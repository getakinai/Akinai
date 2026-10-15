import { router } from '@inertiajs/react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http, redirectResponseSchema } from '~/lib/http'
import {
  CustomerActivityResponseSchema,
  CustomerLocationOptionsResponseSchema,
  type CustomerLocationForm,
  CustomerAddressDeleteResponseSchema,
  CustomerAddressesResponseSchema,
  CustomerAddressResponseSchema,
  CustomerMeResponseSchema,
  CustomerOrderDetailResponseSchema,
  CustomerOrderNoteReplyResponseSchema,
  CustomerOrderNotesResponseSchema,
  CustomerOrderReturnsResponseSchema,
  CustomerReturnResponseSchema,
  type CustomerReturnRequest,
  CustomerOrdersResponseSchema,
  type CustomerAddress,
  type Customer,
  type CustomerAddressForm,
  type CustomerDetailsForm,
  type CustomerMarketingForm,
  type CustomerOrderNoteReplyForm,
  type PaymentProofForm,
} from './_types'

const ORDERS_PER_PAGE = 5
const ACTIVITY_PER_PAGE = 10

export const customerKeys = {
  all: ['customer'] as const,
  me: ['customer', 'me'] as const,
  orders: ['customer', 'orders'] as const,
  order: (id: string) => ['customer', 'orders', 'detail', id] as const,
  orderNotes: (id: string) => ['customer', 'orders', 'notes', id] as const,
  orderReturns: (id: string) => ['customer', 'orders', 'returns', id] as const,
  addresses: ['customer', 'addresses'] as const,
  activity: ['customer', 'activity'] as const,
  locationOptions: ['customer', 'location-options'] as const,
}

/** Matches `checkoutKeys.addresses`; kept here to avoid a circular import. */
const CHECKOUT_ADDRESSES_KEY = ['checkout', 'addresses'] as const

/**
 * Prefixes of every storefront and checkout query (market, prices, payment
 * methods), refetched when the customer's country moves them to another
 * market. Kept here to avoid a circular import.
 */
const MARKET_DEPENDENT_KEYS = [['store'], ['checkout']] as const

export async function fetchCustomerMe() {
  const { data } = await http('/account/me', { schema: CustomerMeResponseSchema })
  return data
}

export function useCustomerMe() {
  return useQuery({ queryKey: customerKeys.me, queryFn: fetchCustomerMe })
}

export async function updateCustomerDetails(payload: CustomerDetailsForm) {
  const { data } = await http('/account/details', {
    method: 'PUT',
    body: payload,
    schema: CustomerMeResponseSchema,
  })
  return data
}

export function useUpdateCustomerDetails() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateCustomerDetails,
    onSuccess: (customer) => queryClient.setQueryData(customerKeys.me, customer),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: customerKeys.me }),
        queryClient.invalidateQueries({ queryKey: customerKeys.activity }),
        ...MARKET_DEPENDENT_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ]),
  })
}

export async function updateCustomerMarketing(payload: CustomerMarketingForm) {
  const { data } = await http('/account/marketing', {
    method: 'PUT',
    body: payload,
    schema: CustomerMeResponseSchema,
  })
  return data
}

/** Turns marketing emails on or off; the switch updates before the server replies. */
export function useUpdateCustomerMarketing() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateCustomerMarketing,
    onMutate: async ({ acceptsMarketing }) => {
      await queryClient.cancelQueries({ queryKey: customerKeys.me })
      const previous = queryClient.getQueryData<Customer>(customerKeys.me)
      if (previous) queryClient.setQueryData(customerKeys.me, { ...previous, acceptsMarketing })
      return { previous }
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) queryClient.setQueryData(customerKeys.me, context.previous)
    },
    onSuccess: (customer) => queryClient.setQueryData(customerKeys.me, customer),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: customerKeys.me }),
        queryClient.invalidateQueries({ queryKey: customerKeys.activity }),
      ]),
  })
}

export async function fetchCustomerLocationOptions() {
  const { data } = await http('/account/location/options', {
    schema: CustomerLocationOptionsResponseSchema,
  })
  return data
}

/** Countries the customer can pick (from active markets) and every timezone. */
export function useCustomerLocationOptions() {
  return useQuery({
    queryKey: customerKeys.locationOptions,
    queryFn: fetchCustomerLocationOptions,
    staleTime: 5 * 60 * 1000,
  })
}

export async function updateCustomerLocation(payload: CustomerLocationForm) {
  return http('/account/location', {
    method: 'PUT',
    body: payload,
    schema: redirectResponseSchema,
  })
}

/** Saves the welcome step, then continues to the account or checkout. */
export function useUpdateCustomerLocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateCustomerLocation,
    onSuccess: async ({ data }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: customerKeys.me }),
        ...MARKET_DEPENDENT_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ])
      router.visit(data.redirectTo)
    },
  })
}

export async function fetchCustomerActivity(page: number) {
  return http(`/account/activity/list?page=${page}&perPage=${ACTIVITY_PER_PAGE}`, {
    schema: CustomerActivityResponseSchema,
  })
}

/** Updates and deletions the customer made in their account, newest first. */
export function useCustomerActivity() {
  return useInfiniteQuery({
    queryKey: customerKeys.activity,
    queryFn: ({ pageParam }) => fetchCustomerActivity(pageParam),
    initialPageParam: 1,
    getNextPageParam: ({ metadata }) =>
      metadata.currentPage < metadata.lastPage ? metadata.currentPage + 1 : undefined,
  })
}

export async function fetchCustomerOrders(page: number, perPage = ORDERS_PER_PAGE) {
  return http(`/account/orders/list?page=${page}&perPage=${perPage}`, {
    schema: CustomerOrdersResponseSchema,
  })
}

/** The signed-in customer's orders, newest first, loaded a page at a time. */
export function useCustomerOrders() {
  return useInfiniteQuery({
    queryKey: customerKeys.orders,
    queryFn: ({ pageParam }) => fetchCustomerOrders(pageParam),
    initialPageParam: 1,
    getNextPageParam: ({ metadata }) =>
      metadata.currentPage < metadata.lastPage ? metadata.currentPage + 1 : undefined,
  })
}

/** The newest few orders and the total count, for the overview. */
export function useRecentCustomerOrders(limit = 3) {
  return useQuery({
    queryKey: [...customerKeys.orders, 'recent', limit],
    queryFn: () => fetchCustomerOrders(1, limit),
  })
}

export async function fetchCustomerOrder(id: string) {
  const { data } = await http(`/account/orders/view/${id}`, {
    schema: CustomerOrderDetailResponseSchema,
  })
  return data
}

export function useCustomerOrder(id: string) {
  return useQuery({
    queryKey: customerKeys.order(id),
    queryFn: () => fetchCustomerOrder(id),
  })
}

/** Same-origin URL of the order's proof-of-payment screenshot (owner only). */
export function customerPaymentProofImageUrl(orderId: string, version: string) {
  return `/account/orders/${orderId}/payment-proof/image?v=${encodeURIComponent(version)}`
}

export async function submitPaymentProof({
  orderId,
  image,
  details,
}: PaymentProofForm & { orderId: string }) {
  const body = new FormData()
  if (image) body.append('image', image)
  if (details) body.append('details', details)
  const { data } = await http(`/account/orders/${orderId}/payment-proof`, {
    method: 'POST',
    body,
    schema: CustomerOrderDetailResponseSchema,
  })
  return data
}

export function useSubmitPaymentProof(orderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (form: PaymentProofForm) => submitPaymentProof({ ...form, orderId }),
    onSuccess: (order) => queryClient.setQueryData(customerKeys.order(orderId), order),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: customerKeys.order(orderId) }),
        queryClient.invalidateQueries({ queryKey: customerKeys.orders }),
      ]),
  })
}

export async function fetchCustomerOrderNotes(id: string) {
  const { data } = await http(`/account/orders/${id}/notes/list`, {
    schema: CustomerOrderNotesResponseSchema,
  })
  return data
}

export function useCustomerOrderNotes(id: string) {
  return useQuery({
    queryKey: customerKeys.orderNotes(id),
    queryFn: () => fetchCustomerOrderNotes(id),
  })
}

export async function replyToOrderNote({
  orderId,
  ...payload
}: CustomerOrderNoteReplyForm & { orderId: string }) {
  const { data } = await http(`/account/orders/${orderId}/notes`, {
    method: 'POST',
    body: payload,
    schema: CustomerOrderNoteReplyResponseSchema,
  })
  return data
}

export function useReplyToOrderNote(orderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CustomerOrderNoteReplyForm) => replyToOrderNote({ ...payload, orderId }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: customerKeys.orderNotes(orderId) }),
  })
}

export async function fetchCustomerOrderReturns(id: string) {
  const { data } = await http(`/account/orders/${id}/returns`, {
    schema: CustomerOrderReturnsResponseSchema,
  })
  return data
}

export function useCustomerOrderReturns(id: string) {
  return useQuery({
    queryKey: customerKeys.orderReturns(id),
    queryFn: () => fetchCustomerOrderReturns(id),
  })
}

export async function requestCustomerReturn({
  orderId,
  ...payload
}: CustomerReturnRequest & { orderId: string }) {
  const { data } = await http(`/account/orders/${orderId}/returns`, {
    method: 'POST',
    body: payload,
    schema: CustomerReturnResponseSchema,
  })
  return data
}

export function useRequestCustomerReturn(orderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: requestCustomerReturn,
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: customerKeys.orderReturns(orderId) }),
        queryClient.invalidateQueries({ queryKey: customerKeys.activity }),
      ]),
  })
}

export async function fetchCustomerAddresses() {
  const { data } = await http('/account/addresses/list', {
    schema: CustomerAddressesResponseSchema,
  })
  return data
}

export function useCustomerAddresses() {
  return useQuery({ queryKey: customerKeys.addresses, queryFn: fetchCustomerAddresses })
}

function useInvalidateAddresses() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: customerKeys.addresses }),
      queryClient.invalidateQueries({ queryKey: CHECKOUT_ADDRESSES_KEY }),
      queryClient.invalidateQueries({ queryKey: customerKeys.activity }),
    ])
}

export async function createCustomerAddress(payload: CustomerAddressForm) {
  const { data } = await http('/account/addresses', {
    method: 'POST',
    body: payload,
    schema: CustomerAddressResponseSchema,
  })
  return data
}

export function useCreateCustomerAddress() {
  const invalidate = useInvalidateAddresses()
  return useMutation({ mutationFn: createCustomerAddress, onSettled: invalidate })
}

export async function updateCustomerAddress({
  id,
  ...payload
}: CustomerAddressForm & { id: string }) {
  const { data } = await http(`/account/addresses/${id}`, {
    method: 'PUT',
    body: payload,
    schema: CustomerAddressResponseSchema,
  })
  return data
}

export function useUpdateCustomerAddress() {
  const invalidate = useInvalidateAddresses()
  return useMutation({ mutationFn: updateCustomerAddress, onSettled: invalidate })
}

/** Makes an address the default without changing its other fields. */
export function useSetDefaultCustomerAddress() {
  const invalidate = useInvalidateAddresses()
  return useMutation({
    mutationFn: ({ id, ...address }: CustomerAddress) =>
      updateCustomerAddress({ id, ...address, isDefault: true }),
    onSettled: invalidate,
  })
}

export async function deleteCustomerAddress(id: string) {
  await http(`/account/addresses/${id}`, {
    method: 'DELETE',
    schema: CustomerAddressDeleteResponseSchema,
  })
}

export function useDeleteCustomerAddress() {
  const invalidate = useInvalidateAddresses()
  return useMutation({ mutationFn: deleteCustomerAddress, onSettled: invalidate })
}

/**
 * Leaves with a full page load instead of an Inertia visit so no signed-in
 * state (query cache, layout, history) survives the logout.
 */
export function useCustomerLogout() {
  return useMutation({
    mutationFn: () => http('/logout', { method: 'POST', schema: redirectResponseSchema }),
    onSuccess: ({ data }) => window.location.assign(data.redirectTo),
  })
}
