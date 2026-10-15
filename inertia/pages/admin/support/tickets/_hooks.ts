import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminInfiniteList } from '~/hooks/use_admin_infinite_list'
import { http } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import { BulkResultResponseSchema } from '~/lib/schemas'
import {
  AdminSupportAssigneesResponseSchema,
  AdminSupportOpenCountResponseSchema,
  AdminSupportThreadResponseSchema,
  AdminSupportTicketsListQuerySchema,
  AdminSupportTicketsListResponseSchema,
  type AdminSupportBulkStatusPayload,
  type AdminSupportReplyForm,
  type AdminSupportTicketUpdate,
  type AdminSupportTicketsListQuery,
} from './_types'

export const adminSupportKeys = {
  all: ['admin', 'support'] as const,
  detail: (id: string) => [...adminSupportKeys.all, 'detail', id] as const,
  openCount: () => [...adminSupportKeys.all, 'open-count'] as const,
  assignees: () => [...adminSupportKeys.all, 'assignees'] as const,
}

export async function fetchAdminSupportTickets(query: AdminSupportTicketsListQuery) {
  const params = AdminSupportTicketsListQuerySchema.parse(query)
  return http(`/admin/support/tickets/list${toQueryString(params)}`, {
    schema: AdminSupportTicketsListResponseSchema,
  })
}

export function useAdminSupportTicketsInfinite(
  filters: Omit<AdminSupportTicketsListQuery, 'page' | 'perPage'>
) {
  return useAdminInfiniteList([...adminSupportKeys.all, 'list', 'infinite', filters], (page) =>
    fetchAdminSupportTickets({ ...filters, ...page })
  )
}

export function useAdminSupportThread(id: string) {
  return useQuery({
    queryKey: adminSupportKeys.detail(id),
    queryFn: async () => {
      const { data } = await http(`/admin/support/tickets/view/${id}`, {
        schema: AdminSupportThreadResponseSchema,
      })
      return data
    },
  })
}

/** Tickets waiting on a staff reply, for the sidebar badge. */
export function useAdminSupportOpenCount(enabled: boolean) {
  return useQuery({
    queryKey: adminSupportKeys.openCount(),
    queryFn: async () => {
      const { data } = await http('/admin/support/tickets/open-count', {
        schema: AdminSupportOpenCountResponseSchema,
      })
      return data.open
    },
    enabled,
    refetchInterval: 120_000,
  })
}

export function useAdminSupportAssignees(enabled: boolean) {
  return useQuery({
    queryKey: adminSupportKeys.assignees(),
    queryFn: async () => {
      const { data } = await http('/admin/support/tickets/assignees', {
        schema: AdminSupportAssigneesResponseSchema,
      })
      return data
    },
    enabled,
    staleTime: 5 * 60_000,
  })
}

export function useReplyAdminSupportTicket(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: AdminSupportReplyForm) => {
      const { data } = await http(`/admin/support/tickets/${id}/messages`, {
        method: 'POST',
        body: payload,
        schema: AdminSupportThreadResponseSchema,
      })
      return data
    },
    onSuccess: (thread) => queryClient.setQueryData(adminSupportKeys.detail(id), thread),
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminSupportKeys.all }),
  })
}

export function useUpdateAdminSupportTicket(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: AdminSupportTicketUpdate) => {
      const { data } = await http(`/admin/support/tickets/${id}`, {
        method: 'PUT',
        body: payload,
        schema: AdminSupportThreadResponseSchema,
      })
      return data
    },
    onSuccess: (thread) => queryClient.setQueryData(adminSupportKeys.detail(id), thread),
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminSupportKeys.all }),
  })
}

export function useBulkSetAdminSupportTicketsStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: AdminSupportBulkStatusPayload) => {
      const { data } = await http('/admin/support/tickets/bulk/status', {
        method: 'PUT',
        body: payload,
        schema: BulkResultResponseSchema,
      })
      return data
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminSupportKeys.all }),
  })
}
