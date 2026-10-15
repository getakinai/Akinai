import { useEffect, useId, useRef, useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { LogOut, UserRound } from 'lucide-react'
import { FormButton } from '~/components/form'
import { Avatar, Badge, Skeleton } from '~/components/ui'
import { useAdminLogout, useAdminMe } from '~/pages/admin/_hooks'
import { useAccountSecurity } from '~/pages/admin/account/_hooks'

const menuItem =
  'flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] font-medium text-ink transition-colors duration-150 hover:bg-paper focus-visible:bg-paper focus-visible:outline-none disabled:opacity-60'

/**
 * The avatar in the admin top bar. Opens a short summary of the signed-in
 * User with a link to their profile.
 */
export default function AdminUserMenu() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const { data: user } = useAdminMe()
  const security = useAccountSecurity({ enabled: open })
  const logout = useAdminLogout()

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

  const close = () => setOpen(false)

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="grid rounded-full focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Account menu"
      >
        <Avatar initials={user?.initials} seed={user?.id} />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute top-full right-0 z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-card border border-line-2 bg-card p-2 shadow-lg"
        >
          <div className="flex items-center gap-3 border-b border-line px-2.5 pt-1.5 pb-3">
            <Avatar initials={user?.initials} seed={user?.id} />
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[14px] font-semibold text-ink">
                {user ? (user.fullName ?? user.email) : 'Loading…'}
              </div>
              <div className="truncate text-[12.5px] text-muted">{user?.email}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-3 text-[12.5px]">
            {user?.role && (
              <Badge tone={user.role.isLocked ? 'primary' : 'neutral'}>{user.role.name}</Badge>
            )}
            {security.isLoading ? (
              <Skeleton className="h-5 w-24" />
            ) : security.data ? (
              <Badge tone={security.data.enabled ? 'success' : 'warning'}>
                {security.data.enabled ? '2FA on' : '2FA off'}
              </Badge>
            ) : null}
          </div>

          <div className="flex flex-col gap-0.5 border-t border-line pt-2">
            <Link
              href="/admin/account#profile"
              role="menuitem"
              className={menuItem}
              onClick={close}
            >
              <UserRound size={15} className="text-muted" /> My profile
            </Link>
            <div className="mt-1.5 border-t border-line px-0.5 pt-2.5 pb-0.5">
              <FormButton
                type="button"
                block
                role="menuitem"
                loading={logout.isPending}
                loadingText="Logging out…"
                onClick={() => logout.mutate()}
              >
                <LogOut size={15} /> Log out
              </FormButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
