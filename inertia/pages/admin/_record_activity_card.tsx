import { useState, type ReactNode } from 'react'
import { Eye } from 'lucide-react'
import {
  InfiniteDataTable,
  type DataTableColumn,
  type InfiniteListState,
} from '~/components/data_table'
import { Badge, IconButton } from '~/components/ui'
import { card, dataTable } from '~/lib/styles'
import ActivityDialog from './_activity_dialog'
import ActivityFiltersToolbar from './_activity_filters'
import { auditActionMeta, auditFieldChanges, formatAuditDate } from './_audit_format'
import {
  type ActivityActor,
  type ActivityFilters,
  type AuditAction,
  type RecordActivity,
} from './_audit_types'

const SUMMARY_FIELDS = 2

const actorKindLabels: Record<ActivityActor['kind'], string> = {
  staff: 'Staff',
  customer: 'Customer',
  system: 'Automatic',
}

type RecordActivityCardProps = {
  title: string
  description: string
  /** Accessible name of the table, e.g. "Order activity". */
  label: string
  actions: AuditAction[]
  filters: ActivityFilters
  onFiltersChange: (next: ActivityFilters) => void
  isFiltered: boolean
  list: InfiniteListState<RecordActivity>
  /** Text for action-specific rows; return null to list the changed fields. */
  summary?: (log: RecordActivity) => ReactNode | null
  /** Adds a column naming the record each row is about, for feeds that mix records. */
  recordLabel?: (log: RecordActivity) => string
}

function FieldChanges({ log }: { log: RecordActivity }) {
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

/**
 * Audit log table for one record (or a record and its children): filters,
 * batch-loaded rows with who made each change, and a dialog with the full
 * diff. Renders the list it is given; the caller fetches it.
 */
export default function RecordActivityCard({
  title,
  description,
  label,
  actions,
  filters,
  onFiltersChange,
  isFiltered,
  list,
  summary,
  recordLabel,
}: RecordActivityCardProps) {
  const [selected, setSelected] = useState<RecordActivity | null>(null)

  const columns: DataTableColumn<RecordActivity>[] = [
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
    ...(recordLabel
      ? [
          {
            key: 'record',
            header: 'Record',
            cell: (log: RecordActivity) => (
              <span className="block max-w-[200px] truncate text-[13.5px] text-ink">
                {recordLabel(log)}
              </span>
            ),
          },
        ]
      : []),
    {
      key: 'actor',
      header: 'By',
      cell: (log) => (
        <div className="min-w-0">
          <div className="max-w-[200px] truncate text-[13.5px] font-medium text-ink">
            {log.actor.name}
          </div>
          <div className="text-[12.5px] text-muted">{actorKindLabels[log.actor.kind]}</div>
        </div>
      ),
    },
    {
      key: 'changes',
      header: 'Changes',
      cell: (log) => {
        const text = summary?.(log)
        return text ? <span className="text-muted">{text}</span> : <FieldChanges log={log} />
      },
    },
  ]

  return (
    <section className={card.base}>
      <header className={card.head}>
        <div>
          <span className={card.eyebrow}>Audit log</span>
          <h2 className={card.title}>{title}</h2>
          <p className="mt-0.5 text-[13px] text-pretty text-muted">{description}</p>
        </div>
      </header>

      <ActivityFiltersToolbar filters={filters} onChange={onFiltersChange} actions={actions} />

      <InfiniteDataTable
        label={label}
        list={list}
        columns={columns}
        getRowId={(log) => log.id}
        rowActions={(log) => (
          <IconButton label="View changes" size="sm" onClick={() => setSelected(log)}>
            <Eye size={15} />
          </IconButton>
        )}
        skeletonRows={3}
        emptySlot={isFiltered ? 'No activity matches your filters.' : 'No activity yet.'}
        errorMessage="Could not load activity."
      />

      <ActivityDialog log={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
