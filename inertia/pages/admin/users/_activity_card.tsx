import { useState } from 'react'
import { Eye } from 'lucide-react'
import { InfiniteDataTable, type DataTableColumn } from '~/components/data_table'
import { Badge, IconButton } from '~/components/ui'
import { card, dataTable } from '~/lib/styles'
import ActivityDialog from '../_activity_dialog'
import ActivityFiltersToolbar, { useActivityFilters } from '../_activity_filters'
import {
  ALL_ACTIVITY_ACTIONS,
  auditActionMeta,
  auditFieldChanges,
  auditRecordName,
  auditTitle,
  formatAuditDate,
  isEventAction,
  isSecurityAction,
  recordTypeLabel,
  securitySummary,
} from '../_audit_format'
import { type AuditLog } from '../_audit_types'
import { useAdminUserActivityInfinite } from './_hooks'

const SUMMARY_FIELDS = 2

function ChangesSummary({ log }: { log: AuditLog }) {
  if (isSecurityAction(log.action)) {
    return <span className="text-muted">{securitySummary(log.action)}</span>
  }
  if (log.action === 'deleted') {
    return <span className="text-muted">Removed this record</span>
  }
  if (isEventAction(log.action)) {
    return <span className="text-muted">{auditTitle(log)}</span>
  }

  const changes = auditFieldChanges(log)
  const hidden = changes.length - SUMMARY_FIELDS

  return (
    <ul className="flex min-w-0 flex-col gap-0.5">
      {changes.slice(0, SUMMARY_FIELDS).map((change) => (
        <li key={change.key} className="max-w-[360px] truncate text-[13px]">
          <span className="text-muted">{change.label}:</span> {change.before}
          {' → '}
          <span className="font-medium text-ink">{change.after}</span>
        </li>
      ))}
      {hidden > 0 && (
        <li className="text-[12.5px] text-subtle">
          +{hidden} more {hidden === 1 ? 'change' : 'changes'}
        </li>
      )}
    </ul>
  )
}

const columns: DataTableColumn<AuditLog>[] = [
  {
    key: 'createdAt',
    header: 'When',
    cell: (log) => <span className={dataTable.mono}>{formatAuditDate(log.createdAt)}</span>,
  },
  {
    key: 'action',
    header: 'Action',
    cell: (log) => (
      <Badge tone={auditActionMeta[log.action].tone} dot>
        {auditActionMeta[log.action].label}
      </Badge>
    ),
  },
  {
    key: 'record',
    header: 'Record',
    cell: (log) => (
      <div className="min-w-0">
        <div className="max-w-[240px] truncate text-[13.5px] font-medium text-ink">
          {auditRecordName(log)}
        </div>
        <div className="text-[12.5px] text-muted">{recordTypeLabel(log.auditableType)}</div>
      </div>
    ),
  },
  {
    key: 'changes',
    header: 'Changes',
    cell: (log) => <ChangesSummary log={log} />,
  },
]

export default function ActivityCard({ userId }: { userId: string }) {
  const { filters, setFilters, isFiltered } = useActivityFilters()
  const [selected, setSelected] = useState<AuditLog | null>(null)
  const list = useAdminUserActivityInfinite(userId, filters)

  return (
    <section className={card.base}>
      <header className={card.head}>
        <div>
          <span className={card.eyebrow}>Audit log</span>
          <h2 className={card.title}>Activity</h2>
          <p className="mt-0.5 text-[13px] text-pretty text-muted">
            Sign-ins, security events, updates and deletions for this user in the back office.
          </p>
        </div>
      </header>

      <ActivityFiltersToolbar
        filters={filters}
        onChange={setFilters}
        actions={ALL_ACTIVITY_ACTIONS}
      />

      <InfiniteDataTable
        label="User activity"
        list={list}
        columns={columns}
        getRowId={(log) => log.id}
        rowActions={(log) => (
          <IconButton label="View changes" size="sm" onClick={() => setSelected(log)}>
            <Eye size={15} />
          </IconButton>
        )}
        skeletonRows={5}
        emptySlot={isFiltered ? 'No activity matches your filters.' : 'No activity yet.'}
        errorMessage="Could not load activity."
      />

      <ActivityDialog log={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
