import { z } from 'zod'

export const AdminThemeSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  version: z.string(),
  author: z.string().nullable(),
  description: z.string().nullable(),
  role: z.enum(['live', 'unpublished']),
  source: z.enum(['bundled', 'upload']),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  previewImageUrl: z.string().nullable(),
  uploadedBy: z.object({ id: z.string(), fullName: z.string() }).nullable(),
})

export type AdminTheme = z.infer<typeof AdminThemeSchema>

export const AdminThemeListResponseSchema = z.object({
  data: z.array(AdminThemeSchema),
})

export const AdminThemeResponseSchema = z.object({
  data: AdminThemeSchema,
})

export const AdminThemeShareResponseSchema = z.object({
  data: z.object({ url: z.string(), expiresIn: z.string() }),
})
