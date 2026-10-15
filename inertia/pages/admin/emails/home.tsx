import { useMemo, useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { Eye } from 'lucide-react'
import Page from '~/components/page'
import { InfiniteDataTable, DataTableToolbar, type DataTableColumn } from '~/components/data_table'
import { FormSelectWithSearch } from '~/components/form'
import { Badge, SearchInput } from '~/components/ui'
import { useDateFormat } from '~/hooks/use_date_format'
import { useListQueryState } from '~/hooks/use_list_query_state'
import AdminLayout from '~/layouts/admin'
import { card, dataTable, iconButton, listToolbarSearch } from '~/lib/styles'
import { emailStatusMeta, emailTypeLabels, recipientsSummary } from './_format'
import { useAdminEmailsInfinite } from './_hooks'
import {
  EMAIL_STATUSES,
  EMAIL_TYPES,
  EmailStatusFilterSchema,
  EmailTypeFilterSchema,
  type AdminEmailListItem,
  type AdminEmailsSortKey,
  type EmailStatusFilter,
  type EmailTypeFilter,
} from './_types'

export default function AdminEmailsHome() {
  const { formatDateTime } = useDateFormat()
  const { query, sort, setSearch, setSort } = useListQueryState<AdminEmailsSortKey>({
    defaultSort: { key: 'createdAt', direction: 'desc' },
  })
  const [status, setStatus] = useState<EmailStatusFilter>('')
  const [type, setType] = useState<EmailTypeFilter>('')
  const list = useAdminEmailsInfinite({ ...query, status, type })
  const filtered = Boolean(query.q || status || type)

  const columns = useMemo<DataTableColumn<AdminEmailListItem, AdminEmailsSortKey>[]>(
    () => [
      {
        key: 'createdAt',
        header: 'Date',
        sortKey: 'createdAt',
        cell: (email) => (
          <span className={`${dataTable.mono} whitespace-nowrap`}>
            {formatDateTime(email.createdAt)}
          </span>
        ),
      },
      {
        key: 'subject',
        header: 'Email',
        sortKey: 'subject',
        cell: (email) => (
          <div className="min-w-0">
            <Link
              route="admin.emails.show"
              routeParams={{ id: email.id }}
              className="line-clamp-1 text-[13.5px] font-medium text-ink hover:underline"
            >
              {email.subject || '(no subject)'}
            </Link>
            <div className="mt-0.5 text-[12px] text-muted">
              {emailTypeLabels[email.type]}
              {email.resentFromId && ' · Resent'}
            </div>
          </div>
        ),
      },
      {
        key: 'to',
        header: 'To',
        cell: (email) => (
          <span className="truncate text-[13px]">{recipientsSummary(email.toAddresses)}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortKey: 'status',
        cell: (email) => {
          const meta = emailStatusMeta[email.status]
          return (
            <Badge tone={meta.tone} dot>
              {meta.label}
            </Badge>
          )
        },
      },
      {
        key: 'related',
        header: 'Related',
        cell: (email) =>
          email.orderId ? (
            <Link
              route="admin.orders.show"
              routeParams={{ id: email.orderId }}
              className="text-[13px] text-accent hover:underline"
            >
              Order
            </Link>
          ) : email.customerId ? (
            <Link
              route="admin.customers.edit"
              routeParams={{ id: email.customerId }}
              className="text-[13px] text-accent hover:underline"
            >
              Customer
            </Link>
          ) : (
            <span className={dataTable.mono}>—</span>
          ),
      },
    ],
    [formatDateTime]
  )

  return (
    <Page
      eyebrow="Back office · Settings"
      title="Emails"
      description="Every email the store sent in the last 90 days, who got it and whether it was delivered."
    >
      <section className={card.base}>
        <DataTableToolbar
          left={
            <SearchInput
              label="Search emails"
              placeholder="Search by subject or recipient…"
              value={query.q}
              onDebouncedChange={setSearch}
              className={listToolbarSearch}
            />
          }
          right={
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <FormSelectWithSearch
                name="emails-status-filter"
                label="Filter by status"
                hideLabel
                compact
                className="w-full min-w-[9rem] sm:w-auto"
                value={status}
                onChange={(next) => setStatus(EmailStatusFilterSchema.parse(next))}
                options={[
                  { value: '', label: 'All status' },
                  ...EMAIL_STATUSES.map((value) => ({
                    value,
                    label: emailStatusMeta[value].label,
                  })),
                ]}
              />
              <FormSelectWithSearch
                name="emails-type-filter"
                label="Filter by type"
                hideLabel
                compact
                className="w-full min-w-[12rem] sm:w-auto"
                value={type}
                onChange={(next) => setType(EmailTypeFilterSchema.parse(next))}
                options={[
                  { value: '', label: 'All types' },
                  ...EMAIL_TYPES.map((value) => ({ value, label: emailTypeLabels[value] })),
                ]}
              />
            </div>
          }
        />

        <InfiniteDataTable
          label="Emails"
          list={list}
          columns={columns}
          getRowId={(email) => email.id}
          sort={sort}
          onSortChange={setSort}
          rowActions={(email) => (
            <Link
              route="admin.emails.show"
              routeParams={{ id: email.id }}
              className={`${iconButton} size-7 border-transparent`}
              aria-label={`View email ${email.subject}`}
              title="View email"
            >
              <Eye size={15} />
            </Link>
          )}
          emptySlot={filtered ? 'No emails match your filters.' : 'No emails sent yet.'}
          errorMessage="Could not load emails."
        />
      </section>
    </Page>
  )
}

AdminEmailsHome.layout = [AdminLayout]
