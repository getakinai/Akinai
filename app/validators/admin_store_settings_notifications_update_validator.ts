import vine from '@vinejs/vine'
import { MAX_ORDER_NOTIFICATION_EMAILS } from '#constants/store_settings'

export const adminStoreSettingsNotificationsUpdateValidator = vine.create({
  orderNotificationEmails: vine
    .array(vine.string().trim().toLowerCase().email().maxLength(254))
    .maxLength(MAX_ORDER_NOTIFICATION_EMAILS)
    .distinct(),
})
