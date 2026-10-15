import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import LocationPolicy from '#policies/location_policy'
import LocationService from '#services/location_service'
import LocationTransformer from '#transformers/location_transformer'

@inject()
export default class AdminLocationsArchiveController {
  constructor(protected locationService: LocationService) {}

  async handle(ctx: HttpContext) {
    const location = await this.locationService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(LocationPolicy).authorize('archive', location)

    const archived = await this.locationService.archive(location)

    return ctx.serialize(LocationTransformer.transform(archived))
  }
}
