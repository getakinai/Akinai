import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'
import { MAX_PRODUCT_OPTIONS, MAX_PRODUCT_VARIANTS } from '#validators/helpers/product_options'

/**
 * Product options chosen from the store-wide catalog: one definition per
 * row and at least one of its values.
 */
export function productCatalogOptionsSchema() {
  return vine
    .array(
      vine.object({
        optionDefinitionId: vine.string().uuid(),
        optionDefinitionValueIds: vine.array(vine.string().uuid()).distinct().minLength(1),
      })
    )
    .maxLength(MAX_PRODUCT_OPTIONS)
    .use(catalogOptionsRule())
}

const catalogOptionsRule = vine.createRule(async (value, _options, field) => {
  if (!field.isValid || !Array.isArray(value)) return

  const rows = value as {
    optionDefinitionId: string
    optionDefinitionValueIds: string[]
  }[]

  const definitionIds = rows.map(({ optionDefinitionId }) => optionDefinitionId)
  if (new Set(definitionIds).size !== definitionIds.length) {
    field.report('Each option can only be added once', 'distinctDefinitions', field)
    return
  }

  const definitions = await db
    .from('option_definitions')
    .whereIn('id', definitionIds)
    .where('is_active', true)
    .select('id')

  if (definitions.length !== definitionIds.length) {
    field.report('Choose active options from the catalog', 'invalidDefinitions', field)
    return
  }

  const allValueIds = rows.flatMap(({ optionDefinitionValueIds }) => optionDefinitionValueIds)
  const catalogValues = await db
    .from('option_definition_values')
    .whereIn('id', allValueIds)
    .select('id', 'option_definition_id')

  for (const [index, row] of rows.entries()) {
    const allowed = new Set(
      catalogValues
        .filter(({ option_definition_id }) => option_definition_id === row.optionDefinitionId)
        .map(({ id }) => id)
    )
    if (row.optionDefinitionValueIds.some((id) => !allowed.has(id))) {
      field.report('Choose values that belong to the selected option', 'invalidValues', field, {
        index,
      })
      return
    }
  }

  const combinations = rows.reduce(
    (total, row) => total * row.optionDefinitionValueIds.length,
    rows.length === 0 ? 0 : 1
  )
  if (combinations > MAX_PRODUCT_VARIANTS) {
    field.report(
      `These options create ${combinations} variants. The limit is ${MAX_PRODUCT_VARIANTS}.`,
      'maxVariants',
      field
    )
  }
})
