import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminInfiniteList } from '~/hooks/use_admin_infinite_list'
import { http } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import {
  AdminMarketResponseSchema,
  AdminMarketsListQuerySchema,
  AdminMarketsListResponseSchema,
  type AdminMarketCreateForm,
  type AdminMarketUpdateForm,
  type AdminMarketsListQuery,
} from './_types'
import { useAdminBulkArchive } from '../_hooks'

export const adminMarketsKeys = {
  all: ['admin', 'markets'] as const,
  list: (query: AdminMarketsListQuery) => [...adminMarketsKeys.all, 'list', query] as const,
  detail: (id: string) => [...adminMarketsKeys.all, 'detail', id] as const,
}

export async function fetchAdminMarkets(query: AdminMarketsListQuery) {
  const params = AdminMarketsListQuerySchema.parse(query)
  return http(`/admin/markets/list${toQueryString(params)}`, {
    schema: AdminMarketsListResponseSchema,
  })
}

export function useAdminMarkets(query: AdminMarketsListQuery) {
  return useQuery({
    queryKey: adminMarketsKeys.list(query),
    queryFn: () => fetchAdminMarkets(query),
    placeholderData: keepPreviousData,
  })
}

/** The list page's rows, loaded in batches as the table scrolls. */
export function useAdminMarketsInfinite(filters: Omit<AdminMarketsListQuery, 'page' | 'perPage'>) {
  return useAdminInfiniteList([...adminMarketsKeys.all, 'list', 'infinite', filters], (page) =>
    fetchAdminMarkets({ ...filters, ...page })
  )
}

export async function fetchAdminMarket(id: string) {
  const { data } = await http(`/admin/markets/view/${id}`, { schema: AdminMarketResponseSchema })
  return data
}

export function useAdminMarket(id: string) {
  return useQuery({
    queryKey: adminMarketsKeys.detail(id),
    queryFn: () => fetchAdminMarket(id),
  })
}

function useInvalidateMarkets() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: adminMarketsKeys.all })
}

export async function createAdminMarket(payload: AdminMarketCreateForm) {
  const { data } = await http('/admin/markets', {
    method: 'POST',
    body: payload,
    schema: AdminMarketResponseSchema,
  })
  return data
}

export function useCreateAdminMarket() {
  const invalidate = useInvalidateMarkets()
  return useMutation({ mutationFn: createAdminMarket, onSuccess: invalidate })
}

export async function updateAdminMarket({
  id,
  ...payload
}: AdminMarketUpdateForm & { id: string }) {
  const { data } = await http(`/admin/markets/${id}`, {
    method: 'PUT',
    body: payload,
    schema: AdminMarketResponseSchema,
  })
  return data
}

export function useUpdateAdminMarket() {
  const invalidate = useInvalidateMarkets()
  return useMutation({ mutationFn: updateAdminMarket, onSuccess: invalidate })
}

export async function archiveAdminMarket(id: string) {
  const { data } = await http(`/admin/markets/${id}/archive`, {
    method: 'POST',
    schema: AdminMarketResponseSchema,
  })
  return data
}

export function useArchiveAdminMarket() {
  const invalidate = useInvalidateMarkets()
  return useMutation({ mutationFn: archiveAdminMarket, onSuccess: invalidate })
}

export async function unarchiveAdminMarket(id: string) {
  const { data } = await http(`/admin/markets/${id}/unarchive`, {
    method: 'POST',
    schema: AdminMarketResponseSchema,
  })
  return data
}

export function useUnarchiveAdminMarket() {
  const invalidate = useInvalidateMarkets()
  return useMutation({ mutationFn: unarchiveAdminMarket, onSuccess: invalidate })
}

export function useBulkSetAdminMarketsArchived() {
  return useAdminBulkArchive('/admin/markets/bulk/archive', adminMarketsKeys.all)
}
