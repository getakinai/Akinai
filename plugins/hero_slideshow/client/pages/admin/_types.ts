import { z } from 'zod'
import { MENU_ITEM_TYPES } from '~/lib/storefront'

const linkedRecord = z
  .object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    status: z.enum(['draft', 'active', 'archived']),
  })
  .nullable()

const MENU_URL = /^(\/(?!\/)\S*|https?:\/\/\S+)$/

const linkTargets = {
  collection: {
    type: z.literal('collection'),
    collectionId: z.string().min(1, 'Choose a collection'),
    pageId: z.null(),
    url: z.null(),
  },
  page: {
    type: z.literal('page'),
    pageId: z.string().min(1, 'Choose a page'),
    collectionId: z.null(),
    url: z.null(),
  },
  url: {
    type: z.literal('url'),
    url: z
      .string()
      .trim()
      .min(1, 'Enter a URL')
      .max(500)
      .regex(MENU_URL, 'Start with / for a store page, or https:// for another site'),
    collectionId: z.null(),
    pageId: z.null(),
  },
} as const

export const MAX_HERO_IMAGE_UPLOAD_SIZE_MB = 5

export const MAX_HERO_SLIDES = 10

export const BRANDING_IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp'

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

export const EmptyResponseSchema = z.null()
