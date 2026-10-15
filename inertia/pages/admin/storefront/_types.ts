import { z } from 'zod'
import { AdminProductReviewSchema } from '~/pages/admin/products/_types'
import {
  FEATURE_ICONS,
  HEX_COLOR,
  MAX_FEATURES,
  MENU_ITEM_TYPES,
  PROMO_PLACEMENTS,
  PROMO_TONES,
  THEME_PRESET_KEYS,
} from '~/lib/storefront'

const hexColor = z.string().trim().regex(HEX_COLOR, 'Use a hex color such as #14532d')

export const AdminStorefrontThemeSchema = z.object({
  id: z.string(),
  preset: z.enum(THEME_PRESET_KEYS),
  primaryColor: z.string(),
  primaryForegroundColor: z.string(),
  accentColor: z.string(),
  backgroundColor: z.string(),
  surfaceColor: z.string(),
  textColor: z.string(),
  brandName: z.string().nullable(),
  logoUrl: z.string().nullable(),
  faviconUrl: z.string().nullable(),
  announcementText: z.string().nullable(),
  announcementUrl: z.string().nullable(),
  footerTagline: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
})

export type AdminStorefrontTheme = z.infer<typeof AdminStorefrontThemeSchema>

export const AdminStorefrontThemeResponseSchema = z.object({ data: AdminStorefrontThemeSchema })

export const AdminStorefrontThemeFormSchema = z.object({
  primaryColor: hexColor,
  primaryForegroundColor: hexColor,
  accentColor: hexColor,
  backgroundColor: hexColor,
  surfaceColor: hexColor,
  textColor: hexColor,
})

export type AdminStorefrontThemeForm = z.infer<typeof AdminStorefrontThemeFormSchema>

export const MAX_BRAND_NAME_LENGTH = 80

export const AdminStorefrontBrandFormSchema = z.object({
  brandName: z
    .string()
    .trim()
    .max(MAX_BRAND_NAME_LENGTH, `Use ${MAX_BRAND_NAME_LENGTH} characters or fewer`)
    .transform((value) => value || null),
})

export type AdminStorefrontBrandForm = z.infer<typeof AdminStorefrontBrandFormSchema>

export const BRANDING_IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp'

export const MAX_LOGO_UPLOAD_SIZE_MB = 2

export const MAX_FAVICON_UPLOAD_SIZE_MB = 5

export const FAVICON_MIN_SIZE = 512

const linkedRecord = z
  .object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    status: z.enum(['draft', 'active', 'archived']),
  })
  .nullable()

export const AdminStorefrontMenuItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(MENU_ITEM_TYPES),
  collectionId: z.string().nullable(),
  pageId: z.string().nullable(),
  url: z.string().nullable(),
  position: z.number(),
  isVisible: z.boolean(),
  collection: linkedRecord,
  page: linkedRecord,
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
})

export type AdminStorefrontMenuItem = z.infer<typeof AdminStorefrontMenuItemSchema>

export const AdminStorefrontMenuItemResponseSchema = z.object({
  data: AdminStorefrontMenuItemSchema,
})

export const AdminStorefrontMenuListResponseSchema = z.object({
  data: z.array(AdminStorefrontMenuItemSchema),
})

const MENU_URL = /^(\/(?!\/)\S*|https?:\/\/\S+)$/

/** The link target fields for each link type, shared by menu items, hero slides and promo banners. */
const linkTargets = {
  collection: {
    type: z.literal('collection'),
    collectionId: z.string().min(1, 'Choose a collection'),
    pageId: z.null(),
    url: z.null(),
  },
  page: {
    type: z.literal('page'),
    collectionId: z.null(),
    pageId: z.string().min(1, 'Choose a page'),
    url: z.null(),
  },
  url: {
    type: z.literal('url'),
    collectionId: z.null(),
    pageId: z.null(),
    url: z
      .string()
      .trim()
      .min(1, 'Enter a link')
      .max(500)
      .regex(MENU_URL, 'Start with / for a store page, or https:// for another site'),
  },
}

const menuItemFields = {
  label: z.string().trim().min(1, 'Enter a label').max(60),
  isVisible: z.boolean(),
}

export const AdminStorefrontMenuItemFormSchema = z.discriminatedUnion('type', [
  z.object({ ...menuItemFields, ...linkTargets.collection }),
  z.object({ ...menuItemFields, ...linkTargets.page }),
  z.object({ ...menuItemFields, ...linkTargets.url }),
])

export type AdminStorefrontMenuItemForm = z.infer<typeof AdminStorefrontMenuItemFormSchema>

export const MAX_HERO_IMAGE_UPLOAD_SIZE_MB = 5

export const MAX_HERO_SLIDES = 10

export const AdminStorefrontHeroSlideSchema = z.object({
  id: z.string(),
  eyebrow: z.string().nullable(),
  heading: z.string(),
  subheading: z.string().nullable(),
  buttonLabel: z.string().nullable(),
  type: z.enum(MENU_ITEM_TYPES),
  collectionId: z.string().nullable(),
  pageId: z.string().nullable(),
  url: z.string().nullable(),
  imageUrl: z.string().nullable(),
  position: z.number(),
  isVisible: z.boolean(),
  collection: linkedRecord,
  page: linkedRecord,
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
})

export type AdminStorefrontHeroSlide = z.infer<typeof AdminStorefrontHeroSlideSchema>

export const AdminStorefrontHeroSlideResponseSchema = z.object({
  data: AdminStorefrontHeroSlideSchema,
})

export const AdminStorefrontHeroSlideListResponseSchema = z.object({
  data: z.array(AdminStorefrontHeroSlideSchema),
})

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use ${max} characters or fewer`)
    .transform((value) => value || null)

const heroSlideTexts = {
  eyebrow: optionalText(60),
  heading: z.string().trim().min(1, 'Enter a heading').max(120),
  subheading: optionalText(240),
  buttonLabel: optionalText(30),
  isVisible: z.boolean(),
}

export const AdminStorefrontHeroSlideFormSchema = z.discriminatedUnion('type', [
  z.object({ ...heroSlideTexts, ...linkTargets.collection }),
  z.object({ ...heroSlideTexts, ...linkTargets.page }),
  z.object({ ...heroSlideTexts, ...linkTargets.url }),
])

export type AdminStorefrontHeroSlideForm = z.infer<typeof AdminStorefrontHeroSlideFormSchema>

const nullableUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === '' || MENU_URL.test(value), {
    message: 'Start with / for a store page, or https:// for another site',
  })
  .transform((value) => value || null)

export const AdminStorefrontContentFormSchema = z.object({
  announcementText: optionalText(160),
  announcementUrl: nullableUrl,
  footerTagline: optionalText(200),
})

export type AdminStorefrontContentForm = z.infer<typeof AdminStorefrontContentFormSchema>

export const AdminStorefrontPromoBannerSchema = z.object({
  id: z.string(),
  placement: z.enum(PROMO_PLACEMENTS),
  eyebrow: z.string().nullable(),
  title: z.string(),
  buttonLabel: z.string().nullable(),
  tone: z.enum(PROMO_TONES),
  type: z.enum(MENU_ITEM_TYPES),
  collectionId: z.string().nullable(),
  pageId: z.string().nullable(),
  url: z.string().nullable(),
  imageUrl: z.string().nullable(),
  position: z.number(),
  isVisible: z.boolean(),
  collection: linkedRecord,
  page: linkedRecord,
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
})

export type AdminStorefrontPromoBanner = z.infer<typeof AdminStorefrontPromoBannerSchema>

export const AdminStorefrontPromoBannerResponseSchema = z.object({
  data: AdminStorefrontPromoBannerSchema,
})

export const AdminStorefrontPromoBannerListResponseSchema = z.object({
  data: z.array(AdminStorefrontPromoBannerSchema),
})

const promoBannerTexts = {
  eyebrow: optionalText(40),
  title: z.string().trim().min(1, 'Enter a title').max(100),
  buttonLabel: optionalText(30),
  tone: z.enum(PROMO_TONES),
  isVisible: z.boolean(),
}

export const AdminStorefrontPromoBannerFormSchema = z.discriminatedUnion('type', [
  z.object({ ...promoBannerTexts, ...linkTargets.collection }),
  z.object({ ...promoBannerTexts, ...linkTargets.page }),
  z.object({ ...promoBannerTexts, ...linkTargets.url }),
])

export type AdminStorefrontPromoBannerForm = z.infer<typeof AdminStorefrontPromoBannerFormSchema>

export const AdminStorefrontFeatureSchema = z.object({
  id: z.string(),
  icon: z.enum(FEATURE_ICONS),
  title: z.string(),
  text: z.string(),
  position: z.number(),
})

export type AdminStorefrontFeature = z.infer<typeof AdminStorefrontFeatureSchema>

export const AdminStorefrontFeatureListResponseSchema = z.object({
  data: z.array(AdminStorefrontFeatureSchema),
})

export const AdminStorefrontFeaturesFormSchema = z.object({
  items: z
    .array(
      z.object({
        icon: z.enum(FEATURE_ICONS),
        title: z.string().trim().min(1, 'Enter a title').max(40),
        text: z.string().trim().min(1, 'Enter a short description').max(120),
      })
    )
    .max(MAX_FEATURES, `Add at most ${MAX_FEATURES} features`),
})

export type AdminStorefrontFeaturesForm = z.infer<typeof AdminStorefrontFeaturesFormSchema>

export const AdminFeaturedReviewListResponseSchema = z.object({
  data: z.array(AdminProductReviewSchema),
})

export const AdminCollectionOptionSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['draft', 'active', 'archived']),
})

export const AdminCollectionOptionsResponseSchema = z.object({
  data: z.array(AdminCollectionOptionSchema),
})

export const AdminPageOptionSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  status: z.enum(['draft', 'active', 'archived']),
})

export type AdminPageOption = z.infer<typeof AdminPageOptionSchema>

export const AdminPageOptionsResponseSchema = z.object({
  data: z.array(AdminPageOptionSchema),
})

export const EmptyResponseSchema = z.null()
