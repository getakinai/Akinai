import RecordActivityCard from '../_record_activity_card'
import { useActivityFilters } from '../_activity_filters'
import { PRODUCT_ACTIVITY_ACTIONS, auditRecordName } from '../_audit_format'
import { type RecordActivity } from '../_audit_types'
import { useAdminProductActivityInfinite } from './_hooks'

const isVariant = (log: RecordActivity) => log.auditableType === 'ProductVariant'

function productSummary(log: RecordActivity) {
  if (log.action === 'created') {
    return log.changes.after?.source === 'csv_import' ? 'Imported from CSV' : 'Product created'
  }
  if (log.action === 'deleted') {
    return isVariant(log) ? `Removed variant ${auditRecordName(log)}` : 'Removed this product'
  }
  return null
}

function recordLabel(log: RecordActivity) {
  return isVariant(log) ? auditRecordName(log) : 'Product'
}

export default function ProductActivityCard({ productId }: { productId: string }) {
  const { filters, setFilters, isFiltered } = useActivityFilters()
  const list = useAdminProductActivityInfinite(productId, filters)

  return (
    <RecordActivityCard
      title="Activity"
      description="Changes to this product and its variants, and who made them."
      label="Product activity"
      actions={PRODUCT_ACTIVITY_ACTIONS}
      filters={filters}
      onFiltersChange={setFilters}
      isFiltered={isFiltered}
      list={list}
      summary={productSummary}
      recordLabel={recordLabel}
    />
  )
}
