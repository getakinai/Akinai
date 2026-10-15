/**
 * Starting setup for stores that deliver to a given country, applied when
 * first-run setup picks that country (and by `yarn db:seed` once it is
 * set). Countries without a preset only get a primary market for that
 * country. Everything here can be changed in the back office afterwards.
 */
export type CountryPreset = {
  /** The first market becomes the primary market. */
  markets: {
    name: string
    currencyCode: string
    pricesIncludeTax: boolean
    countryCodes: string[]
  }[]
  taxRates: {
    name: string
    countryCode: string
    regionCode: string | null
    rate: number
    appliesToShipping: boolean
  }[]
  shippingZones: {
    name: string
    countryCodes: string[]
    regionCodes?: string[]
    rates: {
      name: string
      /** In the primary market's currency. */
      price: number
      /** Prices in other markets, by currency code. */
      marketPrices?: Record<string, number>
    }[]
  }[]
  /** Seed the development starter catalog (`starter_catalog_seeder`). */
  starterCatalog: boolean
}

/**
 * Philippines: shoppers in New Zealand and Australia send orders to
 * family in the Philippines.
 */
const PHILIPPINES: CountryPreset = {
  markets: [
    { name: 'New Zealand', currencyCode: 'NZD', pricesIncludeTax: true, countryCodes: ['NZ'] },
    { name: 'Australia', currencyCode: 'AUD', pricesIncludeTax: true, countryCodes: ['AU'] },
  ],
  taxRates: [
    { name: 'GST', countryCode: 'NZ', regionCode: null, rate: 15, appliesToShipping: true },
  ],
  shippingZones: [
    {
      name: 'Manila City',
      countryCodes: ['PH'],
      rates: [{ name: 'Standard delivery', price: 15, marketPrices: { AUD: 14 } }],
    },
  ],
  starterCatalog: true,
}

export const COUNTRY_PRESETS: Readonly<Record<string, CountryPreset>> = {
  PH: PHILIPPINES,
}

export function countryPresetFor(countryCode: string | null | undefined): CountryPreset | null {
  if (!countryCode) return null
  return COUNTRY_PRESETS[countryCode.toUpperCase()] ?? null
}
