/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| Back-office routes live under /admin and use the `web` guard (Users).
| Storefront routes live under / and /account and use the `customer`
| guard (Customers).
|
*/

import { middleware } from '#start/kernel'
import { registeredPlugins } from '#plugin_host/registry'
import {
  accountPasswordThrottle,
  analyticsEventThrottle,
  analyticsExportThrottle,
  catalogSessionThrottle,
  catalogThrottle,
  catalogTokenThrottle,
  checkoutThrottle,
  emailResendThrottle,
  forgotPasswordEmailThrottle,
  forgotPasswordThrottle,
  impersonationThrottle,
  loginThrottle,
  marketThrottle,
  newsletterEmailThrottle,
  newsletterThrottle,
  orderDocumentThrottle,
  orderNoteReplyThrottle,
  otpThrottle,
  paymentProofThrottle,
  paymentThrottle,
  placesThrottle,
  pricingThrottle,
  productReviewThrottle,
  csvThrottles,
  returnRequestThrottle,
  searchThrottle,
  setupThrottle,
  signupThrottle,
  socialAuthThrottle,
  supportThreadViewThrottle,
  supportTicketEmailThrottle,
  supportTicketReplyThrottle,
  supportTicketStoreThrottle,
  webhookThrottle,
  wishlistThrottle,
} from '#start/limiter'
import { SOCIAL_INTENTS, SOCIAL_PROVIDERS } from '#constants/social_providers'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'

type RouteHandler = Parameters<typeof router.get>[1]

/**
 * CSV import (sample download + upload) and export routes of a back-office
 * resource, guarded by `<resource>.import` / `<resource>.export` and the
 * resource's own throttles. Register inside the `web` auth group.
 */
function csvTransferRoutes(
  resource: 'products' | 'collections' | 'product_types' | 'vendors' | 'options' | 'locations',
  path: string,
  handlers: { sample: RouteHandler; store: RouteHandler; export: RouteHandler }
) {
  const throttles = csvThrottles(resource)

  router
    .group(() => {
      router.get(`${path}/import/sample`, handlers.sample).as(`admin.${resource}.import.sample`)
      router
        .post(`${path}/import`, handlers.store)
        .as(`admin.${resource}.import.store`)
        .use(throttles.import)
    })
    .use(middleware.can({ permission: `${resource}.import` }))

  router
    .get(`${path}/export`, handlers.export)
    .as(`admin.${resource}.export`)
    .use([middleware.can({ permission: `${resource}.export` }), throttles.export])
}

router.get('/', [controllers.storefront.StorefrontHome]).as('home').use(catalogThrottle)

/*
|--------------------------------------------------------------------------
| Admin (back office)
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router
      .group(() => {
        router.get('login', [controllers.admin.AdminSessionCreate]).as('admin.session.create')
        router
          .post('login', [controllers.admin.AdminSessionStore])
          .as('admin.session.store')
          .use([loginThrottle, middleware.recaptcha({ action: 'admin_login' })])
        router
          .post('login/mfa', [controllers.admin.AdminSessionMfaStore])
          .as('admin.session.mfa.store')
          .use([otpThrottle, middleware.recaptcha({ action: 'admin_login_mfa' })])
        router.get('setup', [controllers.admin.AdminSetupCreate]).as('admin.setup.create')
        router.get('setup/view', [controllers.admin.AdminSetupView]).as('admin.setup.view')
        router
          .post('setup', [controllers.admin.AdminSetupStore])
          .as('admin.setup.store')
          .use([setupThrottle, middleware.recaptcha({ action: 'admin_setup' })])
      })
      .use(middleware.guest({ guards: ['web'] }))

    /*
     * The signed-in User's own account. Outside `requireMfa` so staff can
     * turn MFA on when the store requires it.
     */
    router
      .group(() => {
        router.post('logout', [controllers.admin.AdminSessionDelete]).as('admin.session.delete')
        router.get('me', [controllers.admin.AdminMeView]).as('admin.me.view')
        router.get('account', [controllers.admin.AdminAccountHome]).as('admin.account.home')
        router
          .put('account/profile', [controllers.admin.AdminAccountProfileUpdate])
          .as('admin.account.profile.update')
          .use(accountPasswordThrottle)
        router
          .get('account/security/view', [controllers.admin.AdminAccountSecurityView])
          .as('admin.account.security.view')
        router
          .post('account/mfa/setup', [controllers.admin.AdminAccountMfaSetupStore])
          .as('admin.account.mfa.setup.store')
        router
          .post('account/mfa', [controllers.admin.AdminAccountMfaStore])
          .as('admin.account.mfa.store')
          .use(otpThrottle)
        router
          .delete('account/mfa', [controllers.admin.AdminAccountMfaDelete])
          .as('admin.account.mfa.delete')
          .use(otpThrottle)
        router
          .put('account/password', [controllers.admin.AdminAccountPasswordUpdate])
          .as('admin.account.password.update')
          .use(accountPasswordThrottle)
      })
      .use([middleware.auth({ guards: ['web'] }), middleware.auditActor()])

    router
      .group(() => {
        router.on('/').redirect('admin.dashboard.home').as('admin.home')
        router.get('dashboard', [controllers.admin.AdminDashboardHome]).as('admin.dashboard.home')

        router
          .group(() => {
            router
              .get('analytics', [controllers.admin.AdminAnalyticsHome])
              .as('admin.analytics.home')
            router
              .get('analytics/view', [controllers.admin.AdminAnalyticsView])
              .as('admin.analytics.view')
            router
              .get('analytics/reports', [controllers.admin.AdminAnalyticsReportsHome])
              .as('admin.analytics.reports.home')
            router
              .get('analytics/reports/list', [controllers.admin.AdminAnalyticsReportsList])
              .as('admin.analytics.reports.list')
            router
              .get('analytics/reports/:key', [controllers.admin.AdminAnalyticsReportsShow])
              .as('admin.analytics.reports.show')
            router
              .get('analytics/reports/:key/view', [controllers.admin.AdminAnalyticsReportsView])
              .as('admin.analytics.reports.view')
            router
              .get('analytics/live', [controllers.admin.AdminAnalyticsLiveHome])
              .as('admin.analytics.live.home')
            router
              .get('analytics/live/view', [controllers.admin.AdminAnalyticsLiveView])
              .as('admin.analytics.live.view')
          })
          .use(middleware.can({ permission: 'analytics.view' }))
        router
          .get('analytics/reports/:key/export', [controllers.admin.AdminAnalyticsReportsExport])
          .as('admin.analytics.reports.export')
          .use([middleware.can({ permission: 'analytics.export' }), analyticsExportThrottle])

        router
          .group(() => {
            router.get('users', [controllers.admin.AdminUsersHome]).as('admin.users.home')
            router.get('users/list', [controllers.admin.AdminUsersList]).as('admin.users.list')
            router.get('users/roles', [controllers.admin.AdminUsersRoles]).as('admin.users.roles')
            router.get('users/show/:id', [controllers.admin.AdminUsersShow]).as('admin.users.show')
            router.get('users/view/:id', [controllers.admin.AdminUsersView]).as('admin.users.view')
            router
              .get('users/:id/activity', [controllers.admin.AdminUserActivityList])
              .as('admin.users.activity.list')
          })
          .use(middleware.can({ permission: 'users.view' }))

        router
          .group(() => {
            router.get('users/edit/:id', [controllers.admin.AdminUsersEdit]).as('admin.users.edit')
            router.put('users/:id', [controllers.admin.AdminUsersUpdate]).as('admin.users.update')
          })
          .use(middleware.can({ permission: 'users.edit' }))

        router
          .group(() => {
            router
              .get('users/create', [controllers.admin.AdminUsersCreate])
              .as('admin.users.create')
            router.post('users', [controllers.admin.AdminUsersStore]).as('admin.users.store')
          })
          .use(middleware.can({ permission: 'users.create' }))

        router
          .group(() => {
            router.get('roles', [controllers.admin.AdminRolesHome]).as('admin.roles.home')
            router
              .get('roles/matrix', [controllers.admin.AdminRolesMatrix])
              .as('admin.roles.matrix')
          })
          .use(middleware.can({ permission: 'roles.view' }))

        router
          .group(() => {
            router.get('products', [controllers.admin.AdminProductsHome]).as('admin.products.home')
            router
              .get('products/list', [controllers.admin.AdminProductsList])
              .as('admin.products.list')
            router
              .get('products/facets', [controllers.admin.AdminProductsFacets])
              .as('admin.products.facets')
            router
              .get('products/markets', [controllers.admin.AdminPricingMarketsList])
              .as('admin.products.markets.list')
            router
              .get('products/view/:id', [controllers.admin.AdminProductsView])
              .as('admin.products.view')
            router
              .get('products/:id/activity', [controllers.admin.AdminProductActivityList])
              .as('admin.products.activity.list')
            router
              .get('products/:productId/variants/view/:id', [controllers.admin.AdminVariantsView])
              .as('admin.products.variants.view')
            router
              .get('products/:id/reviews/list', [controllers.admin.AdminProductReviewsList])
              .as('admin.products.reviews.list')
            router
              .get('options/catalog', [controllers.admin.AdminOptionsCatalog])
              .as('admin.options.catalog')
          })
          .use(middleware.can({ permission: 'products.view' }))

        router
          .group(() => {
            router
              .get('products/create', [controllers.admin.AdminProductsCreate])
              .as('admin.products.create')
            router
              .post('products', [controllers.admin.AdminProductsStore])
              .as('admin.products.store')
          })
          .use(middleware.can({ permission: 'products.create' }))

        router
          .group(() => {
            router
              .get('products/edit/:id', [controllers.admin.AdminProductsEdit])
              .as('admin.products.edit')
            router
              .put('products/:id', [controllers.admin.AdminProductsUpdate])
              .as('admin.products.update')
            router
              .put('products/:id/options', [controllers.admin.AdminProductOptionsUpdate])
              .as('admin.products.options.update')
            router
              .get('products/:productId/variants/create', [controllers.admin.AdminVariantsCreate])
              .as('admin.products.variants.create')
            router
              .post('products/:productId/variants', [controllers.admin.AdminVariantsStore])
              .as('admin.products.variants.store')
            router
              .get('products/:productId/variants/edit/:id', [controllers.admin.AdminVariantsEdit])
              .as('admin.products.variants.edit')
            router
              .put('products/:productId/variants/:id', [controllers.admin.AdminVariantsUpdate])
              .as('admin.products.variants.update')
            router
              .delete('products/:productId/variants/:id', [controllers.admin.AdminVariantsDelete])
              .as('admin.products.variants.delete')
            router
              .put('products/bulk/status', [controllers.admin.AdminProductsBulkStatus])
              .as('admin.products.bulk.status.update')
            router
              .put('products/:productId/reviews/:id', [controllers.admin.AdminProductReviewsUpdate])
              .as('admin.products.reviews.update')
          })
          .use(middleware.can({ permission: 'products.edit' }))

        router
          .group(() => {
            router
              .put('products/bulk/archive', [controllers.admin.AdminProductsBulkArchive])
              .as('admin.products.bulk.archive.update')
            router
              .post('products/:id/archive', [controllers.admin.AdminProductsArchive])
              .as('admin.products.archive')
            router
              .post('products/:id/unarchive', [controllers.admin.AdminProductsUnarchive])
              .as('admin.products.unarchive')
          })
          .use(middleware.can({ permission: 'products.archive' }))

        router
          .post('products/images', [controllers.admin.AdminProductImagesStore])
          .as('admin.products.images.store')
          .use(middleware.can({ permission: 'products.upload' }))

        csvTransferRoutes('products', 'products', {
          sample: [controllers.admin.AdminProductsImportSample],
          store: [controllers.admin.AdminProductsImportStore],
          export: [controllers.admin.AdminProductsExport],
        })

        router
          .group(() => {
            router
              .get('collections', [controllers.admin.AdminCollectionsHome])
              .as('admin.collections.home')
            router
              .get('collections/list', [controllers.admin.AdminCollectionsList])
              .as('admin.collections.list')
            router
              .get('collections/view/:id', [controllers.admin.AdminCollectionsView])
              .as('admin.collections.view')
            router
              .get('collections/:id/products/list', [controllers.admin.AdminCollectionProductsList])
              .as('admin.collections.products.list')
            router
              .post('collections/preview', [controllers.admin.AdminCollectionsPreview])
              .as('admin.collections.preview')
          })
          .use(middleware.can({ permission: 'collections.view' }))

        router
          .group(() => {
            router
              .get('collections/create', [controllers.admin.AdminCollectionsCreate])
              .as('admin.collections.create')
            router
              .post('collections', [controllers.admin.AdminCollectionsStore])
              .as('admin.collections.store')
          })
          .use(middleware.can({ permission: 'collections.create' }))

        router
          .group(() => {
            router
              .put('collections/bulk/status', [controllers.admin.AdminCollectionsBulkStatus])
              .as('admin.collections.bulk.status.update')
            router
              .get('collections/edit/:id', [controllers.admin.AdminCollectionsEdit])
              .as('admin.collections.edit')
            router
              .put('collections/:id', [controllers.admin.AdminCollectionsUpdate])
              .as('admin.collections.update')
            router
              .post('collections/:id/products', [controllers.admin.AdminCollectionProductsStore])
              .as('admin.collections.products.store')
            router
              .put('collections/:id/products/reorder', [
                controllers.admin.AdminCollectionProductsReorder,
              ])
              .as('admin.collections.products.reorder')
            router
              .delete('collections/:collectionId/products/:id', [
                controllers.admin.AdminCollectionProductsDelete,
              ])
              .as('admin.collections.products.delete')
          })
          .use(middleware.can({ permission: 'collections.edit' }))

        router
          .group(() => {
            router
              .put('collections/bulk/archive', [controllers.admin.AdminCollectionsBulkArchive])
              .as('admin.collections.bulk.archive.update')
            router
              .post('collections/:id/archive', [controllers.admin.AdminCollectionsArchive])
              .as('admin.collections.archive')
            router
              .post('collections/:id/unarchive', [controllers.admin.AdminCollectionsUnarchive])
              .as('admin.collections.unarchive')
          })
          .use(middleware.can({ permission: 'collections.archive' }))

        router
          .group(() => {
            router
              .post('collections/:id/image', [controllers.admin.AdminCollectionImageStore])
              .as('admin.collections.image.store')
            router
              .delete('collections/:id/image', [controllers.admin.AdminCollectionImageDelete])
              .as('admin.collections.image.delete')
          })
          .use(middleware.can({ permission: 'collections.upload' }))

        csvTransferRoutes('collections', 'collections', {
          sample: [controllers.admin.AdminCollectionsImportSample],
          store: [controllers.admin.AdminCollectionsImportStore],
          export: [controllers.admin.AdminCollectionsExport],
        })

        router
          .group(() => {
            router.get('pages', [controllers.admin.AdminPagesHome]).as('admin.pages.home')
            router.get('pages/list', [controllers.admin.AdminPagesList]).as('admin.pages.list')
            router.get('pages/view/:id', [controllers.admin.AdminPagesView]).as('admin.pages.view')
          })
          .use(middleware.can({ permission: 'pages.view' }))

        router
          .group(() => {
            router
              .get('pages/create', [controllers.admin.AdminPagesCreate])
              .as('admin.pages.create')
            router.post('pages', [controllers.admin.AdminPagesStore]).as('admin.pages.store')
          })
          .use(middleware.can({ permission: 'pages.create' }))

        router
          .group(() => {
            router
              .put('pages/bulk/status', [controllers.admin.AdminPagesBulkStatus])
              .as('admin.pages.bulk.status.update')
            router.get('pages/edit/:id', [controllers.admin.AdminPagesEdit]).as('admin.pages.edit')
            router.put('pages/:id', [controllers.admin.AdminPagesUpdate]).as('admin.pages.update')
          })
          .use(middleware.can({ permission: 'pages.edit' }))

        router
          .group(() => {
            router
              .put('pages/bulk/archive', [controllers.admin.AdminPagesBulkArchive])
              .as('admin.pages.bulk.archive.update')
            router
              .post('pages/:id/archive', [controllers.admin.AdminPagesArchive])
              .as('admin.pages.archive')
            router
              .post('pages/:id/unarchive', [controllers.admin.AdminPagesUnarchive])
              .as('admin.pages.unarchive')
          })
          .use(middleware.can({ permission: 'pages.archive' }))

        router
          .put('products/:productId/variants/:id/inventory', [
            controllers.admin.AdminVariantInventoryUpdate,
          ])
          .as('admin.products.variants.inventory.update')
          .use(middleware.can({ permission: 'inventory.edit' }))

        router
          .group(() => {
            router.get('options', [controllers.admin.AdminOptionsHome]).as('admin.options.home')
            router
              .get('options/list', [controllers.admin.AdminOptionsList])
              .as('admin.options.list')
            router
              .get('options/view/:id', [controllers.admin.AdminOptionsView])
              .as('admin.options.view')
          })
          .use(middleware.can({ permission: 'options.view' }))

        router
          .get('options/edit/:id', [controllers.admin.AdminOptionsEdit])
          .as('admin.options.edit')
          .use(middleware.can({ permission: 'options.edit' }))

        router
          .post('options', [controllers.admin.AdminOptionsStore])
          .as('admin.options.store')
          .use(middleware.can({ permission: 'options.create' }))

        router
          .put('options/:id', [controllers.admin.AdminOptionsUpdate])
          .as('admin.options.update')
          .use(middleware.can({ permission: 'options.edit' }))

        router
          .group(() => {
            router
              .put('options/bulk/archive', [controllers.admin.AdminOptionsBulkArchive])
              .as('admin.options.bulk.archive.update')
            router
              .post('options/:id/archive', [controllers.admin.AdminOptionsArchive])
              .as('admin.options.archive')
            router
              .post('options/:id/unarchive', [controllers.admin.AdminOptionsUnarchive])
              .as('admin.options.unarchive')
          })
          .use(middleware.can({ permission: 'options.archive' }))

        csvTransferRoutes('options', 'options', {
          sample: [controllers.admin.AdminOptionsImportSample],
          store: [controllers.admin.AdminOptionsImportStore],
          export: [controllers.admin.AdminOptionsExport],
        })

        router
          .post('options/:id/values', [controllers.admin.AdminOptionValuesStore])
          .as('admin.options.values.store')
          .use(middleware.can({ permission: 'options.edit' }))

        router
          .put('options/:id/values/:valueId', [controllers.admin.AdminOptionValuesUpdate])
          .as('admin.options.values.update')
          .use(middleware.can({ permission: 'options.edit' }))

        router
          .delete('options/:id/values/:valueId', [controllers.admin.AdminOptionValuesDelete])
          .as('admin.options.values.delete')
          .use(middleware.can({ permission: 'options.edit' }))

        router
          .group(() => {
            router
              .get('product-types', [controllers.admin.AdminProductTypesHome])
              .as('admin.product_types.home')
            router
              .get('product-types/list', [controllers.admin.AdminProductTypesList])
              .as('admin.product_types.list')
          })
          .use(middleware.can({ permission: 'product_types.view' }))

        router
          .post('product-types', [controllers.admin.AdminProductTypesStore])
          .as('admin.product_types.store')
          .use(middleware.can({ permission: 'product_types.create' }))

        router
          .put('product-types/:id', [controllers.admin.AdminProductTypesUpdate])
          .as('admin.product_types.update')
          .use(middleware.can({ permission: 'product_types.edit' }))

        router
          .group(() => {
            router
              .put('product-types/bulk/archive', [controllers.admin.AdminProductTypesBulkArchive])
              .as('admin.product_types.bulk.archive.update')
            router
              .post('product-types/:id/archive', [controllers.admin.AdminProductTypesArchive])
              .as('admin.product_types.archive')
            router
              .post('product-types/:id/unarchive', [controllers.admin.AdminProductTypesUnarchive])
              .as('admin.product_types.unarchive')
          })
          .use(middleware.can({ permission: 'product_types.archive' }))

        csvTransferRoutes('product_types', 'product-types', {
          sample: [controllers.admin.AdminProductTypesImportSample],
          store: [controllers.admin.AdminProductTypesImportStore],
          export: [controllers.admin.AdminProductTypesExport],
        })

        router
          .group(() => {
            router
              .get('product-labels', [controllers.admin.AdminProductLabelsHome])
              .as('admin.product_labels.home')
            router
              .get('product-labels/list', [controllers.admin.AdminProductLabelsList])
              .as('admin.product_labels.list')
          })
          .use(middleware.can({ permission: 'product_labels.view' }))

        router
          .post('product-labels', [controllers.admin.AdminProductLabelsStore])
          .as('admin.product_labels.store')
          .use(middleware.can({ permission: 'product_labels.create' }))

        router
          .put('product-labels/:id', [controllers.admin.AdminProductLabelsUpdate])
          .as('admin.product_labels.update')
          .use(middleware.can({ permission: 'product_labels.edit' }))

        router
          .group(() => {
            router
              .put('product-labels/bulk/archive', [controllers.admin.AdminProductLabelsBulkArchive])
              .as('admin.product_labels.bulk.archive.update')
            router
              .post('product-labels/:id/archive', [controllers.admin.AdminProductLabelsArchive])
              .as('admin.product_labels.archive')
            router
              .post('product-labels/:id/unarchive', [controllers.admin.AdminProductLabelsUnarchive])
              .as('admin.product_labels.unarchive')
          })
          .use(middleware.can({ permission: 'product_labels.archive' }))

        // Every staff User can browse and upload media; MediaPolicy limits deletes to admins.
        router.get('media', [controllers.admin.AdminMediaHome]).as('admin.media.home')
        router.get('media/list', [controllers.admin.AdminMediaList]).as('admin.media.list')
        router.post('media', [controllers.admin.AdminMediaStore]).as('admin.media.store')
        router.delete('media/:id', [controllers.admin.AdminMediaDelete]).as('admin.media.delete')

        router
          .group(() => {
            router.get('vendors', [controllers.admin.AdminVendorsHome]).as('admin.vendors.home')
            router
              .get('vendors/list', [controllers.admin.AdminVendorsList])
              .as('admin.vendors.list')
          })
          .use(middleware.can({ permission: 'vendors.view' }))

        router
          .post('vendors', [controllers.admin.AdminVendorsStore])
          .as('admin.vendors.store')
          .use(middleware.can({ permission: 'vendors.create' }))

        router
          .put('vendors/:id', [controllers.admin.AdminVendorsUpdate])
          .as('admin.vendors.update')
          .use(middleware.can({ permission: 'vendors.edit' }))

        router
          .group(() => {
            router
              .post('vendors/:id/image', [controllers.admin.AdminVendorImageStore])
              .as('admin.vendors.image.store')
            router
              .delete('vendors/:id/image', [controllers.admin.AdminVendorImageDelete])
              .as('admin.vendors.image.delete')
          })
          .use(middleware.can({ permission: 'vendors.upload' }))

        router
          .group(() => {
            router
              .put('vendors/bulk/archive', [controllers.admin.AdminVendorsBulkArchive])
              .as('admin.vendors.bulk.archive.update')
            router
              .post('vendors/:id/archive', [controllers.admin.AdminVendorsArchive])
              .as('admin.vendors.archive')
            router
              .post('vendors/:id/unarchive', [controllers.admin.AdminVendorsUnarchive])
              .as('admin.vendors.unarchive')
          })
          .use(middleware.can({ permission: 'vendors.archive' }))

        csvTransferRoutes('vendors', 'vendors', {
          sample: [controllers.admin.AdminVendorsImportSample],
          store: [controllers.admin.AdminVendorsImportStore],
          export: [controllers.admin.AdminVendorsExport],
        })

        router
          .group(() => {
            router
              .get('locations', [controllers.admin.AdminLocationsHome])
              .as('admin.locations.home')
            router
              .get('locations/list', [controllers.admin.AdminLocationsList])
              .as('admin.locations.list')
          })
          .use(middleware.can({ permission: 'locations.view' }))

        router
          .post('locations', [controllers.admin.AdminLocationsStore])
          .as('admin.locations.store')
          .use(middleware.can({ permission: 'locations.create' }))
        router
          .put('locations/:id', [controllers.admin.AdminLocationsUpdate])
          .as('admin.locations.update')
          .use(middleware.can({ permission: 'locations.edit' }))

        router
          .group(() => {
            router
              .put('locations/bulk/archive', [controllers.admin.AdminLocationsBulkArchive])
              .as('admin.locations.bulk.archive.update')
            router
              .post('locations/:id/archive', [controllers.admin.AdminLocationsArchive])
              .as('admin.locations.archive')
            router
              .post('locations/:id/unarchive', [controllers.admin.AdminLocationsUnarchive])
              .as('admin.locations.unarchive')
          })
          .use(middleware.can({ permission: 'locations.archive' }))

        csvTransferRoutes('locations', 'locations', {
          sample: [controllers.admin.AdminLocationsImportSample],
          store: [controllers.admin.AdminLocationsImportStore],
          export: [controllers.admin.AdminLocationsExport],
        })

        router
          .group(() => {
            router
              .get('dashboard/view', [controllers.admin.AdminDashboardView])
              .as('admin.dashboard.view')
            router.get('orders', [controllers.admin.AdminOrdersHome]).as('admin.orders.home')
            router.get('orders/list', [controllers.admin.AdminOrdersList]).as('admin.orders.list')
            router
              .get('orders/show/:id', [controllers.admin.AdminOrdersShow])
              .as('admin.orders.show')
            router
              .get('orders/view/:id', [controllers.admin.AdminOrdersView])
              .as('admin.orders.view')
            router
              .get('orders/:id/activity', [controllers.admin.AdminOrderActivityList])
              .as('admin.orders.activity.list')
            router
              .get('orders/variants/search', [controllers.admin.AdminOrdersVariantsSearch])
              .as('admin.orders.variants.search')
            router
              .get('orders/drafts', [controllers.admin.AdminDraftOrdersHome])
              .as('admin.orders.drafts.home')
            router
              .get('orders/drafts/list', [controllers.admin.AdminDraftOrdersList])
              .as('admin.orders.drafts.list')
            router
              .get('orders/drafts/view/:id', [controllers.admin.AdminDraftOrdersView])
              .as('admin.orders.drafts.view')
            router
              .get('orders/:id/returns', [controllers.admin.AdminOrderReturnsList])
              .as('admin.orders.returns.list')
            router
              .get('orders/:id/notes/list', [controllers.admin.AdminOrderNotesList])
              .as('admin.orders.notes.list')
            router
              .get('orders/:id/payment-proof/image', [
                controllers.admin.AdminOrderPaymentProofImageView,
              ])
              .as('admin.orders.payment_proof.image.view')
            router
              .get('orders/:id/invoice', [controllers.admin.AdminOrderInvoiceView])
              .as('admin.orders.invoice.view')
              .use(orderDocumentThrottle)
            router
              .get('orders/:id/receipt', [controllers.admin.AdminOrderReceiptView])
              .as('admin.orders.receipt.view')
              .use(orderDocumentThrottle)
            router
              .get('orders/:id/packing-slip', [controllers.admin.AdminOrderPackingSlipView])
              .as('admin.orders.packing_slip.view')
              .use(orderDocumentThrottle)
            router.get('returns', [controllers.admin.AdminReturnsHome]).as('admin.returns.home')
            router
              .get('returns/list', [controllers.admin.AdminReturnsList])
              .as('admin.returns.list')
          })
          .use(middleware.can({ permission: 'orders.view' }))

        router
          .group(() => {
            router
              .get('orders/drafts/create', [controllers.admin.AdminDraftOrdersCreate])
              .as('admin.orders.drafts.create')
            router
              .post('orders/drafts', [controllers.admin.AdminDraftOrdersStore])
              .as('admin.orders.drafts.store')
            router
              .post('orders/drafts/calculate', [controllers.admin.AdminDraftOrdersCalculate])
              .as('admin.orders.drafts.calculate')
          })
          .use(middleware.can({ permission: 'orders.create' }))

        router
          .group(() => {
            router
              .get('orders/drafts/edit/:id', [controllers.admin.AdminDraftOrdersEdit])
              .as('admin.orders.drafts.edit')
            router
              .put('orders/drafts/:id', [controllers.admin.AdminDraftOrdersUpdate])
              .as('admin.orders.drafts.update')
            router
              .post('orders/drafts/:id/complete', [controllers.admin.AdminDraftOrdersComplete])
              .as('admin.orders.drafts.complete')
            router
              .put('orders/:id', [controllers.admin.AdminOrdersUpdate])
              .as('admin.orders.update')
            router
              .post('orders/:id/fulfillments', [controllers.admin.AdminOrderFulfillmentsStore])
              .as('admin.orders.fulfillments.store')
            router
              .put('orders/:id/fulfillment-status', [
                controllers.admin.AdminOrdersFulfillmentStatusUpdate,
              ])
              .as('admin.orders.fulfillment_status.update')
            router
              .put('fulfillments/:id', [controllers.admin.AdminFulfillmentsUpdate])
              .as('admin.fulfillments.update')
            router
              .put('fulfillments/:id/cancel', [controllers.admin.AdminFulfillmentsCancel])
              .as('admin.fulfillments.cancel.update')
            router
              .post('orders/:id/returns', [controllers.admin.AdminOrderReturnsStore])
              .as('admin.orders.returns.store')
            router
              .post('orders/:id/notes', [controllers.admin.AdminOrderNotesStore])
              .as('admin.orders.notes.store')
            router
              .put('orders/:id/payment-proof/review', [
                controllers.admin.AdminOrderPaymentProofReviewUpdate,
              ])
              .as('admin.orders.payment_proof.review.update')
            router
              .put('returns/:id/approve', [controllers.admin.AdminReturnsApprove])
              .as('admin.returns.approve.update')
            router
              .put('returns/:id/decline', [controllers.admin.AdminReturnsDecline])
              .as('admin.returns.decline.update')
            router
              .put('returns/:id/receive', [controllers.admin.AdminReturnsReceive])
              .as('admin.returns.receive.update')
            router
              .put('returns/:id/cancel', [controllers.admin.AdminReturnsCancel])
              .as('admin.returns.cancel.update')
          })
          .use(middleware.can({ permission: 'orders.edit' }))

        router
          .group(() => {
            router
              .post('orders/:id/refunds/calculate', [controllers.admin.AdminOrderRefundsCalculate])
              .as('admin.orders.refunds.calculate')
            router
              .post('orders/:id/refunds', [controllers.admin.AdminOrderRefundsStore])
              .as('admin.orders.refunds.store')
            router
              .post('orders/:id/cancel', [controllers.admin.AdminOrdersCancel])
              .as('admin.orders.cancel')
          })
          .use(middleware.can({ permission: 'refunds.create' }))

        router
          .group(() => {
            router
              .delete('orders/drafts/:id', [controllers.admin.AdminDraftOrdersDelete])
              .as('admin.orders.drafts.delete')
            router
              .put('orders/bulk/archive', [controllers.admin.AdminOrdersBulkArchive])
              .as('admin.orders.bulk.archive.update')
            router
              .post('orders/:id/archive', [controllers.admin.AdminOrdersArchive])
              .as('admin.orders.archive')
            router
              .post('orders/:id/unarchive', [controllers.admin.AdminOrdersUnarchive])
              .as('admin.orders.unarchive')
          })
          .use(middleware.can({ permission: 'orders.archive' }))

        router
          .group(() => {
            router
              .get('discounts', [controllers.admin.AdminDiscountsHome])
              .as('admin.discounts.home')
            router
              .get('discounts/list', [controllers.admin.AdminDiscountsList])
              .as('admin.discounts.list')
            router
              .get('discounts/view/:id', [controllers.admin.AdminDiscountsView])
              .as('admin.discounts.view')
          })
          .use(middleware.can({ permission: 'discounts.view' }))

        router
          .group(() => {
            router
              .get('discounts/create', [controllers.admin.AdminDiscountsCreate])
              .as('admin.discounts.create')
            router
              .post('discounts', [controllers.admin.AdminDiscountsStore])
              .as('admin.discounts.store')
          })
          .use(middleware.can({ permission: 'discounts.create' }))

        router
          .group(() => {
            router
              .get('discounts/edit/:id', [controllers.admin.AdminDiscountsEdit])
              .as('admin.discounts.edit')
            router
              .put('discounts/:id', [controllers.admin.AdminDiscountsUpdate])
              .as('admin.discounts.update')
          })
          .use(middleware.can({ permission: 'discounts.edit' }))

        router
          .group(() => {
            router
              .put('discounts/bulk/archive', [controllers.admin.AdminDiscountsBulkArchive])
              .as('admin.discounts.bulk.archive.update')
            router
              .post('discounts/:id/archive', [controllers.admin.AdminDiscountsArchive])
              .as('admin.discounts.archive')
            router
              .post('discounts/:id/unarchive', [controllers.admin.AdminDiscountsUnarchive])
              .as('admin.discounts.unarchive')
          })
          .use(middleware.can({ permission: 'discounts.archive' }))

        router
          .group(() => {
            router
              .get('marketing/newsletter', [controllers.admin.AdminNewsletterSubscribersHome])
              .as('admin.newsletter_subscribers.home')
            router
              .get('marketing/newsletter/list', [controllers.admin.AdminNewsletterSubscribersList])
              .as('admin.newsletter_subscribers.list')
          })
          .use(middleware.can({ permission: 'newsletter_subscribers.view' }))

        router
          .put('marketing/newsletter/bulk/subscription', [
            controllers.admin.AdminNewsletterSubscribersBulkSubscription,
          ])
          .as('admin.newsletter_subscribers.bulk.subscription.update')
          .use(middleware.can({ permission: 'newsletter_subscribers.edit' }))

        router
          .group(() => {
            router
              .get('settings', [controllers.admin.AdminStoreSettingsHome])
              .as('admin.store_settings.home')
            router
              .get('settings/view', [controllers.admin.AdminStoreSettingsView])
              .as('admin.store_settings.view')
          })
          .use(middleware.can({ permission: 'store_settings.view' }))

        router
          .group(() => {
            router
              .put('settings/business', [controllers.admin.AdminStoreSettingsBusinessUpdate])
              .as('admin.store_settings.business.update')
            router
              .put('settings/contact', [controllers.admin.AdminStoreSettingsContactUpdate])
              .as('admin.store_settings.contact.update')
            router
              .put('settings/address', [controllers.admin.AdminStoreSettingsAddressUpdate])
              .as('admin.store_settings.address.update')
            router
              .put('settings/defaults', [controllers.admin.AdminStoreSettingsDefaultsUpdate])
              .as('admin.store_settings.defaults.update')
            router
              .put('settings/notifications', [
                controllers.admin.AdminStoreSettingsNotificationsUpdate,
              ])
              .as('admin.store_settings.notifications.update')
            router
              .put('settings/checkout', [controllers.admin.AdminStoreSettingsCheckoutUpdate])
              .as('admin.store_settings.checkout.update')
          })
          .use(middleware.can({ permission: 'store_settings.edit' }))

        router
          .get('settings/maintenance/view', [controllers.admin.AdminMaintenanceView])
          .as('admin.maintenance.view')
          .use(middleware.can({ permission: 'maintenance.view' }))

        router
          .put('settings/maintenance', [controllers.admin.AdminMaintenanceUpdate])
          .as('admin.maintenance.update')
          .use(middleware.can({ permission: 'maintenance.edit' }))

        router
          .group(() => {
            router.get('emails', [controllers.admin.AdminEmailsHome]).as('admin.emails.home')
            router.get('emails/list', [controllers.admin.AdminEmailsList]).as('admin.emails.list')
            router
              .get('emails/show/:id', [controllers.admin.AdminEmailsShow])
              .as('admin.emails.show')
            router
              .get('emails/view/:id', [controllers.admin.AdminEmailsView])
              .as('admin.emails.view')
          })
          .use(middleware.can({ permission: 'emails.view' }))

        router
          .post('emails/:id/resend', [controllers.admin.AdminEmailsResendStore])
          .as('admin.emails.resend.store')
          .use(middleware.can({ permission: 'emails.create' }))

        router
          .group(() => {
            router
              .get('support/tickets', [controllers.admin.AdminSupportTicketsHome])
              .as('admin.support.tickets.home')
            router
              .get('support/tickets/list', [controllers.admin.AdminSupportTicketsList])
              .as('admin.support.tickets.list')
            router
              .get('support/tickets/open-count', [controllers.admin.AdminSupportTicketsOpenCount])
              .as('admin.support.tickets.open_count.view')
            router
              .get('support/tickets/assignees', [
                controllers.admin.AdminSupportTicketsAssigneesList,
              ])
              .as('admin.support.tickets.assignees.list')
            router
              .get('support/tickets/show/:id', [controllers.admin.AdminSupportTicketsShow])
              .as('admin.support.tickets.show')
            router
              .get('support/tickets/view/:id', [controllers.admin.AdminSupportTicketsView])
              .as('admin.support.tickets.view')
          })
          .use(middleware.can({ permission: 'support_tickets.view' }))

        router
          .group(() => {
            router
              .put('support/tickets/bulk/status', [controllers.admin.AdminSupportTicketsBulkStatus])
              .as('admin.support.tickets.bulk.status.update')
            router
              .post('support/tickets/:id/messages', [
                controllers.admin.AdminSupportTicketMessagesStore,
              ])
              .as('admin.support.tickets.messages.store')
            router
              .put('support/tickets/:id', [controllers.admin.AdminSupportTicketsUpdate])
              .as('admin.support.tickets.update')
          })
          .use(middleware.can({ permission: 'support_tickets.edit' }))

        router
          .group(() => {
            router
              .get('help/articles', [controllers.admin.AdminHelpArticlesHome])
              .as('admin.help_articles.home')
            router
              .get('help/articles/list', [controllers.admin.AdminHelpArticlesList])
              .as('admin.help_articles.list')
            router
              .get('help/articles/options', [controllers.admin.AdminHelpArticlesOptions])
              .as('admin.help_articles.options.list')
            router
              .get('help/articles/view/:id', [controllers.admin.AdminHelpArticlesView])
              .as('admin.help_articles.view')
            router
              .get('help/categories', [controllers.admin.AdminHelpCategoriesHome])
              .as('admin.help_categories.home')
            router
              .get('help/categories/list', [controllers.admin.AdminHelpCategoriesList])
              .as('admin.help_categories.list')
            router
              .get('help/categories/options', [controllers.admin.AdminHelpCategoriesOptions])
              .as('admin.help_categories.options.list')
            router
              .get('help/categories/view/:id', [controllers.admin.AdminHelpCategoriesView])
              .as('admin.help_categories.view')
          })
          .use(middleware.can({ permission: 'help_articles.view' }))

        router
          .post('help/articles/preview', [controllers.admin.AdminHelpArticlesPreview])
          .as('admin.help_articles.preview.store')
          .use(middleware.can({ anyOf: ['help_articles.create', 'help_articles.edit'] }))

        router
          .group(() => {
            router
              .get('help/articles/create', [controllers.admin.AdminHelpArticlesCreate])
              .as('admin.help_articles.create')
            router
              .post('help/articles', [controllers.admin.AdminHelpArticlesStore])
              .as('admin.help_articles.store')
            router
              .post('help/categories', [controllers.admin.AdminHelpCategoriesStore])
              .as('admin.help_categories.store')
          })
          .use(middleware.can({ permission: 'help_articles.create' }))

        router
          .group(() => {
            router
              .put('help/articles/bulk/status', [controllers.admin.AdminHelpArticlesBulkStatus])
              .as('admin.help_articles.bulk.status.update')
            router
              .get('help/articles/edit/:id', [controllers.admin.AdminHelpArticlesEdit])
              .as('admin.help_articles.edit')
            router
              .put('help/articles/:id', [controllers.admin.AdminHelpArticlesUpdate])
              .as('admin.help_articles.update')
            router
              .put('help/categories/:id', [controllers.admin.AdminHelpCategoriesUpdate])
              .as('admin.help_categories.update')
          })
          .use(middleware.can({ permission: 'help_articles.edit' }))

        router
          .group(() => {
            router
              .put('help/articles/bulk/archive', [controllers.admin.AdminHelpArticlesBulkArchive])
              .as('admin.help_articles.bulk.archive.update')
            router
              .post('help/articles/:id/archive', [controllers.admin.AdminHelpArticlesArchive])
              .as('admin.help_articles.archive')
            router
              .post('help/articles/:id/unarchive', [controllers.admin.AdminHelpArticlesUnarchive])
              .as('admin.help_articles.unarchive')
            router
              .put('help/categories/bulk/archive', [
                controllers.admin.AdminHelpCategoriesBulkArchive,
              ])
              .as('admin.help_categories.bulk.archive.update')
            router
              .post('help/categories/:id/archive', [controllers.admin.AdminHelpCategoriesArchive])
              .as('admin.help_categories.archive')
            router
              .post('help/categories/:id/unarchive', [
                controllers.admin.AdminHelpCategoriesUnarchive,
              ])
              .as('admin.help_categories.unarchive')
          })
          .use(middleware.can({ permission: 'help_articles.archive' }))

        router
          .group(() => {
            router
              .get('notifications/list', [controllers.admin.AdminNotificationsList])
              .as('admin.notifications.list')
            router
              .put('notifications/seen', [controllers.admin.AdminNotificationsSeenUpdate])
              .as('admin.notifications.seen.update')
            router
              .put('notifications/read-all', [controllers.admin.AdminNotificationsReadAllUpdate])
              .as('admin.notifications.read_all.update')
            router
              .put('notifications/:id/read', [controllers.admin.AdminNotificationsReadUpdate])
              .as('admin.notifications.read.update')
          })
          .use(middleware.can({ anyOf: ['orders.view', 'support_tickets.view'] }))

        router
          .group(() => {
            router.get('events', [controllers.admin.AdminEventsHome]).as('admin.events.home')
            router.get('events/list', [controllers.admin.AdminEventsList]).as('admin.events.list')
            router
              .get('events/view/:id', [controllers.admin.AdminEventsView])
              .as('admin.events.view')
          })
          .use(middleware.can({ permission: 'events.view' }))

        router
          .group(() => {
            router
              .post('events/retry-failed', [controllers.admin.AdminEventsRetryFailedStore])
              .as('admin.events.retry_failed.store')
            router
              .post('events/:id/retry', [controllers.admin.AdminEventsRetryStore])
              .as('admin.events.retry.store')
          })
          .use(middleware.can({ permission: 'events.edit' }))
          .use(emailResendThrottle)

        router
          .group(() => {
            router.get('payments', [controllers.admin.AdminPaymentsHome]).as('admin.payments.home')
            router
              .get('payments/list', [controllers.admin.AdminPaymentsList])
              .as('admin.payments.list')
            router
              .get('payments/markets', [controllers.admin.AdminPaymentsMarketsList])
              .as('admin.payments.markets.list')
            router
              .get('payments/bank-transfer/view', [controllers.admin.AdminPaymentsBankTransferView])
              .as('admin.payments.bank_transfer.view')
            router
              .get('payments/stripe/view', [controllers.admin.AdminPaymentsStripeView])
              .as('admin.payments.stripe.view')
            router
              .get('payments/poli/view', [controllers.admin.AdminPaymentsPoliView])
              .as('admin.payments.poli.view')
          })
          .use(middleware.can({ permission: 'payments.view' }))

        router
          .group(() => {
            router
              .put('payments/bank-transfer/:id', [
                controllers.admin.AdminPaymentsBankTransferUpdate,
              ])
              .as('admin.payments.bank_transfer.update')
            router
              .put('payments/stripe', [controllers.admin.AdminPaymentsStripeUpdate])
              .as('admin.payments.stripe.update')
            router
              .put('payments/poli', [controllers.admin.AdminPaymentsPoliUpdate])
              .as('admin.payments.poli.update')
          })
          .use(middleware.can({ permission: 'payments.edit' }))

        router
          .group(() => {
            router
              .get('storefront/theme', [controllers.admin.AdminStorefrontThemeHome])
              .as('admin.storefront_theme.home')
            router
              .get('storefront/theme/view', [controllers.admin.AdminStorefrontThemeView])
              .as('admin.storefront_theme.view')
            router
              .get('storefront/menu', [controllers.admin.AdminStorefrontMenuHome])
              .as('admin.storefront_menu.home')
            router
              .get('storefront/menu/list', [controllers.admin.AdminStorefrontMenuList])
              .as('admin.storefront_menu.list')
            router
              .get('storefront/menu/collections', [
                controllers.admin.AdminStorefrontMenuCollections,
              ])
              .as('admin.storefront_menu.collections')
            router
              .get('storefront/menu/pages', [controllers.admin.AdminStorefrontMenuPages])
              .as('admin.storefront_menu.pages')
            router
              .get('storefront/content', [controllers.admin.AdminStorefrontContentHome])
              .as('admin.storefront_content.home')
            router
              .get('storefront/promo-banners/list', [
                controllers.admin.AdminStorefrontPromoBannersList,
              ])
              .as('admin.storefront_promo_banners.list')
            router
              .get('storefront/features/list', [controllers.admin.AdminStorefrontFeaturesList])
              .as('admin.storefront_features.list')
            router
              .get('storefront/featured-reviews/list', [
                controllers.admin.AdminStorefrontFeaturedReviewsList,
              ])
              .as('admin.storefront_featured_reviews.list')
          })
          .use(middleware.can({ permission: 'storefront.view' }))

        router
          .group(() => {
            router
              .post('storefront/menu', [controllers.admin.AdminStorefrontMenuStore])
              .as('admin.storefront_menu.store')
            router
              .post('storefront/promo-banners', [
                controllers.admin.AdminStorefrontPromoBannersStore,
              ])
              .as('admin.storefront_promo_banners.store')
          })
          .use(middleware.can({ permission: 'storefront.create' }))

        router
          .group(() => {
            router
              .put('storefront/theme', [controllers.admin.AdminStorefrontThemeUpdate])
              .as('admin.storefront_theme.update')
            router
              .put('storefront/theme/brand', [controllers.admin.AdminStorefrontBrandUpdate])
              .as('admin.storefront_theme.brand.update')
            router
              .put('storefront/menu/reorder', [controllers.admin.AdminStorefrontMenuReorder])
              .as('admin.storefront_menu.reorder')
            router
              .put('storefront/menu/:id', [controllers.admin.AdminStorefrontMenuUpdate])
              .as('admin.storefront_menu.update')
            router
              .put('storefront/content', [controllers.admin.AdminStorefrontContentUpdate])
              .as('admin.storefront_content.update')
            router
              .put('storefront/promo-banners/reorder', [
                controllers.admin.AdminStorefrontPromoBannersReorder,
              ])
              .as('admin.storefront_promo_banners.reorder')
            router
              .put('storefront/promo-banners/:id', [
                controllers.admin.AdminStorefrontPromoBannersUpdate,
              ])
              .as('admin.storefront_promo_banners.update')
            router
              .put('storefront/features', [controllers.admin.AdminStorefrontFeaturesUpdate])
              .as('admin.storefront_features.update')
          })
          .use(middleware.can({ permission: 'storefront.edit' }))

        router
          .group(() => {
            router
              .post('storefront/theme/logo', [controllers.admin.AdminStorefrontLogoStore])
              .as('admin.storefront_theme.logo.store')
            router
              .delete('storefront/theme/logo', [controllers.admin.AdminStorefrontLogoDelete])
              .as('admin.storefront_theme.logo.delete')
            router
              .post('storefront/theme/favicon', [controllers.admin.AdminStorefrontFaviconStore])
              .as('admin.storefront_theme.favicon.store')
            router
              .delete('storefront/theme/favicon', [controllers.admin.AdminStorefrontFaviconDelete])
              .as('admin.storefront_theme.favicon.delete')
            router
              .post('storefront/promo-banners/:id/image', [
                controllers.admin.AdminStorefrontPromoBannerImageStore,
              ])
              .as('admin.storefront_promo_banners.image.store')
            router
              .delete('storefront/promo-banners/:id/image', [
                controllers.admin.AdminStorefrontPromoBannerImageDelete,
              ])
              .as('admin.storefront_promo_banners.image.delete')
          })
          .use(middleware.can({ permission: 'storefront.upload' }))

        router
          .group(() => {
            router
              .delete('storefront/menu/:id', [controllers.admin.AdminStorefrontMenuDelete])
              .as('admin.storefront_menu.delete')
            router
              .delete('storefront/promo-banners/:id', [
                controllers.admin.AdminStorefrontPromoBannersDelete,
              ])
              .as('admin.storefront_promo_banners.delete')
          })
          .use(middleware.can({ permission: 'storefront.archive' }))

        router
          .group(() => {
            router.get('plugins', [controllers.admin.AdminPluginsHome]).as('admin.plugins.home')
            router
              .get('plugins/list', [controllers.admin.AdminPluginsList])
              .as('admin.plugins.list')
          })
          .use(middleware.can({ permission: 'plugins.view' }))

        router
          .group(() => {
            router
              .post('plugins/:key/install', [controllers.admin.AdminPluginsInstall])
              .as('admin.plugins.install')
            router
              .delete('plugins/:key/install', [controllers.admin.AdminPluginsUninstall])
              .as('admin.plugins.uninstall')
          })
          .use(middleware.can({ permission: 'plugins.edit' }))

        router
          .group(() => {
            router.get('themes', [controllers.admin.AdminThemesHome]).as('admin.themes.home')
            router.get('themes/list', [controllers.admin.AdminThemesList]).as('admin.themes.list')
            router
              .get('themes/:id/preview', [controllers.admin.AdminThemesPreview])
              .as('admin.themes.preview')
            router
              .get('themes/:id/download', [controllers.admin.AdminThemesDownload])
              .as('admin.themes.download')
            router
              .post('themes/:id/share', [controllers.admin.AdminThemesShare])
              .as('admin.themes.share')
          })
          .use(middleware.can({ permission: 'themes.view' }))

        router
          .group(() => {
            router.post('themes', [controllers.admin.AdminThemesStore]).as('admin.themes.store')
          })
          .use(middleware.can({ permission: 'themes.upload' }))

        router
          .group(() => {
            router
              .post('themes/:id/duplicate', [controllers.admin.AdminThemesDuplicate])
              .as('admin.themes.duplicate')
            router.put('themes/:id', [controllers.admin.AdminThemesUpdate]).as('admin.themes.update')
            router
              .post('themes/:id/publish', [controllers.admin.AdminThemesPublish])
              .as('admin.themes.publish')
            router
              .delete('themes/:id/publish', [controllers.admin.AdminThemesUnpublish])
              .as('admin.themes.unpublish')
          })
          .use(middleware.can({ permission: 'themes.edit' }))

        router
          .delete('themes/:id', [controllers.admin.AdminThemesDelete])
          .as('admin.themes.delete')
          .use(middleware.can({ permission: 'themes.archive' }))

        router
          .group(() => {
            router.get('markets', [controllers.admin.AdminMarketsHome]).as('admin.markets.home')
            router
              .get('markets/list', [controllers.admin.AdminMarketsList])
              .as('admin.markets.list')
            router
              .get('markets/view/:id', [controllers.admin.AdminMarketsView])
              .as('admin.markets.view')
          })
          .use(middleware.can({ permission: 'markets.view' }))

        router
          .post('markets', [controllers.admin.AdminMarketsStore])
          .as('admin.markets.store')
          .use(middleware.can({ permission: 'markets.create' }))

        router
          .group(() => {
            router
              .get('markets/edit/:id', [controllers.admin.AdminMarketsEdit])
              .as('admin.markets.edit')
            router
              .put('markets/:id', [controllers.admin.AdminMarketsUpdate])
              .as('admin.markets.update')
          })
          .use(middleware.can({ permission: 'markets.edit' }))

        router
          .group(() => {
            router
              .put('markets/bulk/archive', [controllers.admin.AdminMarketsBulkArchive])
              .as('admin.markets.bulk.archive.update')
            router
              .post('markets/:id/archive', [controllers.admin.AdminMarketsArchive])
              .as('admin.markets.archive')
            router
              .post('markets/:id/unarchive', [controllers.admin.AdminMarketsUnarchive])
              .as('admin.markets.unarchive')
          })
          .use(middleware.can({ permission: 'markets.archive' }))

        router
          .group(() => {
            router.get('taxes', [controllers.admin.AdminTaxesHome]).as('admin.taxes.home')
            router.get('taxes/list', [controllers.admin.AdminTaxesList]).as('admin.taxes.list')
          })
          .use(middleware.can({ permission: 'taxes.view' }))

        router
          .post('taxes', [controllers.admin.AdminTaxesStore])
          .as('admin.taxes.store')
          .use(middleware.can({ permission: 'taxes.create' }))

        router
          .put('taxes/:id', [controllers.admin.AdminTaxesUpdate])
          .as('admin.taxes.update')
          .use(middleware.can({ permission: 'taxes.edit' }))

        router
          .group(() => {
            router
              .put('taxes/bulk/archive', [controllers.admin.AdminTaxesBulkArchive])
              .as('admin.taxes.bulk.archive.update')
            router
              .post('taxes/:id/archive', [controllers.admin.AdminTaxesArchive])
              .as('admin.taxes.archive')
            router
              .post('taxes/:id/unarchive', [controllers.admin.AdminTaxesUnarchive])
              .as('admin.taxes.unarchive')
          })
          .use(middleware.can({ permission: 'taxes.archive' }))

        router
          .group(() => {
            router.get('shipping', [controllers.admin.AdminShippingHome]).as('admin.shipping.home')
            router
              .get('shipping/list', [controllers.admin.AdminShippingList])
              .as('admin.shipping.list')
            router
              .get('shipping/markets', [controllers.admin.AdminPricingMarketsList])
              .as('admin.shipping.markets.list')
            router
              .get('shipping/regions', [controllers.admin.AdminShippingRegionsList])
              .as('admin.shipping.regions.list')
            router
              .get('shipping/market-countries', [
                controllers.admin.AdminShippingMarketCountriesList,
              ])
              .as('admin.shipping.market_countries.list')
            router
              .get('shipping/view/:id', [controllers.admin.AdminShippingView])
              .as('admin.shipping.view')
          })
          .use(middleware.can({ permission: 'shipping.view' }))

        router
          .post('shipping', [controllers.admin.AdminShippingStore])
          .as('admin.shipping.store')
          .use(middleware.can({ permission: 'shipping.create' }))

        router
          .group(() => {
            router
              .get('shipping/edit/:id', [controllers.admin.AdminShippingEdit])
              .as('admin.shipping.edit')
            router
              .put('shipping/:id', [controllers.admin.AdminShippingUpdate])
              .as('admin.shipping.update')
            router
              .post('shipping/:id/rates', [controllers.admin.AdminShippingRatesStore])
              .as('admin.shipping.rates.store')
            router
              .put('shipping/:zoneId/rates/:id', [controllers.admin.AdminShippingRatesUpdate])
              .as('admin.shipping.rates.update')
            router
              .delete('shipping/:zoneId/rates/:id', [controllers.admin.AdminShippingRatesDelete])
              .as('admin.shipping.rates.delete')
          })
          .use(middleware.can({ permission: 'shipping.edit' }))

        router
          .group(() => {
            router
              .put('shipping/bulk/archive', [controllers.admin.AdminShippingBulkArchive])
              .as('admin.shipping.bulk.archive.update')
            router
              .post('shipping/:id/archive', [controllers.admin.AdminShippingArchive])
              .as('admin.shipping.archive')
            router
              .post('shipping/:id/unarchive', [controllers.admin.AdminShippingUnarchive])
              .as('admin.shipping.unarchive')
          })
          .use(middleware.can({ permission: 'shipping.archive' }))

        router
          .group(() => {
            router
              .get('customers', [controllers.admin.AdminCustomersHome])
              .as('admin.customers.home')
            router
              .get('customers/list', [controllers.admin.AdminCustomersList])
              .as('admin.customers.list')
            router
              .get('customers/view/:id', [controllers.admin.AdminCustomersView])
              .as('admin.customers.view')
            router
              .get('customers/edit/:id', [controllers.admin.AdminCustomersEdit])
              .as('admin.customers.edit')
            router
              .get('customers/:id/activity', [controllers.admin.AdminCustomerActivityList])
              .as('admin.customers.activity.list')
            router
              .get('customers/location-options', [
                controllers.admin.AdminCustomersLocationOptionsView,
              ])
              .as('admin.customers.location_options.view')
            router
              .get('customers/filter-options', [controllers.admin.AdminCustomersFilterOptionsView])
              .as('admin.customers.filter_options.view')
            router
              .get('customers/segments/list', [controllers.admin.AdminCustomerSegmentsList])
              .as('admin.customer_segments.list')
            router
              .post('customers/:id/impersonate', [
                controllers.admin.AdminCustomersImpersonationStore,
              ])
              .as('admin.customers.impersonation.store')
              .use(impersonationThrottle)
          })
          .use(middleware.can({ permission: 'customers.view' }))

        router
          .group(() => {
            router
              .get('customers/create', [controllers.admin.AdminCustomersCreate])
              .as('admin.customers.create')
            router
              .post('customers', [controllers.admin.AdminCustomersStore])
              .as('admin.customers.store')
          })
          .use(middleware.can({ permission: 'customers.create' }))

        router
          .group(() => {
            router
              .put('customers/:id', [controllers.admin.AdminCustomersUpdate])
              .as('admin.customers.update')
            router
              .put('customers/:id/notes', [controllers.admin.AdminCustomersNotesUpdate])
              .as('admin.customers.notes.update')
            router
              .put('customers/:id/marketing', [controllers.admin.AdminCustomersMarketingUpdate])
              .as('admin.customers.marketing.update')
            router
              .post('customers/segments', [controllers.admin.AdminCustomerSegmentsStore])
              .as('admin.customer_segments.store')
            router
              .put('customers/segments/:id', [controllers.admin.AdminCustomerSegmentsUpdate])
              .as('admin.customer_segments.update')
            router
              .delete('customers/segments/:id', [controllers.admin.AdminCustomerSegmentsDelete])
              .as('admin.customer_segments.delete')
            router
              .post('customers/:id/addresses', [controllers.admin.AdminCustomerAddressesStore])
              .as('admin.customers.addresses.store')
            router
              .put('customers/:customerId/addresses/:id', [
                controllers.admin.AdminCustomerAddressesUpdate,
              ])
              .as('admin.customers.addresses.update')
            router
              .delete('customers/:customerId/addresses/:id', [
                controllers.admin.AdminCustomerAddressesDelete,
              ])
              .as('admin.customers.addresses.delete')
          })
          .use(middleware.can({ permission: 'customers.edit' }))

        router
          .group(() => {
            router
              .put('customers/bulk/archive', [controllers.admin.AdminCustomersBulkArchive])
              .as('admin.customers.bulk.archive.update')
            router
              .post('customers/:id/archive', [controllers.admin.AdminCustomersArchive])
              .as('admin.customers.archive')
            router
              .post('customers/:id/unarchive', [controllers.admin.AdminCustomersUnarchive])
              .as('admin.customers.unarchive')
          })
          .use(middleware.can({ permission: 'customers.archive' }))

        router
          .post('roles', [controllers.admin.AdminRolesStore])
          .as('admin.roles.store')
          .use(middleware.can({ permission: 'roles.create' }))
        router
          .put('roles/:id', [controllers.admin.AdminRolesUpdate])
          .as('admin.roles.update')
          .use(middleware.can({ permission: 'roles.edit' }))
        router
          .delete('roles/:id', [controllers.admin.AdminRolesDelete])
          .as('admin.roles.delete')
          .use(middleware.can({ permission: 'roles.archive' }))
        router
          .put('roles/:id/permissions', [controllers.admin.AdminRolePermissionsUpdate])
          .as('admin.roles.permissions.update')
          .use(middleware.can({ permission: 'roles.edit' }))

        for (const plugin of registeredPlugins()) {
          plugin.routes?.admin?.(router, middleware)
        }
      })
      .use([middleware.auth({ guards: ['web'] }), middleware.requireMfa(), middleware.auditActor()])
  })
  .prefix('admin')

/*
|--------------------------------------------------------------------------
| Storefront (public)
|--------------------------------------------------------------------------
*/
router
  .get('sitemap.xml', [controllers.storefront.StorefrontSitemapShow])
  .as('storefront.sitemap.view')
  .use(catalogThrottle)
router.get('robots.txt', [controllers.storefront.StorefrontRobotsShow]).as('storefront.robots.view')
router
  .get('store/settings', [controllers.storefront.StorefrontSettingsView])
  .as('storefront.settings.view')
router.get('store/theme', [controllers.storefront.StorefrontThemeView]).as('storefront.theme.view')
router.get('store/menu', [controllers.storefront.StorefrontMenuList]).as('storefront.menu.list')
router
  .get('store/plugins', [controllers.storefront.StorefrontPluginsList])
  .as('storefront.plugins.list')
for (const plugin of registeredPlugins()) {
  plugin.routes?.storefront?.(router, middleware)
}
router
  .get('themes/assets/:hash/*', [controllers.storefront.ThemeAssetsShow])
  .as('storefront.theme_assets.show')
router
  .get('themes/preview/exit', [controllers.storefront.ThemePreviewExit])
  .as('storefront.theme_preview.exit')
router
  .get('themes/preview/:id', [controllers.storefront.ThemePreviewShow])
  .as('storefront.theme_preview.show')
router
  .get('store/home-content', [controllers.storefront.StorefrontHomeContentView])
  .as('storefront.home_content.view')
router.get('store/home', [controllers.storefront.StorefrontHomeView]).as('storefront.home.view')
/**
 * The collection and product shells are server-rendered with their first
 * page of catalog data, so they share the catalog JSON routes' IP limit.
 */
router
  .get('collections/:slug', [controllers.storefront.StorefrontCollectionsShow])
  .as('storefront.collections.show')
  .use(catalogThrottle)
/**
 * Catalog JSON routes need a session-bound catalog token, so they can't be
 * scraped without first starting a session (which is rate limited too).
 */
const protectedCatalog = (ipThrottle = catalogThrottle) => [
  ipThrottle,
  middleware.catalogToken(),
  catalogSessionThrottle,
]
router
  .get('store/catalog-token', [controllers.storefront.StorefrontCatalogTokenView])
  .as('storefront.catalog_token.view')
  .use(catalogTokenThrottle)
router
  .get('store/collections/view/:slug', [controllers.storefront.StorefrontCollectionsView])
  .as('storefront.collections.view')
  .use(protectedCatalog())
router
  .get('store/collections/:slug/products', [
    controllers.storefront.StorefrontCollectionProductsList,
  ])
  .as('storefront.collections.products.list')
  .use(protectedCatalog())
router
  .get('store/collections/:slug/filters', [controllers.storefront.StorefrontCollectionFiltersList])
  .as('storefront.collections.filters.list')
  .use(protectedCatalog())
router
  .get('pages/:slug', [controllers.storefront.StorefrontPagesShow])
  .as('storefront.pages.show')
  .use(catalogThrottle)
router
  .get('store/pages/view/:slug', [controllers.storefront.StorefrontPagesView])
  .as('storefront.pages.view')
  .use(catalogThrottle)
router
  .get('store/policies', [controllers.storefront.StorefrontPoliciesList])
  .as('storefront.policies.list')
  .use(catalogThrottle)
router.get('help', [controllers.storefront.StorefrontHelpHome]).as('storefront.help.home')
router
  .get('help/:category', [controllers.storefront.StorefrontHelpCategoriesShow])
  .as('storefront.help.categories.show')
router
  .get('help/:category/:slug', [controllers.storefront.StorefrontHelpArticlesShow])
  .as('storefront.help.articles.show')
router
  .get('store/help/categories', [controllers.storefront.StorefrontHelpCategoriesList])
  .as('storefront.help.categories.list')
  .use(catalogThrottle)
router
  .get('store/help/categories/view/:category', [
    controllers.storefront.StorefrontHelpCategoriesView,
  ])
  .as('storefront.help.categories.view')
  .use(catalogThrottle)
router
  .get('store/help/articles/view/:category/:slug', [
    controllers.storefront.StorefrontHelpArticlesView,
  ])
  .as('storefront.help.articles.view')
  .use(catalogThrottle)
router
  .get('store/help/search', [controllers.storefront.StorefrontHelpSearchList])
  .as('storefront.help.search.list')
  .use(catalogThrottle)
router
  .get('products/:slug', [controllers.storefront.StorefrontProductsShow])
  .as('storefront.products.show')
  .use(catalogThrottle)
router
  .get('store/products/view/:slug', [controllers.storefront.StorefrontProductsView])
  .as('storefront.products.view')
  .use(protectedCatalog())
router
  .get('store/products/:slug/reviews', [controllers.storefront.StorefrontProductReviewsList])
  .as('storefront.products.reviews.list')
  .use(protectedCatalog())
router
  .get('store/products/:slug/reviews/summary', [
    controllers.storefront.StorefrontProductReviewsSummary,
  ])
  .as('storefront.products.reviews.summary')
  .use(protectedCatalog())
router
  .get('store/search', [controllers.storefront.StorefrontSearchList])
  .as('storefront.search.list')
  .use(protectedCatalog(searchThrottle))
router
  .get('store/session', [controllers.storefront.StorefrontSessionView])
  .as('storefront.session.view')
router
  .get('store/market', [controllers.storefront.StorefrontMarketView])
  .as('storefront.market.view')
router
  .put('store/market', [controllers.storefront.StorefrontMarketUpdate])
  .as('storefront.market.update')
  .use(marketThrottle)
router
  .post('store/cart/prices', [controllers.storefront.StorefrontCartPricesUpdate])
  .as('storefront.cart.prices.update')
  .use(pricingThrottle)
router
  .post('store/analytics/events', [controllers.storefront.StorefrontAnalyticsEventsStore])
  .as('storefront.analytics.events.store')
  .use(analyticsEventThrottle)
router
  .post('newsletter', [controllers.storefront.StorefrontNewsletterStore])
  .as('storefront.newsletter.store')
  .use([
    newsletterThrottle,
    newsletterEmailThrottle,
    middleware.recaptcha({ action: 'customer_newsletter' }),
  ])
router
  .post('maintenance/newsletter', [controllers.storefront.StorefrontMaintenanceNewsletterStore])
  .as('storefront.maintenance.newsletter.store')
  .use([
    newsletterThrottle,
    newsletterEmailThrottle,
    middleware.recaptcha({ action: 'maintenance_newsletter' }),
  ])
router
  .get('store/support/chat', [controllers.storefront.StorefrontSupportChatAsk])
  .as('storefront.support.chat.view')
  .use(searchThrottle)
router
  .post('support/tickets', [controllers.storefront.StorefrontSupportTicketsStore])
  .as('storefront.support.tickets.store')
  .use([
    supportTicketStoreThrottle,
    supportTicketEmailThrottle,
    middleware.recaptcha({ action: 'support_ticket_create' }),
  ])
router
  .get('support/tickets/:token', [controllers.storefront.StorefrontSupportTicketsShow])
  .as('storefront.support.tickets.show')
  .use(supportThreadViewThrottle)
router
  .get('store/support/tickets/view/:token', [controllers.storefront.StorefrontSupportTicketsView])
  .as('storefront.support.tickets.view')
  .use(supportThreadViewThrottle)
router
  .post('support/tickets/:token/messages', [
    controllers.storefront.StorefrontSupportTicketMessagesStore,
  ])
  .as('storefront.support.tickets.messages.store')
  .use([
    supportThreadViewThrottle,
    supportTicketReplyThrottle,
    middleware.recaptcha({ action: 'support_ticket_reply' }),
  ])

router
  .get('brand/favicons/:file', [controllers.storefront.BrandFaviconShow])
  .as('storefront.brand.favicon.view')
router
  .get('brand/manifest.json', [controllers.storefront.BrandManifestShow])
  .as('storefront.brand.manifest.view')

router
  .get('places/autocomplete', [controllers.storefront.PlacesAutocompleteList])
  .as('storefront.places.autocomplete.list')
  .use(placesThrottle)
router
  .get('places/details/:placeId', [controllers.storefront.PlacesDetailsView])
  .as('storefront.places.details.view')
  .use(placesThrottle)

router
  .post('stripe/webhook', [controllers.storefront.StripeWebhook])
  .as('stripe.webhook')
  .use(webhookThrottle)

router.post('poli/nudge', [controllers.storefront.PoliNudge]).as('poli.nudge').use(webhookThrottle)

router
  .delete('impersonation', [controllers.storefront.StorefrontImpersonationDelete])
  .as('storefront.impersonation.delete')
  .use(middleware.auth({ guards: ['web'] }))

/*
|--------------------------------------------------------------------------
| Checkout (guests and signed-in customers)
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router
      .get('/', [controllers.storefront.StorefrontCheckoutHome])
      .as('storefront.checkout.home')
      .use(middleware.customerProfileComplete({ returnTo: 'checkout' }))
    router
      .post('/', [controllers.storefront.StorefrontCheckoutStore])
      .as('storefront.checkout.store')
      .use([
        checkoutThrottle,
        middleware.recaptcha({ action: 'checkout' }),
        middleware.customerProfileComplete({ returnTo: 'checkout' }),
      ])
    router
      .post('quote', [controllers.storefront.StorefrontCheckoutQuote])
      .as('storefront.checkout.quote')
      .use(pricingThrottle)
    router
      .get('addresses', [controllers.storefront.StorefrontCheckoutAddressesList])
      .as('storefront.checkout.addresses.list')
      .use(middleware.auth({ guards: ['customer'] }))
    router
      .get('payment-methods', [controllers.storefront.StorefrontCheckoutPaymentMethodsList])
      .as('storefront.checkout.payment_methods.list')
    router
      .get('thank-you/:id', [controllers.storefront.StorefrontCheckoutShow])
      .as('storefront.checkout.show')
    router
      .get('orders/view/:id', [controllers.storefront.StorefrontCheckoutOrderView])
      .as('storefront.checkout.orders.view')
    router
      .get('orders/:id/invoice', [controllers.storefront.StorefrontCheckoutOrderInvoiceView])
      .as('storefront.checkout.orders.invoice.view')
      .use(orderDocumentThrottle)
    router
      .get('orders/:id/receipt', [controllers.storefront.StorefrontCheckoutOrderReceiptView])
      .as('storefront.checkout.orders.receipt.view')
      .use(orderDocumentThrottle)
    router
      .post('orders/:id/payment', [controllers.storefront.StorefrontCheckoutPaymentStore])
      .as('storefront.checkout.orders.payment.store')
      .use(paymentThrottle)
    router
      .get('orders/:id/stripe-return', [controllers.storefront.StorefrontCheckoutStripeReturn])
      .as('storefront.checkout.orders.stripe_return')
      .use(paymentThrottle)
    router
      .get('orders/:id/poli-return', [controllers.storefront.StorefrontCheckoutPoliReturn])
      .as('storefront.checkout.orders.poli_return')
      .use(paymentThrottle)
  })
  .prefix('checkout')

/*
|--------------------------------------------------------------------------
| Customers (storefront)
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router
      .get('signup', [controllers.customers.CustomersRegistrationCreate])
      .as('customers.registration.create')
    router
      .post('signup', [controllers.customers.CustomersRegistrationStore])
      .as('customers.registration.store')
      .use([signupThrottle, middleware.recaptcha({ action: 'customer_signup' })])
    router
      .get('signup/verify', [controllers.customers.CustomersRegistrationVerifyCreate])
      .as('customers.registration.verify.create')
    router
      .get('signup/verify/view', [controllers.customers.CustomersRegistrationVerifyView])
      .as('customers.registration.verify.view')
    router
      .post('signup/verify', [controllers.customers.CustomersRegistrationVerifyStore])
      .as('customers.registration.verify.store')
      .use([otpThrottle, middleware.recaptcha({ action: 'customer_signup_verify' })])
    router
      .post('signup/verify/resend', [controllers.customers.CustomersRegistrationVerifyResendStore])
      .as('customers.registration.verify.resend.store')
      .use([otpThrottle, middleware.recaptcha({ action: 'customer_signup_resend' })])
    router
      .get('login', [controllers.customers.CustomersSessionCreate])
      .as('customers.session.create')
    router
      .post('login', [controllers.customers.CustomersSessionStore])
      .as('customers.session.store')
      .use([loginThrottle, middleware.recaptcha({ action: 'customer_login' })])
    router
      .get(':provider/oauth/redirect/:intent', [controllers.customers.CustomersSocialRedirect])
      .as('customers.social.redirect')
      .where('provider', new RegExp(`^(${SOCIAL_PROVIDERS.join('|')})$`))
      .where('intent', new RegExp(`^(${SOCIAL_INTENTS.join('|')})$`))
      .use(socialAuthThrottle)
    router
      .get(':provider/oauth/callback', [controllers.customers.CustomersSocialCallback])
      .as('customers.social.callback')
      .where('provider', new RegExp(`^(${SOCIAL_PROVIDERS.join('|')})$`))
      .use(socialAuthThrottle)
    router
      .get('forgot-password', [controllers.customers.CustomersPasswordForgotCreate])
      .as('customers.password.forgot.create')
    router
      .post('forgot-password', [controllers.customers.CustomersPasswordForgotStore])
      .as('customers.password.forgot.store')
      .use([
        forgotPasswordThrottle,
        forgotPasswordEmailThrottle,
        middleware.recaptcha({ action: 'customer_forgot_password' }),
      ])
    router
      .get('reset-password', [controllers.customers.CustomersPasswordResetCreate])
      .as('customers.password.reset.create')
    router
      .get('reset-password/view', [controllers.customers.CustomersPasswordResetView])
      .as('customers.password.reset.view')
    router
      .post('reset-password', [controllers.customers.CustomersPasswordResetStore])
      .as('customers.password.reset.store')
      .use([otpThrottle, middleware.recaptcha({ action: 'customer_password_reset' })])
    router
      .post('reset-password/resend', [controllers.customers.CustomersPasswordResetResendStore])
      .as('customers.password.reset.resend.store')
      .use([otpThrottle, middleware.recaptcha({ action: 'customer_password_reset_resend' })])
  })
  .use(middleware.guest({ guards: ['customer'] }))

router
  .group(() => {
    router
      .post('logout', [controllers.customers.CustomersSessionDelete])
      .as('customers.session.delete')
    router
      .get('account/me', [controllers.customers.CustomersAccountView])
      .as('customers.account.view')
    router
      .get('account/welcome', [controllers.customers.CustomersAccountWelcomeCreate])
      .as('customers.account.welcome.create')
    router
      .get('account/location/options', [controllers.customers.CustomersAccountLocationOptionsView])
      .as('customers.account.location.options.view')
    router
      .put('account/location', [controllers.customers.CustomersAccountLocationUpdate])
      .as('customers.account.location.update')

    /**
     * Wishlist hearts on storefront product cards. Outside the country
     * step so they work for every signed-in customer. `:id` is a product
     * id, scoped to the session customer's wishlist.
     */
    router
      .get('account/wishlist/ids', [controllers.customers.CustomersAccountWishlistIdsView])
      .as('customers.account.wishlist.ids.view')
    router
      .post('account/wishlist', [controllers.customers.CustomersAccountWishlistStore])
      .as('customers.account.wishlist.store')
      .use(wishlistThrottle)
    router
      .delete('account/wishlist/:id', [controllers.customers.CustomersAccountWishlistDelete])
      .as('customers.account.wishlist.delete')
      .use(wishlistThrottle)

    /**
     * Everything else needs the customer's country first (see the welcome
     * step above).
     */
    router
      .group(() => {
        router
          .get('account', [controllers.customers.CustomersAccountHome])
          .as('customers.account.home')
        router
          .get('account/orders', [controllers.customers.CustomersAccountOrdersHome])
          .as('customers.account.orders.home')
        router
          .get('account/orders/list', [controllers.customers.CustomersAccountOrdersList])
          .as('customers.account.orders.list')
        router
          .get('account/orders/view/:id', [controllers.customers.CustomersAccountOrdersView])
          .as('customers.account.orders.view')
          .use(middleware.customerOwns({ resource: 'order' }))
        router
          .get('account/orders/:id', [controllers.customers.CustomersAccountOrdersShow])
          .as('customers.account.orders.show')
          .use(middleware.customerOwns({ resource: 'order' }))
        router
          .get('account/orders/:id/returns', [
            controllers.customers.CustomersAccountOrderReturnsList,
          ])
          .as('customers.account.orders.returns.list')
          .use(middleware.customerOwns({ resource: 'order' }))
        router
          .get('account/orders/:id/notes/list', [
            controllers.customers.CustomersAccountOrderNotesList,
          ])
          .as('customers.account.orders.notes.list')
          .use(middleware.customerOwns({ resource: 'order' }))
        router
          .post('account/orders/:id/notes', [controllers.customers.CustomersAccountOrderNotesStore])
          .as('customers.account.orders.notes.store')
          .use([orderNoteReplyThrottle, middleware.customerOwns({ resource: 'order' })])
        router
          .post('account/orders/:id/returns', [
            controllers.customers.CustomersAccountOrderReturnsStore,
          ])
          .as('customers.account.orders.returns.store')
          .use([middleware.customerOwns({ resource: 'order' }), returnRequestThrottle])
        router
          .post('account/orders/:id/payment-proof', [
            controllers.customers.CustomersAccountOrderPaymentProofStore,
          ])
          .as('customers.account.orders.payment_proof.store')
          .use([middleware.customerOwns({ resource: 'order' }), paymentProofThrottle])
        router
          .get('account/orders/:id/payment-proof/image', [
            controllers.customers.CustomersAccountOrderPaymentProofImageView,
          ])
          .as('customers.account.orders.payment_proof.image.view')
          .use(middleware.customerOwns({ resource: 'order' }))
        router
          .get('account/orders/:id/invoice', [
            controllers.customers.CustomersAccountOrderInvoiceView,
          ])
          .as('customers.account.orders.invoice.view')
          .use([middleware.customerOwns({ resource: 'order' }), orderDocumentThrottle])
        router
          .get('account/orders/:id/receipt', [
            controllers.customers.CustomersAccountOrderReceiptView,
          ])
          .as('customers.account.orders.receipt.view')
          .use([middleware.customerOwns({ resource: 'order' }), orderDocumentThrottle])
        router
          .get('account/addresses', [controllers.customers.CustomersAccountAddressesHome])
          .as('customers.account.addresses.home')
        router
          .get('account/addresses/list', [controllers.customers.CustomersAccountAddressesList])
          .as('customers.account.addresses.list')
        router
          .post('account/addresses', [controllers.customers.CustomersAccountAddressesStore])
          .as('customers.account.addresses.store')
        router
          .put('account/addresses/:id', [controllers.customers.CustomersAccountAddressesUpdate])
          .as('customers.account.addresses.update')
          .use(middleware.customerOwns({ resource: 'address' }))
        router
          .delete('account/addresses/:id', [controllers.customers.CustomersAccountAddressesDelete])
          .as('customers.account.addresses.delete')
          .use(middleware.customerOwns({ resource: 'address' }))
        router
          .get('account/details', [controllers.customers.CustomersAccountDetailsHome])
          .as('customers.account.details.home')
        router
          .put('account/details', [controllers.customers.CustomersAccountDetailsUpdate])
          .as('customers.account.details.update')
        router
          .put('account/marketing', [controllers.customers.CustomersAccountMarketingUpdate])
          .as('customers.account.marketing.update')
          .use(accountPasswordThrottle)
        router
          .get('account/activity', [controllers.customers.CustomersAccountActivityHome])
          .as('customers.account.activity.home')
        router
          .get('account/activity/list', [controllers.customers.CustomersAccountActivityList])
          .as('customers.account.activity.list')
        router
          .get('account/support', [controllers.customers.CustomersAccountSupportHome])
          .as('customers.account.support.home')
        router
          .get('account/support/list', [controllers.customers.CustomersAccountSupportList])
          .as('customers.account.support.list')
        router
          .get('account/support/view/:id', [controllers.customers.CustomersAccountSupportView])
          .as('customers.account.support.view')
          .use(middleware.customerOwns({ resource: 'support_ticket' }))
        router
          .get('account/support/:id', [controllers.customers.CustomersAccountSupportShow])
          .as('customers.account.support.show')
          .use(middleware.customerOwns({ resource: 'support_ticket' }))
        router
          .post('account/support/:id/messages', [
            controllers.customers.CustomersAccountSupportMessagesStore,
          ])
          .as('customers.account.support.messages.store')
          .use([
            supportTicketReplyThrottle,
            middleware.customerOwns({ resource: 'support_ticket' }),
          ])
        router
          .get('account/wishlist', [controllers.customers.CustomersAccountWishlistHome])
          .as('customers.account.wishlist.home')
        router
          .get('account/wishlist/list', [controllers.customers.CustomersAccountWishlistList])
          .as('customers.account.wishlist.list')
        router
          .post('store/products/:slug/reviews', [
            controllers.customers.CustomersProductReviewsStore,
          ])
          .as('customers.product_reviews.store')
          .use(productReviewThrottle)
      })
      .use(middleware.customerProfileComplete())
  })
  .use([middleware.auth({ guards: ['customer'] }), middleware.customerAuditActor()])