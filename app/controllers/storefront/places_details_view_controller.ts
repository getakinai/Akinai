import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import GooglePlacesService from '#services/google_places_service'
import PlaceAddressTransformer from '#transformers/place_address_transformer'
import { placesDetailsQueryValidator } from '#validators/places_details_query_validator'

@inject()
export default class PlacesDetailsViewController {
  constructor(protected googlePlacesService: GooglePlacesService) {}

  async handle(ctx: HttpContext) {
    const { params, sessionToken } = await ctx.request.validateUsing(placesDetailsQueryValidator, {
      data: { ...ctx.request.qs(), params: ctx.params },
    })
    const address = await this.googlePlacesService.details(params.placeId, sessionToken)
    if (!address) return { data: null }
    return ctx.serialize(PlaceAddressTransformer.transform(address))
  }
}
