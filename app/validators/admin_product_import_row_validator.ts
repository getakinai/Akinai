import vine from '@vinejs/vine'
import { MAX_GALLERY_IMAGES } from '#constants/upload_limits'
import { MAX_REMOTE_IMAGE_URL_LENGTH } from '#utils/remote_image'
import { seoImportFields } from '#validators/helpers/seo_fields'

const optionName = () => vine.string().trim().minLength(1).maxLength(64).optional()
const optionValue = () => vine.string().trim().minLength(1).maxLength(64).optional()
const money = () => vine.number().min(0).max(9_999_999_999.99).decimal([0, 2])

/**
 * One row of a product import CSV. Empty cells are removed before
 * validation, so they read as omitted. Fields only needed on a product's
 * first row (title, status, ...) are checked by ProductImportService.
 */
export const adminProductImportRowValidator = vine.create({
  handle: vine
    .string()
    .trim()
    .toLowerCase()
    .minLength(1)
    .maxLength(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: vine.string().trim().minLength(1).maxLength(255).optional(),
  description: vine.string().trim().maxLength(10_000).optional(),
  status: vine.enum(['draft', 'active'] as const).optional(),
  vendor: vine.string().trim().minLength(1).maxLength(255).optional(),
  product_type: vine.string().trim().minLength(1).maxLength(255).optional(),
  tags: vine.string().trim().maxLength(10_000).optional(),
  // CSV cells arrive as text, so numbers/booleans are coerced (bounded below).
  charge_tax: vine.boolean().optional(),
  ...seoImportFields(),
  image_urls: vine
    .string()
    .trim()
    .maxLength((MAX_GALLERY_IMAGES + 1) * (MAX_REMOTE_IMAGE_URL_LENGTH + 1))
    .optional(),
  option1_name: optionName(),
  option1_value: optionValue(),
  option2_name: optionName(),
  option2_value: optionValue(),
  option3_name: optionName(),
  option3_value: optionValue(),
  sku: vine.string().trim().minLength(1).maxLength(64).optional(),
  barcode: vine.string().trim().minLength(1).maxLength(64).optional(),
  price: money(),
  compare_at_price: money().optional(),
  track_inventory: vine.boolean().optional(),
  inventory_quantity: vine.number().withoutDecimals().min(0).max(1_000_000).optional(),
})
