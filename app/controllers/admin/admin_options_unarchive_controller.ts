import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OptionDefinitionPolicy from '#policies/option_definition_policy'
import OptionDefinitionService from '#services/option_definition_service'
import OptionDefinitionTransformer from '#transformers/option_definition_transformer'

@inject()
export default class AdminOptionsUnarchiveController {
  constructor(protected optionDefinitionService: OptionDefinitionService) {}

  async handle(ctx: HttpContext) {
    const definition = await this.optionDefinitionService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(OptionDefinitionPolicy).authorize('unarchive', definition)

    const restored = await this.optionDefinitionService.unarchive(definition)
    const detail = await this.optionDefinitionService.findDetailOrFail(restored.id)
    return ctx.serialize(OptionDefinitionTransformer.transform(detail).useVariant('toDetail'))
  }
}
