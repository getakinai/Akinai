import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OptionDefinitionService from '#services/option_definition_service'
import OptionDefinitionTransformer from '#transformers/option_definition_transformer'
import { adminOptionDefinitionsListQueryValidator } from '#validators/admin_option_definitions_list_query_validator'

@inject()
export default class AdminOptionsListController {
  constructor(protected optionDefinitionService: OptionDefinitionService) {}

  async handle(ctx: HttpContext) {
    const query = await ctx.request.validateUsing(adminOptionDefinitionsListQueryValidator, {
      data: ctx.request.qs(),
    })
    const page = await this.optionDefinitionService.paginate({
      q: query.q,
      status: query.status,
      sort: query.sort ?? 'name',
      direction: query.direction ?? 'asc',
      page: query.page ?? 1,
      perPage: query.perPage ?? 15,
    })

    return ctx.serialize(
      OptionDefinitionTransformer.paginate(page.all(), page.getMeta()).useVariant('toObject')
    )
  }
}
