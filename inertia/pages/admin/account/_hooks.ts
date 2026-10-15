import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '~/lib/http'
import { adminKeys } from '../_hooks'
import { AdminMeResponseSchema } from '../_types'
import { adminUsersKeys } from '../users/_hooks'
import {
  MessageResponseSchema,
  MfaRecoveryCodesResponseSchema,
  MfaSetupResponseSchema,
  MfaStatusResponseSchema,
  type MfaConfirmForm,
  type MfaDisableForm,
  type PasswordChangeForm,
  type ProfileForm,
} from './_types'

export const accountKeys = {
  security: ['admin', 'account', 'security'] as const,
}

export async function fetchAccountSecurity() {
  const { data } = await http('/admin/account/security/view', { schema: MfaStatusResponseSchema })
  return data
}

export function useAccountSecurity({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({ queryKey: accountKeys.security, queryFn: fetchAccountSecurity, enabled })
}

export function useStartMfaSetup() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await http('/admin/account/mfa/setup', {
        method: 'POST',
        schema: MfaSetupResponseSchema,
      })
      return data
    },
  })
}

export function useConfirmMfaSetup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: MfaConfirmForm) => {
      const { data } = await http('/admin/account/mfa', {
        method: 'POST',
        body: payload,
        schema: MfaRecoveryCodesResponseSchema,
      })
      return data.recoveryCodes
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.security }),
  })
}

export function useDisableMfa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: MfaDisableForm) => {
      const { data } = await http('/admin/account/mfa', {
        method: 'DELETE',
        body: payload,
        schema: MfaStatusResponseSchema,
      })
      return data
    },
    onSuccess: (status) => queryClient.setQueryData(accountKeys.security, status),
  })
}

/** Saves the signed-in User's name and email and refreshes `useAdminMe()`. */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ProfileForm) => {
      const { data } = await http('/admin/account/profile', {
        method: 'PUT',
        body: payload,
        schema: AdminMeResponseSchema,
      })
      return data
    },
    onSuccess: (me) => {
      queryClient.setQueryData(adminKeys.me, me)
      void queryClient.invalidateQueries({ queryKey: adminUsersKeys.all })
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (payload: PasswordChangeForm) => {
      const { data } = await http('/admin/account/password', {
        method: 'PUT',
        body: payload,
        schema: MessageResponseSchema,
      })
      return data
    },
  })
}
