import vine from '@vinejs/vine'
import { COLLECTION_TYPES } from '#models/collection'
import { collectionFields } from '#validators/helpers/collection_fields'

export const adminCollectionStoreValidator = vine.create({
  type: vine.enum(COLLECTION_TYPES),
  ...collectionFields(),
})
