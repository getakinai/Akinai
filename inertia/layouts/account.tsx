import { type ReactNode } from 'react'
import { usePage } from '@inertiajs/react'
import {
  Heart,
  History,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MapPin,
  MessageCircle,
  Package,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { findActiveNavItem, type NavItem } from '~/components/nav_link'
import NavLink from '~/components/nav_link'
import { cn, storefront } from '~/lib/styles'
import { useCustomerLogout } from '~/pages/customers/_hooks'

const ACCOUNT_NAV: (NavItem & { icon: LucideIcon })[] = [
  { label: 'Overview', route: 'customers.account.home', icon: LayoutDashboard },
  { label: 'Orders', route: 'customers.account.orders.home', icon: Package },
  { label: 'Wishlist', route: 'customers.account.wishlist.home', icon: Heart },
  { label: 'Addresses', route: 'customers.account.addresses.home', icon: MapPin },
  { label: 'Account details', route: 'customers.account.details.home', icon: UserRound },
  { label: 'Activity', route: 'customers.account.activity.home', icon: History },
  { label: 'Support', route: 'customers.account.support.home', icon: MessageCircle },
  { label: 'Help', route: 'storefront.help.home', icon: LifeBuoy },
]

const itemClass =
  'inline-flex h-10 flex-none items-center gap-2 rounded-lg px-3 text-[14px] font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring lg:w-full'

const idleClass = 'text-sf-text hover:bg-sf-primary-soft hover:text-sf-primary'

/**
 * Signed-in customer area inside the storefront shell. The nav is a row of
 * scrollable chips on small screens and a sticky sidebar from `lg`.
 */
export default function AccountLayout({ children }: { children: ReactNode }) {
  const { url } = usePage()
  const logout = useCustomerLogout()
  const active = findActiveNavItem(url, ACCOUNT_NAV)

  const logoutButton = (className: string) => (
    <button
      type="button"
      onClick={() => logout.mutate()}
      disabled={logout.isPending}
      className={cn(
        storefront.primaryButton,
        'flex-none whitespace-nowrap disabled:opacity-55 lg:w-full',
        className
      )}
    >
      <LogOut size={16} className="flex-none" />
      {logout.isPending ? 'Logging out…' : 'Log out'}
    </button>
  )

  return (
    <div className={cn(storefront.container, 'py-6 sm:py-10')}>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-8">
        <aside className="min-w-0">
          <nav
            aria-label="Account"
            className={cn(
              storefront.card,
              'p-1.5 lg:sticky lg:top-36 lg:flex lg:min-h-[420px] lg:flex-col lg:justify-between lg:p-3'
            )}
          >
            <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
              {ACCOUNT_NAV.map((item) => {
                const Icon = item.icon
                const isActive = item === active
                return (
                  <li key={item.route} className="flex-none lg:flex-auto">
                    <NavLink
                      route={item.route}
                      active={isActive}
                      className={cn(
                        itemClass,
                        isActive ? 'bg-sf-primary-soft text-sf-primary' : idleClass
                      )}
                    >
                      <Icon size={16} className="flex-none" />
                      {item.label}
                    </NavLink>
                  </li>
                )
              })}
              <li className="flex-none lg:hidden">{logoutButton('')}</li>
            </ul>
            {logoutButton('hidden lg:inline-flex')}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-col gap-6">{children}</div>
      </div>
    </div>
  )
}
