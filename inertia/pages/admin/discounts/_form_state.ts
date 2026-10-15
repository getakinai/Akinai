import { emptyToNull } from '~/lib/form'
import {
  type AdminDiscount,
  type DiscountAppliesTo,
  type DiscountBuyRequirement,
  type DiscountMethod,
  type DiscountTargetItem,
  type DiscountType,
  type DiscountValueType,
} from './_types'

/** Everything the discount form edits, for every type. */
export type DiscountFormState = {
  title: string
  method: DiscountMethod
  code: string
  valueType: DiscountValueType
  value: number | null
  appliesTo: DiscountAppliesTo
  products: DiscountTargetItem[]
  collections: DiscountTargetItem[]
  buyRequirement: DiscountBuyRequirement
  buyValue: number | null
  buyAppliesTo: DiscountAppliesTo
  buyProducts: DiscountTargetItem[]
  buyCollections: DiscountTargetItem[]
  getQuantity: number | null
  maxUsesPerOrder: number | null
  maxShippingPrice: number | null
  minSubtotal: number | null
  usageLimit: number | null
  oncePerCustomer: boolean
}

export type SetDiscountField = <K extends keyof DiscountFormState>(
  key: K,
  value: DiscountFormState[K]
) => void

export function initialFormState(type: DiscountType, discount?: AdminDiscount): DiscountFormState {
  const targets = discount?.targets
  const applies = type === 'buy_x_get_y' ? targets?.get : targets?.applies
  return {
    title: discount?.title ?? '',
    method: discount?.method ?? 'code',
    code: discount?.code ?? '',
    valueType: discount?.valueType ?? 'percentage',
    value: discount?.value ?? (type === 'buy_x_get_y' ? 100 : null),
    appliesTo: discount?.appliesTo ?? 'products',
    products: applies?.products ?? [],
    collections: applies?.collections ?? [],
    buyRequirement: discount?.buyRequirement ?? 'quantity',
    buyValue: discount?.buyValue ?? null,
    buyAppliesTo: discount?.buyAppliesTo ?? 'products',
    buyProducts: targets?.buy.products ?? [],
    buyCollections: targets?.buy.collections ?? [],
    getQuantity: discount?.getQuantity ?? null,
    maxUsesPerOrder: discount?.maxUsesPerOrder ?? null,
    maxShippingPrice: discount?.maxShippingPrice ?? null,
    minSubtotal: discount?.minSubtotal ?? null,
    usageLimit: discount?.usageLimit ?? null,
    oncePerCustomer: discount?.oncePerCustomer ?? false,
  }
}

const idsOf = (items: DiscountTargetItem[]) => items.map(({ id }) => id)

const orUndefined = <T>(value: T | null) => value ?? undefined

/** The request body for `type`: fields the type doesn't use are left out. */
export function formPayload(
  type: DiscountType,
  state: DiscountFormState,
  dates: { startsAt: string; endsAt: string | null }
) {
  const base = {
    title: state.title,
    type,
    method: state.method,
    code: state.method === 'code' ? emptyToNull(state.code.toUpperCase()) : null,
    minSubtotal: state.minSubtotal,
    usageLimit: state.usageLimit,
    oncePerCustomer: state.oncePerCustomer,
    ...dates,
  }
  const value = { valueType: state.valueType, value: orUndefined(state.value) }
  const applies = {
    appliesTo: state.appliesTo,
    productIds: state.appliesTo === 'products' ? idsOf(state.products) : undefined,
    collectionIds: state.appliesTo === 'collections' ? idsOf(state.collections) : undefined,
  }

  switch (type) {
    case 'amount_off_order':
      return { ...base, ...value }
    case 'amount_off_products':
      return { ...base, ...value, ...applies }
    case 'buy_x_get_y':
      return {
        ...base,
        ...value,
        ...applies,
        buyRequirement: state.buyRequirement,
        buyValue: orUndefined(state.buyValue),
        buyAppliesTo: state.buyAppliesTo,
        buyProductIds: state.buyAppliesTo === 'products' ? idsOf(state.buyProducts) : undefined,
        buyCollectionIds:
          state.buyAppliesTo === 'collections' ? idsOf(state.buyCollections) : undefined,
        getQuantity: orUndefined(state.getQuantity),
        maxUsesPerOrder: state.maxUsesPerOrder,
      }
    case 'free_shipping':
      return { ...base, maxShippingPrice: state.maxShippingPrice }
  }
}
