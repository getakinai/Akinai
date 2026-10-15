import vine from '@vinejs/vine'
import {
  DISCOUNT_APPLIES_TO,
  DISCOUNT_BUY_REQUIREMENTS,
  DISCOUNT_METHODS,
  DISCOUNT_TYPES,
  DISCOUNT_VALUE_TYPES,
} from '#models/discount'

const MAX_AMOUNT = 9_999_999_999.99

export const MAX_DISCOUNT_PRODUCTS = 100

export const MAX_DISCOUNT_COLLECTIONS = 50

const VALUE_TYPES = ['amount_off_products', 'buy_x_get_y', 'amount_off_order']

const TARGET_TYPES = ['amount_off_products', 'buy_x_get_y']

const idList = (max: number) =>
  vine.array(vine.string().uuid()).maxLength(max).distinct().optional()

/**
 * Fields shared by the discount store and update validators. Fields that
 * only apply to some `type`s are optional here and required for those
 * types; the service drops the ones a type doesn't use and checks targets.
 * Codes are unique ignoring case; `meta.discountId` (when set) is the
 * discount being edited so it does not clash with itself.
 */
export function discountFields() {
  return {
    title: vine.string().trim().minLength(1).maxLength(255),
    type: vine.enum(DISCOUNT_TYPES),
    method: vine.enum(DISCOUNT_METHODS),
    code: vine
      .string()
      .trim()
      .toUpperCase()
      .minLength(3)
      .maxLength(64)
      .regex(/^[A-Z0-9_-]+$/)
      .unique(async (db, value, field) => {
        const discountId = field.meta.discountId as string | undefined
        const query = db.from('discounts').where('code', value)
        if (discountId) query.whereNot('id', discountId)
        return !(await query.first())
      })
      .optional()
      .requiredWhen('method', '=', 'code'),
    valueType: vine.enum(DISCOUNT_VALUE_TYPES).optional().requiredWhen('type', 'in', VALUE_TYPES),
    value: vine
      .number({ strict: true })
      .min(0.01)
      .max(MAX_AMOUNT)
      .decimal([0, 2])
      .use(percentageRule())
      .optional()
      .requiredWhen('type', 'in', VALUE_TYPES),
    appliesTo: vine.enum(DISCOUNT_APPLIES_TO).optional().requiredWhen('type', 'in', TARGET_TYPES),
    productIds: idList(MAX_DISCOUNT_PRODUCTS),
    collectionIds: idList(MAX_DISCOUNT_COLLECTIONS),
    buyRequirement: vine
      .enum(DISCOUNT_BUY_REQUIREMENTS)
      .optional()
      .requiredWhen('type', '=', 'buy_x_get_y'),
    buyValue: vine
      .number({ strict: true })
      .min(0.01)
      .max(MAX_AMOUNT)
      .decimal([0, 2])
      .use(buyQuantityRule())
      .optional()
      .requiredWhen('type', '=', 'buy_x_get_y'),
    buyAppliesTo: vine
      .enum(DISCOUNT_APPLIES_TO)
      .optional()
      .requiredWhen('type', '=', 'buy_x_get_y'),
    buyProductIds: idList(MAX_DISCOUNT_PRODUCTS),
    buyCollectionIds: idList(MAX_DISCOUNT_COLLECTIONS),
    getQuantity: vine
      .number({ strict: true })
      .withoutDecimals()
      .min(1)
      .max(10_000)
      .optional()
      .requiredWhen('type', '=', 'buy_x_get_y'),
    maxUsesPerOrder: vine
      .number({ strict: true })
      .withoutDecimals()
      .min(1)
      .max(10_000)
      .nullable()
      .optional(),
    maxShippingPrice: vine
      .number({ strict: true })
      .min(0)
      .max(MAX_AMOUNT)
      .decimal([0, 2])
      .nullable()
      .optional(),
    minSubtotal: vine.number({ strict: true }).min(0).max(MAX_AMOUNT).decimal([0, 2]).nullable(),
    usageLimit: vine
      .number({ strict: true })
      .withoutDecimals()
      .min(1)
      .max(1_000_000_000)
      .nullable(),
    oncePerCustomer: vine.boolean({ strict: true }),
    startsAt: vine.date({ formats: ['iso8601'] }),
    endsAt: vine
      .date({ formats: ['iso8601'] })
      .afterField('startsAt')
      .nullable(),
  }
}

const percentageRule = vine.createRule((value, _options, field) => {
  if (!field.isValid || typeof value !== 'number') return
  if (field.parent.valueType === 'percentage' && value > 100) {
    field.report('A percentage cannot be more than 100', 'percentage', field)
  }
})

const buyQuantityRule = vine.createRule((value, _options, field) => {
  if (!field.isValid || typeof value !== 'number') return
  if (field.parent.buyRequirement === 'quantity' && !Number.isInteger(value)) {
    field.report('Enter a whole number of items', 'withoutDecimals', field)
  }
})
