import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OptionDefinitionPolicy from '#policies/option_definition_policy'
import OptionDefinitionService from '#services/option_definition_service'
import OptionDefinitionValueTransformer from '#transformers/option_definition_value_transformer'
import { adminOptionDefinitionValueStoreValidator } from '#validators/admin_option_definition_value_store_validator'

@inject()
export default class AdminOptionValuesStoreController {
  constructor(protected optionDefinitionService: OptionDefinitionService) {}

  async handle(ctx: HttpContext) {
    const definition = await this.optionDefinitionService.findOrFail(ctx.params.id)
    await ctx.bouncer.with(OptionDefinitionPolicy).authorize('createValue', definition)

    const { value } = await ctx.request.validateUsing(adminOptionDefinitionValueStoreValidator, {
      meta: { definitionId: definition.id },
    })
    const entry = await this.optionDefinitionService.addValue(definition.id, value)

    ctx.response.status(201)
    return ctx.serialize(OptionDefinitionValueTransformer.transform(entry))
  }
}
