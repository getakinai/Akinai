import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OptionDefinitionPolicy from '#policies/option_definition_policy'
import OptionDefinitionService from '#services/option_definition_service'
import OptionDefinitionTransformer from '#transformers/option_definition_transformer'
import { adminOptionDefinitionStoreValidator } from '#validators/admin_option_definition_store_validator'

@inject()
export default class AdminOptionsStoreController {
  constructor(protected optionDefinitionService: OptionDefinitionService) {}

  async handle(ctx: HttpContext) {
    await ctx.bouncer.with(OptionDefinitionPolicy).authorize('create')

    const { name } = await ctx.request.validateUsing(adminOptionDefinitionStoreValidator)
    const created = await this.optionDefinitionService.create(name)
    const detail = await this.optionDefinitionService.findDetailOrFail(created.id)

    ctx.response.status(201)
    return ctx.serialize(OptionDefinitionTransformer.transform(detail).useVariant('toDetail'))
  }
}
