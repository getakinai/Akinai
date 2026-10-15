import { z } from 'zod'
import { requireListedProvince } from '~/lib/country_regions'
import { paginatedResponse } from '~/lib/schemas'
import { RecordActivitySchema } from '../_audit_types'

export const AdminCustomerActivityResponseSchema = paginatedResponse(RecordActivitySchema)

export const ADMIN_CUSTOMERS_SORT_KEYS = ['fullName', 'email', 'createdAt'] as const

export const AdminCustomersSortKeySchema = z.enum(ADMIN_CUSTOMERS_SORT_KEYS)

export type AdminCustomersSortKey = z.infer<typeof AdminCustomersSortKeySchema>

export const AdminCustomerStatusFilterSchema = z.enum(['', 'active', 'archived'])

export type AdminCustomerStatusFilter = z.infer<typeof AdminCustomerStatusFilterSchema>

export const CustomerAccountStateSchema = z.enum(['enabled', 'none'])

export type CustomerAccountState = z.infer<typeof CustomerAccountStateSchema>

export const MAX_CUSTOMER_TAGS = 20
export const MAX_CUSTOMER_TAG_LENGTH = 40
export const MAX_CUSTOMER_NOTE_LENGTH = 5000
export const MAX_CUSTOMER_SEGMENT_NAME_LENGTH = 100

export const MARKETING_CONSENT_SOURCES = [
  'signup',
  'checkout',
  'newsletter',
  'account',
  'admin',
] as const

const customerBase = {
  id: z.uuid(),
  fullName: z.string().nullable(),
  email: z.email(),
  phone: z.string().nullable(),
  acceptsMarketing: z.boolean(),
  isActive: z.boolean(),
  accountState: CustomerAccountStateSchema,
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
}

export const AdminCustomerListItemSchema = z.object({
  ...customerBase,
  countryCode: z.string().nullable(),
  addressesCount: z.number().nullable(),
  ordersCount: z.number(),
  lastOrderAt: z.string().nullable(),
})

export type AdminCustomerListItem = z.infer<typeof AdminCustomerListItemSchema>

export const AdminCustomerAddressSchema = z.object({
  id: z.uuid(),
  customerId: z.uuid(),
  fullName: z.string().nullable(),
  company: z.string().nullable(),
  address1: z.string(),
  address2: z.string().nullable(),
  city: z.string(),
  province: z.string().nullable(),
  regionCode: z.string().nullable(),
  postalCode: z.string().nullable(),
  countryCode: z.string(),
  phone: z.string().nullable(),
  isDefault: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
})

export type AdminCustomerAddress = z.infer<typeof AdminCustomerAddressSchema>

export const AdminCustomerDetailSchema = z.object({
  ...customerBase,
  countryCode: z.string().nullable(),
  countryName: z.string().nullable(),
  timezone: z.string().nullable(),
  marketingConsentAt: z.string().nullable(),
  marketingConsentSource: z.enum(MARKETING_CONSENT_SOURCES).nullable(),
  note: z.string().nullable(),
  account: z
    .object({
      email: z.email(),
      lastLoginAt: z.string().nullable(),
      createdAt: z.string(),
    })
    .nullable(),
  addresses: z.array(AdminCustomerAddressSchema),
})

export type AdminCustomerDetail = z.infer<typeof AdminCustomerDetailSchema>

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a full date')

const optionalCount = z.number().int('Use a whole number').min(0).max(100_000).optional()

const optionalAmount = z.number().min(0).max(1_000_000_000).optional()

/**
 * Customer list filters that a saved segment holds. Empty filters are
 * left out (undefined) so they don't reach the query string.
 */
const SegmentFiltersObjectSchema = z.object({
  tags: z.array(z.string().max(MAX_CUSTOMER_TAG_LENGTH)).max(MAX_CUSTOMER_TAGS).optional(),
  marketing: z.enum(['subscribed', 'not_subscribed']).optional(),
  countryCode: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .optional(),
  ordersMin: optionalCount,
  ordersMax: optionalCount,
  spentCurrency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .optional(),
  spentMin: optionalAmount,
  spentMax: optionalAmount,
  lastOrderFrom: ymd.optional(),
  lastOrderTo: ymd.optional(),
})

export const AdminCustomerSegmentFiltersSchema = SegmentFiltersObjectSchema.superRefine(
  (filters, ctx) => {
    if (
      (filters.spentMin !== undefined || filters.spentMax !== undefined) &&
      !filters.spentCurrency
    ) {
      ctx.addIssue({ code: 'custom', path: ['spentCurrency'], message: 'Choose a currency' })
    }
    const ranges = [
      ['ordersMin', 'ordersMax', 'Must be at least the minimum'],
      ['spentMin', 'spentMax', 'Must be at least the minimum'],
    ] as const
    for (const [min, max, message] of ranges) {
      const low = filters[min]
      const high = filters[max]
      if (low !== undefined && high !== undefined && high < low) {
        ctx.addIssue({ code: 'custom', path: [max], message })
      }
    }
    if (
      filters.lastOrderFrom &&
      filters.lastOrderTo &&
      filters.lastOrderTo < filters.lastOrderFrom
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['lastOrderTo'],
        message: 'Must be after the start date',
      })
    }
  }
)

export type AdminCustomerSegmentFilters = z.infer<typeof AdminCustomerSegmentFiltersSchema>

export const AdminCustomersListQuerySchema = z.object({
  q: z.string(),
  status: AdminCustomerStatusFilterSchema,
  sort: AdminCustomersSortKeySchema,
  direction: z.enum(['asc', 'desc']),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
  ...SegmentFiltersObjectSchema.shape,
})

export type AdminCustomersListQuery = z.infer<typeof AdminCustomersListQuerySchema>

export const AdminCustomersListResponseSchema = paginatedResponse(AdminCustomerListItemSchema)

export const AdminCustomerResponseSchema = z.object({ data: AdminCustomerDetailSchema })

export const AdminCustomerAddressResponseSchema = z.object({ data: AdminCustomerAddressSchema })

export const AdminCustomerAddressDeleteResponseSchema = z.null()

export const AdminCustomerFormSchema = z.object({
  fullName: z.string().trim().max(255).nullable(),
  email: z.email('Enter a valid email address').max(254),
  phone: z.string().trim().max(32).nullable(),
  countryCode: z
    .string()
    .regex(/^[A-Z]{2}$/, 'Choose a country')
    .nullable(),
  timezone: z.string().max(64).nullable(),
})

export type AdminCustomerForm = z.infer<typeof AdminCustomerFormSchema>

export const AdminCustomerLocationOptionsSchema = z.object({
  countries: z.array(
    z.object({ code: z.string(), name: z.string(), timezones: z.array(z.string()) })
  ),
  timezones: z.array(z.string()),
})

export type AdminCustomerLocationOptions = z.infer<typeof AdminCustomerLocationOptionsSchema>

export const AdminCustomerLocationOptionsResponseSchema = z.object({
  data: AdminCustomerLocationOptionsSchema,
})

export const AdminCustomerAddressFormSchema = z
  .object({
    fullName: z.string().trim().max(255).nullable(),
    company: z.string().trim().max(255).nullable(),
    address1: z.string().trim().min(1, 'Enter the street address').max(255),
    address2: z.string().trim().max(255).nullable(),
    city: z.string().trim().min(1, 'Enter the city').max(100),
    province: z.string().trim().max(100).nullable(),
    regionCode: z.string().nullable(),
    postalCode: z.string().trim().max(20).nullable(),
    countryCode: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{2}$/, 'Use a 2-letter country code, like PH')
      .transform((value) => value.toUpperCase()),
    phone: z.string().trim().max(32).nullable(),
    isDefault: z.boolean(),
  })
  .superRefine(requireListedProvince)

export type AdminCustomerAddressForm = z.infer<typeof AdminCustomerAddressFormSchema>

export const MAX_IMPERSONATION_REASON_LENGTH = 500

export const AdminCustomerImpersonationFormSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Enter at least 5 characters')
    .max(MAX_IMPERSONATION_REASON_LENGTH),
})

export type AdminCustomerImpersonationForm = z.infer<typeof AdminCustomerImpersonationFormSchema>

export const AdminCustomerNotesFormSchema = z.object({
  tags: z
    .array(z.string().trim().min(1).max(MAX_CUSTOMER_TAG_LENGTH))
    .max(MAX_CUSTOMER_TAGS, `Use at most ${MAX_CUSTOMER_TAGS} tags`),
  note: z
    .string()
    .trim()
    .max(MAX_CUSTOMER_NOTE_LENGTH, `Keep the note under ${MAX_CUSTOMER_NOTE_LENGTH} characters`)
    .nullable(),
})

export type AdminCustomerNotesForm = z.infer<typeof AdminCustomerNotesFormSchema>

export const AdminCustomerMarketingFormSchema = z.object({ acceptsMarketing: z.boolean() })

export type AdminCustomerMarketingForm = z.infer<typeof AdminCustomerMarketingFormSchema>

export const AdminCustomerFilterOptionsSchema = z.object({
  tags: z.array(z.string()),
  countries: z.array(z.object({ code: z.string(), name: z.string() })),
  currencyCodes: z.array(z.string()),
})

export type AdminCustomerFilterOptions = z.infer<typeof AdminCustomerFilterOptionsSchema>

export const AdminCustomerFilterOptionsResponseSchema = z.object({
  data: AdminCustomerFilterOptionsSchema,
})

export const AdminCustomerSegmentSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  filters: z.object({
    tags: z.array(z.string()),
    marketing: z.enum(['subscribed', 'not_subscribed']).nullable(),
    countryCode: z.string().nullable(),
    ordersMin: z.number().nullable(),
    ordersMax: z.number().nullable(),
    spentCurrency: z.string().nullable(),
    spentMin: z.number().nullable(),
    spentMax: z.number().nullable(),
    lastOrderFrom: z.string().nullable(),
    lastOrderTo: z.string().nullable(),
  }),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
})

export type AdminCustomerSegment = z.infer<typeof AdminCustomerSegmentSchema>

export const AdminCustomerSegmentsResponseSchema = z.object({
  data: z.array(AdminCustomerSegmentSchema),
})

export const AdminCustomerSegmentResponseSchema = z.object({ data: AdminCustomerSegmentSchema })

export const AdminCustomerSegmentDeleteResponseSchema = z.null()

export const AdminCustomerSegmentFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name the segment')
    .max(MAX_CUSTOMER_SEGMENT_NAME_LENGTH, 'Use a shorter name'),
  filters: AdminCustomerSegmentFiltersSchema,
})

export type AdminCustomerSegmentForm = z.infer<typeof AdminCustomerSegmentFormSchema>
