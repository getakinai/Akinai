import { type ReactNode } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { ArrowLeft, Pencil } from 'lucide-react'
import Page from '~/components/page'
import { Avatar, Badge } from '~/components/ui'
import AdminLayout from '~/layouts/admin'
import { buttonClasses, card } from '~/lib/styles'
import { useCan } from '../_hooks'
import ActivityCard from './_activity_card'
import { roleTone, userDisplayName, userStatusMeta } from './_format'
import { useAdminUser } from './_hooks'
import { UserLoadError, UserSkeleton } from './_page_states'

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="min-w-0 text-[13.5px] break-all text-ink">{children}</dd>
    </div>
  )
}

export default function AdminUsersShow({ id }: { id: string }) {
  const { data: user, isLoading, isError, refetch } = useAdminUser(id)
  const canEdit = useCan('users.edit')

  const status = user ? userStatusMeta[user.status] : null

  return (
    <Page
      eyebrow={
        <Link route="admin.users.home" className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft size={12} /> Users
        </Link>
      }
      title={user ? userDisplayName(user) : 'User'}
      description={
        user &&
        status && (
          <span className="inline-flex flex-wrap items-center gap-2">
            <Badge tone={status.tone} dot>
              {status.label}
            </Badge>
            {user.role && <Badge tone={roleTone(user.role)}>{user.role.name}</Badge>}
          </span>
        )
      }
      actions={
        user &&
        canEdit && (
          <Link
            route="admin.users.edit"
            routeParams={{ id: user.id }}
            className={buttonClasses({ size: 'sm' })}
          >
            <Pencil size={15} /> Edit user
          </Link>
        )
      }
    >
      {isLoading ? (
        <UserSkeleton />
      ) : isError || !user || !status ? (
        <UserLoadError onRetry={() => refetch()} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className={card.base}>
              <header className={card.head}>
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar initials={user.initials} seed={user.id} />
                  <div className="min-w-0">
                    <span className={card.eyebrow}>Profile</span>
                    <h2 className={`${card.title} truncate`}>{user.fullName ?? '—'}</h2>
                  </div>
                </div>
              </header>
              <dl className="flex flex-col gap-3">
                <Row label="Full name">{user.fullName ?? '—'}</Row>
                <Row label="Email">{user.email}</Row>
              </dl>
            </section>

            <section className={card.base}>
              <header className={card.head}>
                <div>
                  <span className={card.eyebrow}>Access</span>
                  <h2 className={card.title}>Back-office access</h2>
                </div>
              </header>
              <dl className="flex flex-col gap-3">
                <Row label="Role">
                  {user.role ? (
                    <Badge tone={roleTone(user.role)}>{user.role.name}</Badge>
                  ) : (
                    <span className="text-muted">No role</span>
                  )}
                </Row>
                <Row label="Status">
                  <Badge tone={status.tone} dot>
                    {status.label}
                  </Badge>
                </Row>
                <Row label="Created">{dateTimeFormat.format(new Date(user.createdAt))}</Row>
                <Row label="Last updated">
                  {user.updatedAt ? dateTimeFormat.format(new Date(user.updatedAt)) : '—'}
                </Row>
              </dl>
            </section>
          </div>
          <ActivityCard userId={user.id} />
        </div>
      )}
    </Page>
  )
}

AdminUsersShow.layout = [AdminLayout]
