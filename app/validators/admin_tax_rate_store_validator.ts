import vine from '@vinejs/vine'
import { taxRateFields } from '#validators/helpers/tax_rate_fields'

export const adminTaxRateStoreValidator = vine.create(taxRateFields())
