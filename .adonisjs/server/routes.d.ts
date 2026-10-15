import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'admin.session.create': { paramsTuple?: []; params?: {} }
    'admin.session.store': { paramsTuple?: []; params?: {} }
    'admin.session.mfa.store': { paramsTuple?: []; params?: {} }
    'admin.setup.create': { paramsTuple?: []; params?: {} }
    'admin.setup.view': { paramsTuple?: []; params?: {} }
    'admin.setup.store': { paramsTuple?: []; params?: {} }
    'admin.session.delete': { paramsTuple?: []; params?: {} }
    'admin.me.view': { paramsTuple?: []; params?: {} }
    'admin.account.home': { paramsTuple?: []; params?: {} }
    'admin.account.profile.update': { paramsTuple?: []; params?: {} }
    'admin.account.security.view': { paramsTuple?: []; params?: {} }
    'admin.account.mfa.setup.store': { paramsTuple?: []; params?: {} }
    'admin.account.mfa.store': { paramsTuple?: []; params?: {} }
    'admin.account.mfa.delete': { paramsTuple?: []; params?: {} }
    'admin.account.password.update': { paramsTuple?: []; params?: {} }
    'admin.home': { paramsTuple?: []; params?: {} }
    'admin.dashboard.home': { paramsTuple?: []; params?: {} }
    'admin.analytics.home': { paramsTuple?: []; params?: {} }
    'admin.analytics.view': { paramsTuple?: []; params?: {} }
    'admin.analytics.reports.home': { paramsTuple?: []; params?: {} }
    'admin.analytics.reports.list': { paramsTuple?: []; params?: {} }
    'admin.analytics.reports.show': { paramsTuple: [ParamValue]; params: {'key': ParamValue} }
    'admin.analytics.reports.view': { paramsTuple: [ParamValue]; params: {'key': ParamValue} }
    'admin.analytics.live.home': { paramsTuple?: []; params?: {} }
    'admin.analytics.live.view': { paramsTuple?: []; params?: {} }
    'admin.analytics.reports.export': { paramsTuple: [ParamValue]; params: {'key': ParamValue} }
    'admin.users.home': { paramsTuple?: []; params?: {} }
    'admin.users.list': { paramsTuple?: []; params?: {} }
    'admin.users.roles': { paramsTuple?: []; params?: {} }
    'admin.users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.activity.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.create': { paramsTuple?: []; params?: {} }
    'admin.users.store': { paramsTuple?: []; params?: {} }
    'admin.roles.home': { paramsTuple?: []; params?: {} }
    'admin.roles.matrix': { paramsTuple?: []; params?: {} }
    'admin.products.home': { paramsTuple?: []; params?: {} }
    'admin.products.list': { paramsTuple?: []; params?: {} }
    'admin.products.facets': { paramsTuple?: []; params?: {} }
    'admin.products.markets.list': { paramsTuple?: []; params?: {} }
    'admin.products.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.products.activity.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.products.variants.view': { paramsTuple: [ParamValue,ParamValue]; params: {'productId': ParamValue,'id': ParamValue} }
    'admin.products.reviews.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.options.catalog': { paramsTuple?: []; params?: {} }
    'admin.products.create': { paramsTuple?: []; params?: {} }
    'admin.products.store': { paramsTuple?: []; params?: {} }
    'admin.products.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.products.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.products.options.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.products.variants.create': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'admin.products.variants.store': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'admin.products.variants.edit': { paramsTuple: [ParamValue,ParamValue]; params: {'productId': ParamValue,'id': ParamValue} }
    'admin.products.variants.update': { paramsTuple: [ParamValue,ParamValue]; params: {'productId': ParamValue,'id': ParamValue} }
    'admin.products.variants.delete': { paramsTuple: [ParamValue,ParamValue]; params: {'productId': ParamValue,'id': ParamValue} }
    'admin.products.bulk.status.update': { paramsTuple?: []; params?: {} }
    'admin.products.reviews.update': { paramsTuple: [ParamValue,ParamValue]; params: {'productId': ParamValue,'id': ParamValue} }
    'admin.products.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.products.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.products.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.products.images.store': { paramsTuple?: []; params?: {} }
    'admin.products.import.sample': { paramsTuple?: []; params?: {} }
    'admin.products.import.store': { paramsTuple?: []; params?: {} }
    'admin.products.export': { paramsTuple?: []; params?: {} }
    'admin.collections.home': { paramsTuple?: []; params?: {} }
    'admin.collections.list': { paramsTuple?: []; params?: {} }
    'admin.collections.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.collections.products.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.collections.preview': { paramsTuple?: []; params?: {} }
    'admin.collections.create': { paramsTuple?: []; params?: {} }
    'admin.collections.store': { paramsTuple?: []; params?: {} }
    'admin.collections.bulk.status.update': { paramsTuple?: []; params?: {} }
    'admin.collections.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.collections.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.collections.products.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.collections.products.reorder': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.collections.products.delete': { paramsTuple: [ParamValue,ParamValue]; params: {'collectionId': ParamValue,'id': ParamValue} }
    'admin.collections.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.collections.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.collections.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.collections.image.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.collections.image.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.collections.import.sample': { paramsTuple?: []; params?: {} }
    'admin.collections.import.store': { paramsTuple?: []; params?: {} }
    'admin.collections.export': { paramsTuple?: []; params?: {} }
    'admin.pages.home': { paramsTuple?: []; params?: {} }
    'admin.pages.list': { paramsTuple?: []; params?: {} }
    'admin.pages.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.pages.create': { paramsTuple?: []; params?: {} }
    'admin.pages.store': { paramsTuple?: []; params?: {} }
    'admin.pages.bulk.status.update': { paramsTuple?: []; params?: {} }
    'admin.pages.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.pages.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.pages.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.pages.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.pages.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.products.variants.inventory.update': { paramsTuple: [ParamValue,ParamValue]; params: {'productId': ParamValue,'id': ParamValue} }
    'admin.options.home': { paramsTuple?: []; params?: {} }
    'admin.options.list': { paramsTuple?: []; params?: {} }
    'admin.options.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.options.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.options.store': { paramsTuple?: []; params?: {} }
    'admin.options.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.options.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.options.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.options.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.options.import.sample': { paramsTuple?: []; params?: {} }
    'admin.options.import.store': { paramsTuple?: []; params?: {} }
    'admin.options.export': { paramsTuple?: []; params?: {} }
    'admin.options.values.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.options.values.update': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'valueId': ParamValue} }
    'admin.options.values.delete': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'valueId': ParamValue} }
    'admin.product_types.home': { paramsTuple?: []; params?: {} }
    'admin.product_types.list': { paramsTuple?: []; params?: {} }
    'admin.product_types.store': { paramsTuple?: []; params?: {} }
    'admin.product_types.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.product_types.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.product_types.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.product_types.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.product_types.import.sample': { paramsTuple?: []; params?: {} }
    'admin.product_types.import.store': { paramsTuple?: []; params?: {} }
    'admin.product_types.export': { paramsTuple?: []; params?: {} }
    'admin.product_labels.home': { paramsTuple?: []; params?: {} }
    'admin.product_labels.list': { paramsTuple?: []; params?: {} }
    'admin.product_labels.store': { paramsTuple?: []; params?: {} }
    'admin.product_labels.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.product_labels.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.product_labels.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.product_labels.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.media.home': { paramsTuple?: []; params?: {} }
    'admin.media.list': { paramsTuple?: []; params?: {} }
    'admin.media.store': { paramsTuple?: []; params?: {} }
    'admin.media.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.vendors.home': { paramsTuple?: []; params?: {} }
    'admin.vendors.list': { paramsTuple?: []; params?: {} }
    'admin.vendors.store': { paramsTuple?: []; params?: {} }
    'admin.vendors.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.vendors.image.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.vendors.image.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.vendors.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.vendors.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.vendors.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.vendors.import.sample': { paramsTuple?: []; params?: {} }
    'admin.vendors.import.store': { paramsTuple?: []; params?: {} }
    'admin.vendors.export': { paramsTuple?: []; params?: {} }
    'admin.locations.home': { paramsTuple?: []; params?: {} }
    'admin.locations.list': { paramsTuple?: []; params?: {} }
    'admin.locations.store': { paramsTuple?: []; params?: {} }
    'admin.locations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.locations.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.locations.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.locations.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.locations.import.sample': { paramsTuple?: []; params?: {} }
    'admin.locations.import.store': { paramsTuple?: []; params?: {} }
    'admin.locations.export': { paramsTuple?: []; params?: {} }
    'admin.dashboard.view': { paramsTuple?: []; params?: {} }
    'admin.orders.home': { paramsTuple?: []; params?: {} }
    'admin.orders.list': { paramsTuple?: []; params?: {} }
    'admin.orders.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.activity.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.variants.search': { paramsTuple?: []; params?: {} }
    'admin.orders.drafts.home': { paramsTuple?: []; params?: {} }
    'admin.orders.drafts.list': { paramsTuple?: []; params?: {} }
    'admin.orders.drafts.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.returns.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.notes.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.payment_proof.image.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.invoice.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.receipt.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.packing_slip.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.returns.home': { paramsTuple?: []; params?: {} }
    'admin.returns.list': { paramsTuple?: []; params?: {} }
    'admin.orders.drafts.create': { paramsTuple?: []; params?: {} }
    'admin.orders.drafts.store': { paramsTuple?: []; params?: {} }
    'admin.orders.drafts.calculate': { paramsTuple?: []; params?: {} }
    'admin.orders.drafts.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.drafts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.drafts.complete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.fulfillments.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.fulfillment_status.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.fulfillments.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.fulfillments.cancel.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.returns.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.notes.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.payment_proof.review.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.returns.approve.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.returns.decline.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.returns.receive.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.returns.cancel.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.refunds.calculate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.refunds.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.cancel': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.drafts.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.orders.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.discounts.home': { paramsTuple?: []; params?: {} }
    'admin.discounts.list': { paramsTuple?: []; params?: {} }
    'admin.discounts.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.discounts.create': { paramsTuple?: []; params?: {} }
    'admin.discounts.store': { paramsTuple?: []; params?: {} }
    'admin.discounts.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.discounts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.discounts.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.discounts.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.discounts.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.newsletter_subscribers.home': { paramsTuple?: []; params?: {} }
    'admin.newsletter_subscribers.list': { paramsTuple?: []; params?: {} }
    'admin.newsletter_subscribers.bulk.subscription.update': { paramsTuple?: []; params?: {} }
    'admin.store_settings.home': { paramsTuple?: []; params?: {} }
    'admin.store_settings.view': { paramsTuple?: []; params?: {} }
    'admin.store_settings.business.update': { paramsTuple?: []; params?: {} }
    'admin.store_settings.contact.update': { paramsTuple?: []; params?: {} }
    'admin.store_settings.address.update': { paramsTuple?: []; params?: {} }
    'admin.store_settings.defaults.update': { paramsTuple?: []; params?: {} }
    'admin.store_settings.notifications.update': { paramsTuple?: []; params?: {} }
    'admin.store_settings.checkout.update': { paramsTuple?: []; params?: {} }
    'admin.maintenance.view': { paramsTuple?: []; params?: {} }
    'admin.maintenance.update': { paramsTuple?: []; params?: {} }
    'admin.emails.home': { paramsTuple?: []; params?: {} }
    'admin.emails.list': { paramsTuple?: []; params?: {} }
    'admin.emails.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.emails.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.emails.resend.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.support.tickets.home': { paramsTuple?: []; params?: {} }
    'admin.support.tickets.list': { paramsTuple?: []; params?: {} }
    'admin.support.tickets.open_count.view': { paramsTuple?: []; params?: {} }
    'admin.support.tickets.assignees.list': { paramsTuple?: []; params?: {} }
    'admin.support.tickets.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.support.tickets.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.support.tickets.bulk.status.update': { paramsTuple?: []; params?: {} }
    'admin.support.tickets.messages.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.support.tickets.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.help_articles.home': { paramsTuple?: []; params?: {} }
    'admin.help_articles.list': { paramsTuple?: []; params?: {} }
    'admin.help_articles.options.list': { paramsTuple?: []; params?: {} }
    'admin.help_articles.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.help_categories.home': { paramsTuple?: []; params?: {} }
    'admin.help_categories.list': { paramsTuple?: []; params?: {} }
    'admin.help_categories.options.list': { paramsTuple?: []; params?: {} }
    'admin.help_categories.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.help_articles.preview.store': { paramsTuple?: []; params?: {} }
    'admin.help_articles.create': { paramsTuple?: []; params?: {} }
    'admin.help_articles.store': { paramsTuple?: []; params?: {} }
    'admin.help_categories.store': { paramsTuple?: []; params?: {} }
    'admin.help_articles.bulk.status.update': { paramsTuple?: []; params?: {} }
    'admin.help_articles.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.help_articles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.help_categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.help_articles.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.help_articles.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.help_articles.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.help_categories.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.help_categories.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.help_categories.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.notifications.list': { paramsTuple?: []; params?: {} }
    'admin.notifications.seen.update': { paramsTuple?: []; params?: {} }
    'admin.notifications.read_all.update': { paramsTuple?: []; params?: {} }
    'admin.notifications.read.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.events.home': { paramsTuple?: []; params?: {} }
    'admin.events.list': { paramsTuple?: []; params?: {} }
    'admin.events.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.events.retry_failed.store': { paramsTuple?: []; params?: {} }
    'admin.events.retry.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.payments.home': { paramsTuple?: []; params?: {} }
    'admin.payments.list': { paramsTuple?: []; params?: {} }
    'admin.payments.markets.list': { paramsTuple?: []; params?: {} }
    'admin.payments.bank_transfer.view': { paramsTuple?: []; params?: {} }
    'admin.payments.stripe.view': { paramsTuple?: []; params?: {} }
    'admin.payments.poli.view': { paramsTuple?: []; params?: {} }
    'admin.payments.bank_transfer.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.payments.stripe.update': { paramsTuple?: []; params?: {} }
    'admin.payments.poli.update': { paramsTuple?: []; params?: {} }
    'admin.storefront_theme.home': { paramsTuple?: []; params?: {} }
    'admin.storefront_theme.view': { paramsTuple?: []; params?: {} }
    'admin.storefront_menu.home': { paramsTuple?: []; params?: {} }
    'admin.storefront_menu.list': { paramsTuple?: []; params?: {} }
    'admin.storefront_menu.collections': { paramsTuple?: []; params?: {} }
    'admin.storefront_menu.pages': { paramsTuple?: []; params?: {} }
    'admin.storefront_content.home': { paramsTuple?: []; params?: {} }
    'admin.storefront_promo_banners.list': { paramsTuple?: []; params?: {} }
    'admin.storefront_features.list': { paramsTuple?: []; params?: {} }
    'admin.storefront_featured_reviews.list': { paramsTuple?: []; params?: {} }
    'admin.storefront_menu.store': { paramsTuple?: []; params?: {} }
    'admin.storefront_promo_banners.store': { paramsTuple?: []; params?: {} }
    'admin.storefront_theme.update': { paramsTuple?: []; params?: {} }
    'admin.storefront_theme.brand.update': { paramsTuple?: []; params?: {} }
    'admin.storefront_menu.reorder': { paramsTuple?: []; params?: {} }
    'admin.storefront_menu.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.storefront_content.update': { paramsTuple?: []; params?: {} }
    'admin.storefront_promo_banners.reorder': { paramsTuple?: []; params?: {} }
    'admin.storefront_promo_banners.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.storefront_features.update': { paramsTuple?: []; params?: {} }
    'admin.storefront_theme.logo.store': { paramsTuple?: []; params?: {} }
    'admin.storefront_theme.logo.delete': { paramsTuple?: []; params?: {} }
    'admin.storefront_theme.favicon.store': { paramsTuple?: []; params?: {} }
    'admin.storefront_theme.favicon.delete': { paramsTuple?: []; params?: {} }
    'admin.storefront_promo_banners.image.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.storefront_promo_banners.image.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.storefront_menu.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.storefront_promo_banners.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.plugins.home': { paramsTuple?: []; params?: {} }
    'admin.plugins.list': { paramsTuple?: []; params?: {} }
    'admin.plugins.install': { paramsTuple: [ParamValue]; params: {'key': ParamValue} }
    'admin.plugins.uninstall': { paramsTuple: [ParamValue]; params: {'key': ParamValue} }
    'admin.themes.home': { paramsTuple?: []; params?: {} }
    'admin.themes.list': { paramsTuple?: []; params?: {} }
    'admin.themes.preview': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.themes.download': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.themes.share': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.themes.store': { paramsTuple?: []; params?: {} }
    'admin.themes.duplicate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.themes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.themes.publish': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.themes.unpublish': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.themes.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.markets.home': { paramsTuple?: []; params?: {} }
    'admin.markets.list': { paramsTuple?: []; params?: {} }
    'admin.markets.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.markets.store': { paramsTuple?: []; params?: {} }
    'admin.markets.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.markets.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.markets.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.markets.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.markets.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.taxes.home': { paramsTuple?: []; params?: {} }
    'admin.taxes.list': { paramsTuple?: []; params?: {} }
    'admin.taxes.store': { paramsTuple?: []; params?: {} }
    'admin.taxes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.taxes.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.taxes.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.taxes.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.shipping.home': { paramsTuple?: []; params?: {} }
    'admin.shipping.list': { paramsTuple?: []; params?: {} }
    'admin.shipping.markets.list': { paramsTuple?: []; params?: {} }
    'admin.shipping.regions.list': { paramsTuple?: []; params?: {} }
    'admin.shipping.market_countries.list': { paramsTuple?: []; params?: {} }
    'admin.shipping.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.shipping.store': { paramsTuple?: []; params?: {} }
    'admin.shipping.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.shipping.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.shipping.rates.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.shipping.rates.update': { paramsTuple: [ParamValue,ParamValue]; params: {'zoneId': ParamValue,'id': ParamValue} }
    'admin.shipping.rates.delete': { paramsTuple: [ParamValue,ParamValue]; params: {'zoneId': ParamValue,'id': ParamValue} }
    'admin.shipping.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.shipping.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.shipping.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customers.home': { paramsTuple?: []; params?: {} }
    'admin.customers.list': { paramsTuple?: []; params?: {} }
    'admin.customers.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customers.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customers.activity.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customers.location_options.view': { paramsTuple?: []; params?: {} }
    'admin.customers.filter_options.view': { paramsTuple?: []; params?: {} }
    'admin.customer_segments.list': { paramsTuple?: []; params?: {} }
    'admin.customers.impersonation.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customers.create': { paramsTuple?: []; params?: {} }
    'admin.customers.store': { paramsTuple?: []; params?: {} }
    'admin.customers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customers.notes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customers.marketing.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customer_segments.store': { paramsTuple?: []; params?: {} }
    'admin.customer_segments.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customer_segments.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customers.addresses.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customers.addresses.update': { paramsTuple: [ParamValue,ParamValue]; params: {'customerId': ParamValue,'id': ParamValue} }
    'admin.customers.addresses.delete': { paramsTuple: [ParamValue,ParamValue]; params: {'customerId': ParamValue,'id': ParamValue} }
    'admin.customers.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.customers.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customers.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.roles.store': { paramsTuple?: []; params?: {} }
    'admin.roles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.roles.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.roles.permissions.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.storefront_hero.home': { paramsTuple?: []; params?: {} }
    'admin.storefront_hero.list': { paramsTuple?: []; params?: {} }
    'admin.storefront_hero.store': { paramsTuple?: []; params?: {} }
    'admin.storefront_hero.reorder': { paramsTuple?: []; params?: {} }
    'admin.storefront_hero.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.storefront_hero.image.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.storefront_hero.image.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.storefront_hero.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.sitemap.view': { paramsTuple?: []; params?: {} }
    'storefront.robots.view': { paramsTuple?: []; params?: {} }
    'storefront.settings.view': { paramsTuple?: []; params?: {} }
    'storefront.theme.view': { paramsTuple?: []; params?: {} }
    'storefront.menu.list': { paramsTuple?: []; params?: {} }
    'storefront.plugins.list': { paramsTuple?: []; params?: {} }
    'storefront.hero_slides.list': { paramsTuple?: []; params?: {} }
    'storefront.theme_assets.show': { paramsTuple: [ParamValue,...ParamValue[]]; params: {'hash': ParamValue,'*': ParamValue[]} }
    'storefront.theme_preview.exit': { paramsTuple?: []; params?: {} }
    'storefront.theme_preview.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.home_content.view': { paramsTuple?: []; params?: {} }
    'storefront.home.view': { paramsTuple?: []; params?: {} }
    'storefront.collections.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.catalog_token.view': { paramsTuple?: []; params?: {} }
    'storefront.collections.view': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.collections.products.list': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.collections.filters.list': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.pages.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.pages.view': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.policies.list': { paramsTuple?: []; params?: {} }
    'storefront.help.home': { paramsTuple?: []; params?: {} }
    'storefront.help.categories.show': { paramsTuple: [ParamValue]; params: {'category': ParamValue} }
    'storefront.help.articles.show': { paramsTuple: [ParamValue,ParamValue]; params: {'category': ParamValue,'slug': ParamValue} }
    'storefront.help.categories.list': { paramsTuple?: []; params?: {} }
    'storefront.help.categories.view': { paramsTuple: [ParamValue]; params: {'category': ParamValue} }
    'storefront.help.articles.view': { paramsTuple: [ParamValue,ParamValue]; params: {'category': ParamValue,'slug': ParamValue} }
    'storefront.help.search.list': { paramsTuple?: []; params?: {} }
    'storefront.products.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.products.view': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.products.reviews.list': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.products.reviews.summary': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.search.list': { paramsTuple?: []; params?: {} }
    'storefront.session.view': { paramsTuple?: []; params?: {} }
    'storefront.market.view': { paramsTuple?: []; params?: {} }
    'storefront.market.update': { paramsTuple?: []; params?: {} }
    'storefront.cart.prices.update': { paramsTuple?: []; params?: {} }
    'storefront.analytics.events.store': { paramsTuple?: []; params?: {} }
    'storefront.newsletter.store': { paramsTuple?: []; params?: {} }
    'storefront.maintenance.newsletter.store': { paramsTuple?: []; params?: {} }
    'storefront.support.chat.view': { paramsTuple?: []; params?: {} }
    'storefront.support.tickets.store': { paramsTuple?: []; params?: {} }
    'storefront.support.tickets.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'storefront.support.tickets.view': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'storefront.support.tickets.messages.store': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'storefront.brand.favicon.view': { paramsTuple: [ParamValue]; params: {'file': ParamValue} }
    'storefront.brand.manifest.view': { paramsTuple?: []; params?: {} }
    'storefront.places.autocomplete.list': { paramsTuple?: []; params?: {} }
    'storefront.places.details.view': { paramsTuple: [ParamValue]; params: {'placeId': ParamValue} }
    'stripe.webhook': { paramsTuple?: []; params?: {} }
    'poli.nudge': { paramsTuple?: []; params?: {} }
    'storefront.impersonation.delete': { paramsTuple?: []; params?: {} }
    'storefront.checkout.home': { paramsTuple?: []; params?: {} }
    'storefront.checkout.store': { paramsTuple?: []; params?: {} }
    'storefront.checkout.quote': { paramsTuple?: []; params?: {} }
    'storefront.checkout.addresses.list': { paramsTuple?: []; params?: {} }
    'storefront.checkout.payment_methods.list': { paramsTuple?: []; params?: {} }
    'storefront.checkout.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.checkout.orders.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.checkout.orders.invoice.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.checkout.orders.receipt.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.checkout.orders.payment.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.checkout.orders.stripe_return': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.checkout.orders.poli_return': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.registration.create': { paramsTuple?: []; params?: {} }
    'customers.registration.store': { paramsTuple?: []; params?: {} }
    'customers.registration.verify.create': { paramsTuple?: []; params?: {} }
    'customers.registration.verify.view': { paramsTuple?: []; params?: {} }
    'customers.registration.verify.store': { paramsTuple?: []; params?: {} }
    'customers.registration.verify.resend.store': { paramsTuple?: []; params?: {} }
    'customers.session.create': { paramsTuple?: []; params?: {} }
    'customers.session.store': { paramsTuple?: []; params?: {} }
    'customers.social.redirect': { paramsTuple: [ParamValue,ParamValue]; params: {'provider': ParamValue,'intent': ParamValue} }
    'customers.social.callback': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'customers.password.forgot.create': { paramsTuple?: []; params?: {} }
    'customers.password.forgot.store': { paramsTuple?: []; params?: {} }
    'customers.password.reset.create': { paramsTuple?: []; params?: {} }
    'customers.password.reset.view': { paramsTuple?: []; params?: {} }
    'customers.password.reset.store': { paramsTuple?: []; params?: {} }
    'customers.password.reset.resend.store': { paramsTuple?: []; params?: {} }
    'customers.session.delete': { paramsTuple?: []; params?: {} }
    'customers.account.view': { paramsTuple?: []; params?: {} }
    'customers.account.welcome.create': { paramsTuple?: []; params?: {} }
    'customers.account.location.options.view': { paramsTuple?: []; params?: {} }
    'customers.account.location.update': { paramsTuple?: []; params?: {} }
    'customers.account.wishlist.ids.view': { paramsTuple?: []; params?: {} }
    'customers.account.wishlist.store': { paramsTuple?: []; params?: {} }
    'customers.account.wishlist.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.home': { paramsTuple?: []; params?: {} }
    'customers.account.orders.home': { paramsTuple?: []; params?: {} }
    'customers.account.orders.list': { paramsTuple?: []; params?: {} }
    'customers.account.orders.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.orders.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.orders.returns.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.orders.notes.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.orders.notes.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.orders.returns.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.orders.payment_proof.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.orders.payment_proof.image.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.orders.invoice.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.orders.receipt.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.addresses.home': { paramsTuple?: []; params?: {} }
    'customers.account.addresses.list': { paramsTuple?: []; params?: {} }
    'customers.account.addresses.store': { paramsTuple?: []; params?: {} }
    'customers.account.addresses.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.addresses.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.details.home': { paramsTuple?: []; params?: {} }
    'customers.account.details.update': { paramsTuple?: []; params?: {} }
    'customers.account.marketing.update': { paramsTuple?: []; params?: {} }
    'customers.account.activity.home': { paramsTuple?: []; params?: {} }
    'customers.account.activity.list': { paramsTuple?: []; params?: {} }
    'customers.account.support.home': { paramsTuple?: []; params?: {} }
    'customers.account.support.list': { paramsTuple?: []; params?: {} }
    'customers.account.support.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.support.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.support.messages.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.wishlist.home': { paramsTuple?: []; params?: {} }
    'customers.account.wishlist.list': { paramsTuple?: []; params?: {} }
    'customers.product_reviews.store': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
  }
  GET: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'admin.session.create': { paramsTuple?: []; params?: {} }
    'admin.setup.create': { paramsTuple?: []; params?: {} }
    'admin.setup.view': { paramsTuple?: []; params?: {} }
    'admin.me.view': { paramsTuple?: []; params?: {} }
    'admin.account.home': { paramsTuple?: []; params?: {} }
    'admin.account.security.view': { paramsTuple?: []; params?: {} }
    'admin.home': { paramsTuple?: []; params?: {} }
    'admin.dashboard.home': { paramsTuple?: []; params?: {} }
    'admin.analytics.home': { paramsTuple?: []; params?: {} }
    'admin.analytics.view': { paramsTuple?: []; params?: {} }
    'admin.analytics.reports.home': { paramsTuple?: []; params?: {} }
    'admin.analytics.reports.list': { paramsTuple?: []; params?: {} }
    'admin.analytics.reports.show': { paramsTuple: [ParamValue]; params: {'key': ParamValue} }
    'admin.analytics.reports.view': { paramsTuple: [ParamValue]; params: {'key': ParamValue} }
    'admin.analytics.live.home': { paramsTuple?: []; params?: {} }
    'admin.analytics.live.view': { paramsTuple?: []; params?: {} }
    'admin.analytics.reports.export': { paramsTuple: [ParamValue]; params: {'key': ParamValue} }
    'admin.users.home': { paramsTuple?: []; params?: {} }
    'admin.users.list': { paramsTuple?: []; params?: {} }
    'admin.users.roles': { paramsTuple?: []; params?: {} }
    'admin.users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.activity.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.create': { paramsTuple?: []; params?: {} }
    'admin.roles.home': { paramsTuple?: []; params?: {} }
    'admin.roles.matrix': { paramsTuple?: []; params?: {} }
    'admin.products.home': { paramsTuple?: []; params?: {} }
    'admin.products.list': { paramsTuple?: []; params?: {} }
    'admin.products.facets': { paramsTuple?: []; params?: {} }
    'admin.products.markets.list': { paramsTuple?: []; params?: {} }
    'admin.products.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.products.activity.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.products.variants.view': { paramsTuple: [ParamValue,ParamValue]; params: {'productId': ParamValue,'id': ParamValue} }
    'admin.products.reviews.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.options.catalog': { paramsTuple?: []; params?: {} }
    'admin.products.create': { paramsTuple?: []; params?: {} }
    'admin.products.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.products.variants.create': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'admin.products.variants.edit': { paramsTuple: [ParamValue,ParamValue]; params: {'productId': ParamValue,'id': ParamValue} }
    'admin.products.import.sample': { paramsTuple?: []; params?: {} }
    'admin.products.export': { paramsTuple?: []; params?: {} }
    'admin.collections.home': { paramsTuple?: []; params?: {} }
    'admin.collections.list': { paramsTuple?: []; params?: {} }
    'admin.collections.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.collections.products.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.collections.create': { paramsTuple?: []; params?: {} }
    'admin.collections.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.collections.import.sample': { paramsTuple?: []; params?: {} }
    'admin.collections.export': { paramsTuple?: []; params?: {} }
    'admin.pages.home': { paramsTuple?: []; params?: {} }
    'admin.pages.list': { paramsTuple?: []; params?: {} }
    'admin.pages.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.pages.create': { paramsTuple?: []; params?: {} }
    'admin.pages.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.options.home': { paramsTuple?: []; params?: {} }
    'admin.options.list': { paramsTuple?: []; params?: {} }
    'admin.options.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.options.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.options.import.sample': { paramsTuple?: []; params?: {} }
    'admin.options.export': { paramsTuple?: []; params?: {} }
    'admin.product_types.home': { paramsTuple?: []; params?: {} }
    'admin.product_types.list': { paramsTuple?: []; params?: {} }
    'admin.product_types.import.sample': { paramsTuple?: []; params?: {} }
    'admin.product_types.export': { paramsTuple?: []; params?: {} }
    'admin.product_labels.home': { paramsTuple?: []; params?: {} }
    'admin.product_labels.list': { paramsTuple?: []; params?: {} }
    'admin.media.home': { paramsTuple?: []; params?: {} }
    'admin.media.list': { paramsTuple?: []; params?: {} }
    'admin.vendors.home': { paramsTuple?: []; params?: {} }
    'admin.vendors.list': { paramsTuple?: []; params?: {} }
    'admin.vendors.import.sample': { paramsTuple?: []; params?: {} }
    'admin.vendors.export': { paramsTuple?: []; params?: {} }
    'admin.locations.home': { paramsTuple?: []; params?: {} }
    'admin.locations.list': { paramsTuple?: []; params?: {} }
    'admin.locations.import.sample': { paramsTuple?: []; params?: {} }
    'admin.locations.export': { paramsTuple?: []; params?: {} }
    'admin.dashboard.view': { paramsTuple?: []; params?: {} }
    'admin.orders.home': { paramsTuple?: []; params?: {} }
    'admin.orders.list': { paramsTuple?: []; params?: {} }
    'admin.orders.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.activity.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.variants.search': { paramsTuple?: []; params?: {} }
    'admin.orders.drafts.home': { paramsTuple?: []; params?: {} }
    'admin.orders.drafts.list': { paramsTuple?: []; params?: {} }
    'admin.orders.drafts.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.returns.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.notes.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.payment_proof.image.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.invoice.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.receipt.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.packing_slip.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.returns.home': { paramsTuple?: []; params?: {} }
    'admin.returns.list': { paramsTuple?: []; params?: {} }
    'admin.orders.drafts.create': { paramsTuple?: []; params?: {} }
    'admin.orders.drafts.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.discounts.home': { paramsTuple?: []; params?: {} }
    'admin.discounts.list': { paramsTuple?: []; params?: {} }
    'admin.discounts.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.discounts.create': { paramsTuple?: []; params?: {} }
    'admin.discounts.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.newsletter_subscribers.home': { paramsTuple?: []; params?: {} }
    'admin.newsletter_subscribers.list': { paramsTuple?: []; params?: {} }
    'admin.store_settings.home': { paramsTuple?: []; params?: {} }
    'admin.store_settings.view': { paramsTuple?: []; params?: {} }
    'admin.maintenance.view': { paramsTuple?: []; params?: {} }
    'admin.emails.home': { paramsTuple?: []; params?: {} }
    'admin.emails.list': { paramsTuple?: []; params?: {} }
    'admin.emails.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.emails.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.support.tickets.home': { paramsTuple?: []; params?: {} }
    'admin.support.tickets.list': { paramsTuple?: []; params?: {} }
    'admin.support.tickets.open_count.view': { paramsTuple?: []; params?: {} }
    'admin.support.tickets.assignees.list': { paramsTuple?: []; params?: {} }
    'admin.support.tickets.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.support.tickets.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.help_articles.home': { paramsTuple?: []; params?: {} }
    'admin.help_articles.list': { paramsTuple?: []; params?: {} }
    'admin.help_articles.options.list': { paramsTuple?: []; params?: {} }
    'admin.help_articles.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.help_categories.home': { paramsTuple?: []; params?: {} }
    'admin.help_categories.list': { paramsTuple?: []; params?: {} }
    'admin.help_categories.options.list': { paramsTuple?: []; params?: {} }
    'admin.help_categories.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.help_articles.create': { paramsTuple?: []; params?: {} }
    'admin.help_articles.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.notifications.list': { paramsTuple?: []; params?: {} }
    'admin.events.home': { paramsTuple?: []; params?: {} }
    'admin.events.list': { paramsTuple?: []; params?: {} }
    'admin.events.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.payments.home': { paramsTuple?: []; params?: {} }
    'admin.payments.list': { paramsTuple?: []; params?: {} }
    'admin.payments.markets.list': { paramsTuple?: []; params?: {} }
    'admin.payments.bank_transfer.view': { paramsTuple?: []; params?: {} }
    'admin.payments.stripe.view': { paramsTuple?: []; params?: {} }
    'admin.payments.poli.view': { paramsTuple?: []; params?: {} }
    'admin.storefront_theme.home': { paramsTuple?: []; params?: {} }
    'admin.storefront_theme.view': { paramsTuple?: []; params?: {} }
    'admin.storefront_menu.home': { paramsTuple?: []; params?: {} }
    'admin.storefront_menu.list': { paramsTuple?: []; params?: {} }
    'admin.storefront_menu.collections': { paramsTuple?: []; params?: {} }
    'admin.storefront_menu.pages': { paramsTuple?: []; params?: {} }
    'admin.storefront_content.home': { paramsTuple?: []; params?: {} }
    'admin.storefront_promo_banners.list': { paramsTuple?: []; params?: {} }
    'admin.storefront_features.list': { paramsTuple?: []; params?: {} }
    'admin.storefront_featured_reviews.list': { paramsTuple?: []; params?: {} }
    'admin.plugins.home': { paramsTuple?: []; params?: {} }
    'admin.plugins.list': { paramsTuple?: []; params?: {} }
    'admin.themes.home': { paramsTuple?: []; params?: {} }
    'admin.themes.list': { paramsTuple?: []; params?: {} }
    'admin.themes.preview': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.themes.download': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.markets.home': { paramsTuple?: []; params?: {} }
    'admin.markets.list': { paramsTuple?: []; params?: {} }
    'admin.markets.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.markets.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.taxes.home': { paramsTuple?: []; params?: {} }
    'admin.taxes.list': { paramsTuple?: []; params?: {} }
    'admin.shipping.home': { paramsTuple?: []; params?: {} }
    'admin.shipping.list': { paramsTuple?: []; params?: {} }
    'admin.shipping.markets.list': { paramsTuple?: []; params?: {} }
    'admin.shipping.regions.list': { paramsTuple?: []; params?: {} }
    'admin.shipping.market_countries.list': { paramsTuple?: []; params?: {} }
    'admin.shipping.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.shipping.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customers.home': { paramsTuple?: []; params?: {} }
    'admin.customers.list': { paramsTuple?: []; params?: {} }
    'admin.customers.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customers.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customers.activity.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customers.location_options.view': { paramsTuple?: []; params?: {} }
    'admin.customers.filter_options.view': { paramsTuple?: []; params?: {} }
    'admin.customer_segments.list': { paramsTuple?: []; params?: {} }
    'admin.customers.create': { paramsTuple?: []; params?: {} }
    'admin.storefront_hero.home': { paramsTuple?: []; params?: {} }
    'admin.storefront_hero.list': { paramsTuple?: []; params?: {} }
    'storefront.sitemap.view': { paramsTuple?: []; params?: {} }
    'storefront.robots.view': { paramsTuple?: []; params?: {} }
    'storefront.settings.view': { paramsTuple?: []; params?: {} }
    'storefront.theme.view': { paramsTuple?: []; params?: {} }
    'storefront.menu.list': { paramsTuple?: []; params?: {} }
    'storefront.plugins.list': { paramsTuple?: []; params?: {} }
    'storefront.hero_slides.list': { paramsTuple?: []; params?: {} }
    'storefront.theme_assets.show': { paramsTuple: [ParamValue,...ParamValue[]]; params: {'hash': ParamValue,'*': ParamValue[]} }
    'storefront.theme_preview.exit': { paramsTuple?: []; params?: {} }
    'storefront.theme_preview.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.home_content.view': { paramsTuple?: []; params?: {} }
    'storefront.home.view': { paramsTuple?: []; params?: {} }
    'storefront.collections.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.catalog_token.view': { paramsTuple?: []; params?: {} }
    'storefront.collections.view': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.collections.products.list': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.collections.filters.list': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.pages.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.pages.view': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.policies.list': { paramsTuple?: []; params?: {} }
    'storefront.help.home': { paramsTuple?: []; params?: {} }
    'storefront.help.categories.show': { paramsTuple: [ParamValue]; params: {'category': ParamValue} }
    'storefront.help.articles.show': { paramsTuple: [ParamValue,ParamValue]; params: {'category': ParamValue,'slug': ParamValue} }
    'storefront.help.categories.list': { paramsTuple?: []; params?: {} }
    'storefront.help.categories.view': { paramsTuple: [ParamValue]; params: {'category': ParamValue} }
    'storefront.help.articles.view': { paramsTuple: [ParamValue,ParamValue]; params: {'category': ParamValue,'slug': ParamValue} }
    'storefront.help.search.list': { paramsTuple?: []; params?: {} }
    'storefront.products.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.products.view': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.products.reviews.list': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.products.reviews.summary': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.search.list': { paramsTuple?: []; params?: {} }
    'storefront.session.view': { paramsTuple?: []; params?: {} }
    'storefront.market.view': { paramsTuple?: []; params?: {} }
    'storefront.support.chat.view': { paramsTuple?: []; params?: {} }
    'storefront.support.tickets.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'storefront.support.tickets.view': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'storefront.brand.favicon.view': { paramsTuple: [ParamValue]; params: {'file': ParamValue} }
    'storefront.brand.manifest.view': { paramsTuple?: []; params?: {} }
    'storefront.places.autocomplete.list': { paramsTuple?: []; params?: {} }
    'storefront.places.details.view': { paramsTuple: [ParamValue]; params: {'placeId': ParamValue} }
    'storefront.checkout.home': { paramsTuple?: []; params?: {} }
    'storefront.checkout.addresses.list': { paramsTuple?: []; params?: {} }
    'storefront.checkout.payment_methods.list': { paramsTuple?: []; params?: {} }
    'storefront.checkout.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.checkout.orders.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.checkout.orders.invoice.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.checkout.orders.receipt.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.checkout.orders.stripe_return': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.checkout.orders.poli_return': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.registration.create': { paramsTuple?: []; params?: {} }
    'customers.registration.verify.create': { paramsTuple?: []; params?: {} }
    'customers.registration.verify.view': { paramsTuple?: []; params?: {} }
    'customers.session.create': { paramsTuple?: []; params?: {} }
    'customers.social.redirect': { paramsTuple: [ParamValue,ParamValue]; params: {'provider': ParamValue,'intent': ParamValue} }
    'customers.social.callback': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'customers.password.forgot.create': { paramsTuple?: []; params?: {} }
    'customers.password.reset.create': { paramsTuple?: []; params?: {} }
    'customers.password.reset.view': { paramsTuple?: []; params?: {} }
    'customers.account.view': { paramsTuple?: []; params?: {} }
    'customers.account.welcome.create': { paramsTuple?: []; params?: {} }
    'customers.account.location.options.view': { paramsTuple?: []; params?: {} }
    'customers.account.wishlist.ids.view': { paramsTuple?: []; params?: {} }
    'customers.account.home': { paramsTuple?: []; params?: {} }
    'customers.account.orders.home': { paramsTuple?: []; params?: {} }
    'customers.account.orders.list': { paramsTuple?: []; params?: {} }
    'customers.account.orders.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.orders.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.orders.returns.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.orders.notes.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.orders.payment_proof.image.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.orders.invoice.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.orders.receipt.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.addresses.home': { paramsTuple?: []; params?: {} }
    'customers.account.addresses.list': { paramsTuple?: []; params?: {} }
    'customers.account.details.home': { paramsTuple?: []; params?: {} }
    'customers.account.activity.home': { paramsTuple?: []; params?: {} }
    'customers.account.activity.list': { paramsTuple?: []; params?: {} }
    'customers.account.support.home': { paramsTuple?: []; params?: {} }
    'customers.account.support.list': { paramsTuple?: []; params?: {} }
    'customers.account.support.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.support.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.wishlist.home': { paramsTuple?: []; params?: {} }
    'customers.account.wishlist.list': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'admin.session.create': { paramsTuple?: []; params?: {} }
    'admin.setup.create': { paramsTuple?: []; params?: {} }
    'admin.setup.view': { paramsTuple?: []; params?: {} }
    'admin.me.view': { paramsTuple?: []; params?: {} }
    'admin.account.home': { paramsTuple?: []; params?: {} }
    'admin.account.security.view': { paramsTuple?: []; params?: {} }
    'admin.home': { paramsTuple?: []; params?: {} }
    'admin.dashboard.home': { paramsTuple?: []; params?: {} }
    'admin.analytics.home': { paramsTuple?: []; params?: {} }
    'admin.analytics.view': { paramsTuple?: []; params?: {} }
    'admin.analytics.reports.home': { paramsTuple?: []; params?: {} }
    'admin.analytics.reports.list': { paramsTuple?: []; params?: {} }
    'admin.analytics.reports.show': { paramsTuple: [ParamValue]; params: {'key': ParamValue} }
    'admin.analytics.reports.view': { paramsTuple: [ParamValue]; params: {'key': ParamValue} }
    'admin.analytics.live.home': { paramsTuple?: []; params?: {} }
    'admin.analytics.live.view': { paramsTuple?: []; params?: {} }
    'admin.analytics.reports.export': { paramsTuple: [ParamValue]; params: {'key': ParamValue} }
    'admin.users.home': { paramsTuple?: []; params?: {} }
    'admin.users.list': { paramsTuple?: []; params?: {} }
    'admin.users.roles': { paramsTuple?: []; params?: {} }
    'admin.users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.activity.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.create': { paramsTuple?: []; params?: {} }
    'admin.roles.home': { paramsTuple?: []; params?: {} }
    'admin.roles.matrix': { paramsTuple?: []; params?: {} }
    'admin.products.home': { paramsTuple?: []; params?: {} }
    'admin.products.list': { paramsTuple?: []; params?: {} }
    'admin.products.facets': { paramsTuple?: []; params?: {} }
    'admin.products.markets.list': { paramsTuple?: []; params?: {} }
    'admin.products.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.products.activity.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.products.variants.view': { paramsTuple: [ParamValue,ParamValue]; params: {'productId': ParamValue,'id': ParamValue} }
    'admin.products.reviews.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.options.catalog': { paramsTuple?: []; params?: {} }
    'admin.products.create': { paramsTuple?: []; params?: {} }
    'admin.products.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.products.variants.create': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'admin.products.variants.edit': { paramsTuple: [ParamValue,ParamValue]; params: {'productId': ParamValue,'id': ParamValue} }
    'admin.products.import.sample': { paramsTuple?: []; params?: {} }
    'admin.products.export': { paramsTuple?: []; params?: {} }
    'admin.collections.home': { paramsTuple?: []; params?: {} }
    'admin.collections.list': { paramsTuple?: []; params?: {} }
    'admin.collections.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.collections.products.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.collections.create': { paramsTuple?: []; params?: {} }
    'admin.collections.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.collections.import.sample': { paramsTuple?: []; params?: {} }
    'admin.collections.export': { paramsTuple?: []; params?: {} }
    'admin.pages.home': { paramsTuple?: []; params?: {} }
    'admin.pages.list': { paramsTuple?: []; params?: {} }
    'admin.pages.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.pages.create': { paramsTuple?: []; params?: {} }
    'admin.pages.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.options.home': { paramsTuple?: []; params?: {} }
    'admin.options.list': { paramsTuple?: []; params?: {} }
    'admin.options.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.options.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.options.import.sample': { paramsTuple?: []; params?: {} }
    'admin.options.export': { paramsTuple?: []; params?: {} }
    'admin.product_types.home': { paramsTuple?: []; params?: {} }
    'admin.product_types.list': { paramsTuple?: []; params?: {} }
    'admin.product_types.import.sample': { paramsTuple?: []; params?: {} }
    'admin.product_types.export': { paramsTuple?: []; params?: {} }
    'admin.product_labels.home': { paramsTuple?: []; params?: {} }
    'admin.product_labels.list': { paramsTuple?: []; params?: {} }
    'admin.media.home': { paramsTuple?: []; params?: {} }
    'admin.media.list': { paramsTuple?: []; params?: {} }
    'admin.vendors.home': { paramsTuple?: []; params?: {} }
    'admin.vendors.list': { paramsTuple?: []; params?: {} }
    'admin.vendors.import.sample': { paramsTuple?: []; params?: {} }
    'admin.vendors.export': { paramsTuple?: []; params?: {} }
    'admin.locations.home': { paramsTuple?: []; params?: {} }
    'admin.locations.list': { paramsTuple?: []; params?: {} }
    'admin.locations.import.sample': { paramsTuple?: []; params?: {} }
    'admin.locations.export': { paramsTuple?: []; params?: {} }
    'admin.dashboard.view': { paramsTuple?: []; params?: {} }
    'admin.orders.home': { paramsTuple?: []; params?: {} }
    'admin.orders.list': { paramsTuple?: []; params?: {} }
    'admin.orders.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.activity.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.variants.search': { paramsTuple?: []; params?: {} }
    'admin.orders.drafts.home': { paramsTuple?: []; params?: {} }
    'admin.orders.drafts.list': { paramsTuple?: []; params?: {} }
    'admin.orders.drafts.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.returns.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.notes.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.payment_proof.image.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.invoice.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.receipt.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.packing_slip.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.returns.home': { paramsTuple?: []; params?: {} }
    'admin.returns.list': { paramsTuple?: []; params?: {} }
    'admin.orders.drafts.create': { paramsTuple?: []; params?: {} }
    'admin.orders.drafts.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.discounts.home': { paramsTuple?: []; params?: {} }
    'admin.discounts.list': { paramsTuple?: []; params?: {} }
    'admin.discounts.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.discounts.create': { paramsTuple?: []; params?: {} }
    'admin.discounts.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.newsletter_subscribers.home': { paramsTuple?: []; params?: {} }
    'admin.newsletter_subscribers.list': { paramsTuple?: []; params?: {} }
    'admin.store_settings.home': { paramsTuple?: []; params?: {} }
    'admin.store_settings.view': { paramsTuple?: []; params?: {} }
    'admin.maintenance.view': { paramsTuple?: []; params?: {} }
    'admin.emails.home': { paramsTuple?: []; params?: {} }
    'admin.emails.list': { paramsTuple?: []; params?: {} }
    'admin.emails.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.emails.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.support.tickets.home': { paramsTuple?: []; params?: {} }
    'admin.support.tickets.list': { paramsTuple?: []; params?: {} }
    'admin.support.tickets.open_count.view': { paramsTuple?: []; params?: {} }
    'admin.support.tickets.assignees.list': { paramsTuple?: []; params?: {} }
    'admin.support.tickets.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.support.tickets.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.help_articles.home': { paramsTuple?: []; params?: {} }
    'admin.help_articles.list': { paramsTuple?: []; params?: {} }
    'admin.help_articles.options.list': { paramsTuple?: []; params?: {} }
    'admin.help_articles.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.help_categories.home': { paramsTuple?: []; params?: {} }
    'admin.help_categories.list': { paramsTuple?: []; params?: {} }
    'admin.help_categories.options.list': { paramsTuple?: []; params?: {} }
    'admin.help_categories.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.help_articles.create': { paramsTuple?: []; params?: {} }
    'admin.help_articles.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.notifications.list': { paramsTuple?: []; params?: {} }
    'admin.events.home': { paramsTuple?: []; params?: {} }
    'admin.events.list': { paramsTuple?: []; params?: {} }
    'admin.events.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.payments.home': { paramsTuple?: []; params?: {} }
    'admin.payments.list': { paramsTuple?: []; params?: {} }
    'admin.payments.markets.list': { paramsTuple?: []; params?: {} }
    'admin.payments.bank_transfer.view': { paramsTuple?: []; params?: {} }
    'admin.payments.stripe.view': { paramsTuple?: []; params?: {} }
    'admin.payments.poli.view': { paramsTuple?: []; params?: {} }
    'admin.storefront_theme.home': { paramsTuple?: []; params?: {} }
    'admin.storefront_theme.view': { paramsTuple?: []; params?: {} }
    'admin.storefront_menu.home': { paramsTuple?: []; params?: {} }
    'admin.storefront_menu.list': { paramsTuple?: []; params?: {} }
    'admin.storefront_menu.collections': { paramsTuple?: []; params?: {} }
    'admin.storefront_menu.pages': { paramsTuple?: []; params?: {} }
    'admin.storefront_content.home': { paramsTuple?: []; params?: {} }
    'admin.storefront_promo_banners.list': { paramsTuple?: []; params?: {} }
    'admin.storefront_features.list': { paramsTuple?: []; params?: {} }
    'admin.storefront_featured_reviews.list': { paramsTuple?: []; params?: {} }
    'admin.plugins.home': { paramsTuple?: []; params?: {} }
    'admin.plugins.list': { paramsTuple?: []; params?: {} }
    'admin.themes.home': { paramsTuple?: []; params?: {} }
    'admin.themes.list': { paramsTuple?: []; params?: {} }
    'admin.themes.preview': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.themes.download': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.markets.home': { paramsTuple?: []; params?: {} }
    'admin.markets.list': { paramsTuple?: []; params?: {} }
    'admin.markets.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.markets.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.taxes.home': { paramsTuple?: []; params?: {} }
    'admin.taxes.list': { paramsTuple?: []; params?: {} }
    'admin.shipping.home': { paramsTuple?: []; params?: {} }
    'admin.shipping.list': { paramsTuple?: []; params?: {} }
    'admin.shipping.markets.list': { paramsTuple?: []; params?: {} }
    'admin.shipping.regions.list': { paramsTuple?: []; params?: {} }
    'admin.shipping.market_countries.list': { paramsTuple?: []; params?: {} }
    'admin.shipping.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.shipping.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customers.home': { paramsTuple?: []; params?: {} }
    'admin.customers.list': { paramsTuple?: []; params?: {} }
    'admin.customers.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customers.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customers.activity.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customers.location_options.view': { paramsTuple?: []; params?: {} }
    'admin.customers.filter_options.view': { paramsTuple?: []; params?: {} }
    'admin.customer_segments.list': { paramsTuple?: []; params?: {} }
    'admin.customers.create': { paramsTuple?: []; params?: {} }
    'admin.storefront_hero.home': { paramsTuple?: []; params?: {} }
    'admin.storefront_hero.list': { paramsTuple?: []; params?: {} }
    'storefront.sitemap.view': { paramsTuple?: []; params?: {} }
    'storefront.robots.view': { paramsTuple?: []; params?: {} }
    'storefront.settings.view': { paramsTuple?: []; params?: {} }
    'storefront.theme.view': { paramsTuple?: []; params?: {} }
    'storefront.menu.list': { paramsTuple?: []; params?: {} }
    'storefront.plugins.list': { paramsTuple?: []; params?: {} }
    'storefront.hero_slides.list': { paramsTuple?: []; params?: {} }
    'storefront.theme_assets.show': { paramsTuple: [ParamValue,...ParamValue[]]; params: {'hash': ParamValue,'*': ParamValue[]} }
    'storefront.theme_preview.exit': { paramsTuple?: []; params?: {} }
    'storefront.theme_preview.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.home_content.view': { paramsTuple?: []; params?: {} }
    'storefront.home.view': { paramsTuple?: []; params?: {} }
    'storefront.collections.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.catalog_token.view': { paramsTuple?: []; params?: {} }
    'storefront.collections.view': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.collections.products.list': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.collections.filters.list': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.pages.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.pages.view': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.policies.list': { paramsTuple?: []; params?: {} }
    'storefront.help.home': { paramsTuple?: []; params?: {} }
    'storefront.help.categories.show': { paramsTuple: [ParamValue]; params: {'category': ParamValue} }
    'storefront.help.articles.show': { paramsTuple: [ParamValue,ParamValue]; params: {'category': ParamValue,'slug': ParamValue} }
    'storefront.help.categories.list': { paramsTuple?: []; params?: {} }
    'storefront.help.categories.view': { paramsTuple: [ParamValue]; params: {'category': ParamValue} }
    'storefront.help.articles.view': { paramsTuple: [ParamValue,ParamValue]; params: {'category': ParamValue,'slug': ParamValue} }
    'storefront.help.search.list': { paramsTuple?: []; params?: {} }
    'storefront.products.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.products.view': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.products.reviews.list': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.products.reviews.summary': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'storefront.search.list': { paramsTuple?: []; params?: {} }
    'storefront.session.view': { paramsTuple?: []; params?: {} }
    'storefront.market.view': { paramsTuple?: []; params?: {} }
    'storefront.support.chat.view': { paramsTuple?: []; params?: {} }
    'storefront.support.tickets.show': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'storefront.support.tickets.view': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'storefront.brand.favicon.view': { paramsTuple: [ParamValue]; params: {'file': ParamValue} }
    'storefront.brand.manifest.view': { paramsTuple?: []; params?: {} }
    'storefront.places.autocomplete.list': { paramsTuple?: []; params?: {} }
    'storefront.places.details.view': { paramsTuple: [ParamValue]; params: {'placeId': ParamValue} }
    'storefront.checkout.home': { paramsTuple?: []; params?: {} }
    'storefront.checkout.addresses.list': { paramsTuple?: []; params?: {} }
    'storefront.checkout.payment_methods.list': { paramsTuple?: []; params?: {} }
    'storefront.checkout.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.checkout.orders.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.checkout.orders.invoice.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.checkout.orders.receipt.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.checkout.orders.stripe_return': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.checkout.orders.poli_return': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.registration.create': { paramsTuple?: []; params?: {} }
    'customers.registration.verify.create': { paramsTuple?: []; params?: {} }
    'customers.registration.verify.view': { paramsTuple?: []; params?: {} }
    'customers.session.create': { paramsTuple?: []; params?: {} }
    'customers.social.redirect': { paramsTuple: [ParamValue,ParamValue]; params: {'provider': ParamValue,'intent': ParamValue} }
    'customers.social.callback': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'customers.password.forgot.create': { paramsTuple?: []; params?: {} }
    'customers.password.reset.create': { paramsTuple?: []; params?: {} }
    'customers.password.reset.view': { paramsTuple?: []; params?: {} }
    'customers.account.view': { paramsTuple?: []; params?: {} }
    'customers.account.welcome.create': { paramsTuple?: []; params?: {} }
    'customers.account.location.options.view': { paramsTuple?: []; params?: {} }
    'customers.account.wishlist.ids.view': { paramsTuple?: []; params?: {} }
    'customers.account.home': { paramsTuple?: []; params?: {} }
    'customers.account.orders.home': { paramsTuple?: []; params?: {} }
    'customers.account.orders.list': { paramsTuple?: []; params?: {} }
    'customers.account.orders.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.orders.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.orders.returns.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.orders.notes.list': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.orders.payment_proof.image.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.orders.invoice.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.orders.receipt.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.addresses.home': { paramsTuple?: []; params?: {} }
    'customers.account.addresses.list': { paramsTuple?: []; params?: {} }
    'customers.account.details.home': { paramsTuple?: []; params?: {} }
    'customers.account.activity.home': { paramsTuple?: []; params?: {} }
    'customers.account.activity.list': { paramsTuple?: []; params?: {} }
    'customers.account.support.home': { paramsTuple?: []; params?: {} }
    'customers.account.support.list': { paramsTuple?: []; params?: {} }
    'customers.account.support.view': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.support.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.wishlist.home': { paramsTuple?: []; params?: {} }
    'customers.account.wishlist.list': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
    'admin.session.store': { paramsTuple?: []; params?: {} }
    'admin.session.mfa.store': { paramsTuple?: []; params?: {} }
    'admin.setup.store': { paramsTuple?: []; params?: {} }
    'admin.session.delete': { paramsTuple?: []; params?: {} }
    'admin.account.mfa.setup.store': { paramsTuple?: []; params?: {} }
    'admin.account.mfa.store': { paramsTuple?: []; params?: {} }
    'admin.users.store': { paramsTuple?: []; params?: {} }
    'admin.products.store': { paramsTuple?: []; params?: {} }
    'admin.products.variants.store': { paramsTuple: [ParamValue]; params: {'productId': ParamValue} }
    'admin.products.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.products.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.products.images.store': { paramsTuple?: []; params?: {} }
    'admin.products.import.store': { paramsTuple?: []; params?: {} }
    'admin.collections.preview': { paramsTuple?: []; params?: {} }
    'admin.collections.store': { paramsTuple?: []; params?: {} }
    'admin.collections.products.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.collections.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.collections.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.collections.image.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.collections.import.store': { paramsTuple?: []; params?: {} }
    'admin.pages.store': { paramsTuple?: []; params?: {} }
    'admin.pages.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.pages.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.options.store': { paramsTuple?: []; params?: {} }
    'admin.options.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.options.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.options.import.store': { paramsTuple?: []; params?: {} }
    'admin.options.values.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.product_types.store': { paramsTuple?: []; params?: {} }
    'admin.product_types.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.product_types.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.product_types.import.store': { paramsTuple?: []; params?: {} }
    'admin.product_labels.store': { paramsTuple?: []; params?: {} }
    'admin.product_labels.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.product_labels.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.media.store': { paramsTuple?: []; params?: {} }
    'admin.vendors.store': { paramsTuple?: []; params?: {} }
    'admin.vendors.image.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.vendors.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.vendors.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.vendors.import.store': { paramsTuple?: []; params?: {} }
    'admin.locations.store': { paramsTuple?: []; params?: {} }
    'admin.locations.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.locations.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.locations.import.store': { paramsTuple?: []; params?: {} }
    'admin.orders.drafts.store': { paramsTuple?: []; params?: {} }
    'admin.orders.drafts.calculate': { paramsTuple?: []; params?: {} }
    'admin.orders.drafts.complete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.fulfillments.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.returns.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.notes.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.refunds.calculate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.refunds.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.cancel': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.discounts.store': { paramsTuple?: []; params?: {} }
    'admin.discounts.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.discounts.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.emails.resend.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.support.tickets.messages.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.help_articles.preview.store': { paramsTuple?: []; params?: {} }
    'admin.help_articles.store': { paramsTuple?: []; params?: {} }
    'admin.help_categories.store': { paramsTuple?: []; params?: {} }
    'admin.help_articles.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.help_articles.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.help_categories.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.help_categories.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.events.retry_failed.store': { paramsTuple?: []; params?: {} }
    'admin.events.retry.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.storefront_menu.store': { paramsTuple?: []; params?: {} }
    'admin.storefront_promo_banners.store': { paramsTuple?: []; params?: {} }
    'admin.storefront_theme.logo.store': { paramsTuple?: []; params?: {} }
    'admin.storefront_theme.favicon.store': { paramsTuple?: []; params?: {} }
    'admin.storefront_promo_banners.image.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.plugins.install': { paramsTuple: [ParamValue]; params: {'key': ParamValue} }
    'admin.themes.share': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.themes.store': { paramsTuple?: []; params?: {} }
    'admin.themes.duplicate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.themes.publish': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.markets.store': { paramsTuple?: []; params?: {} }
    'admin.markets.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.markets.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.taxes.store': { paramsTuple?: []; params?: {} }
    'admin.taxes.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.taxes.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.shipping.store': { paramsTuple?: []; params?: {} }
    'admin.shipping.rates.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.shipping.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.shipping.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customers.impersonation.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customers.store': { paramsTuple?: []; params?: {} }
    'admin.customer_segments.store': { paramsTuple?: []; params?: {} }
    'admin.customers.addresses.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customers.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customers.unarchive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.roles.store': { paramsTuple?: []; params?: {} }
    'admin.storefront_hero.store': { paramsTuple?: []; params?: {} }
    'admin.storefront_hero.image.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.cart.prices.update': { paramsTuple?: []; params?: {} }
    'storefront.analytics.events.store': { paramsTuple?: []; params?: {} }
    'storefront.newsletter.store': { paramsTuple?: []; params?: {} }
    'storefront.maintenance.newsletter.store': { paramsTuple?: []; params?: {} }
    'storefront.support.tickets.store': { paramsTuple?: []; params?: {} }
    'storefront.support.tickets.messages.store': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'stripe.webhook': { paramsTuple?: []; params?: {} }
    'poli.nudge': { paramsTuple?: []; params?: {} }
    'storefront.checkout.store': { paramsTuple?: []; params?: {} }
    'storefront.checkout.quote': { paramsTuple?: []; params?: {} }
    'storefront.checkout.orders.payment.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.registration.store': { paramsTuple?: []; params?: {} }
    'customers.registration.verify.store': { paramsTuple?: []; params?: {} }
    'customers.registration.verify.resend.store': { paramsTuple?: []; params?: {} }
    'customers.session.store': { paramsTuple?: []; params?: {} }
    'customers.password.forgot.store': { paramsTuple?: []; params?: {} }
    'customers.password.reset.store': { paramsTuple?: []; params?: {} }
    'customers.password.reset.resend.store': { paramsTuple?: []; params?: {} }
    'customers.session.delete': { paramsTuple?: []; params?: {} }
    'customers.account.wishlist.store': { paramsTuple?: []; params?: {} }
    'customers.account.orders.notes.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.orders.returns.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.orders.payment_proof.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.addresses.store': { paramsTuple?: []; params?: {} }
    'customers.account.support.messages.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.product_reviews.store': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
  }
  PUT: {
    'admin.account.profile.update': { paramsTuple?: []; params?: {} }
    'admin.account.password.update': { paramsTuple?: []; params?: {} }
    'admin.users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.products.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.products.options.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.products.variants.update': { paramsTuple: [ParamValue,ParamValue]; params: {'productId': ParamValue,'id': ParamValue} }
    'admin.products.bulk.status.update': { paramsTuple?: []; params?: {} }
    'admin.products.reviews.update': { paramsTuple: [ParamValue,ParamValue]; params: {'productId': ParamValue,'id': ParamValue} }
    'admin.products.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.collections.bulk.status.update': { paramsTuple?: []; params?: {} }
    'admin.collections.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.collections.products.reorder': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.collections.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.pages.bulk.status.update': { paramsTuple?: []; params?: {} }
    'admin.pages.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.pages.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.products.variants.inventory.update': { paramsTuple: [ParamValue,ParamValue]; params: {'productId': ParamValue,'id': ParamValue} }
    'admin.options.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.options.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.options.values.update': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'valueId': ParamValue} }
    'admin.product_types.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.product_types.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.product_labels.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.product_labels.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.vendors.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.vendors.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.locations.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.locations.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.orders.drafts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.fulfillment_status.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.fulfillments.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.fulfillments.cancel.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.payment_proof.review.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.returns.approve.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.returns.decline.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.returns.receive.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.returns.cancel.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.discounts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.discounts.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.newsletter_subscribers.bulk.subscription.update': { paramsTuple?: []; params?: {} }
    'admin.store_settings.business.update': { paramsTuple?: []; params?: {} }
    'admin.store_settings.contact.update': { paramsTuple?: []; params?: {} }
    'admin.store_settings.address.update': { paramsTuple?: []; params?: {} }
    'admin.store_settings.defaults.update': { paramsTuple?: []; params?: {} }
    'admin.store_settings.notifications.update': { paramsTuple?: []; params?: {} }
    'admin.store_settings.checkout.update': { paramsTuple?: []; params?: {} }
    'admin.maintenance.update': { paramsTuple?: []; params?: {} }
    'admin.support.tickets.bulk.status.update': { paramsTuple?: []; params?: {} }
    'admin.support.tickets.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.help_articles.bulk.status.update': { paramsTuple?: []; params?: {} }
    'admin.help_articles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.help_categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.help_articles.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.help_categories.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.notifications.seen.update': { paramsTuple?: []; params?: {} }
    'admin.notifications.read_all.update': { paramsTuple?: []; params?: {} }
    'admin.notifications.read.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.payments.bank_transfer.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.payments.stripe.update': { paramsTuple?: []; params?: {} }
    'admin.payments.poli.update': { paramsTuple?: []; params?: {} }
    'admin.storefront_theme.update': { paramsTuple?: []; params?: {} }
    'admin.storefront_theme.brand.update': { paramsTuple?: []; params?: {} }
    'admin.storefront_menu.reorder': { paramsTuple?: []; params?: {} }
    'admin.storefront_menu.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.storefront_content.update': { paramsTuple?: []; params?: {} }
    'admin.storefront_promo_banners.reorder': { paramsTuple?: []; params?: {} }
    'admin.storefront_promo_banners.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.storefront_features.update': { paramsTuple?: []; params?: {} }
    'admin.themes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.markets.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.markets.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.taxes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.taxes.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.shipping.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.shipping.rates.update': { paramsTuple: [ParamValue,ParamValue]; params: {'zoneId': ParamValue,'id': ParamValue} }
    'admin.shipping.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.customers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customers.notes.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customers.marketing.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customer_segments.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customers.addresses.update': { paramsTuple: [ParamValue,ParamValue]; params: {'customerId': ParamValue,'id': ParamValue} }
    'admin.customers.bulk.archive.update': { paramsTuple?: []; params?: {} }
    'admin.roles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.roles.permissions.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.storefront_hero.reorder': { paramsTuple?: []; params?: {} }
    'admin.storefront_hero.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.market.update': { paramsTuple?: []; params?: {} }
    'customers.account.location.update': { paramsTuple?: []; params?: {} }
    'customers.account.addresses.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.details.update': { paramsTuple?: []; params?: {} }
    'customers.account.marketing.update': { paramsTuple?: []; params?: {} }
  }
  DELETE: {
    'admin.account.mfa.delete': { paramsTuple?: []; params?: {} }
    'admin.products.variants.delete': { paramsTuple: [ParamValue,ParamValue]; params: {'productId': ParamValue,'id': ParamValue} }
    'admin.collections.products.delete': { paramsTuple: [ParamValue,ParamValue]; params: {'collectionId': ParamValue,'id': ParamValue} }
    'admin.collections.image.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.options.values.delete': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'valueId': ParamValue} }
    'admin.media.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.vendors.image.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.orders.drafts.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.storefront_theme.logo.delete': { paramsTuple?: []; params?: {} }
    'admin.storefront_theme.favicon.delete': { paramsTuple?: []; params?: {} }
    'admin.storefront_promo_banners.image.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.storefront_menu.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.storefront_promo_banners.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.plugins.uninstall': { paramsTuple: [ParamValue]; params: {'key': ParamValue} }
    'admin.themes.unpublish': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.themes.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.shipping.rates.delete': { paramsTuple: [ParamValue,ParamValue]; params: {'zoneId': ParamValue,'id': ParamValue} }
    'admin.customer_segments.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.customers.addresses.delete': { paramsTuple: [ParamValue,ParamValue]; params: {'customerId': ParamValue,'id': ParamValue} }
    'admin.roles.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.storefront_hero.image.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.storefront_hero.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.impersonation.delete': { paramsTuple?: []; params?: {} }
    'customers.account.wishlist.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'customers.account.addresses.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}