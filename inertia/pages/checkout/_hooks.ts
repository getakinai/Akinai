import { router } from '@inertiajs/react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useClearCart } from '~/hooks/use_cart_persistence'
import { http, redirectResponseSchema } from '~/lib/http'
import { recaptchaHeaders } from '~/lib/recaptcha'
import { customerKeys, fetchCustomerMe } from '~/pages/customers/_hooks'
import {
  CheckoutOrderResponseSchema,
  CheckoutPaymentMethodsResponseSchema,
  CheckoutQuoteResponseSchema,
  CheckoutSavedAddressesResponseSchema,
  isOnlinePayment,
  type CheckoutQuoteInput,
  type PlaceOrderInput,
} from './_types'

export const checkoutKeys = {
  all: ['checkout'] as const,
  quote: (input: CheckoutQuoteInput | null) => ['checkout', 'quote', input] as const,
  order: (id: string) => ['checkout', 'orders', id] as const,
  paymentMethods: ['checkout', 'payment_methods'] as const,
  addresses: ['checkout', 'addresses'] as const,
}

export async function fetchCheckoutAddresses() {
  const { data } = await http('/checkout/addresses', {
    schema: CheckoutSavedAddressesResponseSchema,
  })
  return data
}

/** The signed-in customer's saved addresses, default first. */
export function useCheckoutAddresses(signedIn: boolean) {
  return useQuery({
    queryKey: checkoutKeys.addresses,
    queryFn: fetchCheckoutAddresses,
    enabled: signedIn,
  })
}

export async function fetchCheckoutQuote(input: CheckoutQuoteInput) {
  const { data } = await http('/checkout/quote', {
    method: 'POST',
    body: input,
    schema: CheckoutQuoteResponseSchema,
  })
  return data
}

/**
 * Server-priced totals and shipping rates for the cart and address.
 * Keeps the previous quote on screen while a new one loads.
 */
export function useCheckoutQuote(input: CheckoutQuoteInput | null) {
  return useQuery({
    queryKey: checkoutKeys.quote(input),
    queryFn: () => fetchCheckoutQuote(input!),
    enabled: input !== null,
    placeholderData: keepPreviousData,
    retry: false,
  })
}

/**
 * The signed-in customer, fetched only when there is one (guests would
 * get a 401 from `/account/me`).
 */
export function useCheckoutCustomer(signedIn: boolean) {
  return useQuery({ queryKey: customerKeys.me, queryFn: fetchCustomerMe, enabled: signedIn })
}

/**
 * Bank transfer orders exist once this succeeds, so the cart is emptied
 * straight away. Card orders are only placed after Stripe takes the
 * payment, so the cart stays until the thank-you page clears it, and a
 * shopper who cancels on Stripe comes back to a full cart.
 */
export function usePlaceOrder() {
  const clearCart = useClearCart()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      firstName,
      address2,
      province,
      postalCode,
      phone,
      ...input
    }: PlaceOrderInput) =>
      http('/checkout', {
        method: 'POST',
        body: {
          ...input,
          firstName: firstName || null,
          address2: address2 || null,
          province: province || null,
          postalCode: postalCode || null,
          phone: phone || null,
        },
        headers: await recaptchaHeaders('checkout'),
        schema: redirectResponseSchema,
      }),
    onSuccess: ({ data }, { paymentMethod }) => {
      if (!isOnlinePayment(paymentMethod)) clearCart()
      queryClient.invalidateQueries({ queryKey: customerKeys.orders })
      queryClient.invalidateQueries({ queryKey: customerKeys.addresses })
      goTo(data.redirectTo)
    },
  })
}

/** Stripe Checkout and POLi live on another origin, so they need a full page load. */
function goTo(url: string) {
  if (/^https?:\/\//.test(url)) window.location.assign(url)
  else router.visit(url)
}

/** Opens a new Stripe or POLi payment page for an unpaid online order. */
export function usePayOrder(id: string) {
  return useMutation({
    mutationFn: () =>
      http(`/checkout/orders/${id}/payment`, { method: 'POST', schema: redirectResponseSchema }),
    onSuccess: ({ data }) => goTo(data.redirectTo),
  })
}

export async function fetchCheckoutPaymentMethods() {
  const { data } = await http('/checkout/payment-methods', {
    schema: CheckoutPaymentMethodsResponseSchema,
  })
  return data
}

/** Payment methods the store has turned on, with bank details. */
export function useCheckoutPaymentMethods() {
  return useQuery({ queryKey: checkoutKeys.paymentMethods, queryFn: fetchCheckoutPaymentMethods })
}

export async function fetchCheckoutOrder(id: string) {
  const { data } = await http(`/checkout/orders/view/${id}`, {
    schema: CheckoutOrderResponseSchema,
  })
  return data
}

export function useCheckoutOrder(id: string) {
  return useQuery({
    queryKey: checkoutKeys.order(id),
    queryFn: () => fetchCheckoutOrder(id),
    retry: false,
  })
}
