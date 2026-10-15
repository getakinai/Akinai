import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import LocationService from '#services/location_service'
import LocationTransformer from '#transformers/location_transformer'
import { adminLocationsListQueryValidator } from '#validators/admin_locations_list_query_validator'

@inject()
export default class AdminLocationsListController {
  constructor(protected locationService: LocationService) {}

  async handle(ctx: HttpContext) {
    const { q, status, sort, direction, page, perPage } = await ctx.request.validateUsing(
      adminLocationsListQueryValidator,
      { data: ctx.request.qs() }
    )
    const locations = await this.locationService.paginate({
      q,
      status,
      sort,
      direction,
      page,
      perPage,
    })

    return ctx.serialize(LocationTransformer.paginate(locations.all(), locations.getMeta()))
  }
}
