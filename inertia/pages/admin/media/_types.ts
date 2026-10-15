import { z } from 'zod'
import { paginatedResponse } from '~/lib/schemas'

/** Same values as the server's `MEDIA_FOLDERS`; '' lists every folder. */
export const MEDIA_FOLDER_OPTIONS = [
  { value: '', label: 'All media' },
  { value: 'products', label: 'Products' },
  { value: 'collections', label: 'Collections' },
  { value: 'vendors', label: 'Vendors' },
  { value: 'storefront', label: 'Storefront' },
  { value: 'branding', label: 'Branding' },
  { value: 'media', label: 'Uploaded here' },
] as const

export const AdminMediaFolderFilterSchema = z.enum([
  '',
  'products',
  'collections',
  'vendors',
  'storefront',
  'branding',
  'media',
])

export type AdminMediaFolderFilter = z.infer<typeof AdminMediaFolderFilterSchema>

export const AdminMediaSchema = z.object({
  id: z.uuid(),
  key: z.string(),
  folder: z.string(),
  url: z.string(),
  contentType: z.string(),
  sizeBytes: z.number().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  originalName: z.string().nullable(),
  createdAt: z.string(),
  uploadedBy: z.object({ id: z.uuid(), fullName: z.string() }).nullable(),
})

export type AdminMedia = z.infer<typeof AdminMediaSchema>

export const AdminMediaListResponseSchema = paginatedResponse(AdminMediaSchema)

export const AdminMediaStoreResponseSchema = z.object({ data: z.object({ count: z.number() }) })

/** Same limits as the server's `adminMediaStoreValidator`. */
export const MEDIA_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif'

export const MAX_MEDIA_UPLOAD_SIZE_MB = 5

export const MAX_MEDIA_FILES_PER_UPLOAD = 20

export const MEDIA_PAGE_SIZE = 48
