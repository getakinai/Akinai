import vine from '@vinejs/vine'
import type { Database } from '@adonisjs/lucid/database'

export const MAX_PRODUCT_TAGS = 250

/**
 * Optional so older clients keep working: an omitted field is left
 * unchanged on update. A product type or vendor must be active to be
 * picked, unless the product already uses it.
 */
export const productMerchandisingFields = () => ({
  productTypeId: vine
    .string()
    .uuid()
    .exists(async (db, value, field) => activeOrCurrent(db, 'product_types', value, field.meta))
    .nullable()
    .optional(),
  vendorId: vine
    .string()
    .uuid()
    .exists(async (db, value, field) => activeOrCurrent(db, 'vendors', value, field.meta))
    .nullable()
    .optional(),
  productLabelId: vine
    .string()
    .uuid()
    .exists(async (db, value, field) => activeOrCurrent(db, 'product_labels', value, field.meta))
    .nullable()
    .optional(),
  tags: vine
    .array(vine.string().trim().minLength(1).maxLength(40))
    .maxLength(MAX_PRODUCT_TAGS)
    .optional(),
})

const PRODUCT_COLUMNS = {
  product_types: 'product_type_id',
  vendors: 'vendor_id',
  product_labels: 'product_label_id',
} as const

async function activeOrCurrent(
  db: Database,
  table: keyof typeof PRODUCT_COLUMNS,
  id: string,
  meta: Record<string, unknown>
): Promise<boolean> {
  const row = await db.from(table).where('id', id).first()
  if (!row) return false
  if (row.is_active) return true

  const productId = meta.productId as string | undefined
  if (!productId) return false
  return Boolean(
    await db.from('products').where('id', productId).where(PRODUCT_COLUMNS[table], id).first()
  )
}
