import { z } from 'zod'
import { paginatedResponse } from '~/lib/schemas'
import { seoFormFields } from '~/lib/seo'

export const PAGE_STATUSES = ['draft', 'active', 'archived'] as const

/** Storefront order of the policy links. Mirrors `app/models/page.ts`. */
export const POLICY_TYPES = ['refund', 'shipping', 'privacy', 'terms'] as const

export const ADMIN_PAGES_SORT_KEYS = ['title', 'status', 'createdAt', 'updatedAt'] as const

export const PAGE_BODY_MAX = 100_000

export const PageStatusSchema = z.enum(PAGE_STATUSES)
export type PageStatus = z.infer<typeof PageStatusSchema>

export const PolicyTypeSchema = z.enum(POLICY_TYPES)
export type PolicyType = z.infer<typeof PolicyTypeSchema>

export const AdminPagesSortKeySchema = z.enum(ADMIN_PAGES_SORT_KEYS)
export type AdminPagesSortKey = z.infer<typeof AdminPagesSortKeySchema>

export const AdminPageStatusFilterSchema = z.enum(['', ...PAGE_STATUSES])
export type AdminPageStatusFilter = z.infer<typeof AdminPageStatusFilterSchema>

export const AdminContentPageListItemSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  slug: z.string(),
  status: PageStatusSchema,
  policyType: PolicyTypeSchema.nullable(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
})

export type AdminContentPageListItem = z.infer<typeof AdminContentPageListItemSchema>

export const AdminContentPageSchema = AdminContentPageListItemSchema.extend({
  body: z.string().nullable(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
})

export type AdminContentPage = z.infer<typeof AdminContentPageSchema>

export const AdminPagesListQuerySchema = z.object({
  q: z.string(),
  status: AdminPageStatusFilterSchema,
  sort: AdminPagesSortKeySchema,
  direction: z.enum(['asc', 'desc']),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
})

export type AdminPagesListQuery = z.infer<typeof AdminPagesListQuerySchema>

export const AdminPagesListResponseSchema = paginatedResponse(AdminContentPageListItemSchema)

export const AdminContentPageResponseSchema = z.object({ data: AdminContentPageSchema })

export const PageFormSchema = z.object({
  title: z.string().trim().min(1, 'Enter a title').max(120),
  body: z.string().trim().max(PAGE_BODY_MAX, 'This page is too long').nullable(),
  status: z.enum(['draft', 'active']),
  slug: z.string().trim().max(255).nullable(),
  ...seoFormFields,
  policyType: PolicyTypeSchema.nullable(),
})

export type PageForm = z.infer<typeof PageFormSchema>
