import { type ReactNode } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { card } from '~/lib/styles'
import type { AnalyticsQuery } from './_types'

/** Card heading that links to a report, keeping the selected range. */
export default function ReportLink({
  reportKey,
  query,
  children,
}: {
  reportKey: string
  query: AnalyticsQuery
  children: ReactNode
}) {
  return (
    <Link
      route="admin.analytics.reports.show"
      routeParams={{ key: reportKey }}
      qs={{ from: query.from, to: query.to, compare: query.compare }}
      className={card.action}
    >
      {children}
    </Link>
  )
}
