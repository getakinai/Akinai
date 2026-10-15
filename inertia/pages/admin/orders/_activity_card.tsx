import RecordActivityCard from '../_record_activity_card'
import { useActivityFilters } from '../_activity_filters'
import { ORDER_ACTIVITY_ACTIONS, auditRecordName } from '../_audit_format'
import { type RecordActivity } from '../_audit_types'
import { useAdminOrderActivityInfinite } from './_hooks'

function orderSummary(log: RecordActivity) {
  if (log.action === 'placed') return `Order placed · ${auditRecordName(log)}`
  if (log.action === 'created') return `Draft created · ${auditRecordName(log)}`
  if (log.action === 'deleted') return 'Removed this order'
  return null
}

export default function ActivityCard({ orderId }: { orderId: string }) {
  const { filters, setFilters, isFiltered } = useActivityFilters()
  const list = useAdminOrderActivityInfinite(orderId, filters)

  return (
    <RecordActivityCard
      title="Activity"
      description="When this order was created, placed, edited and paid, and who did it."
      label="Order activity"
      actions={ORDER_ACTIVITY_ACTIONS}
      filters={filters}
      onFiltersChange={setFilters}
      isFiltered={isFiltered}
      list={list}
      summary={orderSummary}
    />
  )
}
