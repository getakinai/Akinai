import type { PluginMiddleware, PluginRouter } from '#plugin_host/types'

const KEY = 'hero_slideshow'

function guard(middleware: PluginMiddleware) {
  return middleware.plugin({ key: KEY })
}

export function admin(router: PluginRouter, middleware: PluginMiddleware) {
  router
    .group(() => {
      router
        .get('storefront/hero', [
          () => import('./controllers/admin_storefront_hero_home_controller.js'),
        ])
        .as('admin.storefront_hero.home')
        .use(guard(middleware))
      router
        .get('storefront/hero-slides/list', [
          () => import('./controllers/admin_storefront_hero_slides_list_controller.js'),
        ])
        .as('admin.storefront_hero.list')
        .use(guard(middleware))
    })
    .use(middleware.can({ permission: 'storefront.view' }))

  router
    .group(() => {
      router
        .post('storefront/hero-slides', [
          () => import('./controllers/admin_storefront_hero_slides_store_controller.js'),
        ])
        .as('admin.storefront_hero.store')
        .use(guard(middleware))
    })
    .use(middleware.can({ permission: 'storefront.create' }))

  router
    .group(() => {
      router
        .put('storefront/hero-slides/reorder', [
          () => import('./controllers/admin_storefront_hero_slides_reorder_controller.js'),
        ])
        .as('admin.storefront_hero.reorder')
        .use(guard(middleware))
      router
        .put('storefront/hero-slides/:id', [
          () => import('./controllers/admin_storefront_hero_slides_update_controller.js'),
        ])
        .as('admin.storefront_hero.update')
        .use(guard(middleware))
    })
    .use(middleware.can({ permission: 'storefront.edit' }))

  router
    .group(() => {
      router
        .post('storefront/hero-slides/:id/image', [
          () => import('./controllers/admin_storefront_hero_slide_image_store_controller.js'),
        ])
        .as('admin.storefront_hero.image.store')
        .use(guard(middleware))
      router
        .delete('storefront/hero-slides/:id/image', [
          () => import('./controllers/admin_storefront_hero_slide_image_delete_controller.js'),
        ])
        .as('admin.storefront_hero.image.delete')
        .use(guard(middleware))
    })
    .use(middleware.can({ permission: 'storefront.upload' }))

  router
    .group(() => {
      router
        .delete('storefront/hero-slides/:id', [
          () => import('./controllers/admin_storefront_hero_slides_delete_controller.js'),
        ])
        .as('admin.storefront_hero.delete')
        .use(guard(middleware))
    })
    .use(middleware.can({ permission: 'storefront.archive' }))
}

export function storefront(router: PluginRouter, middleware: PluginMiddleware) {
  router
    .get('store/hero-slides', [
      () => import('./controllers/storefront_hero_slides_list_controller.js'),
    ])
    .as('storefront.hero_slides.list')
    .use(guard(middleware))
}
