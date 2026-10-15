import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAdminInfiniteList } from '~/hooks/use_admin_infinite_list'
import { http } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import { BulkResultResponseSchema } from '~/lib/schemas'
import {
  AdminNewsletterSubscribersListQuerySchema,
  AdminNewsletterSubscribersListResponseSchema,
  type AdminNewsletterBulkSubscription,
  type AdminNewsletterSubscribersListQuery,
} from './_types'

export const adminNewsletterSubscribersKeys = {
  all: ['admin', 'newsletter_subscribers'] as const,
}

export async function fetchAdminNewsletterSubscribers(query: AdminNewsletterSubscribersListQuery) {
  const params = AdminNewsletterSubscribersListQuerySchema.parse(query)
  return http(`/admin/marketing/newsletter/list${toQueryString(params)}`, {
    schema: AdminNewsletterSubscribersListResponseSchema,
  })
}

/** The list page's rows, loaded in batches as the table scrolls. */
export function useAdminNewsletterSubscribersInfinite(
  filters: Omit<AdminNewsletterSubscribersListQuery, 'page' | 'perPage'>
) {
  return useAdminInfiniteList(
    [...adminNewsletterSubscribersKeys.all, 'list', 'infinite', filters],
    (page) => fetchAdminNewsletterSubscribers({ ...filters, ...page })
  )
}

export async function bulkSetAdminNewsletterSubscribed(payload: AdminNewsletterBulkSubscription) {
  const { data } = await http('/admin/marketing/newsletter/bulk/subscription', {
    method: 'PUT',
    body: payload,
    schema: BulkResultResponseSchema,
  })
  return data
}

/** Unsubscribes or resubscribes the selected subscribers. */
export function useBulkSetAdminNewsletterSubscribed() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: bulkSetAdminNewsletterSubscribed,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: adminNewsletterSubscribersKeys.all }),
  })
}
