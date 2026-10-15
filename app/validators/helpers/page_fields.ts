import vine from '@vinejs/vine'
import { POLICY_TYPES } from '#models/page'
import { seoFields } from '#validators/helpers/seo_fields'

export const MAX_PAGE_BODY_LENGTH = 100_000

export const pageFields = () => ({
  title: vine.string().trim().minLength(1).maxLength(120),
  body: vine.string().trim().maxLength(MAX_PAGE_BODY_LENGTH).nullable(),
  status: vine.enum(['draft', 'active'] as const),
  slug: vine.string().trim().maxLength(255).nullable().optional(),
  ...seoFields(),
  policyType: vine.enum(POLICY_TYPES).nullable().optional(),
})
