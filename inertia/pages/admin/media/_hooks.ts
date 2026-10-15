import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { z } from 'zod'
import { http } from '~/lib/http'
import { flattenPages, nextPageParam } from '~/lib/infinite_list'
import { toQueryString } from '~/lib/query_string'
import {
  AdminMediaListResponseSchema,
  AdminMediaStoreResponseSchema,
  MEDIA_PAGE_SIZE,
  type AdminMediaFolderFilter,
} from './_types'

export const adminMediaKeys = {
  all: ['admin', 'media'] as const,
}

type MediaFilters = { q: string; folder: AdminMediaFolderFilter }

export function useAdminMediaInfinite({ q, folder }: MediaFilters) {
  const query = useInfiniteQuery({
    queryKey: [...adminMediaKeys.all, 'list', { q, folder }],
    queryFn: ({ pageParam }) =>
      http(
        `/admin/media/list${toQueryString({ q, folder, page: pageParam, perPage: MEDIA_PAGE_SIZE })}`,
        { schema: AdminMediaListResponseSchema }
      ),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    placeholderData: keepPreviousData,
  })
  return { ...query, ...flattenPages(query.data) }
}

export async function uploadAdminMedia(files: File[]) {
  const body = new FormData()
  for (const file of files) body.append('images[]', file)
  const { data } = await http('/admin/media', {
    method: 'POST',
    body,
    schema: AdminMediaStoreResponseSchema,
  })
  return data
}

export function useUploadAdminMedia() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: uploadAdminMedia,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminMediaKeys.all }),
  })
}

export async function deleteAdminMedia(id: string) {
  await http(`/admin/media/${id}`, { method: 'DELETE', schema: z.unknown() })
}

export function useDeleteAdminMedia() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAdminMedia,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminMediaKeys.all }),
  })
}
