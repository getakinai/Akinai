import vine from '@vinejs/vine'
import { draftOrderFields } from '#validators/helpers/draft_order_fields'

export const adminDraftOrderStoreValidator = vine.create(draftOrderFields())
