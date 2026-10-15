import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import HelpCenterService from '#services/help_center_service'
import HelpCenterHomeTransformer from '#transformers/help_center_home_transformer'

@inject()
export default class StorefrontHelpCategoriesListController {
  constructor(protected helpCenterService: HelpCenterService) {}

  async handle(ctx: HttpContext) {
    const home = await this.helpCenterService.home()
    return ctx.serialize(HelpCenterHomeTransformer.transform(home))
  }
}
