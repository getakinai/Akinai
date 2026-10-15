import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminInfiniteList } from '~/hooks/use_admin_infinite_list'
import { http } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import { adminProductsKeys } from '../products/_hooks'
import {
  AdminProductLabelResponseSchema,
  AdminProductLabelsListQuerySchema,
  AdminProductLabelsListResponseSchema,
  type AdminProductLabelForm,
  type AdminProductLabelsListQuery,
} from './_types'
import { useAdminBulkArchive } from '../_hooks'

export const adminProductLabelsKeys = {
  all: ['admin', 'product-labels'] as const,
  list: (query: AdminProductLabelsListQuery) =>
    [...adminProductLabelsKeys.all, 'list', query] as const,
}

export async function fetchAdminProductLabels(query: AdminProductLabelsListQuery) {
  const params = AdminProductLabelsListQuerySchema.parse(query)
  return http(`/admin/product-labels/list${toQueryString(params)}`, {
    schema: AdminProductLabelsListResponseSchema,
  })
}

export function useAdminProductLabels(query: AdminProductLabelsListQuery) {
  return useQuery({
    queryKey: adminProductLabelsKeys.list(query),
    queryFn: () => fetchAdminProductLabels(query),
    placeholderData: keepPreviousData,
  })
}

/** The list page's rows, loaded in batches as the table scrolls. */
export function useAdminProductLabelsInfinite(
  filters: Omit<AdminProductLabelsListQuery, 'page' | 'perPage'>
) {
  return useAdminInfiniteList(
    [...adminProductLabelsKeys.all, 'list', 'infinite', filters],
    (page) => fetchAdminProductLabels({ ...filters, ...page })
  )
}

/**
 * Refreshes the list and the product form dropdown.
 */
function useInvalidateProductLabels() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: adminProductLabelsKeys.all })
    queryClient.invalidateQueries({ queryKey: adminProductsKeys.facets })
  }
}

export async function createAdminProductLabel(payload: AdminProductLabelForm) {
  const { data } = await http('/admin/product-labels', {
    method: 'POST',
    body: payload,
    schema: AdminProductLabelResponseSchema,
  })
  return data
}

export function useCreateAdminProductLabel() {
  const invalidate = useInvalidateProductLabels()
  return useMutation({ mutationFn: createAdminProductLabel, onSuccess: invalidate })
}

export async function updateAdminProductLabel({
  id,
  ...payload
}: AdminProductLabelForm & { id: string }) {
  const { data } = await http(`/admin/product-labels/${id}`, {
    method: 'PUT',
    body: payload,
    schema: AdminProductLabelResponseSchema,
  })
  return data
}

export function useUpdateAdminProductLabel() {
  const invalidate = useInvalidateProductLabels()
  return useMutation({ mutationFn: updateAdminProductLabel, onSuccess: invalidate })
}

export async function archiveAdminProductLabel(id: string) {
  const { data } = await http(`/admin/product-labels/${id}/archive`, {
    method: 'POST',
    schema: AdminProductLabelResponseSchema,
  })
  return data
}

export function useArchiveAdminProductLabel() {
  const invalidate = useInvalidateProductLabels()
  return useMutation({ mutationFn: archiveAdminProductLabel, onSuccess: invalidate })
}

export async function unarchiveAdminProductLabel(id: string) {
  const { data } = await http(`/admin/product-labels/${id}/unarchive`, {
    method: 'POST',
    schema: AdminProductLabelResponseSchema,
  })
  return data
}

export function useUnarchiveAdminProductLabel() {
  const invalidate = useInvalidateProductLabels()
  return useMutation({ mutationFn: unarchiveAdminProductLabel, onSuccess: invalidate })
}

export function useBulkSetAdminProductLabelsArchived() {
  return useAdminBulkArchive('/admin/product-labels/bulk/archive', adminProductLabelsKeys.all)
}
