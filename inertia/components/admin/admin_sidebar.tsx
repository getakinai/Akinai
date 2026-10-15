import { usePage } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import { Settings, X } from 'lucide-react'
import Logo from '~/components/logo'
import NavLink, { findActiveNavItem } from '~/components/nav_link'
import { Skeleton } from '~/components/ui'
import { cn, iconButton } from '~/lib/styles'
import { APP_NAME } from '~/lib/brand'
import { useStorefrontTheme } from '~/pages/_hooks'
import { useAdminMe } from '~/pages/admin/_hooks'
import { useAdminSupportOpenCount } from '~/pages/admin/support/tickets/_hooks'
import {
  type AdminNavItem,
  type AdminNavSection,
  type AdminNavSectionGroup,
  type NavGroup,
  flattenAdminNav,
  visibleAdminNav,
  visibleAdminSettingsNav,
} from './admin_nav'

const focusRing = 'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring'

const navItem = cn(
  'flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[14px] font-medium text-muted transition-[background-color,color] duration-150 hover:bg-paper hover:text-ink aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent',
  focusRing
)

const subNavItem = cn(
  'flex h-8 items-center rounded-lg pr-2.5 pl-[36px] text-[13.5px] font-medium text-muted transition-[background-color,color] duration-150 hover:bg-paper hover:text-ink aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent',
  focusRing
)

const railItem = cn(
  'relative grid size-10 place-items-center rounded-lg text-muted transition-[background-color,color] duration-150 hover:bg-paper hover:text-ink aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent',
  focusRing
)

const flyoutItem = cn(
  'flex h-8 items-center rounded-md px-2.5 text-[13.5px] font-medium whitespace-nowrap text-ink transition-colors duration-150 hover:bg-paper aria-[current=page]:text-accent',
  focusRing
)

const logoLink = cn('inline-flex shrink-0 rounded-md text-ink', focusRing)

const groupLabel = 'mb-1.5 px-2.5 font-mono text-[10.5px] tracking-[0.14em] text-subtle uppercase'

/**
 * The storefront theme's uploaded logo, or the default mark when none is
 * uploaded. Shows a placeholder while loading so the default mark does not
 * flash first.
 */
function AdminLogo({ imageClassName }: { imageClassName: string }) {
  const { data: theme, isLoading } = useStorefrontTheme()
  if (isLoading) return <Skeleton className="size-7 shrink-0 rounded-md" />
  if (!theme?.logoUrl) return <Logo route="admin.dashboard.home" className={logoLink} />

  return (
    <Link route="admin.dashboard.home" aria-label={APP_NAME} className={logoLink}>
      <img
        src={theme.logoUrl}
        alt={theme.brandName || APP_NAME}
        className={cn('h-7 w-auto object-contain', imageClassName)}
      />
    </Link>
  )
}

type AdminSidebarProps = {
  open: boolean
  onClose: () => void
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const { url } = usePage()
  const { data: user } = useAdminMe()
  const permissions = user?.permissions ?? []
  const supportOpen = useAdminSupportOpenCount(permissions.includes('support_tickets.view'))
  const groups = visibleAdminNav(permissions)
  const settingsGroups = visibleAdminSettingsNav(permissions)
  const settingsItems = settingsGroups.flatMap((group) => group.items)
  const activeItem = findActiveNavItem(url, flattenAdminNav(groups, settingsGroups))
  const inSettings = !!activeItem && settingsItems.includes(activeItem)
  const settingsHome = settingsItems[0]
  const counts = { support_open: supportOpen.data ?? 0 }

  return (
    <aside
      id="admin-sidebar"
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex border-r border-line bg-card transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)] min-[900px]:static min-[900px]:h-auto min-[900px]:shrink-0 min-[900px]:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {inSettings && (
        <NavRail
          groups={groups}
          activeItem={activeItem}
          counts={counts}
          settingsHome={settingsHome}
        />
      )}

      <div className="flex w-60 min-w-0 flex-col">
        <div className="flex h-15 shrink-0 items-center gap-2.5 border-b border-line px-5">
          {!inSettings && <AdminLogo imageClassName="max-w-[96px]" />}
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[14.5px] font-semibold tracking-[-0.01em]">
              {inSettings ? 'Settings' : APP_NAME}
            </div>
            <div className="truncate font-mono text-[10.5px] tracking-[0.04em] text-subtle">
              {inSettings ? APP_NAME : 'back office'}
            </div>
          </div>
          <button
            type="button"
            className={cn(iconButton, 'size-8 min-[900px]:hidden')}
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        {inSettings ? (
          <SettingsNav groups={settingsGroups} activeItem={activeItem} />
        ) : (
          <>
            <PrimaryNav groups={groups} activeItem={activeItem} counts={counts} />
            {settingsHome && (
              <div className="border-t border-line px-3 py-3">
                <NavLink route={settingsHome.route} active={false} className={navItem}>
                  <Settings size={16} />
                  <span className="min-w-0 flex-1 truncate">Settings</span>
                </NavLink>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  )
}

type Counts = Record<NonNullable<AdminNavItem['badge']>, number>

function isSectionActive(section: AdminNavSection, activeItem?: AdminNavItem) {
  return (
    !!activeItem &&
    (activeItem.route === section.route ||
      (section.children ?? []).some((child) => child.route === activeItem.route))
  )
}

function CountBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null
  return (
    <span
      className={cn(
        'grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1.5 text-[11px] leading-none font-semibold text-paper',
        className
      )}
      aria-label={`${count} waiting for a reply`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

function PrimaryNav({
  groups,
  activeItem,
  counts,
}: {
  groups: AdminNavSectionGroup[]
  activeItem?: AdminNavItem
  counts: Counts
}) {
  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4" aria-label="Back office">
      {groups.map((group, index) => (
        <div key={group.label ?? index} className="flex flex-col gap-0.5">
          {group.label && <div className={groupLabel}>{group.label}</div>}
          {group.sections.map((section) => {
            const { label, route, icon: Icon, badge, children = [] } = section
            const active = isSectionActive(section, activeItem)
            const expanded = active || section.alwaysOpen
            return (
              <div key={label} className="flex flex-col gap-0.5">
                <NavLink
                  route={route}
                  active={activeItem?.route === route}
                  className={cn(navItem, active && 'text-ink')}
                >
                  <Icon size={16} />
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  {badge && <CountBadge count={counts[badge]} />}
                </NavLink>
                {expanded &&
                  children.map((child) => (
                    <NavLink
                      key={child.label}
                      route={child.route}
                      active={activeItem?.route === child.route}
                      className={subNavItem}
                    >
                      <span className="min-w-0 truncate">{child.label}</span>
                    </NavLink>
                  ))}
              </div>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

function SettingsNav({ groups, activeItem }: { groups: NavGroup[]; activeItem?: AdminNavItem }) {
  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4" aria-label="Settings">
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-0.5">
          <div className={groupLabel}>{group.label}</div>
          {group.items.map(({ label, route, icon: Icon }) => (
            <NavLink
              key={label}
              route={route}
              active={activeItem?.route === route}
              className={navItem}
            >
              {Icon && <Icon size={16} />}
              <span className="min-w-0 flex-1 truncate">{label}</span>
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )
}

/**
 * The collapsed primary nav shown beside the settings panel. Hovering or
 * focusing an icon opens a flyout with the section and its sub-pages.
 */
function NavRail({
  groups,
  activeItem,
  counts,
  settingsHome,
}: {
  groups: AdminNavSectionGroup[]
  activeItem?: AdminNavItem
  counts: Counts
  settingsHome?: AdminNavItem
}) {
  return (
    <nav
      className="relative z-10 flex w-14 shrink-0 flex-col items-center border-r border-line"
      aria-label="Back office"
    >
      <div className="grid h-15 w-full shrink-0 place-items-center border-b border-line">
        <AdminLogo imageClassName="max-w-10" />
      </div>
      <div className="flex flex-1 flex-col items-center gap-1 py-3">
        {groups.map((group, index) => (
          <div
            key={group.label ?? index}
            className={cn(
              'flex flex-col items-center gap-1',
              index > 0 && 'mt-2 border-t border-line pt-3'
            )}
          >
            {group.sections.map((section) => {
              const { label, route, icon: Icon, badge, children = [] } = section
              const count = badge ? counts[badge] : 0
              return (
                <div key={label} className="group relative">
                  <NavLink
                    route={route}
                    active={isSectionActive(section, activeItem)}
                    className={railItem}
                  >
                    <Icon size={17} />
                    <span className="sr-only">{label}</span>
                    {count > 0 && (
                      <CountBadge
                        count={count}
                        className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px]"
                      />
                    )}
                  </NavLink>
                  <div className="absolute top-0 left-full z-50 hidden pl-2 group-focus-within:block group-hover:block">
                    <div className="flex min-w-40 flex-col gap-0.5 rounded-card border border-line-2 bg-card p-1.5 shadow-lg">
                      <NavLink
                        route={route}
                        active={activeItem?.route === route}
                        className={flyoutItem}
                      >
                        {label}
                      </NavLink>
                      {children.map((child) => (
                        <NavLink
                          key={child.label}
                          route={child.route}
                          active={activeItem?.route === child.route}
                          className={cn(flyoutItem, 'text-muted hover:text-ink')}
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      {settingsHome && (
        <div className="flex w-full justify-center border-t border-line py-3">
          <NavLink route={settingsHome.route} active className={railItem}>
            <Settings size={17} />
            <span className="sr-only">Settings</span>
          </NavLink>
        </div>
      )}
    </nav>
  )
}
