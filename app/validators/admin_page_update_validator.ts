import vine from '@vinejs/vine'
import { pageFields } from '#validators/helpers/page_fields'

export const adminPageUpdateValidator = vine.create({
  ...pageFields(),
})
