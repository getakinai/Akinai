import { useState } from 'react'
import { DataTableToolbar } from '~/components/data_table'
import {
  DateRangeCalendarPicker,
  FormSelectWithSearch,
  formatDateRangeToYmd,
  parseDateRangeFromYmd,
} from '~/components/form'
import { SearchInput } from '~/components/ui'
import { listToolbarSearch } from '~/lib/styles'
import { auditActionMeta } from './_audit_format'
import { AuditActionSchema, type ActivityFilters, type AuditAction } from './_audit_types'

export function useActivityFilters() {
  const [filters, setFilters] = useState<ActivityFilters>({})
  const isFiltered = Boolean(filters.q || filters.action || filters.dateFrom)
  return { filters, setFilters, isFiltered }
}

export default function ActivityFiltersToolbar({
  filters,
  onChange,
  actions,
}: {
  filters: ActivityFilters
  onChange: (next: ActivityFilters) => void
  actions: AuditAction[]
}) {
  return (
    <DataTableToolbar
      left={
        <SearchInput
          label="Search changes"
          placeholder="Search changes…"
          value={filters.q ?? ''}
          onDebouncedChange={(q) => onChange({ ...filters, q: q.trim() || undefined })}
          className={listToolbarSearch}
        />
      }
      right={
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <FormSelectWithSearch
            name="activity-action-filter"
            label="Filter by action"
            hideLabel
            compact
            className="w-full min-w-[10rem] sm:w-auto"
            value={filters.action ?? ''}
            onChange={(next) => {
              const action = AuditActionSchema.safeParse(next)
              onChange({ ...filters, action: action.success ? action.data : undefined })
            }}
            options={[
              { value: '', label: 'All actions' },
              ...actions.map((action) => ({ value: action, label: auditActionMeta[action].label })),
            ]}
          />
          <DateRangeCalendarPicker
            name="activity-date-filter"
            label="Filter by date"
            hideLabel
            compact
            closeOnSelect
            className="w-full min-w-[12rem] sm:w-auto"
            placeholder="All dates"
            value={parseDateRangeFromYmd(filters.dateFrom, filters.dateTo)}
            onChange={(range) => onChange({ ...filters, ...formatDateRangeToYmd(range) })}
            onClear={
              filters.dateFrom
                ? () => onChange({ ...filters, dateFrom: undefined, dateTo: undefined })
                : undefined
            }
            clearLabel="All dates"
          />
        </div>
      }
    />
  )
}
