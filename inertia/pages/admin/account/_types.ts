import { z } from 'zod'

export const STAFF_PASSWORD_MIN_LENGTH = 12

export const MfaStatusSchema = z.object({
  enabled: z.boolean(),
  enabledAt: z.string().nullable(),
  recoveryCodesRemaining: z.number().int(),
})

export type MfaStatus = z.infer<typeof MfaStatusSchema>

export const MfaStatusResponseSchema = z.object({ data: MfaStatusSchema })

export const MfaSetupResponseSchema = z.object({
  data: z.object({
    secret: z.string(),
    otpauthUri: z.string(),
    qrCodeDataUrl: z.string().startsWith('data:image/png;base64,'),
  }),
})

export type MfaSetup = z.infer<typeof MfaSetupResponseSchema>['data']

export const MfaRecoveryCodesResponseSchema = z.object({
  data: z.object({ recoveryCodes: z.array(z.string()) }),
})

export const MfaConfirmFormSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit code from your app'),
})

export type MfaConfirmForm = z.infer<typeof MfaConfirmFormSchema>

export const MfaDisableFormSchema = z.object({
  password: z.string().min(1, 'Enter your password').max(128),
  code: z.string().trim().min(6, 'Enter a code from your app or a recovery code').max(32),
})

export type MfaDisableForm = z.infer<typeof MfaDisableFormSchema>

export const PasswordChangeFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password').max(128),
    password: z
      .string()
      .min(
        STAFF_PASSWORD_MIN_LENGTH,
        `Password must have at least ${STAFF_PASSWORD_MIN_LENGTH} characters`
      )
      .max(128),
    passwordConfirmation: z.string(),
  })
  .refine((form) => form.password === form.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'Passwords do not match',
  })

export type PasswordChangeForm = z.infer<typeof PasswordChangeFormSchema>

export const ProfileFormSchema = z.object({
  fullName: z.string().trim().max(255).nullable(),
  email: z.email('Enter a valid email').max(254),
  currentPassword: z.string().max(128).optional(),
})

export type ProfileForm = z.infer<typeof ProfileFormSchema>

export const MessageResponseSchema = z.object({ data: z.object({ message: z.string() }) })
