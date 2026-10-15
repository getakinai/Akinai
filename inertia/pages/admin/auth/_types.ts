import { z } from 'zod'

export const AdminLoginFormSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password').max(128, 'Password is too long'),
})

export type AdminLoginForm = z.infer<typeof AdminLoginFormSchema>

export const AdminLoginResponseSchema = z.object({
  data: z.union([z.object({ redirectTo: z.string() }), z.object({ mfaRequired: z.literal(true) })]),
})

export const AdminLoginMfaFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(6, 'Enter the 6-digit code or a recovery code')
    .max(32, 'That code is too long'),
})

export type AdminLoginMfaForm = z.infer<typeof AdminLoginMfaFormSchema>

export const AdminSetupStatusSchema = z.object({
  data: z.object({
    available: z.boolean(),
    tokenConfigured: z.boolean(),
  }),
})

export type AdminSetupStatus = z.infer<typeof AdminSetupStatusSchema>['data']

export const AdminSetupFormSchema = z
  .object({
    setupToken: z.string().trim().min(1, 'Enter the setup token').max(256),
    operatingCountryCode: z.string().regex(/^[A-Z]{2}$/, 'Choose the country you deliver to'),
    fullName: z.string().trim().min(1, 'Enter your name').max(255),
    email: z.email('Enter a valid email address').max(254),
    password: z.string().min(12, 'Password must have at least 12 characters').max(128),
    passwordConfirmation: z.string(),
  })
  .refine((form) => form.password === form.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'Passwords do not match',
  })

export type AdminSetupForm = z.infer<typeof AdminSetupFormSchema>
