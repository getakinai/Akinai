import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminInfiniteList } from '~/hooks/use_admin_infinite_list'
import { http } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import { useAdminBulkArchive, useAdminBulkStatus } from '../_hooks'
import {
  AdminContentPageResponseSchema,
  AdminPagesListQuerySchema,
  AdminPagesListResponseSchema,
  type AdminPagesListQuery,
  type PageForm,
} from './_types'

export const adminPagesKeys = {
  all: ['admin', 'pages'] as const,
  lists: ['admin', 'pages', 'list'] as const,
  detail: (id: string) => [...adminPagesKeys.all, 'detail', id] as const,
}

/** Link pickers on the storefront menu, hero and promo screens list pages too. */
const storefrontLinkKeys = ['admin', 'storefront'] as const

export async function fetchAdminPages(query: AdminPagesListQuery) {
  const params = AdminPagesListQuerySchema.parse(query)
  return http(`/admin/pages/list${toQueryString(params)}`, {
    schema: AdminPagesListResponseSchema,
  })
}

/** The list page's rows, loaded in batches as the table scrolls. */
export function useAdminPagesInfinite(filters: Omit<AdminPagesListQuery, 'page' | 'perPage'>) {
  return useAdminInfiniteList([...adminPagesKeys.lists, 'infinite', filters], (page) =>
    fetchAdminPages({ ...filters, ...page })
  )
}

export async function fetchAdminPage(id: string) {
  const { data } = await http(`/admin/pages/view/${id}`, {
    schema: AdminContentPageResponseSchema,
  })
  return data
}

export function useAdminPage(id: string) {
  return useQuery({
    queryKey: adminPagesKeys.detail(id),
    queryFn: () => fetchAdminPage(id),
  })
}

/**
 * Taking a policy slot can move it off another page, so every page query
 * is refreshed, not just this one.
 */
function useInvalidatePages() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: adminPagesKeys.all })
    queryClient.invalidateQueries({ queryKey: storefrontLinkKeys })
  }
}

export async function createAdminPage(payload: PageForm) {
  const { data } = await http('/admin/pages', {
    method: 'POST',
    body: payload,
    schema: AdminContentPageResponseSchema,
  })
  return data
}

export function useCreateAdminPage() {
  const invalidate = useInvalidatePages()
  return useMutation({ mutationFn: createAdminPage, onSuccess: invalidate })
}

export async function updateAdminPage({ id, ...payload }: PageForm & { id: string }) {
  const { data } = await http(`/admin/pages/${id}`, {
    method: 'PUT',
    body: payload,
    schema: AdminContentPageResponseSchema,
  })
  return data
}

export function useUpdateAdminPage() {
  const invalidate = useInvalidatePages()
  return useMutation({ mutationFn: updateAdminPage, onSuccess: invalidate })
}

export async function archiveAdminPage(id: string) {
  const { data } = await http(`/admin/pages/${id}/archive`, {
    method: 'POST',
    schema: AdminContentPageResponseSchema,
  })
  return data
}

export function useArchiveAdminPage() {
  const invalidate = useInvalidatePages()
  return useMutation({ mutationFn: archiveAdminPage, onSuccess: invalidate })
}

export async function unarchiveAdminPage(id: string) {
  const { data } = await http(`/admin/pages/${id}/unarchive`, {
    method: 'POST',
    schema: AdminContentPageResponseSchema,
  })
  return data
}

export function useUnarchiveAdminPage() {
  const invalidate = useInvalidatePages()
  return useMutation({ mutationFn: unarchiveAdminPage, onSuccess: invalidate })
}

export function useBulkSetAdminPagesStatus() {
  return useAdminBulkStatus('/admin/pages/bulk/status', adminPagesKeys.all)
}

export function useBulkSetAdminPagesArchived() {
  return useAdminBulkArchive('/admin/pages/bulk/archive', adminPagesKeys.all)
}
