import { BaseTransformer } from '@adonisjs/core/transformers'
import type { AnalyticsDashboard } from '#services/analytics_report_service'

/** Raw analytics numbers (amounts in the store currency, percents 0–100); the page formats them. */
export default class AnalyticsDashboardTransformer extends BaseTransformer<AnalyticsDashboard> {
  toObject() {
    const { range, money, cards, salesBySource, sessionsByDevice, topProducts, funnel, notes } =
      this.resource
    return { range, money, cards, salesBySource, sessionsByDevice, topProducts, funnel, notes }
  }
}
