import type { PluginMiddleware, PluginRouter } from '#plugin_host/types'
import { newsletterThrottles } from './limiter.js'

const KEY = 'newsletter'

function guard(middleware: PluginMiddleware) {
  return middleware.plugin({ key: KEY })
}

export function admin(router: PluginRouter, middleware: PluginMiddleware) {
  router
    .group(() => {
      router
        .get('marketing/newsletter', [
          () => import('./controllers/admin_newsletter_subscribers_home_controller.js'),
        ])
        .as('admin.newsletter_subscribers.home')
        .use(guard(middleware))
      router
        .get('marketing/newsletter/list', [
          () => import('./controllers/admin_newsletter_subscribers_list_controller.js'),
        ])
        .as('admin.newsletter_subscribers.list')
        .use(guard(middleware))
    })
    .use(middleware.can({ permission: 'newsletter_subscribers.view' }))

  router
    .put('marketing/newsletter/bulk/subscription', [
      () => import('./controllers/admin_newsletter_subscribers_bulk_subscription_controller.js'),
    ])
    .as('admin.newsletter_subscribers.bulk.subscription.update')
    .use(middleware.can({ permission: 'newsletter_subscribers.edit' }))
    .use(guard(middleware))
}

export function storefront(router: PluginRouter, middleware: PluginMiddleware) {
  const throttles = newsletterThrottles()
  router
    .post('newsletter', [() => import('./controllers/storefront_newsletter_store_controller.js')])
    .as('storefront.newsletter.store')
    .use([guard(middleware), ...throttles, middleware.recaptcha({ action: 'customer_newsletter' })])
  router
    .post('maintenance/newsletter', [
      () => import('./controllers/storefront_maintenance_newsletter_store_controller.js'),
    ])
    .as('storefront.maintenance.newsletter.store')
    .use([
      guard(middleware),
      ...throttles,
      middleware.recaptcha({ action: 'maintenance_newsletter' }),
    ])
}
