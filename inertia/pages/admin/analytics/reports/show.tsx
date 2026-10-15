import { useEffect, useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft, FileSpreadsheet, FileText, RotateCw } from 'lucide-react'
import { toast } from 'sonner'
import { BarTrendChart, FunnelBars, LineTrendChart } from '~/components/charts'
import { DataTable, type DataTableColumn } from '~/components/data_table'
import { FormButton } from '~/components/form'
import Page from '~/components/page'
import { Skeleton } from '~/components/ui'
import AdminLayout from '~/layouts/admin'
import { HttpError } from '~/lib/http'
import { card, cn } from '~/lib/styles'
import { useCan } from '../../_hooks'
import { trendText } from '../../dashboard/_tones'
import DateRangeControl from '../_date_range_control'
import {
  axisFormatter,
  changeText,
  chartData,
  chartSeries,
  formatMetric,
  rangeText,
} from '../_format'
import { useAdminAnalyticsReport, useExportAdminAnalyticsReport } from '../_hooks'
import AnalyticsNotes from '../_notes'
import type { AnalyticsExportFormat, AnalyticsReport, AnalyticsRow } from '../_types'
import { useAnalyticsQuery, type AnalyticsShellProps } from '../_use_analytics_query'
import { useRecentReports } from './_recent'

type IndexedRow = AnalyticsRow & { __index: number }

function ReportChart({ report }: { report: AnalyticsReport }) {
  const chart = report.chart
  if (!chart || chart.points.length === 0) return null
  const primary = chart.series[0]
  const formatValue = axisFormatter(primary?.format ?? 'number', report.money)

  if (chart.type === 'funnel') {
    const first = chart.points[0]?.values[primary.key] ?? 0
    return (
      <FunnelBars
        steps={chart.points.map((point) => {
          const value = point.values[primary.key] ?? 0
          return {
            label: point.label,
            value,
            percent: first > 0 ? Math.round((value / first) * 1000) / 10 : 0,
            previousValue: point.previous?.[primary.key] ?? null,
          }
        })}
      />
    )
  }

  const withPrevious = chart.points.some((point) => point.previous !== null)
  const data = chartData(chart.points)
  const series = chartSeries(chart.series, withPrevious)

  if (chart.type === 'line') {
    return (
      <LineTrendChart
        label={report.title}
        data={data}
        xKey="label"
        series={series}
        formatValue={formatValue}
        height={280}
      />
    )
  }

  const ranked =
    !withPrevious && chart.series.length === 1 && !report.columns.some((c) => c.key === 'period')
  return (
    <BarTrendChart
      label={report.title}
      data={data}
      xKey="label"
      series={series}
      formatValue={formatValue}
      horizontal={ranked}
      height={ranked ? Math.max(180, chart.points.length * 34) : 280}
    />
  )
}

function ReportBody({ report }: { report: AnalyticsReport }) {
  const columns: DataTableColumn<IndexedRow>[] = report.columns.map((column, index) => ({
    key: column.key,
    header: column.label,
    align: column.format === 'text' ? 'left' : 'right',
    cell: (row) => {
      const currency = column.currencyKey ? row[column.currencyKey] : null
      const text = formatMetric(
        row[column.key] ?? null,
        column.format,
        report.money,
        typeof currency === 'string' ? currency : null
      )
      return index === 0 ? (
        <span className="font-medium text-ink">{text}</span>
      ) : (
        <span className="tabular-nums">{text}</span>
      )
    },
  }))
  const rows: IndexedRow[] = report.rows.map((row, index) => ({ ...row, __index: index }))

  return (
    <div className="flex flex-col gap-5">
      <AnalyticsNotes notes={report.notes} />

      {report.summary.length > 0 && (
        <section
          aria-label="Summary"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {report.summary.map((metric) => (
            <div key={metric.key} className={cn(card.base, 'flex flex-col gap-2')}>
              <span className="text-[13px] font-medium text-muted">{metric.label}</span>
              <span className="text-[24px] leading-none font-semibold tracking-[-0.02em] tabular-nums break-words">
                {formatMetric(metric.value, metric.format, report.money)}
              </span>
              {metric.change && (
                <span className="text-[12.5px] text-muted">
                  <span className={trendText[metric.change.trend]}>
                    {changeText(metric.change)}
                  </span>{' '}
                  vs {formatMetric(metric.previous, metric.format, report.money)}
                </span>
              )}
            </div>
          ))}
        </section>
      )}

      {report.chart && report.chart.points.length > 0 && (
        <section className={card.base} aria-label="Chart">
          <ReportChart report={report} />
        </section>
      )}

      <section className={cn(card.base, 'p-0! pt-2!')}>
        <DataTable
          label={report.title}
          rows={rows}
          columns={columns}
          getRowId={(row) => String(row.__index)}
          emptySlot="No data for this period."
        />
      </section>
    </div>
  )
}

export default function AdminAnalyticsReportsShow(
  props: AnalyticsShellProps & { reportKey: string }
) {
  const { query, setQuery } = useAnalyticsQuery(
    props,
    `/admin/analytics/reports/${encodeURIComponent(props.reportKey)}`
  )
  const report = useAdminAnalyticsReport(props.reportKey, query)
  const data = report.data
  const { remember } = useRecentReports()
  const loadedKey = data?.key

  useEffect(() => {
    if (loadedKey) remember(loadedKey)
  }, [loadedKey, remember])

  const canExport = useCan('analytics.export')
  const exportReport = useExportAdminAnalyticsReport(props.reportKey)
  const [exporting, setExporting] = useState<AnalyticsExportFormat | null>(null)

  function download(format: AnalyticsExportFormat) {
    setExporting(format)
    exportReport.mutate(
      { query, format },
      {
        onError: (error) =>
          toast.error(error instanceof HttpError ? error.message : 'Could not download the report'),
        onSettled: () => setExporting(null),
      }
    )
  }

  return (
    <Page
      eyebrow={
        <Link
          route="admin.analytics.reports.home"
          className="inline-flex items-center gap-1 hover:text-ink"
        >
          <ArrowLeft size={12} /> Reports
        </Link>
      }
      title={data?.title ?? 'Report'}
      description={
        data
          ? data.ignoresRange
            ? data.description
            : `${data.description} ${rangeText(data.range)}.`
          : undefined
      }
      actions={
        canExport ? (
          <>
            <FormButton
              type="button"
              variant="secondary"
              size="sm"
              disabled={!data || exportReport.isPending}
              loading={exporting === 'csv'}
              loadingText="Preparing…"
              onClick={() => download('csv')}
            >
              <FileSpreadsheet size={14} /> Download CSV
            </FormButton>
            <FormButton
              type="button"
              variant="secondary"
              size="sm"
              disabled={!data || exportReport.isPending}
              loading={exporting === 'pdf'}
              loadingText="Preparing…"
              onClick={() => download('pdf')}
            >
              <FileText size={14} /> Download PDF
            </FormButton>
          </>
        ) : undefined
      }
    >
      <div className="mb-5">
        <DateRangeControl value={query} onChange={setQuery} disabled={data?.ignoresRange} />
      </div>

      {report.isPending && (
        <div className="flex flex-col gap-5" aria-busy="true">
          <Skeleton className="h-24 w-full rounded-card" />
          <Skeleton className="h-72 w-full rounded-card" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      )}

      {report.isError && !data && (
        <section className={cn(card.base, 'flex flex-wrap items-center justify-between gap-4')}>
          <p className="text-[14px] text-muted">We couldn’t load this report.</p>
          <FormButton type="button" variant="secondary" size="sm" onClick={() => report.refetch()}>
            <RotateCw size={14} /> Try again
          </FormButton>
        </section>
      )}

      {data && (
        <div
          className={cn(
            'transition-opacity duration-200',
            report.isPlaceholderData && 'opacity-60'
          )}
        >
          <ReportBody report={data} />
        </div>
      )}
    </Page>
  )
}

AdminAnalyticsReportsShow.layout = [AdminLayout]
