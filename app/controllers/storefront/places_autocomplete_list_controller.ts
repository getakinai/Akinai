import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import GooglePlacesService from '#services/google_places_service'
import PlaceSuggestionTransformer from '#transformers/place_suggestion_transformer'
import { placesAutocompleteQueryValidator } from '#validators/places_autocomplete_query_validator'

@inject()
export default class PlacesAutocompleteListController {
  constructor(protected googlePlacesService: GooglePlacesService) {}

  async handle(ctx: HttpContext) {
    const { input, sessionToken, countryCode } = await ctx.request.validateUsing(
      placesAutocompleteQueryValidator,
      { data: ctx.request.qs() }
    )
    const suggestions = await this.googlePlacesService.autocomplete(
      input,
      sessionToken,
      countryCode
    )
    return ctx.serialize(PlaceSuggestionTransformer.transform(suggestions))
  }
}
