import { z } from 'zod'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminInfiniteList } from '~/hooks/use_admin_infinite_list'
import { http } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import {
  AdminShippingMarketCountriesResponseSchema,
  AdminShippingRateResponseSchema,
  AdminShippingRegionOwnersResponseSchema,
  AdminShippingZoneDetailResponseSchema,
  AdminShippingZoneResponseSchema,
  AdminShippingZonesListQuerySchema,
  AdminShippingZonesListResponseSchema,
  type AdminShippingRateForm,
  type AdminShippingZoneForm,
  type AdminShippingZonesListQuery,
} from './_types'
import { useAdminBulkArchive } from '../_hooks'

export const SHIPPING_MARKETS_URL = '/admin/shipping/markets'

export const adminShippingKeys = {
  all: ['admin', 'shipping'] as const,
  list: (query: AdminShippingZonesListQuery) => [...adminShippingKeys.all, 'list', query] as const,
  detail: (id: string) => [...adminShippingKeys.all, 'detail', id] as const,
  regions: () => [...adminShippingKeys.all, 'regions'] as const,
  marketCountries: () => [...adminShippingKeys.all, 'market-countries'] as const,
}

export async function fetchAdminShippingMarketCountries() {
  const { data } = await http('/admin/shipping/market-countries', {
    schema: AdminShippingMarketCountriesResponseSchema,
  })
  return data.countryCodes
}

/** Countries active markets sell to. */
export function useAdminShippingMarketCountries() {
  return useQuery({
    queryKey: adminShippingKeys.marketCountries(),
    queryFn: fetchAdminShippingMarketCountries,
  })
}

export async function fetchAdminShippingRegionOwners() {
  const { data } = await http('/admin/shipping/regions', {
    schema: AdminShippingRegionOwnersResponseSchema,
  })
  return data
}

/** Regions assigned to a zone, with the zone that owns each. */
export function useAdminShippingRegionOwners() {
  return useQuery({
    queryKey: adminShippingKeys.regions(),
    queryFn: fetchAdminShippingRegionOwners,
  })
}

export async function fetchAdminShippingZones(query: AdminShippingZonesListQuery) {
  const params = AdminShippingZonesListQuerySchema.parse(query)
  return http(`/admin/shipping/list${toQueryString(params)}`, {
    schema: AdminShippingZonesListResponseSchema,
  })
}

export function useAdminShippingZones(query: AdminShippingZonesListQuery) {
  return useQuery({
    queryKey: adminShippingKeys.list(query),
    queryFn: () => fetchAdminShippingZones(query),
    placeholderData: keepPreviousData,
  })
}

/** The list page's rows, loaded in batches as the table scrolls. */
export function useAdminShippingZonesInfinite(
  filters: Omit<AdminShippingZonesListQuery, 'page' | 'perPage'>
) {
  return useAdminInfiniteList([...adminShippingKeys.all, 'list', 'infinite', filters], (page) =>
    fetchAdminShippingZones({ ...filters, ...page })
  )
}

export async function fetchAdminShippingZone(id: string) {
  const { data } = await http(`/admin/shipping/view/${id}`, {
    schema: AdminShippingZoneDetailResponseSchema,
  })
  return data
}

export function useAdminShippingZone(id: string) {
  return useQuery({
    queryKey: adminShippingKeys.detail(id),
    queryFn: () => fetchAdminShippingZone(id),
  })
}

function useInvalidateShipping() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: adminShippingKeys.all })
}

export async function createAdminShippingZone(payload: AdminShippingZoneForm) {
  const { data } = await http('/admin/shipping', {
    method: 'POST',
    body: payload,
    schema: AdminShippingZoneDetailResponseSchema,
  })
  return data
}

export function useCreateAdminShippingZone() {
  const invalidate = useInvalidateShipping()
  return useMutation({ mutationFn: createAdminShippingZone, onSuccess: invalidate })
}

export async function updateAdminShippingZone({
  id,
  ...payload
}: AdminShippingZoneForm & { id: string }) {
  const { data } = await http(`/admin/shipping/${id}`, {
    method: 'PUT',
    body: payload,
    schema: AdminShippingZoneDetailResponseSchema,
  })
  return data
}

export function useUpdateAdminShippingZone() {
  const invalidate = useInvalidateShipping()
  return useMutation({ mutationFn: updateAdminShippingZone, onSuccess: invalidate })
}

export async function archiveAdminShippingZone(id: string) {
  const { data } = await http(`/admin/shipping/${id}/archive`, {
    method: 'POST',
    schema: AdminShippingZoneResponseSchema,
  })
  return data
}

export function useArchiveAdminShippingZone() {
  const invalidate = useInvalidateShipping()
  return useMutation({ mutationFn: archiveAdminShippingZone, onSuccess: invalidate })
}

export async function unarchiveAdminShippingZone(id: string) {
  const { data } = await http(`/admin/shipping/${id}/unarchive`, {
    method: 'POST',
    schema: AdminShippingZoneResponseSchema,
  })
  return data
}

export function useUnarchiveAdminShippingZone() {
  const invalidate = useInvalidateShipping()
  return useMutation({ mutationFn: unarchiveAdminShippingZone, onSuccess: invalidate })
}

export async function createAdminShippingRate({
  zoneId,
  ...payload
}: AdminShippingRateForm & { zoneId: string }) {
  const { data } = await http(`/admin/shipping/${zoneId}/rates`, {
    method: 'POST',
    body: payload,
    schema: AdminShippingRateResponseSchema,
  })
  return data
}

export function useCreateAdminShippingRate(zoneId: string) {
  const invalidate = useInvalidateShipping()
  return useMutation({
    mutationFn: (payload: AdminShippingRateForm) => createAdminShippingRate({ zoneId, ...payload }),
    onSuccess: invalidate,
  })
}

export async function updateAdminShippingRate({
  zoneId,
  rateId,
  ...payload
}: AdminShippingRateForm & { zoneId: string; rateId: string }) {
  const { data } = await http(`/admin/shipping/${zoneId}/rates/${rateId}`, {
    method: 'PUT',
    body: payload,
    schema: AdminShippingRateResponseSchema,
  })
  return data
}

export function useUpdateAdminShippingRate(zoneId: string) {
  const invalidate = useInvalidateShipping()
  return useMutation({
    mutationFn: (args: AdminShippingRateForm & { rateId: string }) =>
      updateAdminShippingRate({ zoneId, ...args }),
    onSuccess: invalidate,
  })
}

export async function deleteAdminShippingRate(zoneId: string, rateId: string) {
  await http(`/admin/shipping/${zoneId}/rates/${rateId}`, {
    method: 'DELETE',
    schema: z.null(),
  })
}

export function useDeleteAdminShippingRate(zoneId: string) {
  const invalidate = useInvalidateShipping()
  return useMutation({
    mutationFn: (rateId: string) => deleteAdminShippingRate(zoneId, rateId),
    onSuccess: invalidate,
  })
}

export function useBulkSetAdminShippingZonesArchived() {
  return useAdminBulkArchive('/admin/shipping/bulk/archive', adminShippingKeys.all)
}
