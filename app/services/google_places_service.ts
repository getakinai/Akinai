import logger from '@adonisjs/core/services/logger'
import env from '#start/env'

const PLACES_API_URL = 'https://places.googleapis.com/v1'
const REQUEST_TIMEOUT_MS = 5000
const MAX_SUGGESTIONS = 5

export type PlaceSuggestion = {
  placeId: string
  description: string
  mainText: string
}

export type PlaceAddress = {
  address1: string
  address2: string | null
  suburb: string | null
  city: string | null
  region: string | null
  postalCode: string | null
  countryCode: string | null
}

export type GoogleAddressComponent = {
  longText?: string
  shortText?: string
  types?: string[]
}

type AutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string
      text?: { text?: string }
      structuredFormat?: { mainText?: { text?: string } }
    }
  }>
}

type DetailsResponse = {
  addressComponents?: GoogleAddressComponent[]
}

/**
 * Maps Google `addressComponents` onto the app's address fields. Exported
 * for unit tests.
 */
export function mapAddressComponents(components: GoogleAddressComponent[]): PlaceAddress {
  const find = (type: string) => components.find((component) => component.types?.includes(type))
  const long = (...types: string[]) => {
    for (const type of types) {
      const value = find(type)?.longText?.trim()
      if (value) return value
    }
    return null
  }

  const street = [long('street_number'), long('route')].filter(Boolean).join(' ')
  const premise = long('premise')

  return {
    address1: street || premise || '',
    address2: long('subpremise'),
    suburb: long('sublocality_level_1', 'sublocality', 'neighborhood'),
    city: long('locality', 'postal_town', 'administrative_area_level_2'),
    region: long('administrative_area_level_1'),
    postalCode: long('postal_code'),
    countryCode: find('country')?.shortText?.trim().toUpperCase() || null,
  }
}

/**
 * Server-side proxy to the Google Places API (New), so the API key never
 * reaches the browser. Failures soft-fail to empty results.
 */
export default class GooglePlacesService {
  protected apiKey(): string | null {
    return env.get('GOOGLE_AUTOCOMPLETE_ADDRESS_API_KEY')?.release() || null
  }

  isEnabled(): boolean {
    return this.apiKey() !== null
  }

  async autocomplete(
    input: string,
    sessionToken: string,
    countryCode?: string | null
  ): Promise<PlaceSuggestion[]> {
    const apiKey = this.apiKey()
    if (!apiKey) return []

    try {
      const response = await fetch(`${PLACES_API_URL}/places:autocomplete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask':
            'suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text',
        },
        body: JSON.stringify({
          input,
          sessionToken,
          ...(countryCode ? { includedRegionCodes: [countryCode.toLowerCase()] } : {}),
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })

      if (!response.ok) {
        logger.warn({ status: response.status }, 'Google Places autocomplete failed')
        return []
      }

      const payload = (await response.json()) as AutocompleteResponse
      const suggestions: PlaceSuggestion[] = []
      for (const suggestion of payload.suggestions ?? []) {
        const prediction = suggestion.placePrediction
        const placeId = prediction?.placeId
        const description = prediction?.text?.text
        if (!placeId || !description) continue
        suggestions.push({
          placeId,
          description,
          mainText: prediction?.structuredFormat?.mainText?.text ?? description,
        })
      }
      return suggestions.slice(0, MAX_SUGGESTIONS)
    } catch (error) {
      logger.warn({ err: error }, 'Google Places autocomplete request errored')
      return []
    }
  }

  async details(placeId: string, sessionToken: string): Promise<PlaceAddress | null> {
    const apiKey = this.apiKey()
    if (!apiKey) return null

    try {
      const url = new URL(`${PLACES_API_URL}/places/${encodeURIComponent(placeId)}`)
      url.searchParams.set('sessionToken', sessionToken)

      const response = await fetch(url, {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'addressComponents',
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })

      if (!response.ok) {
        logger.warn({ status: response.status }, 'Google Places details failed')
        return null
      }

      const payload = (await response.json()) as DetailsResponse
      if (!payload.addressComponents?.length) return null
      return mapAddressComponents(payload.addressComponents)
    } catch (error) {
      logger.warn({ err: error }, 'Google Places details request errored')
      return null
    }
  }
}
