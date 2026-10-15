import RecordActivityCard from '../_record_activity_card'
import { useActivityFilters } from '../_activity_filters'
import { ALL_ACTIVITY_ACTIONS, auditRecordName, recordTypeLabel } from '../_audit_format'
import { type RecordActivity } from '../_audit_types'
import { useAdminCustomerActivityInfinite } from './_hooks'

function customerSummary(log: RecordActivity) {
  if (log.action === 'impersonation_started') {
    const reason = log.changes.after?.reason
    return typeof reason === 'string'
      ? `Signed in as this customer · “${reason}”`
      : 'Signed in as this customer'
  }
  if (log.action === 'impersonation_stopped') return 'Stopped impersonating this customer'
  if (log.action === 'deleted') return `Removed ${auditRecordName(log)}`
  return null
}

function recordLabel(log: RecordActivity) {
  if (log.auditableType === 'Customer') return 'Customer'
  return `${recordTypeLabel(log.auditableType)} · ${auditRecordName(log)}`
}

export default function CustomerActivityCard({ customerId }: { customerId: string }) {
  const { filters, setFilters, isFiltered } = useActivityFilters()
  const list = useAdminCustomerActivityInfinite(customerId, filters)

  return (
    <RecordActivityCard
      title="Activity"
      description="Changes to this customer, their sign-ins, staff impersonations, and everything done in their account."
      label="Customer activity"
      actions={ALL_ACTIVITY_ACTIONS}
      filters={filters}
      onFiltersChange={setFilters}
      isFiltered={isFiltered}
      list={list}
      summary={customerSummary}
      recordLabel={recordLabel}
    />
  )
}
