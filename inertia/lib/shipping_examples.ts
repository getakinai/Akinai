/**
 * Example text for the shipping zone screens, tailored to the store's
 * country of operation. Countries without an entry get neutral examples.
 */
export type ShippingExamples = {
  /** Placeholder for a new zone's name. */
  zoneName: string
  /** Finishes "Charge a different price for part of a country, e.g. …". */
  regionGroups: string
  /** Placeholder for the province search. */
  regionSearch: string
}

const NEUTRAL: ShippingExamples = {
  zoneName: 'Domestic',
  regionGroups: 'one state or province',
  regionSearch: 'Name or code',
}

const BY_COUNTRY: Readonly<Record<string, ShippingExamples>> = {
  PH: {
    zoneName: 'Philippines – Metro Manila',
    regionGroups: 'Metro Manila, the rest of Luzon, Visayas or Mindanao',
    regionSearch: 'Cebu, Visayas, NCR…',
  },
}

export function shippingExamplesFor(countryCode: string | null | undefined): ShippingExamples {
  return (countryCode && BY_COUNTRY[countryCode.toUpperCase()]) || NEUTRAL
}
