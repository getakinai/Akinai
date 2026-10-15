import vine from '@vinejs/vine'
import { MAX_RETURN_LINES } from '#validators/customers_order_return_store_validator'

/** Which received lines go back into stock, and where. */
export const adminReturnReceiveValidator = vine.create({
  lines: vine
    .array(
      vine.object({
        id: vine.string().uuid(),
        restock: vine.boolean({ strict: true }),
        locationId: vine.string().uuid().nullable().optional(),
      })
    )
    .maxLength(MAX_RETURN_LINES)
    .distinct('id'),
})
