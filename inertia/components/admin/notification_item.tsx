import {
  Ban,
  CreditCard,
  FileSearch,
  LifeBuoy,
  MessageSquareReply,
  PackageX,
  RotateCcw,
  ShoppingCart,
  Store,
  Truck,
  Undo2,
  type LucideIcon,
} from 'lucide-react'
import { Avatar } from '~/components/ui'
import { cn } from '~/lib/styles'
import { useDateFormat } from '~/hooks/use_date_format'
import { actorName } from '~/pages/admin/_notification_hooks'
import type { AdminEventType, AdminNotification } from '~/pages/admin/_notification_types'

const typeBadges: Record<AdminEventType, { icon: LucideIcon; tone: string }> = {
  'order.placed': { icon: ShoppingCart, tone: 'bg-accent' },
  'order.paid': { icon: CreditCard, tone: 'bg-ok' },
  'order.payment_submitted': { icon: FileSearch, tone: 'bg-info' },
  'order.payment_status_changed': { icon: CreditCard, tone: 'bg-ok' },
  'order.fulfillment_status_changed': { icon: Truck, tone: 'bg-info' },
  'order.fulfilled': { icon: Truck, tone: 'bg-info' },
  'order.fulfillment_cancelled': { icon: PackageX, tone: 'bg-warning' },
  'order.cancelled': { icon: Ban, tone: 'bg-danger' },
  'order.refunded': { icon: Undo2, tone: 'bg-warning' },
  'order.note_replied': { icon: MessageSquareReply, tone: 'bg-info' },
  'return.requested': { icon: RotateCcw, tone: 'bg-purple' },
  'return.approved': { icon: RotateCcw, tone: 'bg-purple' },
  'return.declined': { icon: RotateCcw, tone: 'bg-purple' },
  'return.received': { icon: RotateCcw, tone: 'bg-purple' },
  'return.cancelled': { icon: RotateCcw, tone: 'bg-purple' },
  'support.ticket_created': { icon: LifeBuoy, tone: 'bg-accent' },
  'support.ticket_replied': { icon: MessageSquareReply, tone: 'bg-accent' },
}

function initials(name: string) {
  const [first, second] = name.trim().split(/\s+/)
  return `${first?.charAt(0) ?? ''}${second?.charAt(0) ?? first?.charAt(1) ?? ''}`.toUpperCase()
}

type NotificationItemProps = {
  notification: AdminNotification
  onOpen: (notification: AdminNotification) => void
}

/** One row: actor avatar with a type badge, "**Actor** did something", age, unread dot. */
export default function NotificationItem({ notification, onOpen }: NotificationItemProps) {
  const { compactTimeAgo } = useDateFormat()
  const badge = typeBadges[notification.type]
  const BadgeIcon = badge.icon
  const name = actorName(notification)
  const unread = !notification.read

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors duration-150 hover:bg-paper focus-visible:bg-paper focus-visible:outline-none',
        unread && 'bg-accent/5'
      )}
    >
      <span className="relative shrink-0">
        {notification.actorType === 'system' ? (
          <span
            aria-hidden="true"
            className="grid size-12 place-items-center rounded-full bg-paper text-muted ring-1 ring-line-2"
          >
            <Store size={20} />
          </span>
        ) : (
          <Avatar
            initials={initials(name)}
            seed={notification.actorLabel ?? notification.id}
            size="lg"
          />
        )}
        <span
          aria-hidden="true"
          className={cn(
            'absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-full text-paper ring-2 ring-card',
            badge.tone
          )}
        >
          <BadgeIcon size={12} strokeWidth={2.5} />
        </span>
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'line-clamp-3 text-[13.5px] leading-snug',
            unread ? 'text-ink' : 'text-muted'
          )}
        >
          <span className="font-semibold">{name}</span> {notification.title}
        </span>
        <span
          className={cn(
            'mt-0.5 block text-[12px]',
            unread ? 'font-semibold text-accent' : 'text-subtle'
          )}
        >
          <time dateTime={notification.createdAt}>{compactTimeAgo(notification.createdAt)}</time>
        </span>
      </span>

      {unread && (
        <span className="size-3 shrink-0 rounded-full bg-accent">
          <span className="sr-only">Unread</span>
        </span>
      )}
    </button>
  )
}
