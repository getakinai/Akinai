import vine from '@vinejs/vine'
import { collectionFields } from '#validators/helpers/collection_fields'

export const adminCollectionUpdateValidator = vine.create({
  ...collectionFields(),
})
