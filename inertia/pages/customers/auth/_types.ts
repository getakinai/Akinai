import { z } from 'zod'

export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_MAX_LENGTH = 128
export const VERIFICATION_CODE_LENGTH = 6

const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must have at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must have at most ${PASSWORD_MAX_LENGTH} characters`)

const verificationCodeSchema = z
  .string()
  .trim()
  .regex(new RegExp(`^\\d{${VERIFICATION_CODE_LENGTH}}$`), 'Enter the 6-digit code')

export const CustomerLoginFormSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})

export type CustomerLoginForm = z.infer<typeof CustomerLoginFormSchema>

export const CustomerSignupFormSchema = z
  .object({
    fullName: z.string().trim().max(255).nullable(),
    email: z.email('Enter a valid email address'),
    phone: z.string().trim().max(32).nullable(),
    password: newPasswordSchema,
    passwordConfirmation: z.string(),
    acceptsMarketing: z.boolean(),
  })
  .refine((form) => form.password === form.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'Passwords do not match',
  })

export type CustomerSignupForm = z.infer<typeof CustomerSignupFormSchema>

export const VerificationCodeFormSchema = z.object({ code: verificationCodeSchema })

export type VerificationCodeForm = z.infer<typeof VerificationCodeFormSchema>

export const ForgotPasswordFormSchema = z.object({
  email: z.email('Enter a valid email address'),
})

export type ForgotPasswordForm = z.infer<typeof ForgotPasswordFormSchema>

export const ResetPasswordFormSchema = z
  .object({
    code: verificationCodeSchema,
    password: newPasswordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((form) => form.password === form.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'Passwords do not match',
  })

export type ResetPasswordForm = z.infer<typeof ResetPasswordFormSchema>

export const PendingVerificationResponseSchema = z.object({
  data: z.object({ email: z.string() }),
})

export const ResendCodeResponseSchema = z.object({
  data: z.object({ cooldownSeconds: z.number().int().nonnegative() }),
})
