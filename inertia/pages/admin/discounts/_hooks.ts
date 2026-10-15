import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminInfiniteList } from '~/hooks/use_admin_infinite_list'
import { http } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import {
  AdminDiscountResponseSchema,
  AdminDiscountsListQuerySchema,
  AdminDiscountsListResponseSchema,
  type AdminDiscountForm,
  type AdminDiscountsListQuery,
} from './_types'
import { useAdminBulkArchive } from '../_hooks'

export const adminDiscountsKeys = {
  all: ['admin', 'discounts'] as const,
  list: (query: AdminDiscountsListQuery) => [...adminDiscountsKeys.all, 'list', query] as const,
  detail: (id: string) => [...adminDiscountsKeys.all, 'detail', id] as const,
}

export async function fetchAdminDiscounts(query: AdminDiscountsListQuery) {
  const params = AdminDiscountsListQuerySchema.parse(query)
  return http(`/admin/discounts/list${toQueryString(params)}`, {
    schema: AdminDiscountsListResponseSchema,
  })
}

export function useAdminDiscounts(query: AdminDiscountsListQuery) {
  return useQuery({
    queryKey: adminDiscountsKeys.list(query),
    queryFn: () => fetchAdminDiscounts(query),
    placeholderData: keepPreviousData,
  })
}

/** The list page's rows, loaded in batches as the table scrolls. */
export function useAdminDiscountsInfinite(
  filters: Omit<AdminDiscountsListQuery, 'page' | 'perPage'>
) {
  return useAdminInfiniteList([...adminDiscountsKeys.all, 'list', 'infinite', filters], (page) =>
    fetchAdminDiscounts({ ...filters, ...page })
  )
}

export async function fetchAdminDiscount(id: string) {
  const { data } = await http(`/admin/discounts/view/${id}`, {
    schema: AdminDiscountResponseSchema,
  })
  return data
}

export function useAdminDiscount(id: string) {
  return useQuery({
    queryKey: adminDiscountsKeys.detail(id),
    queryFn: () => fetchAdminDiscount(id),
  })
}

function useInvalidateDiscounts() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: adminDiscountsKeys.all })
}

export async function createAdminDiscount(payload: AdminDiscountForm) {
  const { data } = await http('/admin/discounts', {
    method: 'POST',
    body: payload,
    schema: AdminDiscountResponseSchema,
  })
  return data
}

export function useCreateAdminDiscount() {
  const invalidate = useInvalidateDiscounts()
  return useMutation({ mutationFn: createAdminDiscount, onSuccess: invalidate })
}

export async function updateAdminDiscount({ id, ...payload }: AdminDiscountForm & { id: string }) {
  const { data } = await http(`/admin/discounts/${id}`, {
    method: 'PUT',
    body: payload,
    schema: AdminDiscountResponseSchema,
  })
  return data
}

export function useUpdateAdminDiscount() {
  const invalidate = useInvalidateDiscounts()
  return useMutation({ mutationFn: updateAdminDiscount, onSuccess: invalidate })
}

export async function archiveAdminDiscount(id: string) {
  const { data } = await http(`/admin/discounts/${id}/archive`, {
    method: 'POST',
    schema: AdminDiscountResponseSchema,
  })
  return data
}

export function useArchiveAdminDiscount() {
  const invalidate = useInvalidateDiscounts()
  return useMutation({ mutationFn: archiveAdminDiscount, onSuccess: invalidate })
}

export async function unarchiveAdminDiscount(id: string) {
  const { data } = await http(`/admin/discounts/${id}/unarchive`, {
    method: 'POST',
    schema: AdminDiscountResponseSchema,
  })
  return data
}

export function useUnarchiveAdminDiscount() {
  const invalidate = useInvalidateDiscounts()
  return useMutation({ mutationFn: unarchiveAdminDiscount, onSuccess: invalidate })
}

export function useBulkSetAdminDiscountsArchived() {
  return useAdminBulkArchive('/admin/discounts/bulk/archive', adminDiscountsKeys.all)
}
