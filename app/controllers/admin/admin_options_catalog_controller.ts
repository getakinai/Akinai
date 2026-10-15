import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OptionDefinitionService from '#services/option_definition_service'
import OptionDefinitionTransformer from '#transformers/option_definition_transformer'

@inject()
export default class AdminOptionsCatalogController {
  constructor(protected optionDefinitionService: OptionDefinitionService) {}

  async handle(ctx: HttpContext) {
    const definitions = await this.optionDefinitionService.catalog()
    return ctx.serialize(OptionDefinitionTransformer.transform(definitions).useVariant('toCatalog'))
  }
}
