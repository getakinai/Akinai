import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import OptionDefinition from '#models/option_definition'
import OptionDefinitionValue from '#models/option_definition_value'
import ProductOption from '#models/product_option'
import ProductOptionValue from '#models/product_option_value'
import ProductVariant from '#models/product_variant'
import { bulkUpdate } from '#repositories/helpers/bulk_update'
import { containsPattern } from '#repositories/helpers/like'
import { lowerIn } from '#repositories/helpers/lower_in'

export type OptionDefinitionSortKey = 'name' | 'createdAt'

export type OptionDefinitionStatusFilter = 'active' | 'archived'

export type PaginateOptionDefinitionsData = {
  q?: string
  status?: OptionDefinitionStatusFilter
  sort: OptionDefinitionSortKey
  direction: 'asc' | 'desc'
  page: number
  perPage: number
}

const sortColumns: Record<OptionDefinitionSortKey, string> = {
  name: 'name',
  createdAt: 'created_at',
}

type SyncedRow<Row, After> = { row: Row; after: After }

/**
 * Product copies changed by `syncProductCopies`. Each `row` holds the
 * values from before the update, for the audit log.
 */
export type SyncedProductCopies = {
  options: SyncedRow<ProductOption, { name: string }>[]
  values: SyncedRow<ProductOptionValue, { value: string }>[]
  variants: SyncedRow<ProductVariant, { title: string }>[]
}

/**
 * The title each variant using the option would get if built now: its
 * values in option order, as `ProductVariantService` builds it. One binding,
 * the option definition id.
 */
const SYNCED_VARIANT_TITLES = `
  SELECT link.product_variant_id,
    left(string_agg(pov.value, ' / ' ORDER BY po.position, po.id), 255) AS title
  FROM product_variant_option_values AS link
  JOIN product_option_values AS pov ON pov.id = link.product_option_value_id
  JOIN product_options AS po ON po.id = pov.product_option_id
  WHERE link.product_variant_id IN (
    SELECT used.product_variant_id
    FROM product_variant_option_values AS used
    JOIN product_option_values AS used_value ON used_value.id = used.product_option_value_id
    JOIN product_options AS used_option ON used_option.id = used_value.product_option_id
    WHERE used_option.option_definition_id = ?
  )
  GROUP BY link.product_variant_id
`

export default class OptionDefinitionRepository {
  async paginate({ q, status, sort, direction, page, perPage }: PaginateOptionDefinitionsData) {
    return OptionDefinition.query()
      .withCount('values', (query) => query.as('values_count'))
      .if(q, (query) => query.whereILike('name', containsPattern(q)))
      .if(status, (query) => query.where('is_active', status === 'active'))
      .orderBy(sortColumns[sort], direction)
      .orderBy('id', direction)
      .paginate(page, perPage)
  }

  async allActiveWithValues(): Promise<OptionDefinition[]> {
    return OptionDefinition.query()
      .where('is_active', true)
      .orderBy('position', 'asc')
      .orderBy('name', 'asc')
      .preload('values', (values) => values.orderBy('position', 'asc'))
  }

  async findOrFail(id: string): Promise<OptionDefinition> {
    return OptionDefinition.findOrFail(id)
  }

  async findWithValuesOrFail(id: string): Promise<OptionDefinition> {
    return OptionDefinition.query()
      .where('id', id)
      .preload('values', (values) => values.orderBy('position', 'asc'))
      .firstOrFail()
  }

  async findByName(name: string, ignoreId?: string): Promise<OptionDefinition | null> {
    return OptionDefinition.query()
      .whereRaw('lower(name) = ?', [name.trim().toLowerCase()])
      .if(ignoreId, (query) => query.whereNot('id', ignoreId!))
      .first()
  }

  async exportRows(
    { q, status, sort, direction }: Omit<PaginateOptionDefinitionsData, 'page' | 'perPage'>,
    limit: number
  ): Promise<OptionDefinition[]> {
    return OptionDefinition.query()
      .select('id', 'name', 'is_active', 'created_at')
      .if(q, (query) => query.whereILike('name', containsPattern(q)))
      .if(status, (query) => query.where('is_active', status === 'active'))
      .orderBy(sortColumns[sort], direction)
      .orderBy('id', direction)
      .limit(limit)
      .preload('values', (values) =>
        values.select('id', 'option_definition_id', 'value', 'position').orderBy('position', 'asc')
      )
  }

  /** Names from `names` that are taken (ignoring case), lowercased. */
  async namesIn(names: string[]): Promise<string[]> {
    if (names.length === 0) return []
    const rows = await OptionDefinition.query()
      .whereRaw(...lowerIn('name', names))
      .select('name')
    return rows.map(({ name }) => name.toLowerCase())
  }

  /**
   * Creates the options after the existing ones, each with its values in
   * the given order, in one transaction.
   */
  async createManyWithValues(
    rows: { name: string; isActive: boolean; values: string[] }[]
  ): Promise<OptionDefinition[]> {
    return db.transaction(async (trx) => {
      const last = await OptionDefinition.query({ client: trx })
        .select('position')
        .orderBy('position', 'desc')
        .first()
      const start = last ? last.position + 1 : 0

      const definitions = await OptionDefinition.createMany(
        rows.map(({ name, isActive }, index) => ({ name, isActive, position: start + index })),
        { client: trx }
      )
      const values = definitions.flatMap((definition, index) =>
        rows[index].values.map((value, position) => ({
          optionDefinitionId: definition.id,
          value,
          position,
        }))
      )
      if (values.length > 0) await OptionDefinitionValue.createMany(values, { client: trx })
      return definitions
    })
  }

  async create(name: string): Promise<OptionDefinition> {
    const last = await OptionDefinition.query().orderBy('position', 'desc').first()
    return OptionDefinition.create({ name, position: last ? last.position + 1 : 0, isActive: true })
  }

  /**
   * Renames the option and syncs its product copies in one transaction.
   * Runs the sync even when the name is unchanged, so saving an option
   * repairs products that went stale.
   */
  async updateAndSyncProducts(
    definition: OptionDefinition,
    name: string
  ): Promise<{ definition: OptionDefinition; synced: SyncedProductCopies }> {
    return db.transaction(async (trx) => {
      definition.useTransaction(trx)
      await definition.merge({ name }).save()
      const synced = await this.syncProductCopies(definition, trx)
      return { definition, synced }
    })
  }

  async setActive(definition: OptionDefinition, isActive: boolean): Promise<OptionDefinition> {
    return definition.merge({ isActive }).save()
  }

  /**
   * Archives (`isActive = false`) or restores the options in `ids`, skipping
   * ones already in that state. Options used by a product are never
   * archived. Returns the changed rows as they were.
   */
  async setActiveMany(ids: string[], isActive: boolean): Promise<OptionDefinition[]> {
    return bulkUpdate(OptionDefinition, ids, { isActive }, (query) =>
      query
        .where('is_active', !isActive)
        .if(!isActive, (scoped) =>
          scoped.whereNotExists((used) =>
            used
              .from('product_options')
              .whereColumn('product_options.option_definition_id', 'option_definitions.id')
          )
        )
    )
  }

  async addValue(definitionId: string, value: string): Promise<OptionDefinitionValue> {
    const last = await OptionDefinitionValue.query()
      .where('option_definition_id', definitionId)
      .orderBy('position', 'desc')
      .first()
    return OptionDefinitionValue.create({
      optionDefinitionId: definitionId,
      value,
      position: last ? last.position + 1 : 0,
    })
  }

  /** Renames the value and syncs its option's product copies in one transaction. */
  async updateValueAndSyncProducts(
    entry: OptionDefinitionValue,
    value: string
  ): Promise<{ entry: OptionDefinitionValue; synced: SyncedProductCopies }> {
    return db.transaction(async (trx) => {
      entry.useTransaction(trx)
      await entry.merge({ value }).save()
      const definition = await OptionDefinition.query({ client: trx })
        .where('id', entry.optionDefinitionId)
        .firstOrFail()
      const synced = await this.syncProductCopies(definition, trx)
      return { entry, synced }
    })
  }

  /**
   * Products keep their own copy of an option's name and values, and each
   * variant's title is built from them. Rewrites the copies linked to
   * `definition` that differ from the catalog, then rebuilds the titles of
   * the variants using them. A copy is skipped when the product already has
   * another option or value with the new text (they are unique per product).
   * Set-based: a few statements however many products use the option.
   */
  protected async syncProductCopies(
    definition: OptionDefinition,
    trx: TransactionClientContract
  ): Promise<SyncedProductCopies> {
    const staleOptions = await ProductOption.query({ client: trx })
      .where('option_definition_id', definition.id)
      .whereNot('name', definition.name)
      .whereNotExists((taken) =>
        taken
          .from('product_options as taken')
          .whereColumn('taken.product_id', 'product_options.product_id')
          .where('taken.name', definition.name)
      )
      .forUpdate()
    if (staleOptions.length > 0) {
      await ProductOption.query({ client: trx })
        .whereIn(
          'id',
          staleOptions.map(({ id }) => id)
        )
        .update({ name: definition.name, updated_at: new Date() })
    }

    const staleValues = await ProductOptionValue.query({ client: trx })
      .join(
        'option_definition_values as catalog',
        'catalog.id',
        'product_option_values.option_definition_value_id'
      )
      .where('catalog.option_definition_id', definition.id)
      .whereRaw('product_option_values.value <> catalog.value')
      .whereNotExists((taken) =>
        taken
          .from('product_option_values as taken')
          .whereColumn('taken.product_option_id', 'product_option_values.product_option_id')
          .whereColumn('taken.value', 'catalog.value')
      )
      .select('product_option_values.*', 'catalog.value as catalog_value')
      .forUpdate()
    if (staleValues.length > 0) {
      await trx.rawQuery(
        `UPDATE product_option_values AS pov
         SET value = catalog.value, updated_at = now()
         FROM option_definition_values AS catalog
         WHERE catalog.id = pov.option_definition_value_id AND pov.id = ANY(?::uuid[])`,
        [staleValues.map(({ id }) => id)]
      )
    }

    const staleVariants = await ProductVariant.query({ client: trx })
      .joinRaw(
        `JOIN (${SYNCED_VARIANT_TITLES}) AS synced ON synced.product_variant_id = product_variants.id`,
        [definition.id]
      )
      .whereRaw('product_variants.title <> synced.title')
      .select('product_variants.*', 'synced.title as synced_title')
    if (staleVariants.length > 0) {
      await trx.rawQuery(
        `UPDATE product_variants AS pv
         SET title = synced.title, updated_at = now()
         FROM (${SYNCED_VARIANT_TITLES}) AS synced
         WHERE synced.product_variant_id = pv.id AND pv.id = ANY(?::uuid[])`,
        [definition.id, staleVariants.map(({ id }) => id)]
      )
    }

    return {
      options: staleOptions.map((row) => ({ row, after: { name: definition.name } })),
      values: staleValues.map((row) => ({
        row,
        after: { value: row.$extras.catalog_value as string },
      })),
      variants: staleVariants.map((row) => ({
        row,
        after: { title: row.$extras.synced_title as string },
      })),
    }
  }

  async deleteValue(entry: OptionDefinitionValue): Promise<void> {
    await entry.delete()
  }

  async findValueForDefinitionOrFail(
    definitionId: string,
    valueId: string
  ): Promise<OptionDefinitionValue> {
    return OptionDefinitionValue.query()
      .where('id', valueId)
      .where('option_definition_id', definitionId)
      .firstOrFail()
  }

  async findValueByLabel(
    definitionId: string,
    value: string,
    ignoreId?: string
  ): Promise<OptionDefinitionValue | null> {
    return OptionDefinitionValue.query()
      .where('option_definition_id', definitionId)
      .whereRaw('lower(value) = ?', [value.trim().toLowerCase()])
      .if(ignoreId, (query) => query.whereNot('id', ignoreId!))
      .first()
  }

  /**
   * Catalog values with the given ids that belong to one of `definitionIds`.
   */
  async findValuesInDefinitions(
    ids: string[],
    definitionIds: string[]
  ): Promise<OptionDefinitionValue[]> {
    if (ids.length === 0 || definitionIds.length === 0) return []
    return OptionDefinitionValue.query()
      .whereIn('id', ids)
      .whereIn('option_definition_id', definitionIds)
  }

  async isValueInUse(valueId: string): Promise<boolean> {
    const row = await db
      .from('product_option_values')
      .where('option_definition_value_id', valueId)
      .first()
    return row !== undefined
  }

  /**
   * Up to `limit` titles (A–Z) of products using the option, plus how many
   * products use it in total.
   */
  async productsUsingDefinition(
    definitionId: string,
    limit: number
  ): Promise<{ titles: string[]; total: number }> {
    const usedBy = () =>
      db
        .from('product_options')
        .join('products', 'products.id', 'product_options.product_id')
        .where('product_options.option_definition_id', definitionId)

    const [rows, [{ total }]] = await Promise.all([
      usedBy().select('products.title').orderBy('products.title', 'asc').limit(limit),
      usedBy().count('* as total'),
    ])
    return { titles: rows.map(({ title }) => title), total: Number(total) }
  }

  /**
   * Active catalog options whose name matches one of `names` (ignoring
   * case), with all their values.
   */
  async activeByNamesWithValues(names: string[]): Promise<OptionDefinition[]> {
    if (names.length === 0) return []
    return OptionDefinition.query()
      .whereRaw(...lowerIn('name', names))
      .where('is_active', true)
      .preload('values', (values) => values.orderBy('position', 'asc'))
  }

  async loadCatalogInputs(
    selections: { optionDefinitionId: string; optionDefinitionValueIds: string[] }[]
  ) {
    if (selections.length === 0) return []

    const definitions = await OptionDefinition.query()
      .whereIn(
        'id',
        selections.map(({ optionDefinitionId }) => optionDefinitionId)
      )
      .where('is_active', true)
      .preload('values')

    const byId = new Map(definitions.map((definition) => [definition.id, definition]))

    return selections.map(({ optionDefinitionId, optionDefinitionValueIds }) => {
      const definition = byId.get(optionDefinitionId)
      if (!definition) return null
      const picked = optionDefinitionValueIds.map((id) =>
        definition.values.find((v) => v.id === id)
      )
      if (picked.some((v) => !v)) return null
      return {
        optionDefinitionId,
        name: definition.name,
        values: picked.map((v) => ({
          optionDefinitionValueId: v!.id,
          value: v!.value,
        })),
      }
    })
  }
}

export type ResolvedCatalogOption = NonNullable<
  Awaited<ReturnType<OptionDefinitionRepository['loadCatalogInputs']>>[number]
>
