import { useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import {
  ArrowLeft,
  ArrowRight,
  History,
  Lock,
  RotateCw,
  SearchX,
  type LucideIcon,
} from 'lucide-react'
import { DataTable, type DataTableColumn } from '~/components/data_table'
import { FormButton } from '~/components/form'
import Page from '~/components/page'
import { SearchInput, Skeleton } from '~/components/ui'
import AdminLayout from '~/layouts/admin'
import { timeAgo } from '~/lib/date'
import { card, cn, listToolbarSearch } from '~/lib/styles'
import { useAdminAnalyticsCatalog } from '../_hooks'
import type { AnalyticsCatalog } from '../_types'
import { categoryMeta, reportMeta, reportToneSoft, reportToneTile, type ReportTone } from './_meta'
import { useRecentReports } from './_recent'

type Category = AnalyticsCatalog['categories'][number]
type Report = Category['reports'][number]
type RecentRow = { key: string; title: string; category: string; viewedAt: string }

function IconTile({
  icon: Icon,
  tone,
  size = 'md',
}: {
  icon: LucideIcon
  tone: ReportTone
  size?: 'sm' | 'md'
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg text-white shadow-sm',
        reportToneTile[tone],
        size === 'md' ? 'size-9' : 'size-7'
      )}
    >
      <Icon size={size === 'md' ? 17 : 14} aria-hidden />
    </span>
  )
}

function ReportCard({ report, category }: { report: Report; category: string }) {
  const meta = reportMeta(report.key, category)
  return (
    <Link
      route="admin.analytics.reports.show"
      routeParams={{ key: report.key }}
      className={cn(
        card.base,
        'group flex h-full flex-col gap-3 transition-[box-shadow,border-color] hover:border-ink/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring'
      )}
    >
      <IconTile icon={meta.icon} tone={meta.tone} />
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{report.title}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">{report.description}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink">
          View report
          <ArrowRight
            size={14}
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-0.5"
          />
        </span>
        <span className="font-mono text-[10.5px] tracking-[0.08em] text-subtle uppercase">
          Created by {report.createdBy}
        </span>
      </div>
    </Link>
  )
}

function CategorySection({ category }: { category: Category }) {
  const meta = categoryMeta(category.key)
  const Icon = meta.icon
  return (
    <section id={`reports-${category.key}`} className="scroll-mt-24">
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <span
          className={cn(
            'inline-flex size-7 items-center justify-center rounded-md',
            reportToneSoft[meta.tone]
          )}
        >
          <Icon size={14} aria-hidden="true" />
        </span>
        <h2 className="text-[16px] font-semibold tracking-[-0.01em]">{category.label}</h2>
        <span className="font-mono text-[12px] text-subtle">{category.reports.length}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {category.reports.map((report) => (
          <ReportCard key={report.key} report={report} category={category.key} />
        ))}
      </div>
    </section>
  )
}

function ComingLater({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null
  return (
    <section>
      <div className="mb-3 flex items-center gap-2.5">
        <span className="inline-flex size-7 items-center justify-center rounded-md bg-line text-muted">
          <Lock size={14} aria-hidden="true" />
        </span>
        <h2 className="text-[16px] font-semibold tracking-[-0.01em]">Not available yet</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => {
          const meta = categoryMeta(category.key)
          const Icon = meta.icon
          return (
            <div
              key={category.key}
              className="flex items-start gap-3 rounded-card border border-dashed border-line-2 p-5"
            >
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-line text-muted">
                <Icon size={17} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="text-[14.5px] font-semibold text-ink-2">{category.label}</h3>
                <p className="mt-1 text-[13px] text-muted">
                  This store doesn’t have the data for these reports yet.
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function RecentReports({ rows }: { rows: RecentRow[] }) {
  if (rows.length === 0) return null

  const columns: DataTableColumn<RecentRow>[] = [
    {
      key: 'title',
      header: 'Report name',
      cell: (row) => {
        const meta = reportMeta(row.key, row.category)
        return (
          <Link
            route="admin.analytics.reports.show"
            routeParams={{ key: row.key }}
            className="inline-flex min-w-0 items-center gap-2.5 font-medium text-ink hover:underline"
          >
            <IconTile icon={meta.icon} tone={meta.tone} size="sm" />
            <span className="truncate">{row.title}</span>
          </Link>
        )
      },
    },
    {
      key: 'category',
      header: 'Category',
      cell: (row) => <span className="text-muted">{row.category}</span>,
    },
    {
      key: 'viewedAt',
      header: 'Last viewed',
      align: 'right',
      cell: (row) => <span className="text-muted">{timeAgo(row.viewedAt)}</span>,
    },
  ]

  return (
    <section className={cn(card.base, 'p-0!')}>
      <div className="flex items-start gap-3 px-5 pt-5 pb-3">
        <span
          className={cn(
            'inline-flex size-7 shrink-0 items-center justify-center rounded-md',
            reportToneSoft.ok
          )}
        >
          <History size={14} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Recently viewed</h2>
          <p className="mt-0.5 text-[13px] text-muted">
            Reports you opened recently on this device.
          </p>
        </div>
      </div>
      <DataTable
        label="Recently viewed reports"
        rows={rows}
        columns={columns}
        getRowId={(row) => row.key}
      />
    </section>
  )
}

export default function AdminAnalyticsReportsHome() {
  const catalog = useAdminAnalyticsCatalog()
  const { recent } = useRecentReports()
  const [search, setSearch] = useState('')
  const term = search.trim().toLowerCase()

  const allCategories = catalog.data?.categories ?? []
  const available = allCategories
    .filter((category) => category.available)
    .map((category) => ({
      ...category,
      reports: category.reports.filter(
        (report) =>
          !term ||
          report.title.toLowerCase().includes(term) ||
          report.description.toLowerCase().includes(term) ||
          category.label.toLowerCase().includes(term)
      ),
    }))
    .filter((category) => category.reports.length > 0)
  const unavailable = term ? [] : allCategories.filter((category) => !category.available)

  const reportsByKey = new Map(
    allCategories.flatMap((category) =>
      category.reports.map((report) => [report.key, { report, category }] as const)
    )
  )
  const recentRows: RecentRow[] = recent.flatMap((item) => {
    const match = reportsByKey.get(item.key)
    return match
      ? [
          {
            key: item.key,
            title: match.report.title,
            category: match.category.label,
            viewedAt: item.viewedAt,
          },
        ]
      : []
  })
  const reportCount = allCategories.reduce((total, category) => total + category.reports.length, 0)

  return (
    <Page
      eyebrow={
        <Link
          route="admin.analytics.home"
          className="inline-flex items-center gap-1 hover:text-ink"
        >
          <ArrowLeft size={12} /> Analytics
        </Link>
      }
      title="Reports"
      description="Review sales, traffic, customers and stock with reports created by the store."
    >
      <div className="mb-6 flex flex-col gap-3">
        <SearchInput
          label="Search reports"
          placeholder={reportCount ? `Search ${reportCount} reports…` : 'Search reports…'}
          value={search}
          onDebouncedChange={setSearch}
          className={listToolbarSearch}
        />
        {catalog.data && !term && (
          <nav
            aria-label="Report categories"
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
          >
            {available.map((category) => {
              const meta = categoryMeta(category.key)
              const Icon = meta.icon
              return (
                <a
                  key={category.key}
                  href={`#reports-${category.key}`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line-2 bg-card px-3 py-1.5 text-[12.5px] font-medium text-ink-2 transition-colors hover:border-ink/20 hover:text-ink"
                >
                  <Icon size={13} aria-hidden="true" className="text-muted" />
                  {category.label}
                </a>
              )
            })}
          </nav>
        )}
      </div>

      {catalog.isPending && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {[0, 1, 2, 3, 4, 5].map((key) => (
            <div key={key} className={cn(card.base, 'flex flex-col gap-3')}>
              <Skeleton className="size-9 rounded-lg" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      )}

      {catalog.isError && (
        <section className={cn(card.base, 'flex flex-wrap items-center justify-between gap-4')}>
          <p className="text-[14px] text-muted">We couldn’t load the reports.</p>
          <FormButton type="button" variant="secondary" size="sm" onClick={() => catalog.refetch()}>
            <RotateCw size={14} /> Try again
          </FormButton>
        </section>
      )}

      {catalog.data && (
        <div className="flex flex-col gap-9">
          {!term && <RecentReports rows={recentRows} />}

          {available.length === 0 ? (
            <div className={cn(card.base, 'flex flex-col items-center gap-2 py-12 text-center')}>
              <SearchX size={22} aria-hidden="true" className="text-subtle" />
              <p className="text-[14px] font-medium text-ink">No reports match “{search}”</p>
              <p className="text-[13px] text-muted">
                Try a different word, like sales or sessions.
              </p>
            </div>
          ) : (
            available.map((category) => <CategorySection key={category.key} category={category} />)
          )}

          <ComingLater categories={unavailable} />
        </div>
      )}
    </Page>
  )
}

AdminAnalyticsReportsHome.layout = [AdminLayout]
