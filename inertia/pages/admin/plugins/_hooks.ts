import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '~/lib/http'
import { storefrontKeys, useStorefrontPlugins } from '~/pages/_hooks'
import { EmptyResponseSchema } from '../storefront/_types'
import { AdminPluginListResponseSchema } from './_types'

export const adminPluginKeys = {
  all: ['admin', 'plugins'] as const,
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
      ]),
  })
}

/** Keys of installed plugins, for hiding back-office links of uninstalled ones. */
export function useInstalledPluginKeys(): string[] | null {
  const { data } = useStorefrontPlugins()
  return data ? data.map((plugin) => plugin.key) : null
}
