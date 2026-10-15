import { urlFor } from '~/client'
import { usePage } from '@inertiajs/react'
import { type LucideIcon } from 'lucide-react'
import { type ReactNode } from 'react'
import { Link } from '@adonisjs/inertia/react'

export type NavRoute = Parameters<typeof urlFor>[0]

export type NavItem = {
  label: string
  route: NavRoute
  icon?: LucideIcon
}

export function isActiveUrl(url: string, route: NavRoute, exact = false) {
  const href = urlFor(route)
  const path = url.split('?')[0]
  return exact ? path === href : path === href || path.startsWith(`${href}/`)
}

/**
 * Picks the item whose route best matches the URL. When routes are nested
 * (e.g. "/admin/orders" and "/admin/orders/drafts"), the longest match wins
 * so only one item is active.
 */
export function findActiveNavItem<T extends NavItem>(url: string, items: T[]): T | undefined {
  return items
    .filter((item) => isActiveUrl(url, item.route))
    .sort((a, b) => urlFor(b.route).length - urlFor(a.route).length)[0]
}

/**
 * A link that marks itself with `aria-current="page"` when the current URL
 * matches its route. By default nested URLs count as a match, so a
 * "Settings" link stays active on "/settings/security". Pass `exact` to
 * only match the route itself, or `active` to decide it from outside.
 */
export default function NavLink({
  route,
  exact = false,
  active,
  className,
  children,
}: {
  route: NavRoute
  exact?: boolean
  active?: boolean
  className?: string
  children: ReactNode
}) {
  const { url } = usePage()
  const href = urlFor(route)
  const isActive = active ?? isActiveUrl(url, route, exact)

  return (
    <Link href={href} className={className} aria-current={isActive ? 'page' : undefined}>
      {children}
    </Link>
  )
}
