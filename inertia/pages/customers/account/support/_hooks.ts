import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import { SupportReplySentResponseSchema, type SupportReplyForm } from '~/pages/support/_types'
import { CustomerSupportThreadResponseSchema, CustomerSupportTicketsResponseSchema } from './_types'

const PER_PAGE = 10

export const customerSupportKeys = {
  all: ['customer', 'support'] as const,
  list: () => [...customerSupportKeys.all, 'list'] as const,
  thread: (id: string) => [...customerSupportKeys.all, 'thread', id] as const,
}

/** The signed-in customer's support requests, latest activity first. */
export function useCustomerSupportTickets() {
  return useInfiniteQuery({
    queryKey: customerSupportKeys.list(),
    queryFn: ({ pageParam }) =>
      http(`/account/support/list${toQueryString({ page: pageParam, perPage: PER_PAGE })}`, {
        schema: CustomerSupportTicketsResponseSchema,
      }),
    initialPageParam: 1,
    getNextPageParam: ({ metadata }) =>
      metadata.currentPage < metadata.lastPage ? metadata.currentPage + 1 : undefined,
  })
}

export function useCustomerSupportThread(id: string) {
  return useQuery({
    queryKey: customerSupportKeys.thread(id),
    queryFn: async () => {
      const { data } = await http(`/account/support/view/${id}`, {
        schema: CustomerSupportThreadResponseSchema,
      })
      return data
    },
  })
}

export function useReplyCustomerSupportThread(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SupportReplyForm) =>
      http(`/account/support/${id}/messages`, {
        method: 'POST',
        body: payload,
        schema: SupportReplySentResponseSchema,
      }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: customerSupportKeys.all }),
  })
}
