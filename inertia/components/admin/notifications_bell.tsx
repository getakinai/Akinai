import { useEffect, useId, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { cn, iconButton } from '~/lib/styles'
import {
  useAdminLiveEvents,
  useAdminNotifications,
  useCanViewNotifications,
  useMarkNotificationsSeen,
} from '~/pages/admin/_notification_hooks'
import NotificationsPanel from './notifications_panel'

/**
 * Bell in the admin top bar. Shows a count of events since the panel was
 * last opened, and listens for new ones while the back office is open.
 */
export default function NotificationsBell() {
  useAdminLiveEvents()
  const canView = useCanViewNotifications()
  const [open, setOpen] = useState(false)
  const [newSince, setNewSince] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const query = useAdminNotifications('all', canView)
  const markSeen = useMarkNotificationsSeen()

  const meta = query.data?.pages[0]?.metadata
  const badge = meta?.badge ?? 0

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!canView) return null

  function toggle() {
    if (open) {
      setOpen(false)
      return
    }
    setNewSince(meta?.seenAt ?? null)
    setOpen(true)
    if (badge > 0) markSeen.mutate()
  }

  return (
    <div ref={rootRef} className="min-[721px]:relative">
      <button
        type="button"
        className={cn(iconButton, 'rounded-full', open && 'bg-accent-soft text-accent')}
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={badge > 0 ? `Notifications, ${badge} new` : 'Notifications'}
      >
        <Bell size={16} />
        {badge > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1.5 -right-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[11px] leading-none font-bold text-paper ring-2 ring-card"
          >
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </button>

      {open && (
        <NotificationsPanel id={panelId} newSince={newSince} onClose={() => setOpen(false)} />
      )}
    </div>
  )
}
