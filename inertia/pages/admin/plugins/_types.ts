import { z } from 'zod'

export const AdminPluginSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  slots: z.array(z.string()),
  adminRoute: z.string().nullable(),
  isInstalled: z.boolean(),
  installedAt: z.string().nullable(),
})

export type AdminPlugin = z.infer<typeof AdminPluginSchema>

export const AdminPluginListResponseSchema = z.object({
  data: z.array(AdminPluginSchema),
})
