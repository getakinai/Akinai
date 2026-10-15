import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminInfiniteList } from '~/hooks/use_admin_infinite_list'
import { http } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import { useAdminBulkArchive } from '../../_hooks'
import {
  AdminHelpCategoriesListQuerySchema,
  AdminHelpCategoriesListResponseSchema,
  AdminHelpCategoryOptionsResponseSchema,
  AdminHelpCategoryResponseSchema,
  type AdminHelpCategoriesListQuery,
  type AdminHelpCategoryForm,
} from './_types'

/** Under `['admin', 'help']` so article queries refresh with them. */
export const adminHelpCategoriesKeys = {
  all: ['admin', 'help', 'categories'] as const,
  options: ['admin', 'help', 'categories', 'options'] as const,
}

const helpKeys = ['admin', 'help'] as const

export async function fetchAdminHelpCategories(query: AdminHelpCategoriesListQuery) {
  const params = AdminHelpCategoriesListQuerySchema.parse(query)
  return http(`/admin/help/categories/list${toQueryString(params)}`, {
    schema: AdminHelpCategoriesListResponseSchema,
  })
}

/** The list page's rows, loaded in batches as the table scrolls. */
export function useAdminHelpCategoriesInfinite(
  filters: Omit<AdminHelpCategoriesListQuery, 'page' | 'perPage'>
) {
  return useAdminInfiniteList(
    [...adminHelpCategoriesKeys.all, 'list', 'infinite', filters],
    (page) => fetchAdminHelpCategories({ ...filters, ...page })
  )
}

export async function fetchAdminHelpCategoryOptions() {
  const { data } = await http('/admin/help/categories/options', {
    schema: AdminHelpCategoryOptionsResponseSchema,
  })
  return data
}

/** Active categories and their sections, for the article form and filters. */
export function useAdminHelpCategoryOptions() {
  return useQuery({
    queryKey: adminHelpCategoriesKeys.options,
    queryFn: fetchAdminHelpCategoryOptions,
  })
}

function useInvalidateHelp() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: helpKeys })
}

export async function createAdminHelpCategory(payload: AdminHelpCategoryForm) {
  const { data } = await http('/admin/help/categories', {
    method: 'POST',
    body: payload,
    schema: AdminHelpCategoryResponseSchema,
  })
  return data
}

export function useCreateAdminHelpCategory() {
  const invalidate = useInvalidateHelp()
  return useMutation({ mutationFn: createAdminHelpCategory, onSuccess: invalidate })
}

export async function updateAdminHelpCategory({
  id,
  ...payload
}: AdminHelpCategoryForm & { id: string }) {
  const { data } = await http(`/admin/help/categories/${id}`, {
    method: 'PUT',
    body: payload,
    schema: AdminHelpCategoryResponseSchema,
  })
  return data
}

export function useUpdateAdminHelpCategory() {
  const invalidate = useInvalidateHelp()
  return useMutation({ mutationFn: updateAdminHelpCategory, onSuccess: invalidate })
}

export async function archiveAdminHelpCategory(id: string) {
  const { data } = await http(`/admin/help/categories/${id}/archive`, {
    method: 'POST',
    schema: AdminHelpCategoryResponseSchema,
  })
  return data
}

export function useArchiveAdminHelpCategory() {
  const invalidate = useInvalidateHelp()
  return useMutation({ mutationFn: archiveAdminHelpCategory, onSuccess: invalidate })
}

export async function unarchiveAdminHelpCategory(id: string) {
  const { data } = await http(`/admin/help/categories/${id}/unarchive`, {
    method: 'POST',
    schema: AdminHelpCategoryResponseSchema,
  })
  return data
}

export function useUnarchiveAdminHelpCategory() {
  const invalidate = useInvalidateHelp()
  return useMutation({ mutationFn: unarchiveAdminHelpCategory, onSuccess: invalidate })
}

export function useBulkSetAdminHelpCategoriesArchived() {
  return useAdminBulkArchive('/admin/help/categories/bulk/archive', helpKeys)
}
