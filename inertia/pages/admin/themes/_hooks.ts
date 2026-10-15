import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '~/lib/http'
import {
  AdminThemeListResponseSchema,
  AdminThemeResponseSchema,
  AdminThemeShareResponseSchema,
} from './_types'

export const adminThemeKeys = {
  all: ['admin', 'themes'] as const,
}

const themeUrl = (id: string, action = '') =>
  `/admin/themes/${encodeURIComponent(id)}${action ? `/${action}` : ''}`

export async function fetchAdminThemes() {
  const { data } = await http('/admin/themes/list', { schema: AdminThemeListResponseSchema })
  return data
}

export function useAdminThemes() {
  return useQuery({ queryKey: adminThemeKeys.all, queryFn: fetchAdminThemes })
}

function useThemeMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminThemeKeys.all }),
  })
}

export function useUploadAdminTheme() {
  return useThemeMutation(async (file: File) => {
    const body = new FormData()
    body.append('theme', file)
    const { data } = await http('/admin/themes', {
      method: 'POST',
      body,
      schema: AdminThemeResponseSchema,
    })
    return data
  })
}

export function usePublishAdminTheme() {
  return useThemeMutation((id: string) =>
    http(themeUrl(id, 'publish'), { method: 'POST', schema: z.unknown() })
  )
}

export function useUnpublishAdminTheme() {
  return useThemeMutation((id: string) =>
    http(themeUrl(id, 'publish'), { method: 'DELETE', schema: z.unknown() })
  )
}

export function useDuplicateAdminTheme() {
  return useThemeMutation((id: string) =>
    http(themeUrl(id, 'duplicate'), { method: 'POST', schema: AdminThemeResponseSchema })
  )
}

export function useRenameAdminTheme() {
  return useThemeMutation(({ id, name }: { id: string; name: string }) =>
    http(themeUrl(id), { method: 'PUT', body: { name }, schema: z.unknown() })
  )
}

export function useDeleteAdminTheme() {
  return useThemeMutation((id: string) =>
    http(themeUrl(id), { method: 'DELETE', schema: z.unknown() })
  )
}

export async function createAdminThemeShareLink(id: string) {
  const { data } = await http(themeUrl(id, 'share'), {
    method: 'POST',
    schema: AdminThemeShareResponseSchema,
  })
  return data
}

export const adminThemePreviewUrl = (id: string | 'builtin') => themeUrl(id, 'preview')
export const adminThemeDownloadUrl = (id: string) => themeUrl(id, 'download')
