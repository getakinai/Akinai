import vine from '@vinejs/vine'

type NotBelowMinOptions = {
  /** Sibling field holding the lower bound. */
  minKey: string
  message?: string
}

/**
 * Reports when the value (an upper bound) is below the sibling `minKey`
 * field. Skips when either side is empty.
 */
export const notBelowMinRule = vine.createRule((value, options: NotBelowMinOptions, field) => {
  if (!field.isValid || typeof value !== 'number') return
  const raw = field.parent[options.minKey]
  if (raw === null || raw === undefined || raw === '') return
  const min = Number(raw)
  if (!Number.isNaN(min) && value < min) {
    field.report(options.message ?? 'Maximum must be at least the minimum', 'minMax', field)
  }
})
