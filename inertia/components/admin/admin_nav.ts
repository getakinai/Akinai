import {
  BellRing,
  Building2,
  ChartLine,
  CreditCard,
  Globe,
  House,
  Images,
  Inbox,
  LifeBuoy,
  Mail,
  Package,
  Percent,
  Puzzle,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  UserRound,
  Users,
  Warehouse,
} from 'lucide-react'
import { type LucideIcon } from 'lucide-react'
import { type NavItem, type NavRoute } from '~/components/nav_link'
import type { AdminNavPlugin } from '~/pages/admin/plugins/_types'
import { pluginRegistry } from '~/plugins/registry'

export type AdminNavItem = NavItem & {
  permission?: string
  /** Live count shown next to the label. */
  badge?: 'support_open'
}

/**
 * A top-level entry in the primary sidebar. It links to its own route, and
 * its `children` only show (indented) while the section is active.
 */
export type AdminNavSection = AdminNavItem & {
  icon: LucideIcon
  children?: AdminNavItem[]
}

export type AdminNavSectionGroup = {
  /** Small heading above the group; the first group has none. */
  label?: string
  sections: AdminNavSection[]
}

export type NavGroup = {
  label: string
  items: AdminNavItem[]
}

/**
 * Primary back-office navigation. Add an entry here for every new staff
 * area. Items with a `permission` are hidden from roles that lack it.
 */
export const adminNav: AdminNavSectionGroup[] = [
  {
    sections: [
      {
        label: 'Home',
        route: 'admin.dashboard.home',
        icon: House,
        permission: 'dashboard.view',
      },
      {
        label: 'Orders',
        route: 'admin.orders.home',
        icon: ShoppingBag,
        permission: 'orders.view',
        children: [
          { label: 'Drafts', route: 'admin.orders.drafts.home', permission: 'orders.view' },
          { label: 'Returns', route: 'admin.returns.home', permission: 'orders.view' },
        ],
      },
      {
        label: 'Products',
        route: 'admin.products.home',
        icon: Package,
        permission: 'products.view',
        children: [
          {
            label: 'Collections',
            route: 'admin.collections.home',
            permission: 'collections.view',
          },
          {
            label: 'Product types',
            route: 'admin.product_types.home',
            permission: 'product_types.view',
          },
          {
            label: 'Labels',
            route: 'admin.product_labels.home',
            permission: 'product_labels.view',
          },
          { label: 'Vendors', route: 'admin.vendors.home', permission: 'vendors.view' },
          { label: 'Options', route: 'admin.options.home', permission: 'options.view' },
        ],
      },
      {
        label: 'Customers',
        route: 'admin.customers.home',
        icon: UserRound,
        permission: 'customers.view',
      },
      { label: 'Media', route: 'admin.media.home', icon: Images },
      {
        label: 'Analytics',
        route: 'admin.analytics.home',
        icon: ChartLine,
        permission: 'analytics.view',
        children: [
          {
            label: 'Reports',
            route: 'admin.analytics.reports.home',
            permission: 'analytics.view',
          },
          { label: 'Live View', route: 'admin.analytics.live.home', permission: 'analytics.view' },
        ],
      },
    ],
  },
  {
    label: 'Marketing',
    sections: [
      {
        label: 'Discounts',
        route: 'admin.discounts.home',
        icon: Percent,
        permission: 'discounts.view',
      },
    ],
  },
  {
    label: 'Customer service',
    sections: [
      {
        label: 'Inbox',
        route: 'admin.support.tickets.home',
        icon: Inbox,
        permission: 'support_tickets.view',
        badge: 'support_open',
      },
      {
        label: 'Help center',
        route: 'admin.help_articles.home',
        icon: LifeBuoy,
        permission: 'help_articles.view',
        children: [
          {
            label: 'Categories',
            route: 'admin.help_categories.home',
            permission: 'help_articles.view',
          },
        ],
      },
    ],
  },
  {
    label: 'Sales channels',
    sections: [
      {
        label: 'Online Store',
        route: 'admin.storefront_content.home',
        icon: Store,
        permission: 'storefront.view',
        children: [
          { label: 'Menu', route: 'admin.storefront_menu.home', permission: 'storefront.view' },
          { label: 'Pages', route: 'admin.pages.home', permission: 'pages.view' },
          { label: 'Themes', route: 'admin.themes.home', permission: 'themes.view' },
          {
            label: 'Built-in theme',
            route: 'admin.storefront_theme.home',
            permission: 'storefront.view',
          },
        ],
      },
      {
        label: 'Plugins',
        route: 'admin.plugins.home',
        icon: Puzzle,
        permission: 'plugins.view',
      },
    ],
  },
]

/** Nav groups that installed plugins of a category join automatically. */
const CATEGORY_NAV_GROUPS: Record<string, string> = {
  marketing: 'Marketing',
}

/** Sidebar sections for installed plugins whose category joins `groupLabel`. */
function categorySections(groupLabel: string, plugins: AdminNavPlugin[]): AdminNavSection[] {
  return plugins.flatMap((plugin) => {
    if (!plugin.adminRoute || CATEGORY_NAV_GROUPS[plugin.category] !== groupLabel) return []
    return [
      {
        label: plugin.name,
        route: plugin.adminRoute as NavRoute,
        icon: pluginRegistry[plugin.key]?.navIcon ?? Puzzle,
        permission: plugin.adminPermission ?? undefined,
      },
    ]
  })
}

/** `permissions` null keeps every plugin item, e.g. for page titles. */
function mergePluginNav(
  groups: AdminNavSectionGroup[],
  permissions: string[] | null,
  installedPlugins: AdminNavPlugin[] | null
): AdminNavSectionGroup[] {
  if (!installedPlugins) return groups

  return groups.map((group) => ({
    ...group,
    sections: [
      ...group.sections,
      ...(group.label ? categorySections(group.label, installedPlugins) : []),
    ].map((section) => {
      const pluginChildren: AdminNavItem[] = []
      for (const { key } of installedPlugins) {
        const entry = pluginRegistry[key]
        if (!entry?.adminNav || entry.adminNav.parentRoute !== section.route) continue
        for (const item of entry.adminNav.items) {
          if (!permissions || !item.permission || permissions.includes(item.permission)) {
            pluginChildren.push(item)
          }
        }
      }
      if (pluginChildren.length === 0) return section
      return {
        ...section,
        children: [...(section.children ?? []), ...pluginChildren],
      }
    }),
  }))
}

/** The primary nav with installed plugins' entries, unfiltered by permission. */
export function adminNavWithPlugins(
  installedPlugins: AdminNavPlugin[] | null
): AdminNavSectionGroup[] {
  return mergePluginNav(adminNav, null, installedPlugins)
}

/**
 * Settings pages, listed in the secondary sidebar that opens when the
 * Settings link (pinned to the bottom of the primary sidebar) is active.
 */
export const adminSettingsNav: NavGroup[] = [
  {
    label: 'Store',
    items: [
      {
        label: 'Store details',
        route: 'admin.store_settings.home',
        icon: Building2,
        permission: 'store_settings.view',
      },
      { label: 'Markets', route: 'admin.markets.home', icon: Globe, permission: 'markets.view' },
      { label: 'Taxes', route: 'admin.taxes.home', icon: Receipt, permission: 'taxes.view' },
      { label: 'Shipping', route: 'admin.shipping.home', icon: Truck, permission: 'shipping.view' },
      {
        label: 'Locations',
        route: 'admin.locations.home',
        icon: Warehouse,
        permission: 'locations.view',
      },
      {
        label: 'Payments',
        route: 'admin.payments.home',
        icon: CreditCard,
        permission: 'payments.view',
      },
      { label: 'Emails', route: 'admin.emails.home', icon: Mail, permission: 'emails.view' },
      { label: 'Events', route: 'admin.events.home', icon: BellRing, permission: 'events.view' },
    ],
  },
  {
    label: 'Team',
    items: [
      { label: 'Users', route: 'admin.users.home', icon: Users, permission: 'users.view' },
      {
        label: 'Team & Permissions',
        route: 'admin.roles.home',
        icon: ShieldCheck,
        permission: 'roles.view',
      },
    ],
  },
]

function permitted(item: AdminNavItem, permissions: string[]) {
  return !item.permission || permissions.includes(item.permission)
}

/**
 * The primary nav trimmed to what the given permissions and installed
 * plugins allow. A section the user can't open itself still shows when they
 * can open one of its children, and then links to the first such child.
 */
export function visibleAdminNav(
  permissions: string[],
  installedPlugins: AdminNavPlugin[] | null = null
): AdminNavSectionGroup[] {
  return mergePluginNav(adminNav, permissions, installedPlugins)
    .map((group) => ({
      ...group,
      sections: group.sections.flatMap((section) => {
        const children = (section.children ?? []).filter((child) => permitted(child, permissions))
        if (permitted(section, permissions)) return [{ ...section, children }]
        const [first, ...rest] = children
        return first ? [{ ...section, route: first.route, children: rest }] : []
      }),
    }))
    .filter((group) => group.sections.length > 0)
}

export function visibleAdminSettingsNav(permissions: string[]): NavGroup[] {
  return adminSettingsNav
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => permitted(item, permissions)),
    }))
    .filter((group) => group.items.length > 0)
}

/** Every routable entry, for active-link and breadcrumb matching. */
export function flattenAdminNav(
  groups: AdminNavSectionGroup[] = adminNav,
  settings: NavGroup[] = adminSettingsNav
): AdminNavItem[] {
  return [
    ...groups.flatMap((group) =>
      group.sections.flatMap((section) => [section, ...(section.children ?? [])])
    ),
    ...settings.flatMap((group) => group.items),
  ]
}
