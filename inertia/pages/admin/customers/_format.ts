import { type BadgeTone } from '~/lib/styles'
import { type AdminCustomerAddress, type CustomerAccountState } from './_types'

export const accountStateMeta: Record<CustomerAccountState, { label: string; tone: BadgeTone }> = {
  enabled: { label: 'Account', tone: 'success' },
  none: { label: 'No account', tone: 'neutral' },
}

export function customerDisplayName(customer: { fullName: string | null; email: string }) {
  return customer.fullName || customer.email
}

/**
 * Address as display lines, skipping blank parts.
 */
export function addressLines(address: AdminCustomerAddress): string[] {
  const locality = [address.city, address.province, address.postalCode].filter(Boolean).join(', ')
  return [
    address.fullName,
    address.company,
    address.address1,
    address.address2,
    locality,
    address.countryCode,
    address.phone,
  ].filter((line): line is string => Boolean(line))
}
