import vine from '@vinejs/vine'

export function fulfillmentTrackingFields() {
  return {
    trackingCompany: vine.string().trim().maxLength(100).nullable().optional(),
    trackingNumber: vine.string().trim().maxLength(100).nullable().optional(),
    trackingUrl: vine
      .string()
      .trim()
      .maxLength(2048)
      .url({ protocols: ['http', 'https'], require_protocol: true })
      .nullable()
      .optional(),
  }
}
