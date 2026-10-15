import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminInfiniteList } from '~/hooks/use_admin_infinite_list'
import { http } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'
import { AdminCustomerResponseSchema, AdminCustomersListResponseSchema } from '../customers/_types'
import { AdminMarketsListResponseSchema } from '../markets/_types'
import {
  ActivityListQuerySchema,
  type ActivityFilters,
  type ActivityListQuery,
} from '../_audit_types'
import {
  AdminOrderActivityResponseSchema,
  AdminOrderDeleteResponseSchema,
  AdminOrderNoteResponseSchema,
  AdminOrderNotesListResponseSchema,
  AdminOrderResponseSchema,
  AdminOrdersListQuerySchema,
  AdminOrdersListResponseSchema,
  DraftOrderQuoteResponseSchema,
  OrderVariantOptionsResponseSchema,
  type AdminFulfillmentStorePayload,
  type AdminOrderCancelPayload,
  type AdminRefundStorePayload,
  RefundQuoteResponseSchema,
  type RefundLinesPayload,
  type AdminOrdersListQuery,
  type AdminOrderNoteStorePayload,
  type AdminOrderUpdatePayload,
  type AdminPaymentProofReviewPayload,
  type DraftOrderPayload,
  type FulfillmentTrackingPayload,
  type ManualFulfillmentStatus,
  type ManualPaymentStatus,
} from './_types'
import { useAdminBulkArchive } from '../_hooks'

export const adminOrdersKeys = {
  all: ['admin', 'orders'] as const,
  drafts: (query: AdminOrdersListQuery) => [...adminOrdersKeys.all, 'drafts', query] as const,
  list: (query: AdminOrdersListQuery) => [...adminOrdersKeys.all, 'list', query] as const,
  detail: (id: string) => [...adminOrdersKeys.all, 'detail', id] as const,
  variants: (q: string) => [...adminOrdersKeys.all, 'variants', q] as const,
  activity: (id: string, filters: ActivityFilters) =>
    [...adminOrdersKeys.all, 'activity', id, 'infinite', filters] as const,
  notes: (id: string) => [...adminOrdersKeys.all, 'notes', id] as const,
}

function listParams(query: AdminOrdersListQuery) {
  const { paymentStatus, fulfillmentStatus, archive, ...params } =
    AdminOrdersListQuerySchema.parse(query)
  return toQueryString({
    ...params,
    ...(paymentStatus ? { paymentStatus } : {}),
    ...(fulfillmentStatus ? { fulfillmentStatus } : {}),
    ...(archive && archive !== 'all' ? { archived: archive === 'archived' } : {}),
  })
}

export async function fetchAdminDraftOrders(query: AdminOrdersListQuery) {
  return http(`/admin/orders/drafts/list${listParams(query)}`, {
    schema: AdminOrdersListResponseSchema,
  })
}

export function useAdminDraftOrders(query: AdminOrdersListQuery) {
  return useQuery({
    queryKey: adminOrdersKeys.drafts(query),
    queryFn: () => fetchAdminDraftOrders(query),
    placeholderData: keepPreviousData,
  })
}

/** The list page's rows, loaded in batches as the table scrolls. */
export function useAdminDraftOrdersInfinite(
  filters: Omit<AdminOrdersListQuery, 'page' | 'perPage'>
) {
  return useAdminInfiniteList([...adminOrdersKeys.all, 'drafts', 'infinite', filters], (page) =>
    fetchAdminDraftOrders({ ...filters, ...page })
  )
}

export async function fetchAdminOrders(query: AdminOrdersListQuery) {
  return http(`/admin/orders/list${listParams(query)}`, {
    schema: AdminOrdersListResponseSchema,
  })
}

export function useAdminOrders(query: AdminOrdersListQuery, enabled = true) {
  return useQuery({
    queryKey: adminOrdersKeys.list(query),
    queryFn: () => fetchAdminOrders(query),
    placeholderData: keepPreviousData,
    enabled,
  })
}

/** The list page's rows, loaded in batches as the table scrolls. */
export function useAdminOrdersInfinite(filters: Omit<AdminOrdersListQuery, 'page' | 'perPage'>) {
  return useAdminInfiniteList([...adminOrdersKeys.all, 'list', 'infinite', filters], (page) =>
    fetchAdminOrders({ ...filters, ...page })
  )
}

export async function fetchAdminOrder(id: string) {
  const { data } = await http(`/admin/orders/view/${id}`, { schema: AdminOrderResponseSchema })
  return data
}

export function useAdminOrder(id: string) {
  return useQuery({ queryKey: adminOrdersKeys.detail(id), queryFn: () => fetchAdminOrder(id) })
}

export async function fetchAdminOrderActivity(id: string, query: ActivityListQuery) {
  const params = ActivityListQuerySchema.parse(query)
  return http(`/admin/orders/${id}/activity${toQueryString(params)}`, {
    schema: AdminOrderActivityResponseSchema,
  })
}

/** The order's activity, loaded in batches as the table scrolls. */
export function useAdminOrderActivityInfinite(id: string, filters: ActivityFilters) {
  return useAdminInfiniteList(adminOrdersKeys.activity(id, filters), (page) =>
    fetchAdminOrderActivity(id, { ...filters, ...page })
  )
}

export async function fetchAdminDraftOrder(id: string) {
  const { data } = await http(`/admin/orders/drafts/view/${id}`, {
    schema: AdminOrderResponseSchema,
  })
  return data
}

export function useAdminDraftOrder(id: string) {
  return useQuery({
    queryKey: adminOrdersKeys.detail(id),
    queryFn: () => fetchAdminDraftOrder(id),
  })
}

export async function fetchOrderVariants(q: string) {
  const { data } = await http(`/admin/orders/variants/search${toQueryString({ q })}`, {
    schema: OrderVariantOptionsResponseSchema,
  })
  return data
}

export function useOrderVariants(q: string, enabled: boolean) {
  return useQuery({
    queryKey: adminOrdersKeys.variants(q),
    queryFn: () => fetchOrderVariants(q),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useOrderMarkets(enabled: boolean) {
  return useQuery({
    queryKey: [...adminOrdersKeys.all, 'markets'],
    queryFn: () =>
      http(`/admin/markets/list${toQueryString({ status: 'active', perPage: 100 })}`, {
        schema: AdminMarketsListResponseSchema,
      }),
    enabled,
  })
}

export function useOrderCustomers(q: string, enabled: boolean) {
  return useQuery({
    queryKey: [...adminOrdersKeys.all, 'customers', q],
    queryFn: () =>
      http(`/admin/customers/list${toQueryString({ q, status: 'active', perPage: 15 })}`, {
        schema: AdminCustomersListResponseSchema,
      }),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function orderCustomerQuery(id: string) {
  return {
    queryKey: [...adminOrdersKeys.all, 'customer', id],
    queryFn: async () => {
      const { data } = await http(`/admin/customers/view/${id}`, {
        schema: AdminCustomerResponseSchema,
      })
      return data
    },
  }
}

export function useOrderCustomer(id: string | null, enabled: boolean) {
  return useQuery({ ...orderCustomerQuery(id ?? ''), enabled: enabled && id !== null })
}

function useInvalidateOrders() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: adminOrdersKeys.all })
}

export async function calculateDraftOrder(payload: DraftOrderPayload) {
  const { data } = await http('/admin/orders/drafts/calculate', {
    method: 'POST',
    body: payload,
    schema: DraftOrderQuoteResponseSchema,
  })
  return data
}

/** Live totals for the form; `null` skips the request (no line items yet). */
export function useDraftOrderQuote(payload: DraftOrderPayload | null) {
  return useQuery({
    queryKey: [...adminOrdersKeys.all, 'quote', payload],
    queryFn: () => calculateDraftOrder(payload!),
    enabled: payload !== null,
    placeholderData: keepPreviousData,
    retry: false,
  })
}

export async function createDraftOrder(payload: DraftOrderPayload) {
  const { data } = await http('/admin/orders/drafts', {
    method: 'POST',
    body: payload,
    schema: AdminOrderResponseSchema,
  })
  return data
}

export function useCreateDraftOrder() {
  const invalidate = useInvalidateOrders()
  return useMutation({ mutationFn: createDraftOrder, onSuccess: invalidate })
}

export async function updateDraftOrder({ id, ...payload }: DraftOrderPayload & { id: string }) {
  const { data } = await http(`/admin/orders/drafts/${id}`, {
    method: 'PUT',
    body: payload,
    schema: AdminOrderResponseSchema,
  })
  return data
}

export function useUpdateDraftOrder() {
  const invalidate = useInvalidateOrders()
  return useMutation({ mutationFn: updateDraftOrder, onSuccess: invalidate })
}

export async function deleteDraftOrder(id: string) {
  return http(`/admin/orders/drafts/${id}`, {
    method: 'DELETE',
    schema: AdminOrderDeleteResponseSchema,
  })
}

export function useDeleteDraftOrder() {
  const invalidate = useInvalidateOrders()
  return useMutation({ mutationFn: deleteDraftOrder, onSuccess: invalidate })
}

export async function completeDraftOrder({
  id,
  paymentStatus,
}: {
  id: string
  paymentStatus: ManualPaymentStatus
}) {
  const { data } = await http(`/admin/orders/drafts/${id}/complete`, {
    method: 'POST',
    body: { paymentStatus },
    schema: AdminOrderResponseSchema,
  })
  return data
}

export function useCompleteDraftOrder() {
  const invalidate = useInvalidateOrders()
  return useMutation({ mutationFn: completeDraftOrder, onSuccess: invalidate })
}

export async function updateAdminOrder({
  id,
  ...payload
}: AdminOrderUpdatePayload & { id: string }) {
  const { data } = await http(`/admin/orders/${id}`, {
    method: 'PUT',
    body: payload,
    schema: AdminOrderResponseSchema,
  })
  return data
}

export function useUpdateAdminOrder() {
  const invalidate = useInvalidateOrders()
  return useMutation({ mutationFn: updateAdminOrder, onSettled: invalidate })
}

/** Same-origin URL of the order's proof-of-payment screenshot (staff only). */
export function adminPaymentProofImageUrl(orderId: string, version: string) {
  return `/admin/orders/${orderId}/payment-proof/image?v=${encodeURIComponent(version)}`
}

export async function reviewPaymentProof({
  orderId,
  ...payload
}: AdminPaymentProofReviewPayload & { orderId: string }) {
  const { data } = await http(`/admin/orders/${orderId}/payment-proof/review`, {
    method: 'PUT',
    body: payload,
    schema: AdminOrderResponseSchema,
  })
  return data
}

export function useReviewPaymentProof(orderId: string) {
  const invalidate = useInvalidateOrders()
  return useMutation({
    mutationFn: (payload: AdminPaymentProofReviewPayload) =>
      reviewPaymentProof({ ...payload, orderId }),
    onSettled: invalidate,
  })
}

export async function createFulfillment({
  orderId,
  ...payload
}: AdminFulfillmentStorePayload & { orderId: string }) {
  const { data } = await http(`/admin/orders/${orderId}/fulfillments`, {
    method: 'POST',
    body: payload,
    schema: AdminOrderResponseSchema,
  })
  return data
}

export function useCreateFulfillment() {
  const invalidate = useInvalidateOrders()
  return useMutation({ mutationFn: createFulfillment, onSettled: invalidate })
}

export async function updateFulfillmentTracking({
  id,
  ...payload
}: FulfillmentTrackingPayload & { id: string }) {
  const { data } = await http(`/admin/fulfillments/${id}`, {
    method: 'PUT',
    body: payload,
    schema: AdminOrderResponseSchema,
  })
  return data
}

export function useUpdateFulfillmentTracking() {
  const invalidate = useInvalidateOrders()
  return useMutation({ mutationFn: updateFulfillmentTracking, onSettled: invalidate })
}

export async function cancelFulfillment(id: string) {
  const { data } = await http(`/admin/fulfillments/${id}/cancel`, {
    method: 'PUT',
    schema: AdminOrderResponseSchema,
  })
  return data
}

export function useCancelFulfillment() {
  const invalidate = useInvalidateOrders()
  return useMutation({ mutationFn: cancelFulfillment, onSettled: invalidate })
}

export async function setOrderFulfillmentStatus({
  id,
  status,
}: {
  id: string
  status: ManualFulfillmentStatus
}) {
  const { data } = await http(`/admin/orders/${id}/fulfillment-status`, {
    method: 'PUT',
    body: { status },
    schema: AdminOrderResponseSchema,
  })
  return data
}

export function useSetOrderFulfillmentStatus() {
  const invalidate = useInvalidateOrders()
  return useMutation({ mutationFn: setOrderFulfillmentStatus, onSettled: invalidate })
}

export async function archiveOrder(id: string) {
  const { data } = await http(`/admin/orders/${id}/archive`, {
    method: 'POST',
    schema: AdminOrderResponseSchema,
  })
  return data
}

export function useArchiveOrder() {
  const invalidate = useInvalidateOrders()
  return useMutation({ mutationFn: archiveOrder, onSettled: invalidate })
}

export async function unarchiveOrder(id: string) {
  const { data } = await http(`/admin/orders/${id}/unarchive`, {
    method: 'POST',
    schema: AdminOrderResponseSchema,
  })
  return data
}

export function useUnarchiveOrder() {
  const invalidate = useInvalidateOrders()
  return useMutation({ mutationFn: unarchiveOrder, onSettled: invalidate })
}

export function useBulkSetAdminOrdersArchived() {
  return useAdminBulkArchive('/admin/orders/bulk/archive', adminOrdersKeys.all)
}

export async function calculateRefund({
  orderId,
  ...payload
}: RefundLinesPayload & { orderId: string }) {
  const { data } = await http(`/admin/orders/${orderId}/refunds/calculate`, {
    method: 'POST',
    body: payload,
    schema: RefundQuoteResponseSchema,
  })
  return data
}

/** Suggested refund for the selected lines; refreshed as the selection changes. */
export function useRefundQuote(orderId: string, payload: RefundLinesPayload, enabled: boolean) {
  return useQuery({
    queryKey: [...adminOrdersKeys.all, 'refund-quote', orderId, payload],
    queryFn: () => calculateRefund({ orderId, ...payload }),
    enabled,
    placeholderData: keepPreviousData,
    retry: false,
  })
}

export async function createRefund({
  orderId,
  ...payload
}: AdminRefundStorePayload & { orderId: string }) {
  const { data } = await http(`/admin/orders/${orderId}/refunds`, {
    method: 'POST',
    body: payload,
    schema: AdminOrderResponseSchema,
  })
  return data
}

export function useCreateRefund() {
  const invalidate = useInvalidateOrders()
  return useMutation({ mutationFn: createRefund, onSettled: invalidate })
}

export async function cancelOrder({
  orderId,
  ...payload
}: AdminOrderCancelPayload & { orderId: string }) {
  const { data } = await http(`/admin/orders/${orderId}/cancel`, {
    method: 'POST',
    body: payload,
    schema: AdminOrderResponseSchema,
  })
  return data
}

export function useCancelOrder() {
  const invalidate = useInvalidateOrders()
  return useMutation({ mutationFn: cancelOrder, onSettled: invalidate })
}

export async function fetchAdminOrderNotes(orderId: string) {
  const { data } = await http(`/admin/orders/${orderId}/notes/list`, {
    schema: AdminOrderNotesListResponseSchema,
  })
  return data
}

export function useAdminOrderNotes(orderId: string) {
  return useQuery({
    queryKey: adminOrdersKeys.notes(orderId),
    queryFn: () => fetchAdminOrderNotes(orderId),
  })
}

export async function createAdminOrderNote({
  orderId,
  ...payload
}: AdminOrderNoteStorePayload & { orderId: string }) {
  const { data } = await http(`/admin/orders/${orderId}/notes`, {
    method: 'POST',
    body: payload,
    schema: AdminOrderNoteResponseSchema,
  })
  return data
}

export function useCreateAdminOrderNote(orderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AdminOrderNoteStorePayload) =>
      createAdminOrderNote({ orderId, ...payload }),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: adminOrdersKeys.notes(orderId) }),
        queryClient.invalidateQueries({ queryKey: adminOrdersKeys.all }),
      ]),
  })
}
