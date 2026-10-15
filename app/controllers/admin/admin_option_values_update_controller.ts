import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OptionDefinitionPolicy from '#policies/option_definition_policy'
import OptionDefinitionService from '#services/option_definition_service'
import OptionDefinitionValueTransformer from '#transformers/option_definition_value_transformer'
import { adminOptionDefinitionValueUpdateValidator } from '#validators/admin_option_definition_value_update_validator'

@inject()
export default class AdminOptionValuesUpdateController {
  constructor(protected optionDefinitionService: OptionDefinitionService) {}

  async handle(ctx: HttpContext) {
    const definition = await this.optionDefinitionService.findOrFail(ctx.params.id)
    const entry = await this.optionDefinitionService.findValueForDefinitionOrFail(
      definition.id,
      ctx.params.valueId
    )
    await ctx.bouncer.with(OptionDefinitionPolicy).authorize('updateValue', definition)

    const { value } = await ctx.request.validateUsing(adminOptionDefinitionValueUpdateValidator, {
      meta: { definitionId: definition.id, valueId: entry.id },
    })
    const updated = await this.optionDefinitionService.updateValue(entry, value)

    return ctx.serialize(OptionDefinitionValueTransformer.transform(updated))
  }
}
