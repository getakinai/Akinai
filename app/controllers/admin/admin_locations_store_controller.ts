import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import LocationService from '#services/location_service'
import LocationTransformer from '#transformers/location_transformer'
import { adminLocationStoreValidator } from '#validators/admin_location_store_validator'

@inject()
export default class AdminLocationsStoreController {
  constructor(protected locationService: LocationService) {}

  async handle(ctx: HttpContext) {
    const { name, addressLine, city, country } = await ctx.request.validateUsing(
      adminLocationStoreValidator
    )
    const location = await this.locationService.create({ name, addressLine, city, country })

    ctx.response.status(201)
    return ctx.serialize(LocationTransformer.transform(location))
  }
}
