import { BaseTransformer } from '@adonisjs/core/transformers'
import type { AnalyticsReport } from '#services/analytics_report_service'

/** One prebuilt report: summary metrics, chart points, table columns and rows. */
export default class AnalyticsReportTransformer extends BaseTransformer<AnalyticsReport> {
  toObject() {
    const report = this.resource
    return {
      key: report.key,
      category: report.category,
      title: report.title,
      description: report.description,
      usesSessions: report.usesSessions,
      ignoresRange: report.ignoresRange,
      range: report.range,
      money: report.money,
      summary: report.summary,
      chart: report.chart,
      columns: report.columns,
      rows: report.rows,
      notes: report.notes,
    }
  }
}
