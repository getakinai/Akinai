import vine from '@vinejs/vine'
import { discountFields } from '#validators/helpers/discount_fields'

export const adminDiscountUpdateValidator = vine
  .withMetaData<{ discountId: string }>()
  .create(discountFields())
