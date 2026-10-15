import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminInfiniteList } from '~/hooks/use_admin_infinite_list'
import { http } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import {
  AdminEmailResendResponseSchema,
  AdminEmailResponseSchema,
  AdminEmailsListQuerySchema,
  AdminEmailsListResponseSchema,
  type AdminEmailsListQuery,
} from './_types'

export const adminEmailsKeys = {
  all: ['admin', 'emails'] as const,
  detail: (id: string) => [...adminEmailsKeys.all, 'detail', id] as const,
}

export async function fetchAdminEmails(query: AdminEmailsListQuery) {
  const params = AdminEmailsListQuerySchema.parse(query)
  return http(`/admin/emails/list${toQueryString(params)}`, {
    schema: AdminEmailsListResponseSchema,
  })
}

/** Email log rows, loaded in batches as the table scrolls. */
export function useAdminEmailsInfinite(filters: Omit<AdminEmailsListQuery, 'page' | 'perPage'>) {
  return useAdminInfiniteList([...adminEmailsKeys.all, 'list', 'infinite', filters], (page) =>
    fetchAdminEmails({ ...filters, ...page })
  )
}

/** The latest emails for one order or customer (cards on their pages). */
export function useAdminRecentEmails(
  scope: { orderId: string } | { customerId: string },
  enabled: boolean
) {
  return useQuery({
    queryKey: [...adminEmailsKeys.all, 'recent', scope],
    queryFn: () =>
      fetchAdminEmails({ ...scope, sort: 'createdAt', direction: 'desc', page: 1, perPage: 15 }),
    enabled,
  })
}

export async function fetchAdminEmail(id: string) {
  const { data } = await http(`/admin/emails/view/${id}`, { schema: AdminEmailResponseSchema })
  return data
}

export function useAdminEmail(id: string) {
  return useQuery({
    queryKey: adminEmailsKeys.detail(id),
    queryFn: () => fetchAdminEmail(id),
  })
}

export function useResendAdminEmail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      http(`/admin/emails/${id}/resend`, {
        method: 'POST',
        body: {},
        schema: AdminEmailResendResponseSchema,
      }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminEmailsKeys.all }),
  })
}
