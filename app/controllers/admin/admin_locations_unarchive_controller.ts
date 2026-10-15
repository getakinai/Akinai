import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import LocationPolicy from '#policies/location_policy'
import LocationService from '#services/location_service'
import LocationTransformer from '#transformers/location_transformer'

@inject()
export default class AdminLocationsUnarchiveController {
  constructor(protected locationService: LocationService) {}

  async handle(ctx: HttpContext) {
    const location = await this.locationService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(LocationPolicy).authorize('unarchive', location)

    const restored = await this.locationService.unarchive(location)

    return ctx.serialize(LocationTransformer.transform(restored))
  }
}
