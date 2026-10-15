import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import type { AnalyticsExportFormat } from '#constants/analytics'
import type { AnalyticsReportKey } from '#constants/analytics_reports'
import { renderAnalyticsReportPdf } from '#documents/analytics_report_pdf'
import type User from '#models/user'
import AnalyticsReportService, {
  type AnalyticsColumn,
  type AnalyticsReport,
} from '#services/analytics_report_service'
import AuditLogService from '#services/audit_log_service'
import StoreSettingService from '#services/store_setting_service'
import { csvAnalyticsValue, formatAnalyticsValue } from '#utils/analytics_format'
import type { AnalyticsRangeInput } from '#utils/analytics_range'
import { toCsv } from '#utils/csv'

export type AnalyticsReportFile = {
  filename: string
  contentType: string
  body: string | Buffer
}

const CSV_UNITS: Partial<Record<AnalyticsColumn['format'], (currency: string) => string>> = {
  money: (currency) => currency,
  percent: () => '%',
  hours: () => 'hours',
}

const day = (value: string) => DateTime.fromISO(value).toFormat('d LLL yyyy')

/** Downloads of the prebuilt analytics reports as CSV (raw values) or PDF (formatted). */
@inject()
export default class AnalyticsReportExportService {
  constructor(
    protected analyticsReportService: AnalyticsReportService,
    protected storeSettingService: StoreSettingService,
    protected auditLogService: AuditLogService
  ) {}

  async export(
    key: AnalyticsReportKey,
    input: AnalyticsRangeInput,
    format: AnalyticsExportFormat,
    actor: { user: User; ipAddress: string | null }
  ): Promise<AnalyticsReportFile> {
    const [report, settings] = await Promise.all([
      this.analyticsReportService.report(key, input),
      this.storeSettingService.get(),
    ])

    await this.auditLogService.recordSecurityEvent('analytics_report_exported', actor.user, {
      ipAddress: actor.ipAddress,
      details: {
        report: key,
        format,
        from: report.ignoresRange ? null : report.range.from,
        to: report.ignoresRange ? null : report.range.to,
        rows: report.rows.length,
      },
    })

    const stem = report.ignoresRange
      ? `${key}-${DateTime.now().setZone(settings.timezone).toISODate()}`
      : `${key}-${report.range.from}-to-${report.range.to}`

    if (format === 'csv') {
      return {
        filename: `${stem}.csv`,
        contentType: 'text/csv; charset=utf-8',
        body: this.toCsv(report),
      }
    }

    const generatedAt = DateTime.now()
      .setZone(settings.timezone)
      .setLocale(settings.locale)
      .toFormat("d LLL yyyy 'at' HH:mm ZZZZ")
    const buffer = await renderAnalyticsReportPdf({
      storeName: settings.storeName,
      title: report.title,
      description: report.description,
      rangeText: this.rangeText(report),
      generatedText: `Generated ${generatedAt}`,
      summary: report.summary.map((metric) => ({
        label: metric.label,
        value: formatAnalyticsValue(metric.value, metric.format, report.money),
        detail:
          metric.previous === null
            ? null
            : `vs ${formatAnalyticsValue(metric.previous, metric.format, report.money)}${
                metric.change?.percent !== null && metric.change?.percent !== undefined
                  ? ` (${metric.change.percent > 0 ? '+' : ''}${metric.change.percent}%)`
                  : ''
              }`,
      })),
      notes: report.notes,
      columns: report.columns.map((column) => ({
        label: column.label,
        align: column.format === 'text' ? 'left' : 'right',
      })),
      rows: report.rows.map((row) =>
        report.columns.map((column) => {
          const currency = column.currencyKey ? row[column.currencyKey] : null
          return formatAnalyticsValue(
            row[column.key],
            column.format,
            report.money,
            typeof currency === 'string' ? currency : null
          )
        })
      ),
    })
    return { filename: `${stem}.pdf`, contentType: 'application/pdf', body: buffer }
  }

  /** One header row, then the report rows as plain values (money to cents, no symbols). */
  protected toCsv(report: AnalyticsReport): string {
    const mixedCurrency = report.columns.some((column) => column.currencyKey)
    const columns = report.columns.map((column) => {
      const unit = column.currencyKey ? null : CSV_UNITS[column.format]?.(report.money.currencyCode)
      return { ...column, header: unit ? `${column.label} (${unit})` : column.label }
    })
    const currencyKey = report.columns.find((column) => column.currencyKey)?.currencyKey
    const headers = [
      ...columns.map((column) => column.header),
      ...(mixedCurrency ? ['Currency'] : []),
    ]

    return toCsv(
      headers,
      report.rows.map((row) => {
        const cells: Record<string, string> = {}
        for (const column of columns) {
          cells[column.header] = csvAnalyticsValue(row[column.key], column.format)
        }
        if (mixedCurrency && currencyKey) cells.Currency = String(row[currencyKey] ?? '')
        return cells
      })
    )
  }

  protected rangeText(report: AnalyticsReport): string {
    if (report.ignoresRange) return 'Stock right now'
    const { from, to, previousFrom, previousTo } = report.range
    const current = from === to ? day(from) : `${day(from)} – ${day(to)}`
    if (!previousFrom || !previousTo) return current
    const previous =
      previousFrom === previousTo ? day(previousFrom) : `${day(previousFrom)} – ${day(previousTo)}`
    return `${current}, compared with ${previous}`
  }
}
