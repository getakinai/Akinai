import { History, MapPin, Trash2, UserRound } from 'lucide-react'
import { Badge, Skeleton } from '~/components/ui'
import AccountLayout from '~/layouts/account'
import StorefrontLayout from '~/layouts/storefront'
import { cn, storefront } from '~/lib/styles'
import { useCustomerActivity } from '../../_hooks'
import type { CustomerActivity } from '../../_types'
import AccountPage, { EmptyState, ErrorState } from '../_account_page'
import { useAccountFormat } from '../_format'
import { activityFieldChanges, activityTitle } from './_activity_format'

function ActivityIcon({ entry }: { entry: CustomerActivity }) {
  if (entry.action === 'deleted') {
    return (
      <span className="grid size-10 flex-none place-items-center rounded-lg bg-danger-soft text-danger">
        <Trash2 size={18} />
      </span>
    )
  }
  const Icon = entry.auditableType === 'CustomerAddress' ? MapPin : UserRound
  return (
    <span className="grid size-10 flex-none place-items-center rounded-lg bg-sf-primary-soft text-sf-primary">
      <Icon size={18} />
    </span>
  )
}

function ActivityChanges({ entry }: { entry: CustomerActivity }) {
  if (entry.action === 'deleted') {
    return <p className="mt-1 text-[13.5px] text-sf-muted">Removed</p>
  }

  const changes = activityFieldChanges(entry)
  if (changes.length === 0) return null

  return (
    <ul className="mt-2 flex flex-col gap-1">
      {changes.map((change) => (
        <li key={change.key} className="text-[13.5px] break-words">
          <span className="text-sf-muted">{change.label}:</span>{' '}
          <span className="text-sf-muted line-through decoration-sf-line">{change.before}</span>
          {' → '}
          <span className="font-medium">{change.after}</span>
        </li>
      ))}
    </ul>
  )
}

function ActivityCard({
  entry,
  date,
  time,
}: {
  entry: CustomerActivity
  date: string
  time: string
}) {
  return (
    <li className={cn(storefront.card, 'flex gap-3 p-4')}>
      <ActivityIcon entry={entry} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <p className="text-[15px] font-semibold">{activityTitle(entry)}</p>
          <Badge tone={entry.action === 'deleted' ? 'danger' : 'info'}>
            {entry.action === 'deleted' ? 'Deleted' : 'Updated'}
          </Badge>
        </div>
        {entry.auditableLabel && (
          <p className="mt-0.5 truncate text-[13.5px] text-sf-muted">{entry.auditableLabel}</p>
        )}
        <ActivityChanges entry={entry} />
        <p className="mt-2 text-[12.5px] text-sf-muted">
          {date} · {time}
        </p>
      </div>
    </li>
  )
}

export default function CustomerAccountActivityHome() {
  const activity = useCustomerActivity()
  const format = useAccountFormat()
  const list = activity.data?.pages.flatMap((page) => page.data) ?? []

  return (
    <AccountPage
      title="Activity"
      description="Changes and deletions you’ve made in your account, newest first."
    >
      {activity.isLoading && (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-[104px] w-full rounded-card" />
          ))}
        </div>
      )}
      {activity.isError && (
        <ErrorState message="We couldn’t load your activity." onRetry={() => activity.refetch()} />
      )}
      {activity.data && list.length === 0 && (
        <EmptyState icon={<History size={20} />} title="No account activity yet">
          <p>When you update your details or change your saved addresses, it will show up here.</p>
        </EmptyState>
      )}
      {list.length > 0 && (
        <ul className="flex flex-col gap-3">
          {list.map((entry) => (
            <ActivityCard
              key={entry.id}
              entry={entry}
              date={format.date(entry.createdAt)}
              time={format.time(entry.createdAt)}
            />
          ))}
        </ul>
      )}
      {activity.hasNextPage && (
        <button
          type="button"
          onClick={() => activity.fetchNextPage()}
          disabled={activity.isFetchingNextPage}
          className={cn(
            storefront.iconButton,
            'h-10 w-full px-4 text-[14px] font-medium disabled:opacity-55 sm:w-fit sm:self-center'
          )}
        >
          {activity.isFetchingNextPage ? 'Loading…' : 'Show more'}
        </button>
      )}
    </AccountPage>
  )
}

CustomerAccountActivityHome.layout = [StorefrontLayout, AccountLayout]
