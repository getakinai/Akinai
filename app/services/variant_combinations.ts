export const DEFAULT_VARIANT_TITLE = 'Default Title'

export type OptionInput = {
  name: string
  values: string[]
}

export type OptionPair = {
  optionName: string
  value: string
}

export type Combination = {
  key: string
  title: string
  pairs: OptionPair[]
}

/**
 * Order-independent identity of a combination, used to match regenerated
 * combinations against existing variants.
 */
export function combinationKey(pairs: OptionPair[]): string {
  return pairs
    .map(
      ({ optionName, value }) => `${optionName.trim().toLowerCase()}:${value.trim().toLowerCase()}`
    )
    .sort()
    .join('|')
}

/**
 * Cartesian product of the option values, in option order. A product with
 * no options resolves to a single default combination.
 */
export function buildCombinations(options: OptionInput[]): Combination[] {
  if (options.length === 0) {
    return [{ key: '', title: DEFAULT_VARIANT_TITLE, pairs: [] }]
  }

  let rows: OptionPair[][] = [[]]
  for (const option of options) {
    rows = rows.flatMap((prefix) =>
      option.values.map((value) => [...prefix, { optionName: option.name, value }])
    )
  }

  return rows.map((pairs) => ({
    key: combinationKey(pairs),
    title: pairs.map(({ value }) => value).join(' / '),
    pairs,
  }))
}
