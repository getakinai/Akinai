import vine from '@vinejs/vine'
import { MAX_IMPORT_SIZE_MB } from '#constants/csv_transfer'

export const adminCsvImportStoreValidator = vine.create({
  file: vine.file({ size: `${MAX_IMPORT_SIZE_MB}mb`, extnames: ['csv'] }),
})
