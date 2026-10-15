/** Longest payee reference NZ and AU banks carry. */
export const BANK_REFERENCE_MAX_LENGTH = 12

export const BANK_REFERENCE_PREFIX = 'HPDL'

/**
 * The reference a customer pays a bank transfer with, e.g. `HPDL1001`.
 * Only `A–Z` and `0–9`, which every NZ and AU bank accepts. Drops the
 * prefix when the number alone is needed to fit the limit.
 */
export function bankTransferReference(orderNumber: number) {
  const digits = String(orderNumber)
  const withPrefix = `${BANK_REFERENCE_PREFIX}${digits}`
  return withPrefix.length <= BANK_REFERENCE_MAX_LENGTH
    ? withPrefix
    : digits.slice(-BANK_REFERENCE_MAX_LENGTH)
}

const REFERENCE_PATTERN = new RegExp(`^${BANK_REFERENCE_PREFIX}[\\s-]*(\\d+)$`, 'i')

/** The order number in a reference such as `HPDL1001` or `hpdl-1001`, else null. */
export function parseBankTransferReference(value: string): number | null {
  const match = value.trim().match(REFERENCE_PATTERN)
  return match ? Number(match[1]) : null
}
