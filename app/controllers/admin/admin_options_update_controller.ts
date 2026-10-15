import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OptionDefinitionPolicy from '#policies/option_definition_policy'
import OptionDefinitionService from '#services/option_definition_service'
import OptionDefinitionTransformer from '#transformers/option_definition_transformer'
import { adminOptionDefinitionUpdateValidator } from '#validators/admin_option_definition_update_validator'

@inject()
export default class AdminOptionsUpdateController {
  constructor(protected optionDefinitionService: OptionDefinitionService) {}

  async handle(ctx: HttpContext) {
    const definition = await this.optionDefinitionService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(OptionDefinitionPolicy).authorize('update', definition)

    const { name } = await ctx.request.validateUsing(adminOptionDefinitionUpdateValidator, {
      meta: { definitionId: definition.id },
    })
    const updated = await this.optionDefinitionService.update(definition, name)
    const detail = await this.optionDefinitionService.findDetailOrFail(updated.id)

    return ctx.serialize(OptionDefinitionTransformer.transform(detail).useVariant('toDetail'))
  }
}
