import vine from '@vinejs/vine'
import { productLabelFields } from '#validators/helpers/product_label_fields'

export const adminProductLabelUpdateValidator = vine
  .withMetaData<{ productLabelId: string }>()
  .create(productLabelFields())
