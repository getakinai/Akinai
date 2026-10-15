export const PERMISSION_ACTIONS = [
  'view',
  'create',
  'edit',
  'archive',
  'upload',
  'import',
  'export',
] as const

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number]

type PermissionResource = {
  key: string
  label: string
  description: string
  actions: readonly PermissionAction[]
}

type PermissionSection = {
  key: string
  label: string
  resources: readonly PermissionResource[]
}

/**
 * Catalog of every back-office permission. A permission key is
 * `<resource>.<action>`; add a resource here before guarding a route with it.
 */
export const PERMISSION_SECTIONS = [
  {
    key: 'core',
    label: 'Core',
    resources: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        description: 'Back-office overview',
        actions: ['view'],
      },
      {
        key: 'users',
        label: 'Users',
        description: 'Staff accounts that sign in to the back office',
        actions: ['view', 'create', 'edit', 'archive'],
      },
      {
        key: 'roles',
        label: 'Roles & permissions',
        description: 'Manage roles and what each role can do',
        actions: ['view', 'create', 'edit', 'archive'],
      },
    ],
  },
  {
    key: 'analytics',
    label: 'Analytics',
    resources: [
      {
        key: 'analytics',
        label: 'Analytics & reports',
        description: 'Sales, traffic and customer reports, and Live View of the online store',
        actions: ['view', 'export'],
      },
    ],
  },
  {
    key: 'sales',
    label: 'Sales',
    resources: [
      {
        key: 'orders',
        label: 'Orders',
        description: 'Orders and draft orders created for customers',
        actions: ['view', 'create', 'edit', 'archive'],
      },
      {
        key: 'refunds',
        label: 'Refunds & cancellations',
        description: 'Refund payments and cancel orders',
        actions: ['create'],
      },
    ],
  },
  {
    key: 'catalog',
    label: 'Catalog',
    resources: [
      {
        key: 'products',
        label: 'Products',
        description: 'Products, options and variants sold in the store',
        actions: ['view', 'create', 'edit', 'archive', 'upload', 'import', 'export'],
      },
      {
        key: 'collections',
        label: 'Collections',
        description: 'Manual and automated groups of products used for merchandising',
        actions: ['view', 'create', 'edit', 'archive', 'upload', 'import', 'export'],
      },
      {
        key: 'product_types',
        label: 'Product types',
        description: 'Kinds of products picked on the product form, such as Gift box',
        actions: ['view', 'create', 'edit', 'archive', 'import', 'export'],
      },
      {
        key: 'product_labels',
        label: 'Product labels',
        description: 'Badges such as New or Hot shown over product photos in the store',
        actions: ['view', 'create', 'edit', 'archive'],
      },
      {
        key: 'vendors',
        label: 'Vendors',
        description: 'Brands and suppliers picked on the product form',
        actions: ['view', 'create', 'edit', 'archive', 'upload', 'import', 'export'],
      },
      {
        key: 'options',
        label: 'Product options',
        description: 'Shared option names and values used across products',
        actions: ['view', 'create', 'edit', 'archive', 'import', 'export'],
      },
      {
        key: 'locations',
        label: 'Locations',
        description: 'Warehouses, stores and other places that hold stock',
        actions: ['view', 'create', 'edit', 'archive', 'import', 'export'],
      },
      {
        key: 'inventory',
        label: 'Inventory',
        description: 'Stock quantities of tracked variants at each location',
        actions: ['view', 'edit'],
      },
    ],
  },
  {
    key: 'customers',
    label: 'Customers',
    resources: [
      {
        key: 'customers',
        label: 'Customers',
        description: 'Customer profiles, their storefront accounts and saved addresses',
        actions: ['view', 'create', 'edit', 'archive'],
      },
    ],
  },
  {
    key: 'support',
    label: 'Customer service',
    resources: [
      {
        key: 'support_tickets',
        label: 'Support inbox',
        description: 'Messages sent from the storefront help chat, and replies to customers',
        actions: ['view', 'edit'],
      },
      {
        key: 'help_articles',
        label: 'Help center',
        description: 'Storefront help guides and their categories, also used by the help chat',
        actions: ['view', 'create', 'edit', 'archive'],
      },
    ],
  },
  {
    key: 'marketing',
    label: 'Marketing',
    resources: [
      {
        key: 'discounts',
        label: 'Discounts',
        description: 'Discount codes and automatic discounts applied to orders',
        actions: ['view', 'create', 'edit', 'archive'],
      },
      {
        key: 'newsletter_subscribers',
        label: 'Newsletter',
        description:
          'Emails signed up through the storefront and maintenance page newsletter forms',
        actions: ['view', 'edit'],
      },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    resources: [
      {
        key: 'store_settings',
        label: 'Store details',
        description: 'Business entity, store contact details, currency, timezone and units',
        actions: ['view', 'edit'],
      },
      {
        key: 'maintenance',
        label: 'Maintenance mode',
        description: 'Take the storefront offline for customers',
        actions: ['view', 'edit'],
      },
      {
        key: 'storefront',
        label: 'Online store',
        description: 'Storefront theme colors, logo, favicon, the header menu and home hero slides',
        actions: ['view', 'create', 'edit', 'archive', 'upload'],
      },
      {
        key: 'pages',
        label: 'Pages',
        description:
          'Storefront content pages and the refund, shipping, privacy and terms policies',
        actions: ['view', 'create', 'edit', 'archive'],
      },
      {
        key: 'markets',
        label: 'Markets',
        description: 'Groups of countries that share a currency and tax display',
        actions: ['view', 'create', 'edit', 'archive'],
      },
      {
        key: 'taxes',
        label: 'Taxes',
        description: 'Tax rates charged by country and region',
        actions: ['view', 'create', 'edit', 'archive'],
      },
      {
        key: 'shipping',
        label: 'Shipping',
        description: 'Shipping zones and the rates offered in each zone',
        actions: ['view', 'create', 'edit', 'archive'],
      },
      {
        key: 'payments',
        label: 'Payments',
        description: 'Payment methods offered at checkout, such as bank transfer',
        actions: ['view', 'edit'],
      },
      {
        key: 'emails',
        label: 'Emails',
        description: 'Log of every email the store sent, and resending them',
        actions: ['view', 'create'],
      },
      {
        key: 'events',
        label: 'Events',
        description: 'Live notification events sent to staff, and retrying failed ones',
        actions: ['view', 'edit'],
      },
    ],
  },
] as const satisfies readonly PermissionSection[]

type Sections = (typeof PERMISSION_SECTIONS)[number]
type Resources = Sections['resources'][number]

export type Permission = {
  [R in Resources as R['key']]: `${R['key']}.${R['actions'][number]}`
}[Resources['key']]

export const PERMISSIONS: Permission[] = PERMISSION_SECTIONS.flatMap((section) =>
  section.resources.flatMap((resource) =>
    resource.actions.map((action) => `${resource.key}.${action}` as Permission)
  )
)

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as string[]).includes(value)
}
