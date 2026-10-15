import vine from '@vinejs/vine'
import { notDisposableEmail } from '#validators/rules/not_disposable_email'

export const storefrontNewsletterStoreValidator = vine.create({
  email: vine.string().trim().toLowerCase().email().maxLength(254).use(notDisposableEmail()),
})
