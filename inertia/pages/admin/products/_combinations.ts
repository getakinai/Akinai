import type { AdminOptionCatalogEntry } from '../options/_types'
import { type AdminVariant, type ProductOptionForm } from './_types'

export const DEFAULT_VARIANT_TITLE = 'Default Title'

type OptionPair = { optionName: string; value: string }

export type CombinationPreview = { key: string; title: string }

/**
 * Mirrors the server's combination key.
 */
export function combinationKey(pairs: OptionPair[]): string {
  return pairs
    .map(
      ({ optionName, value }) => `${optionName.trim().toLowerCase()}:${value.trim().toLowerCase()}`
    )
    .sort()
    .join('|')
}

type NamedOptionForm = { name: string; values: string[] }

export function catalogToOptionNames(
  options: ProductOptionForm[],
  catalog: AdminOptionCatalogEntry[]
): NamedOptionForm[] {
  return options
    .map(({ optionDefinitionId, optionDefinitionValueIds }) => {
      const definition = catalog.find(({ id }) => id === optionDefinitionId)
      if (!definition) return null
      const values = optionDefinitionValueIds
        .map((id) => definition.values.find((entry) => entry.id === id)?.value)
        .filter((value): value is string => Boolean(value))
      if (values.length === 0) return null
      return { name: definition.name, values }
    })
    .filter((row): row is NamedOptionForm => row !== null)
}

export function buildCombinationsFromCatalog(
  options: ProductOptionForm[],
  catalog: AdminOptionCatalogEntry[]
): CombinationPreview[] {
  return buildCombinations(catalogToOptionNames(options, catalog))
}

export function buildCombinations(options: NamedOptionForm[]): CombinationPreview[] {
  const usable = options.filter((option) => option.name.trim() && option.values.length > 0)
  if (usable.length === 0) return [{ key: '', title: DEFAULT_VARIANT_TITLE }]

  let rows: OptionPair[][] = [[]]
  for (const option of usable) {
    rows = rows.flatMap((prefix) =>
      option.values.map((value) => [...prefix, { optionName: option.name, value }])
    )
  }
  return rows.map((pairs) => ({
    key: combinationKey(pairs),
    title: pairs.map(({ value }) => value).join(' / '),
  }))
}

const normalize = (value: string) => value.trim().toLowerCase()

function combinationPairs(options: NamedOptionForm[]): OptionPair[][] {
  const usable = options.filter((option) => option.name.trim() && option.values.length > 0)
  let rows: OptionPair[][] = [[]]
  for (const option of usable) {
    rows = rows.flatMap((prefix) =>
      option.values.map((value) => [...prefix, { optionName: option.name, value }])
    )
  }
  return rows
}

/**
 * Moves an old combination onto the new options, as the server does: new
 * options take their first value, removed options are dropped, and a
 * combination using a removed value maps to null.
 */
function mapPairs(pairs: OptionPair[], options: NamedOptionForm[]): OptionPair[] | null {
  const byOption = new Map(pairs.map((pair) => [normalize(pair.optionName), pair.value]))
  const mapped: OptionPair[] = []
  for (const option of options.filter((row) => row.name.trim() && row.values.length > 0)) {
    const previous = byOption.get(normalize(option.name))
    if (previous === undefined) {
      mapped.push({ optionName: option.name, value: option.values[0] })
      continue
    }
    const value = option.values.find((candidate) => normalize(candidate) === normalize(previous))
    if (value === undefined) return null
    mapped.push({ optionName: option.name, value })
  }
  return mapped
}

/**
 * Previews an options save, mirroring ProductService.syncOptions: variants
 * using a removed value (or collapsing onto another variant) are removed,
 * and only combinations that were impossible before are added. Variants
 * deleted by hand are not recreated.
 */
export function diffVariants(
  variants: AdminVariant[],
  previousOptions: ProductOptionForm[],
  options: ProductOptionForm[],
  catalog: AdminOptionCatalogEntry[]
) {
  const namedPrevious = catalogToOptionNames(previousOptions, catalog)
  const namedNext = catalogToOptionNames(options, catalog)
  const combinations = buildCombinations(namedNext)
  const keptKeys = new Set<string>()
  const removed = variants.filter((variant) => {
    const pairs = mapPairs(variant.optionValues, namedNext)
    const key = pairs && combinationKey(pairs)
    if (key === null || keptKeys.has(key)) return true
    keptKeys.add(key)
    return false
  })

  const reachable = new Set(
    combinationPairs(namedPrevious)
      .map((pairs) => mapPairs(pairs, namedNext))
      .filter((pairs): pairs is OptionPair[] => pairs !== null)
      .map(combinationKey)
  )
  const added = combinations.filter(
    ({ key }) => !keptKeys.has(key) && (keptKeys.size === 0 || !reachable.has(key))
  )

  return { total: keptKeys.size + added.length, removed, added }
}
