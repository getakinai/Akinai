import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminInfiniteList } from '~/hooks/use_admin_infinite_list'
import { http } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import { useAdminBulkArchive, useAdminBulkStatus } from '../../_hooks'
import {
  AdminHelpArticleOptionsResponseSchema,
  AdminHelpArticleResponseSchema,
  AdminHelpArticlesListQuerySchema,
  AdminHelpArticlesListResponseSchema,
  HelpMarkdownPreviewResponseSchema,
  type AdminHelpArticleForm,
  type AdminHelpArticlesListQuery,
} from './_types'

/** Under `['admin', 'help']` so category changes refresh them too. */
export const adminHelpArticlesKeys = {
  all: ['admin', 'help', 'articles'] as const,
  lists: ['admin', 'help', 'articles', 'list'] as const,
  options: ['admin', 'help', 'articles', 'options'] as const,
  detail: (id: string) => ['admin', 'help', 'articles', 'detail', id] as const,
}

export async function fetchAdminHelpArticles(query: AdminHelpArticlesListQuery) {
  const params = AdminHelpArticlesListQuerySchema.parse(query)
  return http(`/admin/help/articles/list${toQueryString(params)}`, {
    schema: AdminHelpArticlesListResponseSchema,
  })
}

/** The list page's rows, loaded in batches as the table scrolls. */
export function useAdminHelpArticlesInfinite(
  filters: Omit<AdminHelpArticlesListQuery, 'page' | 'perPage'>
) {
  return useAdminInfiniteList([...adminHelpArticlesKeys.lists, 'infinite', filters], (page) =>
    fetchAdminHelpArticles({ ...filters, ...page })
  )
}

export async function fetchAdminHelpArticle(id: string) {
  const { data } = await http(`/admin/help/articles/view/${id}`, {
    schema: AdminHelpArticleResponseSchema,
  })
  return data
}

export function useAdminHelpArticle(id: string) {
  return useQuery({
    queryKey: adminHelpArticlesKeys.detail(id),
    queryFn: () => fetchAdminHelpArticle(id),
  })
}

export async function fetchAdminHelpArticleOptions() {
  const { data } = await http('/admin/help/articles/options', {
    schema: AdminHelpArticleOptionsResponseSchema,
  })
  return data
}

/** Articles that can be picked as related. */
export function useAdminHelpArticleOptions() {
  return useQuery({
    queryKey: adminHelpArticlesKeys.options,
    queryFn: fetchAdminHelpArticleOptions,
  })
}

export async function previewAdminHelpMarkdown(markdown: string) {
  const { data } = await http('/admin/help/articles/preview', {
    method: 'POST',
    body: { markdown },
    schema: HelpMarkdownPreviewResponseSchema,
  })
  return data.html
}

/** Renders markdown with the same server sanitizer used when the article is saved. */
export function usePreviewAdminHelpMarkdown() {
  return useMutation({ mutationFn: previewAdminHelpMarkdown })
}

function useInvalidateHelpArticles() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['admin', 'help'] })
}

export async function createAdminHelpArticle(payload: AdminHelpArticleForm) {
  const { data } = await http('/admin/help/articles', {
    method: 'POST',
    body: payload,
    schema: AdminHelpArticleResponseSchema,
  })
  return data
}

export function useCreateAdminHelpArticle() {
  const invalidate = useInvalidateHelpArticles()
  return useMutation({ mutationFn: createAdminHelpArticle, onSuccess: invalidate })
}

export async function updateAdminHelpArticle({
  id,
  ...payload
}: AdminHelpArticleForm & { id: string }) {
  const { data } = await http(`/admin/help/articles/${id}`, {
    method: 'PUT',
    body: payload,
    schema: AdminHelpArticleResponseSchema,
  })
  return data
}

export function useUpdateAdminHelpArticle() {
  const invalidate = useInvalidateHelpArticles()
  return useMutation({ mutationFn: updateAdminHelpArticle, onSuccess: invalidate })
}

export async function archiveAdminHelpArticle(id: string) {
  const { data } = await http(`/admin/help/articles/${id}/archive`, {
    method: 'POST',
    schema: AdminHelpArticleResponseSchema,
  })
  return data
}

export function useArchiveAdminHelpArticle() {
  const invalidate = useInvalidateHelpArticles()
  return useMutation({ mutationFn: archiveAdminHelpArticle, onSuccess: invalidate })
}

export async function unarchiveAdminHelpArticle(id: string) {
  const { data } = await http(`/admin/help/articles/${id}/unarchive`, {
    method: 'POST',
    schema: AdminHelpArticleResponseSchema,
  })
  return data
}

export function useUnarchiveAdminHelpArticle() {
  const invalidate = useInvalidateHelpArticles()
  return useMutation({ mutationFn: unarchiveAdminHelpArticle, onSuccess: invalidate })
}

export function useBulkSetAdminHelpArticlesStatus() {
  return useAdminBulkStatus('/admin/help/articles/bulk/status', ['admin', 'help'])
}

export function useBulkSetAdminHelpArticlesArchived() {
  return useAdminBulkArchive('/admin/help/articles/bulk/archive', ['admin', 'help'])
}
