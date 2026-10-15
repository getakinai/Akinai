import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminInfiniteList } from '~/hooks/use_admin_infinite_list'
import { http } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import { adminOrdersKeys } from '../orders/_hooks'
import {
  AdminOrderReturnsResponseSchema,
  AdminReturnResponseSchema,
  AdminReturnsListQuerySchema,
  AdminReturnsListResponseSchema,
  type AdminReturnApprovePayload,
  type AdminReturnDeclinePayload,
  type AdminReturnReceivePayload,
  type AdminReturnsListQuery,
  type AdminReturnStorePayload,
} from './_types'

export const adminReturnsKeys = {
  all: ['admin', 'returns'] as const,
  /** Under the order keys so refunds and cancellations refresh it too. */
  forOrder: (orderId: string) => [...adminOrdersKeys.all, 'returns', orderId] as const,
}

export async function fetchAdminReturns(query: AdminReturnsListQuery) {
  const { status, ...params } = AdminReturnsListQuerySchema.parse(query)
  return http(`/admin/returns/list${toQueryString({ ...params, ...(status ? { status } : {}) })}`, {
    schema: AdminReturnsListResponseSchema,
  })
}

/** Returns across all orders, loaded in batches as the table scrolls. */
export function useAdminReturnsInfinite(filters: Omit<AdminReturnsListQuery, 'page' | 'perPage'>) {
  return useAdminInfiniteList([...adminReturnsKeys.all, 'list', 'infinite', filters], (page) =>
    fetchAdminReturns({ ...filters, ...page })
  )
}

export async function fetchAdminOrderReturns(orderId: string) {
  const { data } = await http(`/admin/orders/${orderId}/returns`, {
    schema: AdminOrderReturnsResponseSchema,
  })
  return data
}

export function useAdminOrderReturns(orderId: string) {
  return useQuery({
    queryKey: adminReturnsKeys.forOrder(orderId),
    queryFn: () => fetchAdminOrderReturns(orderId),
  })
}

function useInvalidateReturns() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: adminOrdersKeys.all }),
      queryClient.invalidateQueries({ queryKey: adminReturnsKeys.all }),
    ])
}

export async function createAdminReturn({
  orderId,
  ...payload
}: AdminReturnStorePayload & { orderId: string }) {
  const { data } = await http(`/admin/orders/${orderId}/returns`, {
    method: 'POST',
    body: payload,
    schema: AdminReturnResponseSchema,
  })
  return data
}

export function useCreateAdminReturn() {
  const invalidate = useInvalidateReturns()
  return useMutation({ mutationFn: createAdminReturn, onSettled: invalidate })
}

async function updateReturn(id: string, action: string, body: object) {
  const { data } = await http(`/admin/returns/${id}/${action}`, {
    method: 'PUT',
    body,
    schema: AdminReturnResponseSchema,
  })
  return data
}

export function useApproveAdminReturn() {
  const invalidate = useInvalidateReturns()
  return useMutation({
    mutationFn: ({ id, ...payload }: AdminReturnApprovePayload & { id: string }) =>
      updateReturn(id, 'approve', payload),
    onSettled: invalidate,
  })
}

export function useDeclineAdminReturn() {
  const invalidate = useInvalidateReturns()
  return useMutation({
    mutationFn: ({ id, ...payload }: AdminReturnDeclinePayload & { id: string }) =>
      updateReturn(id, 'decline', payload),
    onSettled: invalidate,
  })
}

export function useReceiveAdminReturn() {
  const invalidate = useInvalidateReturns()
  return useMutation({
    mutationFn: ({ id, ...payload }: AdminReturnReceivePayload & { id: string }) =>
      updateReturn(id, 'receive', payload),
    onSettled: invalidate,
  })
}

export function useCancelAdminReturn() {
  const invalidate = useInvalidateReturns()
  return useMutation({
    mutationFn: (id: string) => updateReturn(id, 'cancel', {}),
    onSettled: invalidate,
  })
}
