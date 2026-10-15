import { router } from '@inertiajs/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http, redirectResponseSchema } from '~/lib/http'
import { recaptchaHeaders } from '~/lib/recaptcha'
import {
  PendingVerificationResponseSchema,
  ResendCodeResponseSchema,
  type CustomerLoginForm,
  type CustomerSignupForm,
  type ForgotPasswordForm,
  type ResetPasswordForm,
  type VerificationCodeForm,
} from './_types'

export const customerAuthKeys = {
  signupVerification: ['customers', 'auth', 'signup-verification'] as const,
  passwordReset: ['customers', 'auth', 'password-reset'] as const,
}

export async function loginCustomer(payload: CustomerLoginForm) {
  return http('/login', {
    method: 'POST',
    body: payload,
    headers: await recaptchaHeaders('customer_login'),
    schema: redirectResponseSchema,
  })
}

export async function registerCustomer(payload: CustomerSignupForm) {
  return http('/signup', {
    method: 'POST',
    body: payload,
    headers: await recaptchaHeaders('customer_signup'),
    schema: redirectResponseSchema,
  })
}

export async function verifyCustomerSignup(payload: VerificationCodeForm) {
  return http('/signup/verify', {
    method: 'POST',
    body: payload,
    headers: await recaptchaHeaders('customer_signup_verify'),
    schema: redirectResponseSchema,
  })
}

export async function resendSignupCode() {
  return http('/signup/verify/resend', {
    method: 'POST',
    headers: await recaptchaHeaders('customer_signup_resend'),
    schema: ResendCodeResponseSchema,
  })
}

export async function fetchSignupVerification() {
  return http('/signup/verify/view', { schema: PendingVerificationResponseSchema })
}

export async function requestPasswordReset(payload: ForgotPasswordForm) {
  return http('/forgot-password', {
    method: 'POST',
    body: payload,
    headers: await recaptchaHeaders('customer_forgot_password'),
    schema: redirectResponseSchema,
  })
}

export async function resetCustomerPassword(payload: ResetPasswordForm) {
  return http('/reset-password', {
    method: 'POST',
    body: payload,
    headers: await recaptchaHeaders('customer_password_reset'),
    schema: redirectResponseSchema,
  })
}

export async function resendPasswordResetCode() {
  return http('/reset-password/resend', {
    method: 'POST',
    headers: await recaptchaHeaders('customer_password_reset_resend'),
    schema: ResendCodeResponseSchema,
  })
}

export async function fetchPasswordReset() {
  return http('/reset-password/view', { schema: PendingVerificationResponseSchema })
}

function useSignedInRedirect<TVariables>(
  mutationFn: (variables: TVariables) => Promise<{ data: { redirectTo: string } }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: ({ data }) => {
      queryClient.clear()
      router.visit(data.redirectTo)
    },
  })
}

export function useCustomerLogin() {
  return useSignedInRedirect(loginCustomer)
}

/**
 * Starts a signup; the account is only created on the verify page.
 */
export function useCustomerSignup() {
  return useMutation({
    mutationFn: registerCustomer,
    onSuccess: ({ data }) => router.visit(data.redirectTo),
  })
}

export function useCustomerSignupVerify() {
  return useSignedInRedirect(verifyCustomerSignup)
}

export function useResendSignupCode() {
  return useMutation({ mutationFn: resendSignupCode })
}

export function useSignupVerification() {
  return useQuery({
    queryKey: customerAuthKeys.signupVerification,
    queryFn: fetchSignupVerification,
    retry: false,
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: ({ data }) => router.visit(data.redirectTo),
  })
}

export function useResetPassword() {
  return useSignedInRedirect(resetCustomerPassword)
}

export function useResendPasswordResetCode() {
  return useMutation({ mutationFn: resendPasswordResetCode })
}

export function usePasswordReset() {
  return useQuery({
    queryKey: customerAuthKeys.passwordReset,
    queryFn: fetchPasswordReset,
    retry: false,
  })
}
