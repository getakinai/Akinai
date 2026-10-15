import { usePage } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import { ChevronRight, Menu } from 'lucide-react'
import { findActiveNavItem } from '~/components/nav_link'
import { cn, iconButton } from '~/lib/styles'
import { useAdminNavPlugins } from '~/pages/admin/plugins/_hooks'
import { adminNavWithPlugins, adminSettingsNav, flattenAdminNav } from './admin_nav'
import AdminUserMenu from './admin_user_menu'
import NotificationsBell from './notifications_bell'

type AdminTopbarProps = {
  sidebarOpen: boolean
  onMenuClick: () => void
}

export default function AdminTopbar({ sidebarOpen, onMenuClick }: AdminTopbarProps) {
  const { url } = usePage()
  const installedPlugins = useAdminNavPlugins()
  const current = findActiveNavItem(url, flattenAdminNav(adminNavWithPlugins(installedPlugins)))
  const inSettings = !!current && adminSettingsNav.some((group) => group.items.includes(current))

  return (
    <header className="sticky top-0 z-20 flex h-15 shrink-0 items-center justify-between gap-4 border-b border-line bg-card/85 px-[30px] backdrop-blur max-[720px]:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className={cn(iconButton, 'min-[900px]:hidden')}
          onClick={onMenuClick}
          aria-label="Open navigation"
          aria-controls="admin-sidebar"
          aria-expanded={sidebarOpen}
        >
          <Menu size={16} />
        </button>
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13.5px]">
          <Link
            route="admin.dashboard.home"
            className="hidden rounded-sm text-muted transition-colors hover:text-ink focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none sm:inline"
          >
            Back office
          </Link>
          {inSettings && (
            <>
              <ChevronRight size={14} className="hidden text-subtle sm:block" />
              <span className="hidden text-muted sm:inline">Settings</span>
            </>
          )}
          {current && (
            <>
              <ChevronRight size={14} className="hidden text-subtle sm:block" />
              <span className="truncate font-medium text-ink" aria-current="page">
                {current.label}
              </span>
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-2.5">
        <NotificationsBell />
        <AdminUserMenu />
      </div>
    </header>
  )
}
