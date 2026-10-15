import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminInfiniteList } from '~/hooks/use_admin_infinite_list'
import { http, redirectResponseSchema } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import {
  ActivityListQuerySchema,
  type ActivityFilters,
  type ActivityListQuery,
} from '../_audit_types'
import {
  AdminCustomerActivityResponseSchema,
  AdminCustomerAddressDeleteResponseSchema,
  AdminCustomerAddressResponseSchema,
  AdminCustomerFilterOptionsResponseSchema,
  AdminCustomerLocationOptionsResponseSchema,
  AdminCustomerResponseSchema,
  AdminCustomerSegmentDeleteResponseSchema,
  AdminCustomerSegmentResponseSchema,
  AdminCustomerSegmentsResponseSchema,
  AdminCustomersListQuerySchema,
  AdminCustomersListResponseSchema,
  type AdminCustomerAddressForm,
  type AdminCustomerForm,
  type AdminCustomerImpersonationForm,
  type AdminCustomerMarketingForm,
  type AdminCustomerNotesForm,
  type AdminCustomerSegmentForm,
  type AdminCustomersListQuery,
} from './_types'
import { useAdminBulkArchive } from '../_hooks'

export const adminCustomersKeys = {
  all: ['admin', 'customers'] as const,
  lists: ['admin', 'customers', 'list'] as const,
  list: (query: AdminCustomersListQuery) => [...adminCustomersKeys.lists, query] as const,
  detail: (id: string) => [...adminCustomersKeys.all, 'detail', id] as const,
  locationOptions: ['admin', 'customers', 'location-options'] as const,
  filterOptions: ['admin', 'customers', 'filter-options'] as const,
  segments: ['admin', 'customers', 'segments'] as const,
  activity: (id: string, filters: ActivityFilters) =>
    [...adminCustomersKeys.all, 'activity', id, 'infinite', filters] as const,
}

export async function fetchAdminCustomerActivity(id: string, query: ActivityListQuery) {
  const params = ActivityListQuerySchema.parse(query)
  return http(`/admin/customers/${id}/activity${toQueryString(params)}`, {
    schema: AdminCustomerActivityResponseSchema,
  })
}

/** The customer's activity, loaded in batches as the table scrolls. */
export function useAdminCustomerActivityInfinite(id: string, filters: ActivityFilters) {
  return useAdminInfiniteList(adminCustomersKeys.activity(id, filters), (page) =>
    fetchAdminCustomerActivity(id, { ...filters, ...page })
  )
}

export async function fetchAdminCustomerLocationOptions() {
  const { data } = await http('/admin/customers/location-options', {
    schema: AdminCustomerLocationOptionsResponseSchema,
  })
  return data
}

/** Countries in active markets (the ones a customer can pick) and every timezone. */
export function useAdminCustomerLocationOptions() {
  return useQuery({
    queryKey: adminCustomersKeys.locationOptions,
    queryFn: fetchAdminCustomerLocationOptions,
    staleTime: 5 * 60 * 1000,
  })
}

export async function fetchAdminCustomers(query: AdminCustomersListQuery) {
  const params = AdminCustomersListQuerySchema.parse(query)
  return http(`/admin/customers/list${toQueryString(params)}`, {
    schema: AdminCustomersListResponseSchema,
  })
}

export function useAdminCustomers(query: AdminCustomersListQuery) {
  return useQuery({
    queryKey: adminCustomersKeys.list(query),
    queryFn: () => fetchAdminCustomers(query),
    placeholderData: keepPreviousData,
  })
}

/** The list page's rows, loaded in batches as the table scrolls. */
export function useAdminCustomersInfinite(
  filters: Omit<AdminCustomersListQuery, 'page' | 'perPage'>
) {
  return useAdminInfiniteList([...adminCustomersKeys.all, 'list', 'infinite', filters], (page) =>
    fetchAdminCustomers({ ...filters, ...page })
  )
}

/**
 * Signs in to the storefront as the customer. A full page load starts the
 * storefront with empty query caches.
 */
export function useImpersonateAdminCustomer() {
  return useMutation({
    mutationFn: ({ id, ...body }: AdminCustomerImpersonationForm & { id: string }) =>
      http(`/admin/customers/${id}/impersonate`, {
        method: 'POST',
        body,
        schema: redirectResponseSchema,
      }),
    onSuccess: ({ data }) => window.location.assign(data.redirectTo),
  })
}

export async function fetchAdminCustomer(id: string) {
  const { data } = await http(`/admin/customers/view/${id}`, {
    schema: AdminCustomerResponseSchema,
  })
  return data
}

export function useAdminCustomer(id: string) {
  return useQuery({
    queryKey: adminCustomersKeys.detail(id),
    queryFn: () => fetchAdminCustomer(id),
  })
}

/**
 * Refreshes the customer's detail and every customer list after a mutation.
 */
function useInvalidateCustomer() {
  const queryClient = useQueryClient()
  return (customerId: string) => {
    queryClient.invalidateQueries({ queryKey: adminCustomersKeys.detail(customerId) })
    queryClient.invalidateQueries({ queryKey: adminCustomersKeys.lists })
  }
}

export async function createAdminCustomer(payload: AdminCustomerForm) {
  const { data } = await http('/admin/customers', {
    method: 'POST',
    body: payload,
    schema: AdminCustomerResponseSchema,
  })
  return data
}

export function useCreateAdminCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAdminCustomer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminCustomersKeys.lists }),
  })
}

export async function updateAdminCustomer({ id, ...payload }: AdminCustomerForm & { id: string }) {
  const { data } = await http(`/admin/customers/${id}`, {
    method: 'PUT',
    body: payload,
    schema: AdminCustomerResponseSchema,
  })
  return data
}

export function useUpdateAdminCustomer() {
  const invalidate = useInvalidateCustomer()
  return useMutation({
    mutationFn: updateAdminCustomer,
    onSuccess: (customer) => invalidate(customer.id),
  })
}

export async function archiveAdminCustomer(id: string) {
  const { data } = await http(`/admin/customers/${id}/archive`, {
    method: 'POST',
    schema: AdminCustomerResponseSchema,
  })
  return data
}

export function useArchiveAdminCustomer() {
  const invalidate = useInvalidateCustomer()
  return useMutation({
    mutationFn: archiveAdminCustomer,
    onSuccess: (customer) => invalidate(customer.id),
  })
}

export async function unarchiveAdminCustomer(id: string) {
  const { data } = await http(`/admin/customers/${id}/unarchive`, {
    method: 'POST',
    schema: AdminCustomerResponseSchema,
  })
  return data
}

export function useUnarchiveAdminCustomer() {
  const invalidate = useInvalidateCustomer()
  return useMutation({
    mutationFn: unarchiveAdminCustomer,
    onSuccess: (customer) => invalidate(customer.id),
  })
}

type AddressRef = { customerId: string; id: string }

const addressUrl = ({ customerId, id }: AddressRef) =>
  `/admin/customers/${customerId}/addresses/${id}`

export async function createAdminCustomerAddress({
  customerId,
  ...payload
}: AdminCustomerAddressForm & { customerId: string }) {
  const { data } = await http(`/admin/customers/${customerId}/addresses`, {
    method: 'POST',
    body: payload,
    schema: AdminCustomerAddressResponseSchema,
  })
  return data
}

export function useCreateAdminCustomerAddress() {
  const invalidate = useInvalidateCustomer()
  return useMutation({
    mutationFn: createAdminCustomerAddress,
    onSuccess: (address) => invalidate(address.customerId),
  })
}

export async function updateAdminCustomerAddress({
  customerId,
  id,
  ...payload
}: AdminCustomerAddressForm & AddressRef) {
  const { data } = await http(addressUrl({ customerId, id }), {
    method: 'PUT',
    body: payload,
    schema: AdminCustomerAddressResponseSchema,
  })
  return data
}

export function useUpdateAdminCustomerAddress() {
  const invalidate = useInvalidateCustomer()
  return useMutation({
    mutationFn: updateAdminCustomerAddress,
    onSuccess: (address) => invalidate(address.customerId),
  })
}

export async function deleteAdminCustomerAddress(ref: AddressRef) {
  await http(addressUrl(ref), {
    method: 'DELETE',
    schema: AdminCustomerAddressDeleteResponseSchema,
  })
}

export function useDeleteAdminCustomerAddress() {
  const invalidate = useInvalidateCustomer()
  return useMutation({
    mutationFn: deleteAdminCustomerAddress,
    onSuccess: (_data, ref) => invalidate(ref.customerId),
  })
}

export async function updateAdminCustomerNotes({
  id,
  ...payload
}: AdminCustomerNotesForm & { id: string }) {
  const { data } = await http(`/admin/customers/${id}/notes`, {
    method: 'PUT',
    body: payload,
    schema: AdminCustomerResponseSchema,
  })
  return data
}

/** Saves the staff tags and note; new tags show up in the list filters. */
export function useUpdateAdminCustomerNotes() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateCustomer()
  return useMutation({
    mutationFn: updateAdminCustomerNotes,
    onSuccess: (customer) => {
      queryClient.setQueryData(adminCustomersKeys.detail(customer.id), customer)
      invalidate(customer.id)
      queryClient.invalidateQueries({ queryKey: adminCustomersKeys.filterOptions })
    },
  })
}

export async function updateAdminCustomerMarketing({
  id,
  ...payload
}: AdminCustomerMarketingForm & { id: string }) {
  const { data } = await http(`/admin/customers/${id}/marketing`, {
    method: 'PUT',
    body: payload,
    schema: AdminCustomerResponseSchema,
  })
  return data
}

export function useUpdateAdminCustomerMarketing() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateCustomer()
  return useMutation({
    mutationFn: updateAdminCustomerMarketing,
    onSuccess: (customer) => {
      queryClient.setQueryData(adminCustomersKeys.detail(customer.id), customer)
      invalidate(customer.id)
    },
  })
}

export async function fetchAdminCustomerFilterOptions() {
  const { data } = await http('/admin/customers/filter-options', {
    schema: AdminCustomerFilterOptionsResponseSchema,
  })
  return data
}

/** Tags in use, customer countries and order currencies for the list filters. */
export function useAdminCustomerFilterOptions() {
  return useQuery({
    queryKey: adminCustomersKeys.filterOptions,
    queryFn: fetchAdminCustomerFilterOptions,
    staleTime: 60 * 1000,
  })
}

export async function fetchAdminCustomerSegments() {
  const { data } = await http('/admin/customers/segments/list', {
    schema: AdminCustomerSegmentsResponseSchema,
  })
  return data
}

export function useAdminCustomerSegments() {
  return useQuery({ queryKey: adminCustomersKeys.segments, queryFn: fetchAdminCustomerSegments })
}

export async function createAdminCustomerSegment(payload: AdminCustomerSegmentForm) {
  const { data } = await http('/admin/customers/segments', {
    method: 'POST',
    body: payload,
    schema: AdminCustomerSegmentResponseSchema,
  })
  return data
}

export function useCreateAdminCustomerSegment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAdminCustomerSegment,
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminCustomersKeys.segments }),
  })
}

export async function updateAdminCustomerSegment({
  id,
  ...payload
}: AdminCustomerSegmentForm & { id: string }) {
  const { data } = await http(`/admin/customers/segments/${id}`, {
    method: 'PUT',
    body: payload,
    schema: AdminCustomerSegmentResponseSchema,
  })
  return data
}

export function useUpdateAdminCustomerSegment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateAdminCustomerSegment,
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminCustomersKeys.segments }),
  })
}

export async function deleteAdminCustomerSegment(id: string) {
  await http(`/admin/customers/segments/${id}`, {
    method: 'DELETE',
    schema: AdminCustomerSegmentDeleteResponseSchema,
  })
}

export function useDeleteAdminCustomerSegment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAdminCustomerSegment,
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminCustomersKeys.segments }),
  })
}

export function useBulkSetAdminCustomersArchived() {
  return useAdminBulkArchive('/admin/customers/bulk/archive', adminCustomersKeys.all)
}
