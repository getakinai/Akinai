import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '~/lib/http'
import { storefrontKeys } from '~/pages/_hooks'
import { adminPaymentKeys } from '../payments/_hooks'
import { EmptyResponseSchema } from '../storefront/_types'
import {
  AdminNavPluginListResponseSchema,
  AdminPluginListResponseSchema,
  type AdminNavPlugin,
} from './_types'

export const adminPluginKeys = {
  all: ['admin', 'plugins'] as const,
  nav: ['admin', 'plugins', 'nav'] as const,
}

export async function fetchAdminPlugins() {
  const { data } = await http('/admin/plugins/list', { schema: AdminPluginListResponseSchema })
  return data
}

export function useAdminPlugins() {
  return useQuery({ queryKey: adminPluginKeys.all, queryFn: fetchAdminPlugins })
}

export async function setAdminPluginInstalled({
  key,
  installed,
}: {
  key: string
  installed: boolean
}) {
  await http(`/admin/plugins/${encodeURIComponent(key)}/install`, {
    method: installed ? 'POST' : 'DELETE',
    schema: EmptyResponseSchema,
  })
}

export function useSetAdminPluginInstalled() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: setAdminPluginInstalled,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: adminPluginKeys.all }),
        queryClient.invalidateQueries({ queryKey: storefrontKeys.plugins }),
        queryClient.invalidateQueries({ queryKey: adminPaymentKeys.all }),
      ]),
  })
}

export async function fetchAdminNavPlugins() {
  const { data } = await http('/admin/plugins/nav', { schema: AdminNavPluginListResponseSchema })
  return data
}

/**
 * Installed plugins for the admin sidebar: their back-office links and the
 * marketing entries they add. Null while loading.
 */
export function useAdminNavPlugins(): AdminNavPlugin[] | null {
  const { data } = useQuery({ queryKey: adminPluginKeys.nav, queryFn: fetchAdminNavPlugins })
  return data ?? null
}
