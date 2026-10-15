/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  drive: {
    fs: {
      serve: typeof routes['drive.fs.serve']
    }
  }
  eventStream: typeof routes['event_stream']
  subscribe: typeof routes['subscribe']
  unsubscribe: typeof routes['unsubscribe']
  home: typeof routes['home']
  admin: {
    session: {
      create: typeof routes['admin.session.create']
      store: typeof routes['admin.session.store']
      mfa: {
        store: typeof routes['admin.session.mfa.store']
      }
      delete: typeof routes['admin.session.delete']
    }
    setup: {
      create: typeof routes['admin.setup.create']
      view: typeof routes['admin.setup.view']
      store: typeof routes['admin.setup.store']
    }
    me: {
      view: typeof routes['admin.me.view']
    }
    account: {
      home: typeof routes['admin.account.home']
      profile: {
        update: typeof routes['admin.account.profile.update']
      }
      security: {
        view: typeof routes['admin.account.security.view']
      }
      mfa: {
        setup: {
          store: typeof routes['admin.account.mfa.setup.store']
        }
        store: typeof routes['admin.account.mfa.store']
        delete: typeof routes['admin.account.mfa.delete']
      }
      password: {
        update: typeof routes['admin.account.password.update']
      }
    }
    home: typeof routes['admin.home']
    dashboard: {
      home: typeof routes['admin.dashboard.home']
      view: typeof routes['admin.dashboard.view']
    }
    analytics: {
      home: typeof routes['admin.analytics.home']
      view: typeof routes['admin.analytics.view']
      reports: {
        home: typeof routes['admin.analytics.reports.home']
        list: typeof routes['admin.analytics.reports.list']
        show: typeof routes['admin.analytics.reports.show']
        view: typeof routes['admin.analytics.reports.view']
        export: typeof routes['admin.analytics.reports.export']
      }
      live: {
        home: typeof routes['admin.analytics.live.home']
        view: typeof routes['admin.analytics.live.view']
      }
    }
    users: {
      home: typeof routes['admin.users.home']
      list: typeof routes['admin.users.list']
      roles: typeof routes['admin.users.roles']
      show: typeof routes['admin.users.show']
      view: typeof routes['admin.users.view']
      activity: {
        list: typeof routes['admin.users.activity.list']
      }
      edit: typeof routes['admin.users.edit']
      update: typeof routes['admin.users.update']
      create: typeof routes['admin.users.create']
      store: typeof routes['admin.users.store']
    }
    roles: {
      home: typeof routes['admin.roles.home']
      matrix: typeof routes['admin.roles.matrix']
      store: typeof routes['admin.roles.store']
      update: typeof routes['admin.roles.update']
      delete: typeof routes['admin.roles.delete']
      permissions: {
        update: typeof routes['admin.roles.permissions.update']
      }
    }
    products: {
      home: typeof routes['admin.products.home']
      list: typeof routes['admin.products.list']
      facets: typeof routes['admin.products.facets']
      markets: {
        list: typeof routes['admin.products.markets.list']
      }
      view: typeof routes['admin.products.view']
      activity: {
        list: typeof routes['admin.products.activity.list']
      }
      variants: {
        view: typeof routes['admin.products.variants.view']
        create: typeof routes['admin.products.variants.create']
        store: typeof routes['admin.products.variants.store']
        edit: typeof routes['admin.products.variants.edit']
        update: typeof routes['admin.products.variants.update']
        delete: typeof routes['admin.products.variants.delete']
        inventory: {
          update: typeof routes['admin.products.variants.inventory.update']
        }
      }
      reviews: {
        list: typeof routes['admin.products.reviews.list']
        update: typeof routes['admin.products.reviews.update']
      }
      create: typeof routes['admin.products.create']
      store: typeof routes['admin.products.store']
      edit: typeof routes['admin.products.edit']
      update: typeof routes['admin.products.update']
      options: {
        update: typeof routes['admin.products.options.update']
      }
      bulk: {
        status: {
          update: typeof routes['admin.products.bulk.status.update']
        }
        archive: {
          update: typeof routes['admin.products.bulk.archive.update']
        }
      }
      archive: typeof routes['admin.products.archive']
      unarchive: typeof routes['admin.products.unarchive']
      images: {
        store: typeof routes['admin.products.images.store']
      }
      import: {
        sample: typeof routes['admin.products.import.sample']
        store: typeof routes['admin.products.import.store']
      }
      export: typeof routes['admin.products.export']
    }
    options: {
      catalog: typeof routes['admin.options.catalog']
      home: typeof routes['admin.options.home']
      list: typeof routes['admin.options.list']
      view: typeof routes['admin.options.view']
      edit: typeof routes['admin.options.edit']
      store: typeof routes['admin.options.store']
      update: typeof routes['admin.options.update']
      bulk: {
        archive: {
          update: typeof routes['admin.options.bulk.archive.update']
        }
      }
      archive: typeof routes['admin.options.archive']
      unarchive: typeof routes['admin.options.unarchive']
      import: {
        sample: typeof routes['admin.options.import.sample']
        store: typeof routes['admin.options.import.store']
      }
      export: typeof routes['admin.options.export']
      values: {
        store: typeof routes['admin.options.values.store']
        update: typeof routes['admin.options.values.update']
        delete: typeof routes['admin.options.values.delete']
      }
    }
    collections: {
      home: typeof routes['admin.collections.home']
      list: typeof routes['admin.collections.list']
      view: typeof routes['admin.collections.view']
      products: {
        list: typeof routes['admin.collections.products.list']
        store: typeof routes['admin.collections.products.store']
        reorder: typeof routes['admin.collections.products.reorder']
        delete: typeof routes['admin.collections.products.delete']
      }
      preview: typeof routes['admin.collections.preview']
      create: typeof routes['admin.collections.create']
      store: typeof routes['admin.collections.store']
      bulk: {
        status: {
          update: typeof routes['admin.collections.bulk.status.update']
        }
        archive: {
          update: typeof routes['admin.collections.bulk.archive.update']
        }
      }
      edit: typeof routes['admin.collections.edit']
      update: typeof routes['admin.collections.update']
      archive: typeof routes['admin.collections.archive']
      unarchive: typeof routes['admin.collections.unarchive']
      image: {
        store: typeof routes['admin.collections.image.store']
        delete: typeof routes['admin.collections.image.delete']
      }
      import: {
        sample: typeof routes['admin.collections.import.sample']
        store: typeof routes['admin.collections.import.store']
      }
      export: typeof routes['admin.collections.export']
    }
    pages: {
      home: typeof routes['admin.pages.home']
      list: typeof routes['admin.pages.list']
      view: typeof routes['admin.pages.view']
      create: typeof routes['admin.pages.create']
      store: typeof routes['admin.pages.store']
      bulk: {
        status: {
          update: typeof routes['admin.pages.bulk.status.update']
        }
        archive: {
          update: typeof routes['admin.pages.bulk.archive.update']
        }
      }
      edit: typeof routes['admin.pages.edit']
      update: typeof routes['admin.pages.update']
      archive: typeof routes['admin.pages.archive']
      unarchive: typeof routes['admin.pages.unarchive']
    }
    productTypes: {
      home: typeof routes['admin.product_types.home']
      list: typeof routes['admin.product_types.list']
      store: typeof routes['admin.product_types.store']
      update: typeof routes['admin.product_types.update']
      bulk: {
        archive: {
          update: typeof routes['admin.product_types.bulk.archive.update']
        }
      }
      archive: typeof routes['admin.product_types.archive']
      unarchive: typeof routes['admin.product_types.unarchive']
      import: {
        sample: typeof routes['admin.product_types.import.sample']
        store: typeof routes['admin.product_types.import.store']
      }
      export: typeof routes['admin.product_types.export']
    }
    productLabels: {
      home: typeof routes['admin.product_labels.home']
      list: typeof routes['admin.product_labels.list']
      store: typeof routes['admin.product_labels.store']
      update: typeof routes['admin.product_labels.update']
      bulk: {
        archive: {
          update: typeof routes['admin.product_labels.bulk.archive.update']
        }
      }
      archive: typeof routes['admin.product_labels.archive']
      unarchive: typeof routes['admin.product_labels.unarchive']
    }
    vendors: {
      home: typeof routes['admin.vendors.home']
      list: typeof routes['admin.vendors.list']
      store: typeof routes['admin.vendors.store']
      update: typeof routes['admin.vendors.update']
      image: {
        store: typeof routes['admin.vendors.image.store']
        delete: typeof routes['admin.vendors.image.delete']
      }
      bulk: {
        archive: {
          update: typeof routes['admin.vendors.bulk.archive.update']
        }
      }
      archive: typeof routes['admin.vendors.archive']
      unarchive: typeof routes['admin.vendors.unarchive']
      import: {
        sample: typeof routes['admin.vendors.import.sample']
        store: typeof routes['admin.vendors.import.store']
      }
      export: typeof routes['admin.vendors.export']
    }
    locations: {
      home: typeof routes['admin.locations.home']
      list: typeof routes['admin.locations.list']
      store: typeof routes['admin.locations.store']
      update: typeof routes['admin.locations.update']
      bulk: {
        archive: {
          update: typeof routes['admin.locations.bulk.archive.update']
        }
      }
      archive: typeof routes['admin.locations.archive']
      unarchive: typeof routes['admin.locations.unarchive']
      import: {
        sample: typeof routes['admin.locations.import.sample']
        store: typeof routes['admin.locations.import.store']
      }
      export: typeof routes['admin.locations.export']
    }
    orders: {
      home: typeof routes['admin.orders.home']
      list: typeof routes['admin.orders.list']
      show: typeof routes['admin.orders.show']
      view: typeof routes['admin.orders.view']
      activity: {
        list: typeof routes['admin.orders.activity.list']
      }
      variants: {
        search: typeof routes['admin.orders.variants.search']
      }
      drafts: {
        home: typeof routes['admin.orders.drafts.home']
        list: typeof routes['admin.orders.drafts.list']
        view: typeof routes['admin.orders.drafts.view']
        create: typeof routes['admin.orders.drafts.create']
        store: typeof routes['admin.orders.drafts.store']
        calculate: typeof routes['admin.orders.drafts.calculate']
        edit: typeof routes['admin.orders.drafts.edit']
        update: typeof routes['admin.orders.drafts.update']
        complete: typeof routes['admin.orders.drafts.complete']
        delete: typeof routes['admin.orders.drafts.delete']
      }
      returns: {
        list: typeof routes['admin.orders.returns.list']
        store: typeof routes['admin.orders.returns.store']
      }
      notes: {
        list: typeof routes['admin.orders.notes.list']
        store: typeof routes['admin.orders.notes.store']
      }
      paymentProof: {
        image: {
          view: typeof routes['admin.orders.payment_proof.image.view']
        }
        review: {
          update: typeof routes['admin.orders.payment_proof.review.update']
        }
      }
      invoice: {
        view: typeof routes['admin.orders.invoice.view']
      }
      receipt: {
        view: typeof routes['admin.orders.receipt.view']
      }
      packingSlip: {
        view: typeof routes['admin.orders.packing_slip.view']
      }
      update: typeof routes['admin.orders.update']
      fulfillments: {
        store: typeof routes['admin.orders.fulfillments.store']
      }
      fulfillmentStatus: {
        update: typeof routes['admin.orders.fulfillment_status.update']
      }
      refunds: {
        calculate: typeof routes['admin.orders.refunds.calculate']
        store: typeof routes['admin.orders.refunds.store']
      }
      cancel: typeof routes['admin.orders.cancel']
      bulk: {
        archive: {
          update: typeof routes['admin.orders.bulk.archive.update']
        }
      }
      archive: typeof routes['admin.orders.archive']
      unarchive: typeof routes['admin.orders.unarchive']
    }
    returns: {
      home: typeof routes['admin.returns.home']
      list: typeof routes['admin.returns.list']
      approve: {
        update: typeof routes['admin.returns.approve.update']
      }
      decline: {
        update: typeof routes['admin.returns.decline.update']
      }
      receive: {
        update: typeof routes['admin.returns.receive.update']
      }
      cancel: {
        update: typeof routes['admin.returns.cancel.update']
      }
    }
    fulfillments: {
      update: typeof routes['admin.fulfillments.update']
      cancel: {
        update: typeof routes['admin.fulfillments.cancel.update']
      }
    }
    discounts: {
      home: typeof routes['admin.discounts.home']
      list: typeof routes['admin.discounts.list']
      view: typeof routes['admin.discounts.view']
      create: typeof routes['admin.discounts.create']
      store: typeof routes['admin.discounts.store']
      edit: typeof routes['admin.discounts.edit']
      update: typeof routes['admin.discounts.update']
      bulk: {
        archive: {
          update: typeof routes['admin.discounts.bulk.archive.update']
        }
      }
      archive: typeof routes['admin.discounts.archive']
      unarchive: typeof routes['admin.discounts.unarchive']
    }
    newsletterSubscribers: {
      home: typeof routes['admin.newsletter_subscribers.home']
      list: typeof routes['admin.newsletter_subscribers.list']
      bulk: {
        subscription: {
          update: typeof routes['admin.newsletter_subscribers.bulk.subscription.update']
        }
      }
    }
    storeSettings: {
      home: typeof routes['admin.store_settings.home']
      view: typeof routes['admin.store_settings.view']
      business: {
        update: typeof routes['admin.store_settings.business.update']
      }
      contact: {
        update: typeof routes['admin.store_settings.contact.update']
      }
      address: {
        update: typeof routes['admin.store_settings.address.update']
      }
      defaults: {
        update: typeof routes['admin.store_settings.defaults.update']
      }
      notifications: {
        update: typeof routes['admin.store_settings.notifications.update']
      }
      checkout: {
        update: typeof routes['admin.store_settings.checkout.update']
      }
    }
    maintenance: {
      view: typeof routes['admin.maintenance.view']
      update: typeof routes['admin.maintenance.update']
    }
    emails: {
      home: typeof routes['admin.emails.home']
      list: typeof routes['admin.emails.list']
      show: typeof routes['admin.emails.show']
      view: typeof routes['admin.emails.view']
      resend: {
        store: typeof routes['admin.emails.resend.store']
      }
    }
    support: {
      tickets: {
        home: typeof routes['admin.support.tickets.home']
        list: typeof routes['admin.support.tickets.list']
        openCount: {
          view: typeof routes['admin.support.tickets.open_count.view']
        }
        assignees: {
          list: typeof routes['admin.support.tickets.assignees.list']
        }
        show: typeof routes['admin.support.tickets.show']
        view: typeof routes['admin.support.tickets.view']
        bulk: {
          status: {
            update: typeof routes['admin.support.tickets.bulk.status.update']
          }
        }
        messages: {
          store: typeof routes['admin.support.tickets.messages.store']
        }
        update: typeof routes['admin.support.tickets.update']
      }
    }
    helpArticles: {
      home: typeof routes['admin.help_articles.home']
      list: typeof routes['admin.help_articles.list']
      options: {
        list: typeof routes['admin.help_articles.options.list']
      }
      view: typeof routes['admin.help_articles.view']
      preview: {
        store: typeof routes['admin.help_articles.preview.store']
      }
      create: typeof routes['admin.help_articles.create']
      store: typeof routes['admin.help_articles.store']
      bulk: {
        status: {
          update: typeof routes['admin.help_articles.bulk.status.update']
        }
        archive: {
          update: typeof routes['admin.help_articles.bulk.archive.update']
        }
      }
      edit: typeof routes['admin.help_articles.edit']
      update: typeof routes['admin.help_articles.update']
      archive: typeof routes['admin.help_articles.archive']
      unarchive: typeof routes['admin.help_articles.unarchive']
    }
    helpCategories: {
      home: typeof routes['admin.help_categories.home']
      list: typeof routes['admin.help_categories.list']
      options: {
        list: typeof routes['admin.help_categories.options.list']
      }
      view: typeof routes['admin.help_categories.view']
      store: typeof routes['admin.help_categories.store']
      update: typeof routes['admin.help_categories.update']
      bulk: {
        archive: {
          update: typeof routes['admin.help_categories.bulk.archive.update']
        }
      }
      archive: typeof routes['admin.help_categories.archive']
      unarchive: typeof routes['admin.help_categories.unarchive']
    }
    notifications: {
      list: typeof routes['admin.notifications.list']
      seen: {
        update: typeof routes['admin.notifications.seen.update']
      }
      readAll: {
        update: typeof routes['admin.notifications.read_all.update']
      }
      read: {
        update: typeof routes['admin.notifications.read.update']
      }
    }
    events: {
      home: typeof routes['admin.events.home']
      list: typeof routes['admin.events.list']
      view: typeof routes['admin.events.view']
      retryFailed: {
        store: typeof routes['admin.events.retry_failed.store']
      }
      retry: {
        store: typeof routes['admin.events.retry.store']
      }
    }
    payments: {
      home: typeof routes['admin.payments.home']
      list: typeof routes['admin.payments.list']
      markets: {
        list: typeof routes['admin.payments.markets.list']
      }
      bankTransfer: {
        view: typeof routes['admin.payments.bank_transfer.view']
        update: typeof routes['admin.payments.bank_transfer.update']
      }
      stripe: {
        view: typeof routes['admin.payments.stripe.view']
        update: typeof routes['admin.payments.stripe.update']
      }
      poli: {
        view: typeof routes['admin.payments.poli.view']
        update: typeof routes['admin.payments.poli.update']
      }
    }
    storefrontTheme: {
      home: typeof routes['admin.storefront_theme.home']
      view: typeof routes['admin.storefront_theme.view']
      update: typeof routes['admin.storefront_theme.update']
      brand: {
        update: typeof routes['admin.storefront_theme.brand.update']
      }
      logo: {
        store: typeof routes['admin.storefront_theme.logo.store']
        delete: typeof routes['admin.storefront_theme.logo.delete']
      }
      favicon: {
        store: typeof routes['admin.storefront_theme.favicon.store']
        delete: typeof routes['admin.storefront_theme.favicon.delete']
      }
    }
    storefrontMenu: {
      home: typeof routes['admin.storefront_menu.home']
      list: typeof routes['admin.storefront_menu.list']
      collections: typeof routes['admin.storefront_menu.collections']
      pages: typeof routes['admin.storefront_menu.pages']
      store: typeof routes['admin.storefront_menu.store']
      reorder: typeof routes['admin.storefront_menu.reorder']
      update: typeof routes['admin.storefront_menu.update']
      delete: typeof routes['admin.storefront_menu.delete']
    }
    storefrontHero: {
      home: typeof routes['admin.storefront_hero.home']
      list: typeof routes['admin.storefront_hero.list']
      store: typeof routes['admin.storefront_hero.store']
      reorder: typeof routes['admin.storefront_hero.reorder']
      update: typeof routes['admin.storefront_hero.update']
      image: {
        store: typeof routes['admin.storefront_hero.image.store']
        delete: typeof routes['admin.storefront_hero.image.delete']
      }
      delete: typeof routes['admin.storefront_hero.delete']
    }
    storefrontContent: {
      home: typeof routes['admin.storefront_content.home']
      update: typeof routes['admin.storefront_content.update']
    }
    storefrontPromoBanners: {
      list: typeof routes['admin.storefront_promo_banners.list']
      store: typeof routes['admin.storefront_promo_banners.store']
      reorder: typeof routes['admin.storefront_promo_banners.reorder']
      update: typeof routes['admin.storefront_promo_banners.update']
      image: {
        store: typeof routes['admin.storefront_promo_banners.image.store']
        delete: typeof routes['admin.storefront_promo_banners.image.delete']
      }
      delete: typeof routes['admin.storefront_promo_banners.delete']
    }
    storefrontFeatures: {
      list: typeof routes['admin.storefront_features.list']
      update: typeof routes['admin.storefront_features.update']
    }
    storefrontFeaturedReviews: {
      list: typeof routes['admin.storefront_featured_reviews.list']
    }
    markets: {
      home: typeof routes['admin.markets.home']
      list: typeof routes['admin.markets.list']
      view: typeof routes['admin.markets.view']
      store: typeof routes['admin.markets.store']
      edit: typeof routes['admin.markets.edit']
      update: typeof routes['admin.markets.update']
      bulk: {
        archive: {
          update: typeof routes['admin.markets.bulk.archive.update']
        }
      }
      archive: typeof routes['admin.markets.archive']
      unarchive: typeof routes['admin.markets.unarchive']
    }
    taxes: {
      home: typeof routes['admin.taxes.home']
      list: typeof routes['admin.taxes.list']
      store: typeof routes['admin.taxes.store']
      update: typeof routes['admin.taxes.update']
      bulk: {
        archive: {
          update: typeof routes['admin.taxes.bulk.archive.update']
        }
      }
      archive: typeof routes['admin.taxes.archive']
      unarchive: typeof routes['admin.taxes.unarchive']
    }
    shipping: {
      home: typeof routes['admin.shipping.home']
      list: typeof routes['admin.shipping.list']
      markets: {
        list: typeof routes['admin.shipping.markets.list']
      }
      regions: {
        list: typeof routes['admin.shipping.regions.list']
      }
      marketCountries: {
        list: typeof routes['admin.shipping.market_countries.list']
      }
      view: typeof routes['admin.shipping.view']
      store: typeof routes['admin.shipping.store']
      edit: typeof routes['admin.shipping.edit']
      update: typeof routes['admin.shipping.update']
      rates: {
        store: typeof routes['admin.shipping.rates.store']
        update: typeof routes['admin.shipping.rates.update']
        delete: typeof routes['admin.shipping.rates.delete']
      }
      bulk: {
        archive: {
          update: typeof routes['admin.shipping.bulk.archive.update']
        }
      }
      archive: typeof routes['admin.shipping.archive']
      unarchive: typeof routes['admin.shipping.unarchive']
    }
    customers: {
      home: typeof routes['admin.customers.home']
      list: typeof routes['admin.customers.list']
      view: typeof routes['admin.customers.view']
      edit: typeof routes['admin.customers.edit']
      activity: {
        list: typeof routes['admin.customers.activity.list']
      }
      locationOptions: {
        view: typeof routes['admin.customers.location_options.view']
      }
      filterOptions: {
        view: typeof routes['admin.customers.filter_options.view']
      }
      impersonation: {
        store: typeof routes['admin.customers.impersonation.store']
      }
      create: typeof routes['admin.customers.create']
      store: typeof routes['admin.customers.store']
      update: typeof routes['admin.customers.update']
      notes: {
        update: typeof routes['admin.customers.notes.update']
      }
      marketing: {
        update: typeof routes['admin.customers.marketing.update']
      }
      addresses: {
        store: typeof routes['admin.customers.addresses.store']
        update: typeof routes['admin.customers.addresses.update']
        delete: typeof routes['admin.customers.addresses.delete']
      }
      bulk: {
        archive: {
          update: typeof routes['admin.customers.bulk.archive.update']
        }
      }
      archive: typeof routes['admin.customers.archive']
      unarchive: typeof routes['admin.customers.unarchive']
    }
    customerSegments: {
      list: typeof routes['admin.customer_segments.list']
      store: typeof routes['admin.customer_segments.store']
      update: typeof routes['admin.customer_segments.update']
      delete: typeof routes['admin.customer_segments.delete']
    }
  }
  storefront: {
    sitemap: {
      view: typeof routes['storefront.sitemap.view']
    }
    robots: {
      view: typeof routes['storefront.robots.view']
    }
    settings: {
      view: typeof routes['storefront.settings.view']
    }
    theme: {
      view: typeof routes['storefront.theme.view']
    }
    menu: {
      list: typeof routes['storefront.menu.list']
    }
    heroSlides: {
      list: typeof routes['storefront.hero_slides.list']
    }
    homeContent: {
      view: typeof routes['storefront.home_content.view']
    }
    home: {
      view: typeof routes['storefront.home.view']
    }
    collections: {
      show: typeof routes['storefront.collections.show']
      view: typeof routes['storefront.collections.view']
      products: {
        list: typeof routes['storefront.collections.products.list']
      }
      filters: {
        list: typeof routes['storefront.collections.filters.list']
      }
    }
    catalogToken: {
      view: typeof routes['storefront.catalog_token.view']
    }
    pages: {
      show: typeof routes['storefront.pages.show']
      view: typeof routes['storefront.pages.view']
    }
    policies: {
      list: typeof routes['storefront.policies.list']
    }
    help: {
      home: typeof routes['storefront.help.home']
      categories: {
        show: typeof routes['storefront.help.categories.show']
        list: typeof routes['storefront.help.categories.list']
        view: typeof routes['storefront.help.categories.view']
      }
      articles: {
        show: typeof routes['storefront.help.articles.show']
        view: typeof routes['storefront.help.articles.view']
      }
      search: {
        list: typeof routes['storefront.help.search.list']
      }
    }
    products: {
      show: typeof routes['storefront.products.show']
      view: typeof routes['storefront.products.view']
      reviews: {
        list: typeof routes['storefront.products.reviews.list']
        summary: typeof routes['storefront.products.reviews.summary']
      }
    }
    search: {
      list: typeof routes['storefront.search.list']
    }
    session: {
      view: typeof routes['storefront.session.view']
    }
    market: {
      view: typeof routes['storefront.market.view']
      update: typeof routes['storefront.market.update']
    }
    cart: {
      prices: {
        update: typeof routes['storefront.cart.prices.update']
      }
    }
    analytics: {
      events: {
        store: typeof routes['storefront.analytics.events.store']
      }
    }
    newsletter: {
      store: typeof routes['storefront.newsletter.store']
    }
    maintenance: {
      newsletter: {
        store: typeof routes['storefront.maintenance.newsletter.store']
      }
    }
    support: {
      chat: {
        view: typeof routes['storefront.support.chat.view']
      }
      tickets: {
        store: typeof routes['storefront.support.tickets.store']
        show: typeof routes['storefront.support.tickets.show']
        view: typeof routes['storefront.support.tickets.view']
        messages: {
          store: typeof routes['storefront.support.tickets.messages.store']
        }
      }
    }
    brand: {
      favicon: {
        view: typeof routes['storefront.brand.favicon.view']
      }
      manifest: {
        view: typeof routes['storefront.brand.manifest.view']
      }
    }
    places: {
      autocomplete: {
        list: typeof routes['storefront.places.autocomplete.list']
      }
      details: {
        view: typeof routes['storefront.places.details.view']
      }
    }
    impersonation: {
      delete: typeof routes['storefront.impersonation.delete']
    }
    checkout: {
      home: typeof routes['storefront.checkout.home']
      store: typeof routes['storefront.checkout.store']
      quote: typeof routes['storefront.checkout.quote']
      addresses: {
        list: typeof routes['storefront.checkout.addresses.list']
      }
      paymentMethods: {
        list: typeof routes['storefront.checkout.payment_methods.list']
      }
      show: typeof routes['storefront.checkout.show']
      orders: {
        view: typeof routes['storefront.checkout.orders.view']
        invoice: {
          view: typeof routes['storefront.checkout.orders.invoice.view']
        }
        receipt: {
          view: typeof routes['storefront.checkout.orders.receipt.view']
        }
        payment: {
          store: typeof routes['storefront.checkout.orders.payment.store']
        }
        stripeReturn: typeof routes['storefront.checkout.orders.stripe_return']
        poliReturn: typeof routes['storefront.checkout.orders.poli_return']
      }
    }
  }
  stripe: {
    webhook: typeof routes['stripe.webhook']
  }
  poli: {
    nudge: typeof routes['poli.nudge']
  }
  customers: {
    registration: {
      create: typeof routes['customers.registration.create']
      store: typeof routes['customers.registration.store']
      verify: {
        create: typeof routes['customers.registration.verify.create']
        view: typeof routes['customers.registration.verify.view']
        store: typeof routes['customers.registration.verify.store']
        resend: {
          store: typeof routes['customers.registration.verify.resend.store']
        }
      }
    }
    session: {
      create: typeof routes['customers.session.create']
      store: typeof routes['customers.session.store']
      delete: typeof routes['customers.session.delete']
    }
    social: {
      redirect: typeof routes['customers.social.redirect']
      callback: typeof routes['customers.social.callback']
    }
    password: {
      forgot: {
        create: typeof routes['customers.password.forgot.create']
        store: typeof routes['customers.password.forgot.store']
      }
      reset: {
        create: typeof routes['customers.password.reset.create']
        view: typeof routes['customers.password.reset.view']
        store: typeof routes['customers.password.reset.store']
        resend: {
          store: typeof routes['customers.password.reset.resend.store']
        }
      }
    }
    account: {
      view: typeof routes['customers.account.view']
      welcome: {
        create: typeof routes['customers.account.welcome.create']
      }
      location: {
        options: {
          view: typeof routes['customers.account.location.options.view']
        }
        update: typeof routes['customers.account.location.update']
      }
      wishlist: {
        ids: {
          view: typeof routes['customers.account.wishlist.ids.view']
        }
        store: typeof routes['customers.account.wishlist.store']
        delete: typeof routes['customers.account.wishlist.delete']
        home: typeof routes['customers.account.wishlist.home']
        list: typeof routes['customers.account.wishlist.list']
      }
      home: typeof routes['customers.account.home']
      orders: {
        home: typeof routes['customers.account.orders.home']
        list: typeof routes['customers.account.orders.list']
        view: typeof routes['customers.account.orders.view']
        show: typeof routes['customers.account.orders.show']
        returns: {
          list: typeof routes['customers.account.orders.returns.list']
          store: typeof routes['customers.account.orders.returns.store']
        }
        notes: {
          list: typeof routes['customers.account.orders.notes.list']
          store: typeof routes['customers.account.orders.notes.store']
        }
        paymentProof: {
          store: typeof routes['customers.account.orders.payment_proof.store']
          image: {
            view: typeof routes['customers.account.orders.payment_proof.image.view']
          }
        }
        invoice: {
          view: typeof routes['customers.account.orders.invoice.view']
        }
        receipt: {
          view: typeof routes['customers.account.orders.receipt.view']
        }
      }
      addresses: {
        home: typeof routes['customers.account.addresses.home']
        list: typeof routes['customers.account.addresses.list']
        store: typeof routes['customers.account.addresses.store']
        update: typeof routes['customers.account.addresses.update']
        delete: typeof routes['customers.account.addresses.delete']
      }
      details: {
        home: typeof routes['customers.account.details.home']
        update: typeof routes['customers.account.details.update']
      }
      marketing: {
        update: typeof routes['customers.account.marketing.update']
      }
      activity: {
        home: typeof routes['customers.account.activity.home']
        list: typeof routes['customers.account.activity.list']
      }
      support: {
        home: typeof routes['customers.account.support.home']
        list: typeof routes['customers.account.support.list']
        view: typeof routes['customers.account.support.view']
        show: typeof routes['customers.account.support.show']
        messages: {
          store: typeof routes['customers.account.support.messages.store']
        }
      }
    }
    productReviews: {
      store: typeof routes['customers.product_reviews.store']
    }
  }
}
