import { router } from '@inertiajs/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http, redirectResponseSchema } from '~/lib/http'
import { recaptchaHeaders } from '~/lib/recaptcha'
import {
  AdminLoginResponseSchema,
  AdminSetupStatusSchema,
  type AdminLoginForm,
  type AdminLoginMfaForm,
  type AdminSetupForm,
} from './_types'

export const adminSetupKeys = {
  status: ['admin', 'setup', 'status'] as const,
}

export async function loginAdmin(payload: AdminLoginForm) {
  return http('/admin/login', {
    method: 'POST',
    body: payload,
    headers: await recaptchaHeaders('admin_login'),
    schema: AdminLoginResponseSchema,
  })
}

/**
 * Signs in with email and password. Resolves to `mfaRequired` when the
 * User has two-step verification on; otherwise visits the back office.
 */
export function useAdminLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: loginAdmin,
    onSuccess: ({ data }) => {
      if ('redirectTo' in data) {
        queryClient.clear()
        router.visit(data.redirectTo)
      }
    },
  })
}

export async function verifyAdminLoginMfa(payload: AdminLoginMfaForm) {
  return http('/admin/login/mfa', {
    method: 'POST',
    body: payload,
    headers: await recaptchaHeaders('admin_login_mfa'),
    schema: redirectResponseSchema,
  })
}

export function useAdminLoginMfa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: verifyAdminLoginMfa,
    onSuccess: ({ data }) => {
      queryClient.clear()
      router.visit(data.redirectTo)
    },
  })
}

export async function fetchAdminSetupStatus() {
  const { data } = await http('/admin/setup/view', { schema: AdminSetupStatusSchema })
  return data
}

export function useAdminSetupStatus() {
  return useQuery({ queryKey: adminSetupKeys.status, queryFn: fetchAdminSetupStatus })
}

export async function setupAdmin(payload: AdminSetupForm) {
  return http('/admin/setup', {
    method: 'POST',
    body: payload,
    headers: await recaptchaHeaders('admin_setup'),
    schema: redirectResponseSchema,
  })
}

/** Creates the first admin, signs them in and opens the back office. */
export function useAdminSetup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: setupAdmin,
    onSuccess: ({ data }) => {
      queryClient.clear()
      router.visit(data.redirectTo)
    },
  })
}
