import { countryName } from '~/lib/countries'
import type { CustomerActivity } from '../../_types'

export type ActivityFieldChange = {
  key: string
  label: string
  before: string
  after: string | null
}

const RECORD_NAMES: Record<string, string> = {
  CustomerAddress: 'address',
  Customer: 'account details',
  WishlistItem: 'wishlist item',
}

const FIELD_LABELS: Record<string, string> = {
  fullName: 'Name',
  company: 'Company',
  address1: 'Street address',
  address2: 'Apartment, suite, etc.',
  city: 'City',
  province: 'Province',
  postalCode: 'Postal code',
  countryCode: 'Country',
  phone: 'Phone',
  email: 'Email',
  isDefault: 'Default address',
}

function sentenceCase(value: string) {
  const words = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll(/[_.-]+/g, ' ')
    .trim()
    .toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** "Updated address", "Deleted address", "Updated account details". */
export function activityTitle(entry: CustomerActivity) {
  const record =
    RECORD_NAMES[entry.auditableType] ?? sentenceCase(entry.auditableType).toLowerCase()
  return `${entry.action === 'deleted' ? 'Deleted' : 'Updated'} ${record}`
}

function fieldLabel(key: string) {
  return FIELD_LABELS[key] ?? sentenceCase(key.replace(/^is(?=[A-Z])/, ''))
}

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return 'empty'
  if (value === '[hidden]') return 'hidden'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (key === 'countryCode' && typeof value === 'string') return countryName(value)
  return String(value)
}

export function activityFieldChanges(entry: CustomerActivity): ActivityFieldChange[] {
  const { before, after } = entry.changes
  return Object.keys(after ?? before).map((key) => ({
    key,
    label: fieldLabel(key),
    before: formatValue(key, before[key]),
    after: after ? formatValue(key, after[key]) : null,
  }))
}
