import { useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { Columns2, Download, Eye, Filter, Pencil, Plus } from 'lucide-react'
import Page from '~/components/page'
import { InfiniteDataTable, DataTableToolbar, type DataTableColumn } from '~/components/data_table'
import { FormButton } from '~/components/form'
import { Avatar, Badge, IconButton, SearchInput } from '~/components/ui'
import { FormSelectWithSearch } from '~/components/form'
import { useListQueryState } from '~/hooks/use_list_query_state'
import AdminLayout from '~/layouts/admin'
import { buttonClasses, card, dataTable, iconButton, listToolbarSearch } from '~/lib/styles'
import { useCan } from '../_hooks'
import { type AdminUser } from '../_types'
import { roleTone, userDisplayName, userStatusMeta } from './_format'
import { useAdminRoleOptions, useAdminUsersInfinite } from './_hooks'
import { mockUserExtras } from './_mock'
import {
  AdminUserStatusFilterSchema,
  type AdminUserStatusFilter,
  type AdminUsersSortKey,
} from './_types'

const dateTime = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function formatDateTime(value: Date | string) {
  const parts = dateTime.formatToParts(new Date(value))
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? ''
  return `${part('month')} ${part('day')} · ${part('hour')}:${part('minute')}`
}

const columns: DataTableColumn<AdminUser, AdminUsersSortKey>[] = [
  {
    key: 'user',
    header: 'User',
    sortKey: 'fullName',
    cell: (user) => (
      <div className="flex min-w-0 items-center gap-3">
        <Avatar initials={user.initials} seed={user.id} size="sm" />
        <div className="min-w-0">
          <div className="truncate text-[13.5px] font-medium text-ink">{user.fullName ?? '—'}</div>
          <div className={`truncate ${dataTable.mono}`}>{user.email}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'role',
    header: 'Role',
    cell: (user) =>
      user.role ? (
        <Badge tone={roleTone(user.role)}>{user.role.name}</Badge>
      ) : (
        <span className="text-muted">No role</span>
      ),
  },
  {
    key: 'department',
    header: 'Department',
    cell: (user) => mockUserExtras(user).department,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (user) => {
      const status = userStatusMeta[user.status]
      return (
        <Badge tone={status.tone} dot>
          {status.label}
        </Badge>
      )
    },
  },
  {
    key: 'id',
    header: 'ID',
    cell: (user) => <span className={dataTable.mono}>{mockUserExtras(user).displayId}</span>,
  },
  {
    key: 'lastActive',
    header: 'Last active',
    cell: (user) => (
      <span className={dataTable.mono}>{formatDateTime(mockUserExtras(user).lastActive)}</span>
    ),
  },
  {
    key: 'createdAt',
    header: 'Created',
    sortKey: 'createdAt',
    cell: (user) => <span className={dataTable.mono}>{formatDateTime(user.createdAt)}</span>,
  },
]

function UserRowActions({ user, canEdit }: { user: AdminUser; canEdit: boolean }) {
  const name = userDisplayName(user)

  return (
    <>
      <Link
        route="admin.users.show"
        routeParams={{ id: user.id }}
        className={`${iconButton} size-7 border-transparent`}
        aria-label={`View ${name}`}
        title={`View ${name}`}
      >
        <Eye size={15} />
      </Link>
      {canEdit && (
        <Link
          route="admin.users.edit"
          routeParams={{ id: user.id }}
          className={`${iconButton} size-7 border-transparent`}
          aria-label={`Edit ${name}`}
          title={`Edit ${name}`}
        >
          <Pencil size={15} />
        </Link>
      )}
    </>
  )
}

export default function AdminUsersHome() {
  const { query, sort, setSearch, setSort } = useListQueryState<AdminUsersSortKey>({
    defaultSort: { key: 'createdAt', direction: 'desc' },
  })
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<AdminUserStatusFilter>('')
  const [roleFilter, setRoleFilter] = useState('')
  const list = useAdminUsersInfinite({
    ...query,
    status: statusFilter,
    roleId: roleFilter,
  })
  const roles = useAdminRoleOptions()
  const canCreate = useCan('users.create')
  const canEdit = useCan('users.edit')

  return (
    <Page
      eyebrow="Back office · People"
      title="Users"
      description="Staff members who can sign in to the back office."
      actions={
        <>
          <FormButton type="button" variant="secondary" size="sm" disabled>
            <Download size={15} /> Export
          </FormButton>
          {canCreate && (
            <Link route="admin.users.create" className={buttonClasses({ size: 'sm' })}>
              <Plus size={15} /> Add user
            </Link>
          )}
        </>
      }
    >
      <section className={card.base}>
        <DataTableToolbar
          left={
            <>
              <SearchInput
                label="Search users"
                placeholder="Search users by name or email…"
                value={query.q}
                onDebouncedChange={setSearch}
                className={listToolbarSearch}
              />
              <FormButton type="button" variant="secondary" size="sm" disabled>
                <Filter size={14} /> Filter
              </FormButton>
            </>
          }
          right={
            <>
              <FormSelectWithSearch
                name="users-role-filter"
                label="Filter by role"
                hideLabel
                compact
                disabled={!roles.data}
                value={roleFilter}
                onChange={(next) => {
                  setRoleFilter(next)
                }}
                options={[
                  { value: '', label: 'All roles' },
                  ...(roles.data ?? []).map((role) => ({ value: role.id, label: role.name })),
                ]}
              />
              <FormSelectWithSearch
                name="users-status-filter"
                label="Filter by status"
                hideLabel
                compact
                value={statusFilter}
                onChange={(next) => {
                  setStatusFilter(AdminUserStatusFilterSchema.parse(next))
                }}
                options={[
                  { value: '', label: 'All status' },
                  { value: 'active', label: 'Active' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
              <IconButton label="Columns" disabled>
                <Columns2 size={15} />
              </IconButton>
            </>
          }
        />

        <InfiniteDataTable
          label="Staff users"
          list={list}
          columns={columns}
          getRowId={(user) => user.id}
          sort={sort}
          onSortChange={setSort}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          rowActions={(user) => <UserRowActions user={user} canEdit={canEdit} />}
          emptySlot={
            query.q || statusFilter || roleFilter ? 'No users match your filters.' : 'No users yet.'
          }
          errorMessage="Could not load users."
        />
      </section>
    </Page>
  )
}

AdminUsersHome.layout = [AdminLayout]
