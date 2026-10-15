import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminInfiniteList } from '~/hooks/use_admin_infinite_list'
import { http } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import { adminProductsKeys } from '../products/_hooks'
import {
  AdminVendorResponseSchema,
  AdminVendorsListQuerySchema,
  AdminVendorsListResponseSchema,
  type AdminVendorForm,
  type AdminVendorsListQuery,
} from './_types'
import { useAdminBulkArchive, useAdminCsvExport, useAdminCsvImport } from '../_hooks'

export const adminVendorsKeys = {
  all: ['admin', 'vendors'] as const,
  list: (query: AdminVendorsListQuery) => [...adminVendorsKeys.all, 'list', query] as const,
}

export async function fetchAdminVendors(query: AdminVendorsListQuery) {
  const params = AdminVendorsListQuerySchema.parse(query)
  return http(`/admin/vendors/list${toQueryString(params)}`, {
    schema: AdminVendorsListResponseSchema,
  })
}

export function useAdminVendors(query: AdminVendorsListQuery) {
  return useQuery({
    queryKey: adminVendorsKeys.list(query),
    queryFn: () => fetchAdminVendors(query),
    placeholderData: keepPreviousData,
  })
}

/** The list page's rows, loaded in batches as the table scrolls. */
export function useAdminVendorsInfinite(filters: Omit<AdminVendorsListQuery, 'page' | 'perPage'>) {
  return useAdminInfiniteList([...adminVendorsKeys.all, 'list', 'infinite', filters], (page) =>
    fetchAdminVendors({ ...filters, ...page })
  )
}

/**
 * Refreshes the list and the product form dropdowns.
 */
function useInvalidateVendors() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: adminVendorsKeys.all })
    queryClient.invalidateQueries({ queryKey: adminProductsKeys.facets })
  }
}

export async function createAdminVendor(payload: AdminVendorForm) {
  const { data } = await http('/admin/vendors', {
    method: 'POST',
    body: payload,
    schema: AdminVendorResponseSchema,
  })
  return data
}

export function useCreateAdminVendor() {
  const invalidate = useInvalidateVendors()
  return useMutation({ mutationFn: createAdminVendor, onSuccess: invalidate })
}

export async function updateAdminVendor({ id, ...payload }: AdminVendorForm & { id: string }) {
  const { data } = await http(`/admin/vendors/${id}`, {
    method: 'PUT',
    body: payload,
    schema: AdminVendorResponseSchema,
  })
  return data
}

export function useUpdateAdminVendor() {
  const invalidate = useInvalidateVendors()
  return useMutation({ mutationFn: updateAdminVendor, onSuccess: invalidate })
}

export async function uploadAdminVendorImage({ id, file }: { id: string; file: File }) {
  const body = new FormData()
  body.append('image', file)
  const { data } = await http(`/admin/vendors/${id}/image`, {
    method: 'POST',
    body,
    schema: AdminVendorResponseSchema,
  })
  return data
}

export function useUploadAdminVendorImage() {
  const invalidate = useInvalidateVendors()
  return useMutation({ mutationFn: uploadAdminVendorImage, onSuccess: invalidate })
}

export async function removeAdminVendorImage(id: string) {
  const { data } = await http(`/admin/vendors/${id}/image`, {
    method: 'DELETE',
    schema: AdminVendorResponseSchema,
  })
  return data
}

export function useRemoveAdminVendorImage() {
  const invalidate = useInvalidateVendors()
  return useMutation({ mutationFn: removeAdminVendorImage, onSuccess: invalidate })
}

export async function archiveAdminVendor(id: string) {
  const { data } = await http(`/admin/vendors/${id}/archive`, {
    method: 'POST',
    schema: AdminVendorResponseSchema,
  })
  return data
}

export function useArchiveAdminVendor() {
  const invalidate = useInvalidateVendors()
  return useMutation({ mutationFn: archiveAdminVendor, onSuccess: invalidate })
}

export async function unarchiveAdminVendor(id: string) {
  const { data } = await http(`/admin/vendors/${id}/unarchive`, {
    method: 'POST',
    schema: AdminVendorResponseSchema,
  })
  return data
}

export function useUnarchiveAdminVendor() {
  const invalidate = useInvalidateVendors()
  return useMutation({ mutationFn: unarchiveAdminVendor, onSuccess: invalidate })
}

export function useBulkSetAdminVendorsArchived() {
  return useAdminBulkArchive('/admin/vendors/bulk/archive', adminVendorsKeys.all)
}

/** Downloads the vendors matching the list filters as an import-ready CSV. */
export function useExportAdminVendors() {
  return useAdminCsvExport(
    '/admin/vendors/export',
    'vendors.csv',
    (query: Omit<AdminVendorsListQuery, 'page' | 'perPage'>) =>
      AdminVendorsListQuerySchema.omit({ page: true, perPage: true }).parse(query)
  )
}

export function useImportAdminVendors() {
  return useAdminCsvImport('/admin/vendors/import', [adminVendorsKeys.all])
}
