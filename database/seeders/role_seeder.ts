import app from '@adonisjs/core/services/app'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import RoleService from '#services/role_service'

/**
 * Creates the built-in roles. Safe to re-run: existing roles keep the
 * permissions edited in the back office.
 */
export default class extends BaseSeeder {
  async run() {
    const roleService = await app.container.make(RoleService)

    await roleService.ensure(
      {
        slug: 'admin',
        name: 'Admin',
        description: 'Full access to the back office',
        isLocked: true,
        sortOrder: 0,
      },
      []
    )

    await roleService.ensure(
      {
        slug: 'manager',
        name: 'Manager',
        description: 'Runs day-to-day operations and manages staff',
        sortOrder: 1,
      },
      [
        'dashboard.view',
        'analytics.view',
        'analytics.export',
        'users.view',
        'users.create',
        'users.edit',
        'users.archive',
        'roles.view',
        'orders.view',
        'orders.create',
        'orders.edit',
        'orders.archive',
        'products.view',
        'products.create',
        'products.edit',
        'products.archive',
        'collections.view',
        'collections.create',
        'collections.edit',
        'collections.archive',
        'product_types.view',
        'product_types.create',
        'product_types.edit',
        'product_types.archive',
        'vendors.view',
        'vendors.create',
        'vendors.edit',
        'vendors.archive',
        'options.view',
        'options.create',
        'options.edit',
        'options.archive',
        'locations.view',
        'inventory.view',
        'inventory.edit',
        'discounts.view',
        'discounts.create',
        'discounts.edit',
        'discounts.archive',
        'newsletter_subscribers.view',
        'newsletter_subscribers.edit',
        'pages.view',
        'pages.create',
        'pages.edit',
        'pages.archive',
        'help_articles.view',
        'help_articles.create',
        'help_articles.edit',
        'help_articles.archive',
        'markets.view',
        'taxes.view',
        'shipping.view',
      ]
    )

    await roleService.ensure(
      {
        slug: 'customer_support',
        name: 'Customer support',
        description: 'Answers the support inbox and keeps the help center up to date',
        sortOrder: 2,
      },
      [
        'dashboard.view',
        'support_tickets.view',
        'support_tickets.edit',
        'help_articles.view',
        'help_articles.create',
        'help_articles.edit',
        'help_articles.archive',
        'customers.view',
        'orders.view',
      ]
    )

    await roleService.ensure(
      {
        slug: 'staff',
        name: 'Staff',
        description: 'Default access for new staff members',
        isDefault: true,
        sortOrder: 3,
      },
      ['dashboard.view']
    )
  }
}
