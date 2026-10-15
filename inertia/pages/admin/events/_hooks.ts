import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminInfiniteList } from '~/hooks/use_admin_infinite_list'
import { http } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import {
  AdminEventResponseSchema,
  AdminEventsListQuerySchema,
  AdminEventsListResponseSchema,
  AdminEventsRetryFailedResponseSchema,
  type AdminEventsListQuery,
} from './_types'

export const adminEventsKeys = {
  all: ['admin', 'events'] as const,
  detail: (id: string) => [...adminEventsKeys.all, 'detail', id] as const,
}

export async function fetchAdminEvents(query: AdminEventsListQuery) {
  const params = AdminEventsListQuerySchema.parse(query)
  return http(`/admin/events/list${toQueryString(params)}`, {
    schema: AdminEventsListResponseSchema,
  })
}

/** Event log rows, loaded in batches as the table scrolls. */
export function useAdminEventsInfinite(filters: Omit<AdminEventsListQuery, 'page' | 'perPage'>) {
  return useAdminInfiniteList([...adminEventsKeys.all, 'list', 'infinite', filters], (page) =>
    fetchAdminEvents({ ...filters, ...page })
  )
}

export async function fetchAdminEvent(id: string) {
  const { data } = await http(`/admin/events/view/${id}`, { schema: AdminEventResponseSchema })
  return data
}

export function useAdminEvent(id: string | null) {
  return useQuery({
    queryKey: adminEventsKeys.detail(id ?? ''),
    queryFn: () => fetchAdminEvent(id ?? ''),
    enabled: Boolean(id),
  })
}

export function useRetryAdminEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await http(`/admin/events/${id}/retry`, {
        method: 'POST',
        body: {},
        schema: AdminEventResponseSchema,
      })
      return data
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminEventsKeys.all }),
  })
}

export function useRetryFailedAdminEvents() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await http('/admin/events/retry-failed', {
        method: 'POST',
        body: {},
        schema: AdminEventsRetryFailedResponseSchema,
      })
      return data
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminEventsKeys.all }),
  })
}
