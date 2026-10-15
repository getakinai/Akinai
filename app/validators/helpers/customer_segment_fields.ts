import vine from '@vinejs/vine'
import { MAX_CUSTOMER_TAG_LENGTH, MAX_CUSTOMER_TAGS } from '#constants/customer_marketing'
import { countryCodeSchema } from '#validators/helpers/country_codes'

const MAX_ORDERS = 100_000
const MAX_SPENT = 1_000_000_000

export function customerTagSchema() {
  return vine.string().trim().toLowerCase().minLength(1).maxLength(MAX_CUSTOMER_TAG_LENGTH)
}

function dateSchema() {
  return vine
    .date({ formats: ['YYYY-MM-DD'] })
    .transform((date) => date.toISODate()!)
    .optional()
}

/**
 * Customer list filters, shared by the list query (`strict: false`, the
 * values arrive as text) and saved segments (`strict: true`, a JSON body).
 */
export function customerSegmentFilterFields({ strict }: { strict: boolean }) {
  const count = () => vine.number({ strict }).withoutDecimals().min(0).max(MAX_ORDERS).optional()
  const amount = () => vine.number({ strict }).min(0).max(MAX_SPENT).optional()

  return {
    tags: vine.array(customerTagSchema()).maxLength(MAX_CUSTOMER_TAGS).optional(),
    marketing: vine.enum(['subscribed', 'not_subscribed'] as const).optional(),
    countryCode: countryCodeSchema().optional(),
    ordersMin: count(),
    ordersMax: count(),
    spentCurrency: vine
      .string()
      .trim()
      .toUpperCase()
      .fixedLength(3)
      .regex(/^[A-Z]{3}$/)
      .optional()
      .requiredIfAnyExists(['spentMin', 'spentMax']),
    spentMin: amount(),
    spentMax: amount(),
    lastOrderFrom: dateSchema(),
    lastOrderTo: dateSchema(),
  }
}
