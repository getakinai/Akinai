import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminInfiniteList } from '~/hooks/use_admin_infinite_list'
import { http } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import {
  AdminTaxRateResponseSchema,
  AdminTaxRatesListQuerySchema,
  AdminTaxRatesListResponseSchema,
  type AdminTaxRateForm,
  type AdminTaxRatesListQuery,
} from './_types'
import { useAdminBulkArchive } from '../_hooks'

export const adminTaxRatesKeys = {
  all: ['admin', 'taxes'] as const,
  list: (query: AdminTaxRatesListQuery) => [...adminTaxRatesKeys.all, 'list', query] as const,
}

export async function fetchAdminTaxRates(query: AdminTaxRatesListQuery) {
  const params = AdminTaxRatesListQuerySchema.parse(query)
  return http(`/admin/taxes/list${toQueryString(params)}`, {
    schema: AdminTaxRatesListResponseSchema,
  })
}

export function useAdminTaxRates(query: AdminTaxRatesListQuery) {
  return useQuery({
    queryKey: adminTaxRatesKeys.list(query),
    queryFn: () => fetchAdminTaxRates(query),
    placeholderData: keepPreviousData,
  })
}

/** The list page's rows, loaded in batches as the table scrolls. */
export function useAdminTaxRatesInfinite(
  filters: Omit<AdminTaxRatesListQuery, 'page' | 'perPage'>
) {
  return useAdminInfiniteList([...adminTaxRatesKeys.all, 'list', 'infinite', filters], (page) =>
    fetchAdminTaxRates({ ...filters, ...page })
  )
}

function useInvalidateTaxRates() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: adminTaxRatesKeys.all })
}

export async function createAdminTaxRate(payload: AdminTaxRateForm) {
  const { data } = await http('/admin/taxes', {
    method: 'POST',
    body: payload,
    schema: AdminTaxRateResponseSchema,
  })
  return data
}

export function useCreateAdminTaxRate() {
  const invalidate = useInvalidateTaxRates()
  return useMutation({ mutationFn: createAdminTaxRate, onSuccess: invalidate })
}

export async function updateAdminTaxRate({ id, ...payload }: AdminTaxRateForm & { id: string }) {
  const { data } = await http(`/admin/taxes/${id}`, {
    method: 'PUT',
    body: payload,
    schema: AdminTaxRateResponseSchema,
  })
  return data
}

export function useUpdateAdminTaxRate() {
  const invalidate = useInvalidateTaxRates()
  return useMutation({ mutationFn: updateAdminTaxRate, onSuccess: invalidate })
}

export async function archiveAdminTaxRate(id: string) {
  const { data } = await http(`/admin/taxes/${id}/archive`, {
    method: 'POST',
    schema: AdminTaxRateResponseSchema,
  })
  return data
}

export function useArchiveAdminTaxRate() {
  const invalidate = useInvalidateTaxRates()
  return useMutation({ mutationFn: archiveAdminTaxRate, onSuccess: invalidate })
}

export async function unarchiveAdminTaxRate(id: string) {
  const { data } = await http(`/admin/taxes/${id}/unarchive`, {
    method: 'POST',
    schema: AdminTaxRateResponseSchema,
  })
  return data
}

export function useUnarchiveAdminTaxRate() {
  const invalidate = useInvalidateTaxRates()
  return useMutation({ mutationFn: unarchiveAdminTaxRate, onSuccess: invalidate })
}

export function useBulkSetAdminTaxRatesArchived() {
  return useAdminBulkArchive('/admin/taxes/bulk/archive', adminTaxRatesKeys.all)
}
