import { z } from 'zod'
import { paginatedResponse } from '~/lib/schemas'

export const ADMIN_OPTIONS_SORT_KEYS = ['name', 'createdAt'] as const
export const AdminOptionsSortKeySchema = z.enum(ADMIN_OPTIONS_SORT_KEYS)
export type AdminOptionsSortKey = z.infer<typeof AdminOptionsSortKeySchema>

export const AdminOptionStatusFilterSchema = z.enum(['', 'active', 'archived'])
export type AdminOptionStatusFilter = z.infer<typeof AdminOptionStatusFilterSchema>

export const AdminOptionValueSchema = z.object({
  id: z.uuid(),
  optionDefinitionId: z.uuid(),
  value: z.string(),
  position: z.number(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
})

export type AdminOptionValue = z.infer<typeof AdminOptionValueSchema>

export const AdminOptionListItemSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  position: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  valuesCount: z.number().nullable(),
})

export type AdminOptionListItem = z.infer<typeof AdminOptionListItemSchema>

export const AdminOptionDetailSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  position: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  values: z.array(AdminOptionValueSchema),
})

export type AdminOptionDetail = z.infer<typeof AdminOptionDetailSchema>

export const AdminOptionCatalogEntrySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  values: z.array(
    z.object({
      id: z.uuid(),
      optionDefinitionId: z.uuid(),
      value: z.string(),
      position: z.number(),
      createdAt: z.string(),
      updatedAt: z.string().nullable(),
    })
  ),
})

export type AdminOptionCatalogEntry = z.infer<typeof AdminOptionCatalogEntrySchema>

export const AdminOptionsListQuerySchema = z.object({
  q: z.string(),
  status: AdminOptionStatusFilterSchema,
  sort: AdminOptionsSortKeySchema,
  direction: z.enum(['asc', 'desc']),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
})

export type AdminOptionsListQuery = z.infer<typeof AdminOptionsListQuerySchema>

export const AdminOptionsListResponseSchema = paginatedResponse(AdminOptionListItemSchema)
export const AdminOptionResponseSchema = z.object({ data: AdminOptionDetailSchema })
export const AdminOptionValueResponseSchema = z.object({ data: AdminOptionValueSchema })
export const AdminOptionsCatalogResponseSchema = z.object({
  data: z.array(AdminOptionCatalogEntrySchema),
})

export const AdminOptionNameFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(64),
})

export type AdminOptionNameForm = z.infer<typeof AdminOptionNameFormSchema>

export const AdminOptionValueFormSchema = z.object({
  value: z.string().trim().min(1, 'Enter a value').max(64),
})

export type AdminOptionValueForm = z.infer<typeof AdminOptionValueFormSchema>

/** Same order as the server's CSV columns. */
export const OPTION_IMPORT_COLUMNS = ['name', 'values', 'status'] as const
