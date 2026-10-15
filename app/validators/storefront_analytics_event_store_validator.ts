import vine from '@vinejs/vine'
import { CLIENT_ANALYTICS_EVENT_TYPES } from '#constants/analytics'

const utmField = () => vine.string().trim().maxLength(100).optional()

export const storefrontAnalyticsEventStoreValidator = vine.create({
  type: vine.enum(CLIENT_ANALYTICS_EVENT_TYPES),
  path: vine
    .string()
    .trim()
    .maxLength(500)
    .regex(/^\/[^\s]*$/),
  productId: vine.string().uuid().optional(),
  referrer: vine.string().trim().maxLength(2048).optional(),
  utmSource: utmField(),
  utmMedium: utmField(),
  utmCampaign: utmField(),
  hasClickId: vine.boolean({ strict: true }).optional(),
})
