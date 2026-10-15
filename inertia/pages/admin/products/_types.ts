import { z } from 'zod'
import { ProductLabelColorSchema } from '~/lib/product_label'
import { paginatedResponse } from '~/lib/schemas'
import { seoFormFields } from '~/lib/seo'
import { RecordActivitySchema } from '../_audit_types'

/** The product's and its variants' audit log, newest first. */
export const AdminProductActivityResponseSchema = paginatedResponse(RecordActivitySchema)

export const AdminProductReviewSchema = z.object({
  id: z.string(),
  productId: z.string(),
  rating: z.number().int(),
  title: z.string().nullable(),
  body: z.string(),
  isHidden: z.boolean(),
  isFeatured: z.boolean(),
  createdAt: z.string(),
  customer: z
    .object({ id: z.string(), fullName: z.string().nullable(), email: z.string() })
    .nullable(),
  product: z
    .object({
      id: z.string(),
      title: z.string(),
      slug: z.string(),
      status: z.enum(['draft', 'active', 'archived']),
    })
    .nullable(),
})

export type AdminProductReview = z.infer<typeof AdminProductReviewSchema>

export const AdminProductReviewResponseSchema = z.object({ data: AdminProductReviewSchema })

export const AdminProductReviewsResponseSchema = paginatedResponse(AdminProductReviewSchema)

export const MAX_PRODUCT_OPTIONS = 3

export const MAX_PRODUCT_VARIANTS = 100

export const PRODUCT_STATUSES = ['draft', 'active', 'archived'] as const

export const ADMIN_PRODUCTS_SORT_KEYS = ['title', 'status', 'createdAt', 'updatedAt'] as const

export const ProductStatusSchema = z.enum(PRODUCT_STATUSES)

export type ProductStatus = z.infer<typeof ProductStatusSchema>

export const AdminProductsSortKeySchema = z.enum(ADMIN_PRODUCTS_SORT_KEYS)

export type AdminProductsSortKey = z.infer<typeof AdminProductsSortKeySchema>

export const AdminProductStatusFilterSchema = z.enum(['', ...PRODUCT_STATUSES])

export type AdminProductStatusFilter = z.infer<typeof AdminProductStatusFilterSchema>

const productBase = {
  id: z.uuid(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  productTypeId: z.uuid().nullable(),
  vendorId: z.uuid().nullable(),
  productLabelId: z.uuid().nullable(),
  status: ProductStatusSchema,
  chargeTax: z.boolean(),
  freeShipping: z.boolean(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
}

export const MAX_PRODUCT_TAGS = 250

export const MAX_GALLERY_IMAGES = 10

export const MAX_IMAGE_UPLOAD_SIZE_MB = 5

export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'

export const UploadedImageSchema = z.object({ key: z.string(), url: z.string() })

export type UploadedImage = z.infer<typeof UploadedImageSchema>

export const UploadedImageResponseSchema = z.object({ data: UploadedImageSchema })

/** Live progress of a product import, sent over the admin events stream. */
export const ProductImportProgressSchema = z.object({
  importId: z.uuid(),
  phase: z.enum(['reading', 'images', 'saving']),
  done: z.number(),
  total: z.number(),
})

export type ProductImportProgress = z.infer<typeof ProductImportProgressSchema>

/** Same order as PRODUCT_IMPORT_COLUMNS on the server. */
export const PRODUCT_IMPORT_COLUMNS = [
  'handle',
  'title',
  'description',
  'status',
  'vendor',
  'product_type',
  'tags',
  'charge_tax',
  'seo_title',
  'seo_description',
  'image_urls',
  'option1_name',
  'option1_value',
  'option2_name',
  'option2_value',
  'option3_name',
  'option3_value',
  'sku',
  'barcode',
  'price',
  'compare_at_price',
  'track_inventory',
  'inventory_quantity',
] as const

const imageFields = {
  coverImage: z.string().nullable(),
  galleryImages: z
    .array(z.string())
    .max(MAX_GALLERY_IMAGES, `Add at most ${MAX_GALLERY_IMAGES} gallery photos`),
}

const NamedChoiceSchema = z.object({ id: z.uuid(), name: z.string() })

export type NamedChoice = z.infer<typeof NamedChoiceSchema>

const LinkedChoiceSchema = NamedChoiceSchema.extend({ isActive: z.boolean() })

const LabelChoiceSchema = NamedChoiceSchema.extend({ color: ProductLabelColorSchema })

export type LabelChoice = z.infer<typeof LabelChoiceSchema>

export const AdminProductFacetsSchema = z.object({
  productTypes: z.array(NamedChoiceSchema),
  vendors: z.array(NamedChoiceSchema),
  productLabels: z.array(LabelChoiceSchema),
  tags: z.array(z.string()),
})

export type AdminProductFacets = z.infer<typeof AdminProductFacetsSchema>

export const AdminProductFacetsResponseSchema = z.object({ data: AdminProductFacetsSchema })

const organizationFields = {
  productTypeId: z.uuid().nullable(),
  vendorId: z.uuid().nullable(),
  productLabelId: z.uuid().nullable(),
  tags: z
    .array(z.string().trim().min(1).max(40, 'Tags can be up to 40 characters'))
    .max(MAX_PRODUCT_TAGS, `Use at most ${MAX_PRODUCT_TAGS} tags`),
}

export const AdminProductListItemSchema = z.object({
  ...productBase,
  coverImageUrl: z.string().nullable(),
  variantsCount: z.number().nullable(),
  availableTotal: z.number().nullable(),
  priceMin: z.number().nullable(),
  priceMax: z.number().nullable(),
  missingPriceCurrencies: z.array(z.string()),
})

export type AdminProductListItem = z.infer<typeof AdminProductListItemSchema>

export const InventoryRowSchema = z.object({
  locationId: z.uuid(),
  locationName: z.string(),
  available: z.number(),
  committed: z.number(),
  incoming: z.number(),
})

export const AdminVariantSchema = z.object({
  id: z.uuid(),
  productId: z.uuid(),
  title: z.string(),
  sku: z.string().nullable(),
  barcode: z.string().nullable(),
  price: z.number(),
  compareAtPrice: z.number().nullable(),
  weight: z.number().nullable(),
  trackInventory: z.boolean(),
  position: z.number(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  optionValues: z.array(z.object({ optionName: z.string(), value: z.string() })),
  optionValueIds: z.array(z.uuid()),
  inventory: z.array(InventoryRowSchema),
  availableTotal: z.number(),
  marketPrices: z.array(
    z.object({ marketId: z.uuid(), price: z.number(), compareAtPrice: z.number().nullable() })
  ),
})

export type AdminVariant = z.infer<typeof AdminVariantSchema>

export const AdminProductOptionSchema = z.object({
  id: z.uuid(),
  optionDefinitionId: z.uuid().nullable(),
  name: z.string(),
  position: z.number(),
  values: z.array(
    z.object({
      id: z.uuid(),
      optionDefinitionValueId: z.uuid().nullable(),
      value: z.string(),
      position: z.number(),
    })
  ),
})

export const AdminProductDetailSchema = z.object({
  ...productBase,
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  productType: LinkedChoiceSchema.nullable(),
  vendor: LinkedChoiceSchema.nullable(),
  productLabel: LabelChoiceSchema.extend({ isActive: z.boolean() }).nullable(),
  tags: z.array(z.string()),
  coverImage: UploadedImageSchema.nullable(),
  galleryImages: z.array(UploadedImageSchema),
  options: z.array(AdminProductOptionSchema),
  variants: z.array(AdminVariantSchema),
  reviewsCount: z.number(),
  locations: z.array(z.object({ id: z.uuid(), name: z.string(), isDefault: z.boolean() })),
})

export type AdminProductDetail = z.infer<typeof AdminProductDetailSchema>

export const AdminProductsListQuerySchema = z.object({
  q: z.string(),
  status: AdminProductStatusFilterSchema,
  sort: AdminProductsSortKeySchema,
  direction: z.enum(['asc', 'desc']),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
})

export type AdminProductsListQuery = z.infer<typeof AdminProductsListQuerySchema>

export const AdminProductsListResponseSchema = paginatedResponse(AdminProductListItemSchema)

export const AdminProductResponseSchema = z.object({ data: AdminProductDetailSchema })

export const AdminVariantResponseSchema = z.object({ data: AdminVariantSchema })

export const AdminVariantDeleteResponseSchema = z.null()

export const ProductOptionFormSchema = z.object({
  optionDefinitionId: z.uuid({ error: 'Choose an option' }),
  optionDefinitionValueIds: z
    .array(z.uuid())
    .min(1, 'Pick at least one value')
    .max(MAX_PRODUCT_VARIANTS),
})

export type ProductOptionForm = z.infer<typeof ProductOptionFormSchema>

export const ProductOptionsFormSchema = z
  .array(ProductOptionFormSchema)
  .max(MAX_PRODUCT_OPTIONS, `A product can have up to ${MAX_PRODUCT_OPTIONS} options`)
  .superRefine((options, context) => {
    const ids = options.map(({ optionDefinitionId }) => optionDefinitionId)
    if (new Set(ids).size !== ids.length) {
      context.addIssue({ code: 'custom', message: 'Each option can only be added once' })
      return
    }
    const combinations = options.reduce(
      (total, option) => total * option.optionDefinitionValueIds.length,
      options.length === 0 ? 0 : 1
    )
    if (combinations > MAX_PRODUCT_VARIANTS) {
      context.addIssue({
        code: 'custom',
        message: `These options create ${combinations} variants. The limit is ${MAX_PRODUCT_VARIANTS}.`,
      })
    }
  })

const weightSchema = z
  .number()
  .min(0, 'Weight cannot be negative')
  .max(99_999, 'Weight must be at most 99,999')
  .nullable()

const priceSchema = z
  .number({ error: 'Enter a price' })
  .min(0, 'Price cannot be negative')
  .max(9_999_999_999.99)

/**
 * Prices in non-primary markets. A market left out has no price, so the
 * variant can't be bought there.
 */
export const VariantMarketPricesFormSchema = z.array(
  z.object({
    marketId: z.uuid(),
    price: priceSchema,
    compareAtPrice: z.number().min(0).max(9_999_999_999.99).nullable(),
  })
)

export type VariantMarketPricesForm = z.infer<typeof VariantMarketPricesFormSchema>

export const ProductCreateFormSchema = z.object({
  title: z.string().trim().min(1, 'Enter a title').max(255),
  description: z.string().trim().max(10_000).nullable(),
  status: z.enum(['draft', 'active']),
  chargeTax: z.boolean(),
  freeShipping: z.boolean(),
  ...organizationFields,
  ...imageFields,
  ...seoFormFields,
  price: priceSchema,
  compareAtPrice: z.number().min(0).max(9_999_999_999.99).nullable(),
  weight: weightSchema,
  marketPrices: VariantMarketPricesFormSchema.optional(),
  options: ProductOptionsFormSchema,
})

export type ProductCreateForm = z.infer<typeof ProductCreateFormSchema>

export const ProductDetailsFormSchema = z.object({
  title: z.string().trim().min(1, 'Enter a title').max(255),
  description: z.string().trim().max(10_000).nullable(),
  status: z.enum(['draft', 'active']),
  chargeTax: z.boolean(),
  freeShipping: z.boolean(),
  ...organizationFields,
  ...imageFields,
  ...seoFormFields,
})

export type ProductDetailsForm = z.infer<typeof ProductDetailsFormSchema>

export const VariantFormSchema = z.object({
  sku: z.string().trim().min(1).max(64).nullable(),
  barcode: z.string().trim().min(1).max(64).nullable(),
  price: priceSchema,
  compareAtPrice: z.number().min(0).max(9_999_999_999.99).nullable(),
  weight: weightSchema,
  trackInventory: z.boolean(),
  marketPrices: VariantMarketPricesFormSchema.optional(),
})

export type VariantForm = z.infer<typeof VariantFormSchema>

/**
 * Full variant form used by the create and edit pages: the fields plus one
 * chosen value id per product option.
 */
export const VariantDetailFormSchema = VariantFormSchema.extend({
  optionValueIds: z.array(z.uuid({ error: 'Choose a value' })),
})

export type VariantDetailForm = z.infer<typeof VariantDetailFormSchema>

export const InventoryFormSchema = z.object({
  levels: z
    .array(
      z.object({
        locationId: z.uuid(),
        available: z
          .number({ error: 'Enter a quantity' })
          .int('Use whole units')
          .min(0, 'Quantity cannot be negative'),
      })
    )
    .min(1),
})

export type InventoryForm = z.infer<typeof InventoryFormSchema>
