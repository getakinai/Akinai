import vine from '@vinejs/vine'

export const POLI_TOKEN = /^[A-Za-z0-9+/=_-]+$/

export const checkoutPoliReturnValidator = vine.create({
  token: vine.string().trim().maxLength(255).regex(POLI_TOKEN).optional(),
  status: vine.enum(['success', 'failure', 'cancelled'] as const).optional(),
})
