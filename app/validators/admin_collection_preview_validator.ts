import vine from '@vinejs/vine'
import { COLLECTION_MATCHES, COLLECTION_SORT_ORDERS } from '#models/collection'
import { collectionRulesSchema } from '#validators/helpers/collection_fields'

export const adminCollectionPreviewValidator = vine.create({
  match: vine.enum(COLLECTION_MATCHES),
  sortOrder: vine.enum(COLLECTION_SORT_ORDERS),
  rules: collectionRulesSchema().minLength(1),
})
