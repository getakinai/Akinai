import { z } from 'zod'
import { http } from '~/lib/http'
import { toQueryString } from '~/lib/query_string'

export const PLACES_MIN_CHARS = 3
export const PLACES_DEBOUNCE_MS = 250

export const PlaceSuggestionSchema = z.object({
  placeId: z.string(),
  description: z.string(),
  mainText: z.string(),
})

export const PlaceAddressSchema = z.object({
  address1: z.string(),
  address2: z.string().nullable(),
  suburb: z.string().nullable(),
  city: z.string().nullable(),
  region: z.string().nullable(),
  postalCode: z.string().nullable(),
  countryCode: z.string().nullable(),
})

const PlaceSuggestionsResponseSchema = z.object({ data: z.array(PlaceSuggestionSchema) })
const PlaceAddressResponseSchema = z.object({ data: PlaceAddressSchema.nullable() })

export type PlaceSuggestion = z.infer<typeof PlaceSuggestionSchema>
export type PlaceAddress = z.infer<typeof PlaceAddressSchema>

/** Groups autocomplete keystrokes and the final details lookup into one billed Google session. */
export function createPlacesSessionToken() {
  return crypto.randomUUID()
}

export async function fetchPlacesAutocomplete(
  input: string,
  sessionToken: string,
  countryCode: string | null | undefined,
  signal?: AbortSignal
): Promise<PlaceSuggestion[]> {
  const query = toQueryString({ input, sessionToken, countryCode })
  const response = await http(`/places/autocomplete${query}`, {
    schema: PlaceSuggestionsResponseSchema,
    signal,
  })
  return response.data
}

export async function fetchPlacesDetails(
  placeId: string,
  sessionToken: string
): Promise<PlaceAddress | null> {
  try {
    const response = await http(
      `/places/details/${encodeURIComponent(placeId)}${toQueryString({ sessionToken })}`,
      { schema: PlaceAddressResponseSchema }
    )
    return response.data
  } catch {
    return null
  }
}
