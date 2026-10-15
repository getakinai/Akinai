import { z } from 'zod'
import {
  BUSINESS_TYPES,
  CURRENCY_DISPLAYS,
  DATE_FORMATS,
  LOCALES,
  MAX_CHECKOUT_DELIVERY_HEADING,
  MAX_CHECKOUT_DELIVERY_NOTE,
  SOLE_TRADER,
  UNIT_SYSTEMS,
  WEIGHT_UNITS,
} from '~/lib/store_settings'

export const MAX_ORDER_NOTIFICATION_EMAILS = 5

export const MAX_RETURN_WINDOW_DAYS = 365

const countryCode = z.string().regex(/^[A-Z]{2}$/, 'Select a country')

const e164 = z.string().regex(/^\+[1-9]\d{6,14}$/, 'Enter a valid phone number')

export const AdminStoreSettingsSchema = z.object({
  id: z.uuid(),
  businessCountryCode: z.string().nullable(),
  businessType: z.enum(BUSINESS_TYPES).nullable(),
  legalName: z.string().nullable(),
  ownerFirstName: z.string().nullable(),
  ownerLastName: z.string().nullable(),
  ownerDateOfBirth: z.string().nullable(),
  ownerEmail: z.string().nullable(),
  ownerPhoneCountryCode: z.string().nullable(),
  ownerPhone: z.string().nullable(),
  ownerAddressLine1: z.string().nullable(),
  ownerSuburb: z.string().nullable(),
  ownerCity: z.string().nullable(),
  ownerRegion: z.string().nullable(),
  ownerPostalCode: z.string().nullable(),
  storeName: z.string(),
  contactEmail: z.string().nullable(),
  phoneCountryCode: z.string().nullable(),
  phone: z.string().nullable(),
  storeAddressLine1: z.string().nullable(),
  storeSuburb: z.string().nullable(),
  storeCity: z.string().nullable(),
  storeRegion: z.string().nullable(),
  storePostalCode: z.string().nullable(),
  storeCountryCode: z.string().nullable(),
  operatingCountryCode: z.string().nullable(),
  currencyCode: z.string(),
  currencyDisplay: z.enum(CURRENCY_DISPLAYS),
  locale: z.string(),
  dateFormat: z.enum(DATE_FORMATS),
  timezone: z.string(),
  unitSystem: z.enum(UNIT_SYSTEMS),
  weightUnit: z.enum(WEIGHT_UNITS),
  returnWindowDays: z.number(),
  orderNotificationEmails: z.array(z.string()),
  checkoutDeliveryHeading: z.string().nullable(),
  checkoutDeliveryNote: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
})

export type AdminStoreSettings = z.infer<typeof AdminStoreSettingsSchema>

export const AdminStoreSettingsResponseSchema = z.object({ data: AdminStoreSettingsSchema })

export const AdminMaintenanceSchema = z.object({ active: z.boolean() })

export type AdminMaintenance = z.infer<typeof AdminMaintenanceSchema>

export const AdminMaintenanceResponseSchema = z.object({ data: AdminMaintenanceSchema })

const required = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max)

const optional = (max: number) => z.string().trim().max(max).nullable()

export const AdminStoreBusinessFormSchema = z
  .object({
    businessCountryCode: countryCode,
    businessType: z.enum(BUSINESS_TYPES, 'Select a business type'),
    legalName: z.string().trim().max(150).optional(),
    ownerFirstName: required('First name', 100),
    ownerLastName: required('Last name', 100),
    ownerDateOfBirth: z.iso.date('Enter a valid date of birth'),
    ownerEmail: z.email('Enter a valid email').max(254),
    ownerPhoneCountryCode: countryCode,
    ownerPhone: e164,
    ownerAddressLine1: required('Residential address', 255),
    ownerSuburb: optional(100),
    ownerCity: required('City', 100),
    ownerRegion: optional(100),
    ownerPostalCode: required('Postal code', 20),
  })
  .refine(
    ({ businessType, legalName }) => businessType === SOLE_TRADER || (legalName?.length ?? 0) >= 2,
    { path: ['legalName'], message: 'Legal business name is required' }
  )

export type AdminStoreBusinessForm = z.infer<typeof AdminStoreBusinessFormSchema>

export const AdminStoreContactFormSchema = z.object({
  storeName: z.string().trim().min(2, 'Store name must have at least 2 characters').max(100),
  contactEmail: z.email('Enter a valid email').max(254),
  phoneCountryCode: countryCode.nullable(),
  phone: e164.nullable(),
})

export type AdminStoreContactForm = z.infer<typeof AdminStoreContactFormSchema>

export const AdminStoreAddressFormSchema = z.object({
  storeAddressLine1: required('Address', 255),
  storeSuburb: optional(100),
  storeCity: required('City', 100),
  storeRegion: optional(100),
  storePostalCode: required('Postal code', 20),
  storeCountryCode: countryCode,
})

export type AdminStoreAddressForm = z.infer<typeof AdminStoreAddressFormSchema>

export const AdminStoreDefaultsFormSchema = z.object({
  operatingCountryCode: countryCode.nullable(),
  currencyCode: z.string().regex(/^[A-Z]{3}$/, 'Select a currency'),
  currencyDisplay: z.enum(CURRENCY_DISPLAYS),
  locale: z.enum(LOCALES, 'Select a language'),
  dateFormat: z.enum(DATE_FORMATS),
  timezone: z.string().min(1, 'Select a time zone'),
  unitSystem: z.enum(UNIT_SYSTEMS),
  weightUnit: z.enum(WEIGHT_UNITS),
  returnWindowDays: z
    .number('Enter the number of days')
    .int('Use whole days')
    .min(0, 'Use 0 or more days')
    .max(MAX_RETURN_WINDOW_DAYS, `Use at most ${MAX_RETURN_WINDOW_DAYS} days`),
})

export type AdminStoreDefaultsForm = z.infer<typeof AdminStoreDefaultsFormSchema>

export const AdminStoreNotificationsFormSchema = z.object({
  orderNotificationEmails: z
    .array(z.email('Enter a valid email').max(254))
    .max(MAX_ORDER_NOTIFICATION_EMAILS, `Add at most ${MAX_ORDER_NOTIFICATION_EMAILS} emails`)
    .refine((emails) => new Set(emails).size === emails.length, 'Each email can be added once'),
})

export type AdminStoreNotificationsForm = z.infer<typeof AdminStoreNotificationsFormSchema>

export const AdminStoreCheckoutFormSchema = z.object({
  checkoutDeliveryHeading: optional(MAX_CHECKOUT_DELIVERY_HEADING),
  checkoutDeliveryNote: optional(MAX_CHECKOUT_DELIVERY_NOTE),
})

export type AdminStoreCheckoutForm = z.infer<typeof AdminStoreCheckoutFormSchema>
