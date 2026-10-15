import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { downloadFile, http, redirectResponseSchema } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import { BulkResultResponseSchema } from '~/lib/schemas'
import {
  AdminMeResponseSchema,
  CsvImportResponseSchema,
  PricingMarketsResponseSchema,
} from './_types'

export const adminKeys = {
  me: ['admin', 'me'] as const,
  pricingMarkets: (url: string) => ['admin', 'pricing-markets', url] as const,
}

function pricingMarketsQuery(url: string) {
  return {
    queryKey: adminKeys.pricingMarkets(url),
    queryFn: async () => {
      const { data } = await http(url, { schema: PricingMarketsResponseSchema })
      return data
    },
    staleTime: 5 * 60_000,
  }
}

/**
 * Non-primary markets that need their own prices. `url` is the resource's
 * markets endpoint (e.g. `/admin/products/markets`), so it runs under that
 * resource's permission.
 */
export function usePricingMarkets(url: string) {
  return useQuery({
    ...pricingMarketsQuery(url),
    select: (markets) => markets.filter(({ isPrimary }) => !isPrimary),
  })
}

/**
 * The primary market (base prices), from the same endpoint and cache as
 * `usePricingMarkets`.
 */
export function usePrimaryPricingMarket(url: string) {
  return useQuery({
    ...pricingMarketsQuery(url),
    select: (markets) => markets.find(({ isPrimary }) => isPrimary) ?? null,
  })
}

export async function fetchAdminMe() {
  const { data } = await http('/admin/me', { schema: AdminMeResponseSchema })
  return data
}

export function useAdminMe() {
  return useQuery({ queryKey: adminKeys.me, queryFn: fetchAdminMe })
}

/**
 * UI-only permission check against the signed-in User's role. The server
 * still authorizes every request.
 */
export function useCan(permission: string) {
  const { data } = useAdminMe()
  return data?.permissions.includes(permission) ?? false
}

/** UI-only check for the locked admin role. */
export function useIsAdmin() {
  const { data } = useAdminMe()
  return data?.role?.isLocked ?? false
}

/**
 * Leaves with a full page load instead of an Inertia visit so no signed-in
 * state (query cache, layout, history) survives the logout.
 */
export function useAdminLogout() {
  return useMutation({
    mutationFn: () => http('/admin/logout', { method: 'POST', schema: redirectResponseSchema }),
    onSuccess: ({ data }) => window.location.assign(data.redirectTo),
  })
}

export type BulkArchivePayload = { ids: string[]; archived: boolean }
export type BulkStatusPayload = { ids: string[]; status: 'active' | 'draft' }

async function bulkUpdate<TPayload>(url: string, payload: TPayload) {
  const { data } = await http(url, {
    method: 'PUT',
    body: payload,
    schema: BulkResultResponseSchema,
  })
  return data
}

/**
 * Bulk action on a list page (`PUT <resource>/bulk/...`). Invalidates the
 * resource's queries once it settles, so partial successes still refresh.
 */
function useAdminBulkMutation<TPayload>(url: string, queryKey: QueryKey) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: TPayload) => bulkUpdate(url, payload),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })
}

export function useAdminBulkArchive(url: string, queryKey: QueryKey) {
  return useAdminBulkMutation<BulkArchivePayload>(url, queryKey)
}

export function useAdminBulkStatus(url: string, queryKey: QueryKey) {
  return useAdminBulkMutation<BulkStatusPayload>(url, queryKey)
}

/**
 * Uploads a CSV to a resource's import endpoint (`POST <resource>/import`).
 * Invalidates `queryKeys` when anything was created or updated.
 */
export function useAdminCsvImport(url: string, queryKeys: QueryKey[]) {
  return useAdminCsvImportWith(url, queryKeys, (file: File) => ({ file }))
}

/** `useAdminCsvImport` for endpoints that take extra form fields with the file. */
export function useAdminCsvImportWith<TInput>(
  url: string,
  queryKeys: QueryKey[],
  fields: (input: TInput) => { file: File } & Record<string, string | File>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: TInput) => {
      const body = new FormData()
      for (const [name, value] of Object.entries(fields(input))) body.append(name, value)
      const { data } = await http(url, { method: 'POST', body, schema: CsvImportResponseSchema })
      return data
    },
    onSuccess: (result) => {
      if (result.created === 0 && result.updated === 0) return
      for (const queryKey of queryKeys) void queryClient.invalidateQueries({ queryKey })
    },
  })
}

/**
 * Downloads a resource's export (`GET <resource>/export`) for the given
 * list filters. `parse` validates them (the list query schema without
 * paging) before they go into the URL.
 */
export function useAdminCsvExport<TQuery>(
  url: string,
  fallbackName: string,
  parse: (query: TQuery) => Parameters<typeof toQueryString>[0]
) {
  return useMutation({
    mutationFn: (query: TQuery) =>
      downloadFile(`${url}${toQueryString(parse(query))}`, fallbackName),
  })
}
