import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminInfiniteList } from '~/hooks/use_admin_infinite_list'
import { http } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import { adminProductsKeys } from '../products/_hooks'
import {
  AdminProductTypeResponseSchema,
  AdminProductTypesListQuerySchema,
  AdminProductTypesListResponseSchema,
  type AdminProductTypeForm,
  type AdminProductTypesListQuery,
} from './_types'
import { useAdminBulkArchive, useAdminCsvExport, useAdminCsvImport } from '../_hooks'

export const adminProductTypesKeys = {
  all: ['admin', 'product-types'] as const,
  list: (query: AdminProductTypesListQuery) =>
    [...adminProductTypesKeys.all, 'list', query] as const,
}

export async function fetchAdminProductTypes(query: AdminProductTypesListQuery) {
  const params = AdminProductTypesListQuerySchema.parse(query)
  return http(`/admin/product-types/list${toQueryString(params)}`, {
    schema: AdminProductTypesListResponseSchema,
  })
}

export function useAdminProductTypes(query: AdminProductTypesListQuery) {
  return useQuery({
    queryKey: adminProductTypesKeys.list(query),
    queryFn: () => fetchAdminProductTypes(query),
    placeholderData: keepPreviousData,
  })
}

/** The list page's rows, loaded in batches as the table scrolls. */
export function useAdminProductTypesInfinite(
  filters: Omit<AdminProductTypesListQuery, 'page' | 'perPage'>
) {
  return useAdminInfiniteList([...adminProductTypesKeys.all, 'list', 'infinite', filters], (page) =>
    fetchAdminProductTypes({ ...filters, ...page })
  )
}

/**
 * Refreshes the list and the product form dropdowns.
 */
function useInvalidateProductTypes() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: adminProductTypesKeys.all })
    queryClient.invalidateQueries({ queryKey: adminProductsKeys.facets })
  }
}

export async function createAdminProductType(payload: AdminProductTypeForm) {
  const { data } = await http('/admin/product-types', {
    method: 'POST',
    body: payload,
    schema: AdminProductTypeResponseSchema,
  })
  return data
}

export function useCreateAdminProductType() {
  const invalidate = useInvalidateProductTypes()
  return useMutation({ mutationFn: createAdminProductType, onSuccess: invalidate })
}

export async function updateAdminProductType({
  id,
  ...payload
}: AdminProductTypeForm & { id: string }) {
  const { data } = await http(`/admin/product-types/${id}`, {
    method: 'PUT',
    body: payload,
    schema: AdminProductTypeResponseSchema,
  })
  return data
}

export function useUpdateAdminProductType() {
  const invalidate = useInvalidateProductTypes()
  return useMutation({ mutationFn: updateAdminProductType, onSuccess: invalidate })
}

export async function archiveAdminProductType(id: string) {
  const { data } = await http(`/admin/product-types/${id}/archive`, {
    method: 'POST',
    schema: AdminProductTypeResponseSchema,
  })
  return data
}

export function useArchiveAdminProductType() {
  const invalidate = useInvalidateProductTypes()
  return useMutation({ mutationFn: archiveAdminProductType, onSuccess: invalidate })
}

export async function unarchiveAdminProductType(id: string) {
  const { data } = await http(`/admin/product-types/${id}/unarchive`, {
    method: 'POST',
    schema: AdminProductTypeResponseSchema,
  })
  return data
}

export function useUnarchiveAdminProductType() {
  const invalidate = useInvalidateProductTypes()
  return useMutation({ mutationFn: unarchiveAdminProductType, onSuccess: invalidate })
}

export function useBulkSetAdminProductTypesArchived() {
  return useAdminBulkArchive('/admin/product-types/bulk/archive', adminProductTypesKeys.all)
}

/** Downloads the product types matching the list filters as an import-ready CSV. */
export function useExportAdminProductTypes() {
  return useAdminCsvExport(
    '/admin/product-types/export',
    'product-types.csv',
    (query: Omit<AdminProductTypesListQuery, 'page' | 'perPage'>) =>
      AdminProductTypesListQuerySchema.omit({ page: true, perPage: true }).parse(query)
  )
}

export function useImportAdminProductTypes() {
  return useAdminCsvImport('/admin/product-types/import', [adminProductTypesKeys.all])
}
