import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '~/lib/http'
import {
  AdminBankTransferResponseSchema,
  AdminPaymentMarketsResponseSchema,
  AdminPaymentMethodsResponseSchema,
  AdminPoliResponseSchema,
  AdminStripeResponseSchema,
  type AdminBankTransferForm,
  type AdminPoliForm,
  type AdminStripeForm,
} from './_types'

export const adminPaymentKeys = {
  all: ['admin', 'payments'] as const,
  list: ['admin', 'payments', 'list'] as const,
  markets: ['admin', 'payments', 'markets'] as const,
  bankTransfer: ['admin', 'payments', 'bank_transfer'] as const,
  stripe: ['admin', 'payments', 'stripe'] as const,
  poli: ['admin', 'payments', 'poli'] as const,
}

export async function fetchAdminPaymentMethods() {
  const { data } = await http('/admin/payments/list', {
    schema: AdminPaymentMethodsResponseSchema,
  })
  return data
}

export function useAdminPaymentMethods(enabled = true) {
  return useQuery({ queryKey: adminPaymentKeys.list, queryFn: fetchAdminPaymentMethods, enabled })
}

export async function fetchAdminPaymentMarkets() {
  const { data } = await http('/admin/payments/markets', {
    schema: AdminPaymentMarketsResponseSchema,
  })
  return data
}

/** Active markets payment methods can be offered in, primary first. */
export function useAdminPaymentMarkets(enabled = true) {
  return useQuery({
    queryKey: adminPaymentKeys.markets,
    queryFn: fetchAdminPaymentMarkets,
    enabled,
  })
}

export async function fetchAdminBankTransfer() {
  const { data } = await http('/admin/payments/bank-transfer/view', {
    schema: AdminBankTransferResponseSchema,
  })
  return data
}

export function useAdminBankTransfer(enabled = true) {
  return useQuery({
    queryKey: adminPaymentKeys.bankTransfer,
    queryFn: fetchAdminBankTransfer,
    enabled,
  })
}

export function useUpdateAdminBankTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      marketId,
      payload,
    }: {
      marketId: string
      payload: AdminBankTransferForm
    }) => {
      const { data } = await http(`/admin/payments/bank-transfer/${marketId}`, {
        method: 'PUT',
        body: payload,
        schema: AdminBankTransferResponseSchema,
      })
      return data
    },
    onSuccess: (saved) => queryClient.setQueryData(adminPaymentKeys.bankTransfer, saved),
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminPaymentKeys.all }),
  })
}

export async function fetchAdminStripe() {
  const { data } = await http('/admin/payments/stripe/view', {
    schema: AdminStripeResponseSchema,
  })
  return data
}

export function useAdminStripe(enabled = true) {
  return useQuery({ queryKey: adminPaymentKeys.stripe, queryFn: fetchAdminStripe, enabled })
}

export function useUpdateAdminStripe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: AdminStripeForm) => {
      const { data } = await http('/admin/payments/stripe', {
        method: 'PUT',
        body: payload,
        schema: AdminStripeResponseSchema,
      })
      return data
    },
    onSuccess: (saved) => queryClient.setQueryData(adminPaymentKeys.stripe, saved),
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminPaymentKeys.all }),
  })
}

export async function fetchAdminPoli() {
  const { data } = await http('/admin/payments/poli/view', {
    schema: AdminPoliResponseSchema,
  })
  return data
}

export function useAdminPoli(enabled = true) {
  return useQuery({ queryKey: adminPaymentKeys.poli, queryFn: fetchAdminPoli, enabled })
}

export function useUpdateAdminPoli() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: AdminPoliForm) => {
      const { data } = await http('/admin/payments/poli', {
        method: 'PUT',
        body: payload,
        schema: AdminPoliResponseSchema,
      })
      return data
    },
    onSuccess: (saved) => queryClient.setQueryData(adminPaymentKeys.poli, saved),
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminPaymentKeys.all }),
  })
}
