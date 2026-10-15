import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OptionDefinitionService from '#services/option_definition_service'
import OptionDefinitionTransformer from '#transformers/option_definition_transformer'

@inject()
export default class AdminOptionsViewController {
  constructor(protected optionDefinitionService: OptionDefinitionService) {}

  async handle(ctx: HttpContext) {
    const definition = await this.optionDefinitionService.findDetailOrFail(ctx.params.id)
    return ctx.serialize(OptionDefinitionTransformer.transform(definition).useVariant('toDetail'))
  }
}
