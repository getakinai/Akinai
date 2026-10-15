import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OptionDefinitionPolicy from '#policies/option_definition_policy'
import OptionDefinitionService from '#services/option_definition_service'

@inject()
export default class AdminOptionValuesDeleteController {
  constructor(protected optionDefinitionService: OptionDefinitionService) {}

  async handle(ctx: HttpContext) {
    const definition = await this.optionDefinitionService.findOrFail(ctx.params.id)
    const entry = await this.optionDefinitionService.findValueForDefinitionOrFail(
      definition.id,
      ctx.params.valueId
    )
    await ctx.bouncer.with(OptionDefinitionPolicy).authorize('deleteValue', entry, definition)

    if (await this.optionDefinitionService.isValueInUse(entry.id)) {
      return ctx.response.status(422).json({
        errors: [{ message: 'Remove this value from every product before deleting it' }],
      })
    }

    await this.optionDefinitionService.deleteValue(entry)
    return ctx.response.noContent()
  }
}
