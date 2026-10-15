import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminInfiniteList } from '~/hooks/use_admin_infinite_list'
import { http } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import {
  AdminLocationResponseSchema,
  AdminLocationsListQuerySchema,
  AdminLocationsListResponseSchema,
  type AdminLocationForm,
  type AdminLocationsListQuery,
} from './_types'
import { useAdminBulkArchive, useAdminCsvExport, useAdminCsvImport } from '../_hooks'

export const adminLocationsKeys = {
  all: ['admin', 'locations'] as const,
  list: (query: AdminLocationsListQuery) => [...adminLocationsKeys.all, 'list', query] as const,
}

/**
 * Product detail responses embed the active locations, so location changes
 * refresh them too.
 */
const productsKey = ['admin', 'products'] as const

export async function fetchAdminLocations(query: AdminLocationsListQuery) {
  const params = AdminLocationsListQuerySchema.parse(query)
  return http(`/admin/locations/list${toQueryString(params)}`, {
    schema: AdminLocationsListResponseSchema,
  })
}

export function useAdminLocations(query: AdminLocationsListQuery, { enabled = true } = {}) {
  return useQuery({
    queryKey: adminLocationsKeys.list(query),
    queryFn: () => fetchAdminLocations(query),
    placeholderData: keepPreviousData,
    enabled,
  })
}

/** The list page's rows, loaded in batches as the table scrolls. */
export function useAdminLocationsInfinite(
  filters: Omit<AdminLocationsListQuery, 'page' | 'perPage'>
) {
  return useAdminInfiniteList([...adminLocationsKeys.all, 'list', 'infinite', filters], (page) =>
    fetchAdminLocations({ ...filters, ...page })
  )
}

function useInvalidateLocations() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: adminLocationsKeys.all })
    queryClient.invalidateQueries({ queryKey: productsKey })
  }
}

export async function createAdminLocation(payload: AdminLocationForm) {
  const { data } = await http('/admin/locations', {
    method: 'POST',
    body: payload,
    schema: AdminLocationResponseSchema,
  })
  return data
}

export function useCreateAdminLocation() {
  const invalidate = useInvalidateLocations()
  return useMutation({ mutationFn: createAdminLocation, onSuccess: invalidate })
}

export async function updateAdminLocation({ id, ...payload }: AdminLocationForm & { id: string }) {
  const { data } = await http(`/admin/locations/${id}`, {
    method: 'PUT',
    body: payload,
    schema: AdminLocationResponseSchema,
  })
  return data
}

export function useUpdateAdminLocation() {
  const invalidate = useInvalidateLocations()
  return useMutation({ mutationFn: updateAdminLocation, onSuccess: invalidate })
}

export async function archiveAdminLocation(id: string) {
  const { data } = await http(`/admin/locations/${id}/archive`, {
    method: 'POST',
    schema: AdminLocationResponseSchema,
  })
  return data
}

export function useArchiveAdminLocation() {
  const invalidate = useInvalidateLocations()
  return useMutation({ mutationFn: archiveAdminLocation, onSuccess: invalidate })
}

export async function unarchiveAdminLocation(id: string) {
  const { data } = await http(`/admin/locations/${id}/unarchive`, {
    method: 'POST',
    schema: AdminLocationResponseSchema,
  })
  return data
}

export function useUnarchiveAdminLocation() {
  const invalidate = useInvalidateLocations()
  return useMutation({ mutationFn: unarchiveAdminLocation, onSuccess: invalidate })
}

export function useBulkSetAdminLocationsArchived() {
  return useAdminBulkArchive('/admin/locations/bulk/archive', adminLocationsKeys.all)
}

/** Downloads the locations matching the list filters as an import-ready CSV. */
export function useExportAdminLocations() {
  return useAdminCsvExport(
    '/admin/locations/export',
    'locations.csv',
    (query: Omit<AdminLocationsListQuery, 'page' | 'perPage'>) =>
      AdminLocationsListQuerySchema.omit({ page: true, perPage: true }).parse(query)
  )
}

export function useImportAdminLocations() {
  return useAdminCsvImport('/admin/locations/import', [adminLocationsKeys.all])
}
