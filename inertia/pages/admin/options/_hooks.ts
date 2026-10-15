import { z } from 'zod'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminInfiniteList } from '~/hooks/use_admin_infinite_list'
import { http } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import { adminProductsKeys } from '../products/_hooks'
import {
  AdminOptionResponseSchema,
  AdminOptionsCatalogResponseSchema,
  AdminOptionsListQuerySchema,
  AdminOptionsListResponseSchema,
  AdminOptionValueResponseSchema,
  type AdminOptionNameForm,
  type AdminOptionValueForm,
  type AdminOptionsListQuery,
} from './_types'
import { useAdminBulkArchive, useAdminCsvExport, useAdminCsvImport } from '../_hooks'

export const adminOptionsKeys = {
  all: ['admin', 'options'] as const,
  list: (query: AdminOptionsListQuery) => [...adminOptionsKeys.all, 'list', query] as const,
  detail: (id: string) => [...adminOptionsKeys.all, 'detail', id] as const,
  catalog: ['admin', 'options', 'catalog'] as const,
}

export async function fetchAdminOptions(query: AdminOptionsListQuery) {
  const params = AdminOptionsListQuerySchema.parse(query)
  return http(`/admin/options/list${toQueryString(params)}`, {
    schema: AdminOptionsListResponseSchema,
  })
}

export function useAdminOptions(query: AdminOptionsListQuery) {
  return useQuery({
    queryKey: adminOptionsKeys.list(query),
    queryFn: () => fetchAdminOptions(query),
    placeholderData: keepPreviousData,
  })
}

/** The list page's rows, loaded in batches as the table scrolls. */
export function useAdminOptionsInfinite(filters: Omit<AdminOptionsListQuery, 'page' | 'perPage'>) {
  return useAdminInfiniteList([...adminOptionsKeys.all, 'list', 'infinite', filters], (page) =>
    fetchAdminOptions({ ...filters, ...page })
  )
}

export async function fetchAdminOption(id: string) {
  const { data } = await http(`/admin/options/view/${id}`, { schema: AdminOptionResponseSchema })
  return data
}

export function useAdminOption(id: string) {
  return useQuery({ queryKey: adminOptionsKeys.detail(id), queryFn: () => fetchAdminOption(id) })
}

export async function fetchAdminOptionsCatalog() {
  const { data } = await http('/admin/options/catalog', {
    schema: AdminOptionsCatalogResponseSchema,
  })
  return data
}

export function useAdminOptionsCatalog() {
  return useQuery({
    queryKey: adminOptionsKeys.catalog,
    queryFn: fetchAdminOptionsCatalog,
    staleTime: 60_000,
  })
}

function useInvalidateOptions() {
  const queryClient = useQueryClient()
  return (id?: string) => {
    queryClient.invalidateQueries({ queryKey: adminOptionsKeys.all })
    queryClient.invalidateQueries({ queryKey: adminOptionsKeys.catalog })
    if (id) queryClient.invalidateQueries({ queryKey: adminOptionsKeys.detail(id) })
    queryClient.invalidateQueries({ queryKey: adminProductsKeys.all })
  }
}

export async function createAdminOption(payload: AdminOptionNameForm) {
  const { data } = await http('/admin/options', {
    method: 'POST',
    body: payload,
    schema: AdminOptionResponseSchema,
  })
  return data
}

export function useCreateAdminOption() {
  const invalidate = useInvalidateOptions()
  return useMutation({
    mutationFn: createAdminOption,
    onSuccess: (option) => invalidate(option.id),
  })
}

export async function updateAdminOption({ id, ...payload }: AdminOptionNameForm & { id: string }) {
  const { data } = await http(`/admin/options/${id}`, {
    method: 'PUT',
    body: payload,
    schema: AdminOptionResponseSchema,
  })
  return data
}

export function useUpdateAdminOption() {
  const invalidate = useInvalidateOptions()
  return useMutation({
    mutationFn: updateAdminOption,
    onSuccess: (option) => invalidate(option.id),
  })
}

export async function archiveAdminOption(id: string) {
  const { data } = await http(`/admin/options/${id}/archive`, {
    method: 'POST',
    schema: AdminOptionResponseSchema,
  })
  return data
}

export function useArchiveAdminOption() {
  const invalidate = useInvalidateOptions()
  return useMutation({
    mutationFn: archiveAdminOption,
    onSuccess: (option) => invalidate(option.id),
  })
}

export async function unarchiveAdminOption(id: string) {
  const { data } = await http(`/admin/options/${id}/unarchive`, {
    method: 'POST',
    schema: AdminOptionResponseSchema,
  })
  return data
}

export function useUnarchiveAdminOption() {
  const invalidate = useInvalidateOptions()
  return useMutation({
    mutationFn: unarchiveAdminOption,
    onSuccess: (option) => invalidate(option.id),
  })
}

export async function createAdminOptionValue({
  optionId,
  ...payload
}: AdminOptionValueForm & { optionId: string }) {
  const { data } = await http(`/admin/options/${optionId}/values`, {
    method: 'POST',
    body: payload,
    schema: AdminOptionValueResponseSchema,
  })
  return data
}

export function useCreateAdminOptionValue(optionId: string) {
  const invalidate = useInvalidateOptions()
  return useMutation({
    mutationFn: (payload: AdminOptionValueForm) => createAdminOptionValue({ optionId, ...payload }),
    onSuccess: () => invalidate(optionId),
  })
}

export async function updateAdminOptionValue({
  optionId,
  valueId,
  ...payload
}: AdminOptionValueForm & { optionId: string; valueId: string }) {
  const { data } = await http(`/admin/options/${optionId}/values/${valueId}`, {
    method: 'PUT',
    body: payload,
    schema: AdminOptionValueResponseSchema,
  })
  return data
}

export function useUpdateAdminOptionValue(optionId: string) {
  const invalidate = useInvalidateOptions()
  return useMutation({
    mutationFn: (args: AdminOptionValueForm & { valueId: string }) =>
      updateAdminOptionValue({ optionId, ...args }),
    onSuccess: () => invalidate(optionId),
  })
}

export async function deleteAdminOptionValue(optionId: string, valueId: string) {
  await http(`/admin/options/${optionId}/values/${valueId}`, {
    method: 'DELETE',
    schema: z.null(),
  })
}

export function useDeleteAdminOptionValue(optionId: string) {
  const invalidate = useInvalidateOptions()
  return useMutation({
    mutationFn: (valueId: string) => deleteAdminOptionValue(optionId, valueId),
    onSuccess: () => invalidate(optionId),
  })
}

export function useBulkSetAdminOptionsArchived() {
  return useAdminBulkArchive('/admin/options/bulk/archive', adminOptionsKeys.all)
}

/** Downloads the options matching the list filters as an import-ready CSV. */
export function useExportAdminOptions() {
  return useAdminCsvExport(
    '/admin/options/export',
    'options.csv',
    (query: Omit<AdminOptionsListQuery, 'page' | 'perPage'>) =>
      AdminOptionsListQuerySchema.omit({ page: true, perPage: true }).parse(query)
  )
}

export function useImportAdminOptions() {
  return useAdminCsvImport('/admin/options/import', [adminOptionsKeys.all])
}
