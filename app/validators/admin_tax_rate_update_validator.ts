import vine from '@vinejs/vine'
import { taxRateFields } from '#validators/helpers/tax_rate_fields'

export const adminTaxRateUpdateValidator = vine
  .withMetaData<{ taxRateId: string }>()
  .create(taxRateFields())
