import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { BellOff, CheckCheck, History, MoreHorizontal } from 'lucide-react'
import { Skeleton } from '~/components/ui'
import { flattenPages } from '~/lib/infinite_list'
import { cn } from '~/lib/styles'
import { useDateFormat } from '~/hooks/use_date_format'
import { useCan } from '~/pages/admin/_hooks'
import {
  openNotificationTarget,
  useAdminNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '~/pages/admin/_notification_hooks'
import {
  NOTIFICATION_FILTERS,
  type AdminNotification,
  type NotificationFilter,
} from '~/pages/admin/_notification_types'
import NotificationItem from './notification_item'

const filterLabels: Record<NotificationFilter, string> = { all: 'All', unread: 'Unread' }

const menuItem =
  'flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] font-medium text-ink transition-colors duration-150 hover:bg-paper focus-visible:bg-paper focus-visible:outline-none'

type Group = { label: string; items: AdminNotification[] }

/** Splits into New (since the panel was last opened), Today and Earlier. */
function groupNotifications(
  items: AdminNotification[],
  newSince: string | null,
  isTodayInAccount: (iso: string) => boolean,
  isAfterInstant: (a: string, b: string) => boolean
): Group[] {
  const groups: Group[] = [
    { label: 'New', items: [] },
    { label: 'Today', items: [] },
    { label: 'Earlier', items: [] },
  ]
  for (const item of items) {
    if (newSince === null || isAfterInstant(item.createdAt, newSince)) groups[0].items.push(item)
    else if (isTodayInAccount(item.createdAt)) groups[1].items.push(item)
    else groups[2].items.push(item)
  }
  return groups.filter((group) => group.items.length > 0)
}

type NotificationsPanelProps = {
  id: string
  /** `seenAt` from before this opening, so New stays put while the panel is open. */
  newSince: string | null
  onClose: () => void
}

export default function NotificationsPanel({ id, newSince, onClose }: NotificationsPanelProps) {
  const { isToday, isAfter } = useDateFormat()
  const [filter, setFilter] = useState<NotificationFilter>('all')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()
  const canViewEvents = useCan('events.view')
  const query = useAdminNotifications(filter, true)
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const sentinelRef = useRef<HTMLDivElement>(null)

  const groups = useMemo(
    () => groupNotifications(flattenPages(query.data).rows, newSince, isToday, isAfter),
    [query.data, newSince, isToday, isAfter]
  )

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasNextPage) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !isFetchingNextPage) void fetchNextPage()
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  function open(notification: AdminNotification) {
    if (!notification.read) markRead.mutate(notification.id)
    onClose()
    openNotificationTarget(notification)
  }

  return (
    <div
      id={id}
      role="dialog"
      aria-label="Notifications"
      className="fixed inset-x-2 top-[64px] z-50 flex max-h-[calc(100dvh-72px)] flex-col rounded-card border border-line-2 bg-card shadow-lg min-[721px]:absolute min-[721px]:inset-x-auto min-[721px]:top-full min-[721px]:right-0 min-[721px]:mt-2 min-[721px]:max-h-[min(640px,calc(100dvh-80px))] min-[721px]:w-[380px]"
    >
      <div className="flex items-center justify-between gap-2 px-4 pt-3.5">
        <h2 className="text-[20px] font-bold tracking-[-0.01em] text-ink">Notifications</h2>
        <div className="relative">
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-paper hover:text-ink focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
            onClick={() => setMenuOpen((current) => !current)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label="Notification options"
          >
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && (
            <div
              id={menuId}
              role="menu"
              className="absolute top-full right-0 z-10 mt-1 w-56 rounded-card border border-line-2 bg-card p-1.5 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                className={menuItem}
                onClick={() => {
                  markAllRead.mutate()
                  setMenuOpen(false)
                }}
              >
                <CheckCheck size={15} className="text-muted" /> Mark all as read
              </button>
              {canViewEvents && (
                <Link
                  route="admin.events.home"
                  role="menuitem"
                  className={menuItem}
                  onClick={onClose}
                >
                  <History size={15} className="text-muted" /> Open event log
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 px-4 pt-2 pb-1" role="tablist" aria-label="Filter notifications">
        {NOTIFICATION_FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={filter === value}
            onClick={() => setFilter(value)}
            className={cn(
              'h-9 rounded-full px-3.5 text-[14px] font-semibold transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none',
              filter === value ? 'bg-accent-soft text-accent' : 'text-ink hover:bg-paper'
            )}
          >
            {filterLabels[value]}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2">
        {query.isLoading ? (
          <div className="flex flex-col gap-3 p-2">
            {[0, 1, 2].map((key) => (
              <div key={key} className="flex items-center gap-3">
                <Skeleton className="size-12 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : query.isError ? (
          <p className="px-2 py-8 text-center text-[13.5px] text-danger">
            Notifications could not be loaded.
          </p>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-paper text-muted">
              <BellOff size={20} />
            </span>
            <p className="text-[14px] font-semibold text-ink">You are all caught up</p>
            <p className="text-[13px] text-muted">
              {filter === 'unread'
                ? 'No unread notifications.'
                : 'Order activity will show up here as it happens.'}
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.label} aria-label={group.label} className="pt-2">
              <div className="flex items-center justify-between px-2 pb-1">
                <h3 className="text-[15px] font-semibold text-ink">{group.label}</h3>
                {group.label === 'Earlier' && canViewEvents && (
                  <Link
                    route="admin.events.home"
                    className="rounded-sm text-[13px] text-accent hover:underline focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
                    onClick={onClose}
                  >
                    See all
                  </Link>
                )}
              </div>
              <ul className="flex flex-col">
                {group.items.map((notification) => (
                  <li key={notification.id}>
                    <NotificationItem notification={notification} onOpen={open} />
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
        <div ref={sentinelRef} aria-hidden="true" className="h-1" />
        {isFetchingNextPage && (
          <div className="flex items-center gap-3 p-2">
            <Skeleton className="size-12 rounded-full" />
            <Skeleton className="h-3.5 flex-1" />
          </div>
        )}
      </div>
    </div>
  )
}
