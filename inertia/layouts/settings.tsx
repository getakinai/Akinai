import Page from '~/components/page'
import { type ReactNode } from 'react'
import NavLink, { type NavItem } from '~/components/nav_link'
import { cn, panel } from '~/lib/styles'

const navItem =
  'flex h-9 items-center gap-2.5 whitespace-nowrap rounded-lg px-2.5 text-[14px] font-medium text-muted transition-colors duration-150 hover:text-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring aria-[current=page]:bg-[color-mix(in_oklab,var(--ink)_6%,var(--card))] aria-[current=page]:text-ink'

/**
 * The pages of the settings area, listed in the sidebar. Register a route
 * for each page and add it here, for example:
 *
 * `{ label: 'Profile', route: 'settings.profile', icon: User }`
 */
const items: NavItem[] = []

/**
 * Renders the settings heading, a sidebar of links and a card holding the
 * current page. Nest it under the app layout from each settings page:
 *
 * `Profile.layout = [AppLayout, SettingsLayout]`
 */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <Page title="Settings" description="Manage your account settings and preferences.">
      <div className="grid grid-cols-[240px_minmax(0,1fr)] items-start gap-6 max-[720px]:grid-cols-[minmax(0,1fr)] max-[720px]:gap-4">
        <nav
          className="flex flex-col gap-0.5 rounded-card border border-line-2 bg-card p-2 max-[720px]:flex-row max-[720px]:overflow-x-auto"
          aria-label="Settings"
        >
          {items.map(({ label, route, icon: Icon }) => (
            <NavLink key={label} route={route} exact className={navItem}>
              {Icon && <Icon size={16} />}
              {label}
            </NavLink>
          ))}
        </nav>
        <div className={cn('min-w-0', panel)}>{children}</div>
      </div>
    </Page>
  )
}
