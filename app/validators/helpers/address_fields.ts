import vine from '@vinejs/vine'

/**
 * Field schemas for a street address (address line, suburb, city, region,
 * postal code). Validators map them to their own column names.
 */
export const addressSchemas = {
  line1: () => vine.string().trim().minLength(1).maxLength(255),
  suburb: () => vine.string().trim().maxLength(100).nullable(),
  city: () => vine.string().trim().minLength(1).maxLength(100),
  region: () => vine.string().trim().maxLength(100).nullable(),
  postalCode: () => vine.string().trim().minLength(1).maxLength(20),
}
