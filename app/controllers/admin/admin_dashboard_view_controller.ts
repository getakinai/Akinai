import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { DEFAULT_DASHBOARD_RANGE } from '#constants/dashboard'
import DashboardService from '#services/dashboard_service'
import DashboardTransformer from '#transformers/dashboard_transformer'
import { adminDashboardViewQueryValidator } from '#validators/admin_dashboard_view_query_validator'

@inject()
export default class AdminDashboardViewController {
  constructor(protected dashboardService: DashboardService) {}

  async handle(ctx: HttpContext) {
    const { range } = await ctx.request.validateUsing(adminDashboardViewQueryValidator, {
      data: ctx.request.qs(),
    })
    const overview = await this.dashboardService.overview(range ?? DEFAULT_DASHBOARD_RANGE)

    return ctx.serialize(DashboardTransformer.transform(overview))
  }
}
