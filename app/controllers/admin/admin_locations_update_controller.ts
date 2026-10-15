import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import LocationPolicy from '#policies/location_policy'
import LocationService from '#services/location_service'
import LocationTransformer from '#transformers/location_transformer'
import { adminLocationUpdateValidator } from '#validators/admin_location_update_validator'

@inject()
export default class AdminLocationsUpdateController {
  constructor(protected locationService: LocationService) {}

  async handle(ctx: HttpContext) {
    const location = await this.locationService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(LocationPolicy).authorize('update')

    const { name, addressLine, city, country } = await ctx.request.validateUsing(
      adminLocationUpdateValidator,
      { meta: { locationId: location.id } }
    )
    const updated = await this.locationService.update(location, {
      name,
      addressLine,
      city,
      country,
    })

    return ctx.serialize(LocationTransformer.transform(updated))
  }
}
