/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'drive.fs.serve': {
    methods: ["GET","HEAD"]
    pattern: '/uploads/*'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { '*': ParamValue[] }
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'event_stream': {
    methods: ["GET","HEAD"]
    pattern: '/__transmit/events'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'subscribe': {
    methods: ["POST"]
    pattern: '/__transmit/subscribe'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'unsubscribe': {
    methods: ["POST"]
    pattern: '/__transmit/unsubscribe'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'home': {
    methods: ["GET","HEAD"]
    pattern: '/'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_home_controller').default['handle']>>>
    }
  }
  'admin.session.create': {
    methods: ["GET","HEAD"]
    pattern: '/admin/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_session_create_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_session_create_controller').default['handle']>>>
    }
  }
  'admin.session.store': {
    methods: ["POST"]
    pattern: '/admin/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_login_validator').adminLoginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_login_validator').adminLoginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_session_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_session_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.session.mfa.store': {
    methods: ["POST"]
    pattern: '/admin/login/mfa'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_login_mfa_validator').adminLoginMfaValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_login_mfa_validator').adminLoginMfaValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_session_mfa_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_session_mfa_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.setup.create': {
    methods: ["GET","HEAD"]
    pattern: '/admin/setup'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_setup_create_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_setup_create_controller').default['handle']>>>
    }
  }
  'admin.setup.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/setup/view'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_setup_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_setup_view_controller').default['handle']>>>
    }
  }
  'admin.setup.store': {
    methods: ["POST"]
    pattern: '/admin/setup'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_setup_store_validator').adminSetupStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_setup_store_validator').adminSetupStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_setup_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_setup_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.session.delete': {
    methods: ["POST"]
    pattern: '/admin/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_session_delete_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_session_delete_controller').default['handle']>>>
    }
  }
  'admin.me.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/me'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_me_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_me_view_controller').default['handle']>>>
    }
  }
  'admin.account.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/account'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_account_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_account_home_controller').default['handle']>>>
    }
  }
  'admin.account.profile.update': {
    methods: ["PUT"]
    pattern: '/admin/account/profile'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_account_profile_update_validator').adminAccountProfileUpdateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_account_profile_update_validator').adminAccountProfileUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_account_profile_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_account_profile_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.account.security.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/account/security/view'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_account_security_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_account_security_view_controller').default['handle']>>>
    }
  }
  'admin.account.mfa.setup.store': {
    methods: ["POST"]
    pattern: '/admin/account/mfa/setup'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_account_mfa_setup_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_account_mfa_setup_store_controller').default['handle']>>>
    }
  }
  'admin.account.mfa.store': {
    methods: ["POST"]
    pattern: '/admin/account/mfa'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_account_mfa_store_validator').adminAccountMfaStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_account_mfa_store_validator').adminAccountMfaStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_account_mfa_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_account_mfa_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.account.mfa.delete': {
    methods: ["DELETE"]
    pattern: '/admin/account/mfa'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_account_mfa_delete_validator').adminAccountMfaDeleteValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_account_mfa_delete_validator').adminAccountMfaDeleteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_account_mfa_delete_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_account_mfa_delete_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.account.password.update': {
    methods: ["PUT"]
    pattern: '/admin/account/password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_account_password_update_validator').adminAccountPasswordUpdateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_account_password_update_validator').adminAccountPasswordUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_account_password_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_account_password_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'admin.dashboard.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/dashboard'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_dashboard_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_dashboard_home_controller').default['handle']>>>
    }
  }
  'admin.analytics.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/analytics'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_analytics_query_validator').adminAnalyticsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_analytics_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_analytics_home_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.analytics.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/analytics/view'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_analytics_query_validator').adminAnalyticsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_analytics_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_analytics_view_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.analytics.reports.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/analytics/reports'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_analytics_reports_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_analytics_reports_home_controller').default['handle']>>>
    }
  }
  'admin.analytics.reports.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/analytics/reports/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_analytics_reports_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_analytics_reports_list_controller').default['handle']>>>
    }
  }
  'admin.analytics.reports.show': {
    methods: ["GET","HEAD"]
    pattern: '/admin/analytics/reports/:key'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { key: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_analytics_query_validator').adminAnalyticsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_analytics_reports_show_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_analytics_reports_show_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.analytics.reports.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/analytics/reports/:key/view'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { key: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_analytics_query_validator').adminAnalyticsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_analytics_reports_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_analytics_reports_view_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.analytics.live.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/analytics/live'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_analytics_live_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_analytics_live_home_controller').default['handle']>>>
    }
  }
  'admin.analytics.live.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/analytics/live/view'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_analytics_live_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_analytics_live_view_controller').default['handle']>>>
    }
  }
  'admin.analytics.reports.export': {
    methods: ["GET","HEAD"]
    pattern: '/admin/analytics/reports/:key/export'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { key: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_analytics_report_export_query_validator').adminAnalyticsReportExportQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_analytics_reports_export_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_analytics_reports_export_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.users.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/users'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_users_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_users_home_controller').default['handle']>>>
    }
  }
  'admin.users.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/users/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_users_list_query_validator').adminUsersListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_users_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_users_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.users.roles': {
    methods: ["GET","HEAD"]
    pattern: '/admin/users/roles'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_users_roles_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_users_roles_controller').default['handle']>>>
    }
  }
  'admin.users.show': {
    methods: ["GET","HEAD"]
    pattern: '/admin/users/show/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_users_show_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_users_show_controller').default['handle']>>>
    }
  }
  'admin.users.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/users/view/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_users_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_users_view_controller').default['handle']>>>
    }
  }
  'admin.users.activity.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/users/:id/activity'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_user_activity_list_query_validator').adminUserActivityListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_user_activity_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_user_activity_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.users.edit': {
    methods: ["GET","HEAD"]
    pattern: '/admin/users/edit/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_users_edit_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_users_edit_controller').default['handle']>>>
    }
  }
  'admin.users.update': {
    methods: ["PUT"]
    pattern: '/admin/users/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_user_update_validator').adminUserUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_user_update_validator').adminUserUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_users_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_users_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.users.create': {
    methods: ["GET","HEAD"]
    pattern: '/admin/users/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_users_create_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_users_create_controller').default['handle']>>>
    }
  }
  'admin.users.store': {
    methods: ["POST"]
    pattern: '/admin/users'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_user_store_validator').adminUserStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_user_store_validator').adminUserStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_users_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_users_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.roles.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/roles'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_roles_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_roles_home_controller').default['handle']>>>
    }
  }
  'admin.roles.matrix': {
    methods: ["GET","HEAD"]
    pattern: '/admin/roles/matrix'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_roles_matrix_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_roles_matrix_controller').default['handle']>>>
    }
  }
  'admin.products.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/products'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_home_controller').default['handle']>>>
    }
  }
  'admin.products.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/products/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_products_list_query_validator').adminProductsListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.products.facets': {
    methods: ["GET","HEAD"]
    pattern: '/admin/products/facets'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_facets_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_facets_controller').default['handle']>>>
    }
  }
  'admin.products.markets.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/products/markets'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_pricing_markets_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_pricing_markets_list_controller').default['handle']>>>
    }
  }
  'admin.products.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/products/view/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_view_controller').default['handle']>>>
    }
  }
  'admin.products.activity.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/products/:id/activity'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_product_activity_list_query_validator').adminProductActivityListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_activity_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_activity_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.products.variants.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/products/:productId/variants/view/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { productId: ParamValue; id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_product_variant_params_validator').adminProductVariantParamsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_variants_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_variants_view_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.products.reviews.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/products/:id/reviews/list'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_product_reviews_query_validator').adminProductReviewsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_reviews_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_reviews_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.options.catalog': {
    methods: ["GET","HEAD"]
    pattern: '/admin/options/catalog'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_options_catalog_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_options_catalog_controller').default['handle']>>>
    }
  }
  'admin.products.create': {
    methods: ["GET","HEAD"]
    pattern: '/admin/products/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_create_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_create_controller').default['handle']>>>
    }
  }
  'admin.products.store': {
    methods: ["POST"]
    pattern: '/admin/products'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_product_store_validator').adminProductStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_product_store_validator').adminProductStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.products.edit': {
    methods: ["GET","HEAD"]
    pattern: '/admin/products/edit/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_edit_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_edit_controller').default['handle']>>>
    }
  }
  'admin.products.update': {
    methods: ["PUT"]
    pattern: '/admin/products/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_product_update_validator').adminProductUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_product_update_validator').adminProductUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.products.options.update': {
    methods: ["PUT"]
    pattern: '/admin/products/:id/options'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_product_options_update_validator').adminProductOptionsUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_product_options_update_validator').adminProductOptionsUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_options_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_options_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.products.variants.create': {
    methods: ["GET","HEAD"]
    pattern: '/admin/products/:productId/variants/create'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { productId: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_product_variant_params_validator').adminProductVariantParamsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_variants_create_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_variants_create_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.products.variants.store': {
    methods: ["POST"]
    pattern: '/admin/products/:productId/variants'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_product_variant_params_validator').adminProductVariantParamsValidator)>|InferInput<(typeof import('#validators/admin_product_variant_store_validator').adminProductVariantStoreValidator)>>
      paramsTuple: [ParamValue]
      params: { productId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_product_variant_params_validator').adminProductVariantParamsValidator)>|InferInput<(typeof import('#validators/admin_product_variant_store_validator').adminProductVariantStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_variants_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_variants_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.products.variants.edit': {
    methods: ["GET","HEAD"]
    pattern: '/admin/products/:productId/variants/edit/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { productId: ParamValue; id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_product_variant_params_validator').adminProductVariantParamsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_variants_edit_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_variants_edit_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.products.variants.update': {
    methods: ["PUT"]
    pattern: '/admin/products/:productId/variants/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_product_variant_params_validator').adminProductVariantParamsValidator)>|InferInput<(typeof import('#validators/admin_product_variant_update_validator').adminProductVariantUpdateValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { productId: ParamValue; id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_product_variant_params_validator').adminProductVariantParamsValidator)>|InferInput<(typeof import('#validators/admin_product_variant_update_validator').adminProductVariantUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_variants_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_variants_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.products.variants.delete': {
    methods: ["DELETE"]
    pattern: '/admin/products/:productId/variants/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_product_variant_params_validator').adminProductVariantParamsValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { productId: ParamValue; id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_product_variant_params_validator').adminProductVariantParamsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_variants_delete_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_variants_delete_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.products.bulk.status.update': {
    methods: ["PUT"]
    pattern: '/admin/products/bulk/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_bulk_status_validator').adminBulkStatusValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_bulk_status_validator').adminBulkStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_bulk_status_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_bulk_status_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.products.reviews.update': {
    methods: ["PUT"]
    pattern: '/admin/products/:productId/reviews/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_product_review_params_validator').adminProductReviewParamsValidator)>|InferInput<(typeof import('#validators/admin_product_review_update_validator').adminProductReviewUpdateValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { productId: ParamValue; id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_product_review_params_validator').adminProductReviewParamsValidator)>|InferInput<(typeof import('#validators/admin_product_review_update_validator').adminProductReviewUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_reviews_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_reviews_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.products.bulk.archive.update': {
    methods: ["PUT"]
    pattern: '/admin/products/bulk/archive'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_bulk_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_bulk_archive_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.products.archive': {
    methods: ["POST"]
    pattern: '/admin/products/:id/archive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_archive_controller').default['handle']>>>
    }
  }
  'admin.products.unarchive': {
    methods: ["POST"]
    pattern: '/admin/products/:id/unarchive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_unarchive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_unarchive_controller').default['handle']>>>
    }
  }
  'admin.products.images.store': {
    methods: ["POST"]
    pattern: '/admin/products/images'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_product_image_store_validator').adminProductImageStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_product_image_store_validator').adminProductImageStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_images_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_images_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.products.import.sample': {
    methods: ["GET","HEAD"]
    pattern: '/admin/products/import/sample'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_import_sample_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_import_sample_controller').default['handle']>>>
    }
  }
  'admin.products.import.store': {
    methods: ["POST"]
    pattern: '/admin/products/import'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_products_import_store_validator').adminProductsImportStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_products_import_store_validator').adminProductsImportStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_import_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_import_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.products.export': {
    methods: ["GET","HEAD"]
    pattern: '/admin/products/export'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_products_export_query_validator').adminProductsExportQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_export_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_products_export_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.collections.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/collections'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_home_controller').default['handle']>>>
    }
  }
  'admin.collections.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/collections/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_collections_list_query_validator').adminCollectionsListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.collections.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/collections/view/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_view_controller').default['handle']>>>
    }
  }
  'admin.collections.products.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/collections/:id/products/list'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_collection_products_query_validator').adminCollectionProductsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_collection_products_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_collection_products_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.collections.preview': {
    methods: ["POST"]
    pattern: '/admin/collections/preview'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_collection_preview_validator').adminCollectionPreviewValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_collection_preview_validator').adminCollectionPreviewValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_preview_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_preview_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.collections.create': {
    methods: ["GET","HEAD"]
    pattern: '/admin/collections/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_create_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_create_controller').default['handle']>>>
    }
  }
  'admin.collections.store': {
    methods: ["POST"]
    pattern: '/admin/collections'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_collection_store_validator').adminCollectionStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_collection_store_validator').adminCollectionStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.collections.bulk.status.update': {
    methods: ["PUT"]
    pattern: '/admin/collections/bulk/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_bulk_status_validator').adminBulkStatusValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_bulk_status_validator').adminBulkStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_bulk_status_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_bulk_status_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.collections.edit': {
    methods: ["GET","HEAD"]
    pattern: '/admin/collections/edit/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_edit_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_edit_controller').default['handle']>>>
    }
  }
  'admin.collections.update': {
    methods: ["PUT"]
    pattern: '/admin/collections/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_collection_update_validator').adminCollectionUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_collection_update_validator').adminCollectionUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.collections.products.store': {
    methods: ["POST"]
    pattern: '/admin/collections/:id/products'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_collection_products_store_validator').adminCollectionProductsStoreValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_collection_products_store_validator').adminCollectionProductsStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_collection_products_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_collection_products_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.collections.products.reorder': {
    methods: ["PUT"]
    pattern: '/admin/collections/:id/products/reorder'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_collection_products_reorder_validator').adminCollectionProductsReorderValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_collection_products_reorder_validator').adminCollectionProductsReorderValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_collection_products_reorder_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_collection_products_reorder_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.collections.products.delete': {
    methods: ["DELETE"]
    pattern: '/admin/collections/:collectionId/products/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_collection_product_params_validator').adminCollectionProductParamsValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { collectionId: ParamValue; id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_collection_product_params_validator').adminCollectionProductParamsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_collection_products_delete_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_collection_products_delete_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.collections.bulk.archive.update': {
    methods: ["PUT"]
    pattern: '/admin/collections/bulk/archive'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_bulk_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_bulk_archive_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.collections.archive': {
    methods: ["POST"]
    pattern: '/admin/collections/:id/archive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_archive_controller').default['handle']>>>
    }
  }
  'admin.collections.unarchive': {
    methods: ["POST"]
    pattern: '/admin/collections/:id/unarchive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_unarchive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_unarchive_controller').default['handle']>>>
    }
  }
  'admin.collections.image.store': {
    methods: ["POST"]
    pattern: '/admin/collections/:id/image'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_collection_image_store_validator').adminCollectionImageStoreValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_collection_image_store_validator').adminCollectionImageStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_collection_image_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_collection_image_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.collections.image.delete': {
    methods: ["DELETE"]
    pattern: '/admin/collections/:id/image'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_collection_image_delete_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_collection_image_delete_controller').default['handle']>>>
    }
  }
  'admin.collections.import.sample': {
    methods: ["GET","HEAD"]
    pattern: '/admin/collections/import/sample'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_import_sample_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_import_sample_controller').default['handle']>>>
    }
  }
  'admin.collections.import.store': {
    methods: ["POST"]
    pattern: '/admin/collections/import'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_csv_import_store_validator').adminCsvImportStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_csv_import_store_validator').adminCsvImportStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_import_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_import_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.collections.export': {
    methods: ["GET","HEAD"]
    pattern: '/admin/collections/export'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_collections_export_query_validator').adminCollectionsExportQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_export_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_collections_export_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.pages.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/pages'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_pages_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_pages_home_controller').default['handle']>>>
    }
  }
  'admin.pages.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/pages/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_pages_list_query_validator').adminPagesListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_pages_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_pages_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.pages.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/pages/view/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_pages_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_pages_view_controller').default['handle']>>>
    }
  }
  'admin.pages.create': {
    methods: ["GET","HEAD"]
    pattern: '/admin/pages/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_pages_create_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_pages_create_controller').default['handle']>>>
    }
  }
  'admin.pages.store': {
    methods: ["POST"]
    pattern: '/admin/pages'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_page_store_validator').adminPageStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_page_store_validator').adminPageStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_pages_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_pages_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.pages.bulk.status.update': {
    methods: ["PUT"]
    pattern: '/admin/pages/bulk/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_bulk_status_validator').adminBulkStatusValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_bulk_status_validator').adminBulkStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_pages_bulk_status_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_pages_bulk_status_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.pages.edit': {
    methods: ["GET","HEAD"]
    pattern: '/admin/pages/edit/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_pages_edit_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_pages_edit_controller').default['handle']>>>
    }
  }
  'admin.pages.update': {
    methods: ["PUT"]
    pattern: '/admin/pages/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_page_update_validator').adminPageUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_page_update_validator').adminPageUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_pages_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_pages_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.pages.bulk.archive.update': {
    methods: ["PUT"]
    pattern: '/admin/pages/bulk/archive'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_pages_bulk_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_pages_bulk_archive_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.pages.archive': {
    methods: ["POST"]
    pattern: '/admin/pages/:id/archive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_pages_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_pages_archive_controller').default['handle']>>>
    }
  }
  'admin.pages.unarchive': {
    methods: ["POST"]
    pattern: '/admin/pages/:id/unarchive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_pages_unarchive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_pages_unarchive_controller').default['handle']>>>
    }
  }
  'admin.products.variants.inventory.update': {
    methods: ["PUT"]
    pattern: '/admin/products/:productId/variants/:id/inventory'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_product_variant_params_validator').adminProductVariantParamsValidator)>|InferInput<(typeof import('#validators/admin_inventory_levels_update_validator').adminInventoryLevelsUpdateValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { productId: ParamValue; id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_product_variant_params_validator').adminProductVariantParamsValidator)>|InferInput<(typeof import('#validators/admin_inventory_levels_update_validator').adminInventoryLevelsUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_variant_inventory_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_variant_inventory_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.options.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/options'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_options_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_options_home_controller').default['handle']>>>
    }
  }
  'admin.options.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/options/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_option_definitions_list_query_validator').adminOptionDefinitionsListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_options_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_options_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.options.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/options/view/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_options_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_options_view_controller').default['handle']>>>
    }
  }
  'admin.options.edit': {
    methods: ["GET","HEAD"]
    pattern: '/admin/options/edit/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_options_edit_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_options_edit_controller').default['handle']>>>
    }
  }
  'admin.options.store': {
    methods: ["POST"]
    pattern: '/admin/options'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_option_definition_store_validator').adminOptionDefinitionStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_option_definition_store_validator').adminOptionDefinitionStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_options_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_options_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.options.update': {
    methods: ["PUT"]
    pattern: '/admin/options/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_option_definition_update_validator').adminOptionDefinitionUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_option_definition_update_validator').adminOptionDefinitionUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_options_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_options_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.options.bulk.archive.update': {
    methods: ["PUT"]
    pattern: '/admin/options/bulk/archive'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_options_bulk_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_options_bulk_archive_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.options.archive': {
    methods: ["POST"]
    pattern: '/admin/options/:id/archive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_options_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_options_archive_controller').default['handle']>>>
    }
  }
  'admin.options.unarchive': {
    methods: ["POST"]
    pattern: '/admin/options/:id/unarchive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_options_unarchive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_options_unarchive_controller').default['handle']>>>
    }
  }
  'admin.options.import.sample': {
    methods: ["GET","HEAD"]
    pattern: '/admin/options/import/sample'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_options_import_sample_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_options_import_sample_controller').default['handle']>>>
    }
  }
  'admin.options.import.store': {
    methods: ["POST"]
    pattern: '/admin/options/import'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_csv_import_store_validator').adminCsvImportStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_csv_import_store_validator').adminCsvImportStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_options_import_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_options_import_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.options.export': {
    methods: ["GET","HEAD"]
    pattern: '/admin/options/export'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_options_export_query_validator').adminOptionsExportQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_options_export_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_options_export_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.options.values.store': {
    methods: ["POST"]
    pattern: '/admin/options/:id/values'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_option_definition_value_store_validator').adminOptionDefinitionValueStoreValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_option_definition_value_store_validator').adminOptionDefinitionValueStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_option_values_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_option_values_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.options.values.update': {
    methods: ["PUT"]
    pattern: '/admin/options/:id/values/:valueId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_option_definition_value_update_validator').adminOptionDefinitionValueUpdateValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; valueId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_option_definition_value_update_validator').adminOptionDefinitionValueUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_option_values_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_option_values_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.options.values.delete': {
    methods: ["DELETE"]
    pattern: '/admin/options/:id/values/:valueId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; valueId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_option_values_delete_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_option_values_delete_controller').default['handle']>>>
    }
  }
  'admin.product_types.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/product-types'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_types_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_types_home_controller').default['handle']>>>
    }
  }
  'admin.product_types.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/product-types/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_product_types_list_query_validator').adminProductTypesListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_types_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_types_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.product_types.store': {
    methods: ["POST"]
    pattern: '/admin/product-types'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_product_type_store_validator').adminProductTypeStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_product_type_store_validator').adminProductTypeStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_types_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_types_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.product_types.update': {
    methods: ["PUT"]
    pattern: '/admin/product-types/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_product_type_update_validator').adminProductTypeUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_product_type_update_validator').adminProductTypeUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_types_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_types_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.product_types.bulk.archive.update': {
    methods: ["PUT"]
    pattern: '/admin/product-types/bulk/archive'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_types_bulk_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_types_bulk_archive_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.product_types.archive': {
    methods: ["POST"]
    pattern: '/admin/product-types/:id/archive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_types_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_types_archive_controller').default['handle']>>>
    }
  }
  'admin.product_types.unarchive': {
    methods: ["POST"]
    pattern: '/admin/product-types/:id/unarchive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_types_unarchive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_types_unarchive_controller').default['handle']>>>
    }
  }
  'admin.product_types.import.sample': {
    methods: ["GET","HEAD"]
    pattern: '/admin/product-types/import/sample'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_types_import_sample_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_types_import_sample_controller').default['handle']>>>
    }
  }
  'admin.product_types.import.store': {
    methods: ["POST"]
    pattern: '/admin/product-types/import'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_csv_import_store_validator').adminCsvImportStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_csv_import_store_validator').adminCsvImportStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_types_import_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_types_import_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.product_types.export': {
    methods: ["GET","HEAD"]
    pattern: '/admin/product-types/export'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_product_types_export_query_validator').adminProductTypesExportQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_types_export_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_types_export_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.product_labels.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/product-labels'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_labels_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_labels_home_controller').default['handle']>>>
    }
  }
  'admin.product_labels.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/product-labels/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_product_labels_list_query_validator').adminProductLabelsListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_labels_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_labels_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.product_labels.store': {
    methods: ["POST"]
    pattern: '/admin/product-labels'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_product_label_store_validator').adminProductLabelStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_product_label_store_validator').adminProductLabelStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_labels_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_labels_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.product_labels.update': {
    methods: ["PUT"]
    pattern: '/admin/product-labels/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_product_label_update_validator').adminProductLabelUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_product_label_update_validator').adminProductLabelUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_labels_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_labels_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.product_labels.bulk.archive.update': {
    methods: ["PUT"]
    pattern: '/admin/product-labels/bulk/archive'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_labels_bulk_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_labels_bulk_archive_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.product_labels.archive': {
    methods: ["POST"]
    pattern: '/admin/product-labels/:id/archive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_labels_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_labels_archive_controller').default['handle']>>>
    }
  }
  'admin.product_labels.unarchive': {
    methods: ["POST"]
    pattern: '/admin/product-labels/:id/unarchive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_labels_unarchive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_product_labels_unarchive_controller').default['handle']>>>
    }
  }
  'admin.media.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/media'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_media_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_media_home_controller').default['handle']>>>
    }
  }
  'admin.media.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/media/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_media_list_query_validator').adminMediaListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_media_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_media_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.media.store': {
    methods: ["POST"]
    pattern: '/admin/media'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_media_store_validator').adminMediaStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_media_store_validator').adminMediaStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_media_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_media_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.media.delete': {
    methods: ["DELETE"]
    pattern: '/admin/media/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_media_delete_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_media_delete_controller').default['handle']>>>
    }
  }
  'admin.vendors.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/vendors'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_vendors_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_vendors_home_controller').default['handle']>>>
    }
  }
  'admin.vendors.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/vendors/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_vendors_list_query_validator').adminVendorsListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_vendors_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_vendors_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.vendors.store': {
    methods: ["POST"]
    pattern: '/admin/vendors'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_vendor_store_validator').adminVendorStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_vendor_store_validator').adminVendorStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_vendors_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_vendors_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.vendors.update': {
    methods: ["PUT"]
    pattern: '/admin/vendors/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_vendor_update_validator').adminVendorUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_vendor_update_validator').adminVendorUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_vendors_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_vendors_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.vendors.image.store': {
    methods: ["POST"]
    pattern: '/admin/vendors/:id/image'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_vendor_image_store_validator').adminVendorImageStoreValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_vendor_image_store_validator').adminVendorImageStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_vendor_image_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_vendor_image_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.vendors.image.delete': {
    methods: ["DELETE"]
    pattern: '/admin/vendors/:id/image'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_vendor_image_delete_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_vendor_image_delete_controller').default['handle']>>>
    }
  }
  'admin.vendors.bulk.archive.update': {
    methods: ["PUT"]
    pattern: '/admin/vendors/bulk/archive'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_vendors_bulk_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_vendors_bulk_archive_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.vendors.archive': {
    methods: ["POST"]
    pattern: '/admin/vendors/:id/archive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_vendors_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_vendors_archive_controller').default['handle']>>>
    }
  }
  'admin.vendors.unarchive': {
    methods: ["POST"]
    pattern: '/admin/vendors/:id/unarchive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_vendors_unarchive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_vendors_unarchive_controller').default['handle']>>>
    }
  }
  'admin.vendors.import.sample': {
    methods: ["GET","HEAD"]
    pattern: '/admin/vendors/import/sample'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_vendors_import_sample_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_vendors_import_sample_controller').default['handle']>>>
    }
  }
  'admin.vendors.import.store': {
    methods: ["POST"]
    pattern: '/admin/vendors/import'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_csv_import_store_validator').adminCsvImportStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_csv_import_store_validator').adminCsvImportStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_vendors_import_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_vendors_import_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.vendors.export': {
    methods: ["GET","HEAD"]
    pattern: '/admin/vendors/export'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_vendors_export_query_validator').adminVendorsExportQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_vendors_export_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_vendors_export_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.locations.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/locations'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_locations_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_locations_home_controller').default['handle']>>>
    }
  }
  'admin.locations.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/locations/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_locations_list_query_validator').adminLocationsListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_locations_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_locations_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.locations.store': {
    methods: ["POST"]
    pattern: '/admin/locations'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_location_store_validator').adminLocationStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_location_store_validator').adminLocationStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_locations_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_locations_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.locations.update': {
    methods: ["PUT"]
    pattern: '/admin/locations/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_location_update_validator').adminLocationUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_location_update_validator').adminLocationUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_locations_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_locations_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.locations.bulk.archive.update': {
    methods: ["PUT"]
    pattern: '/admin/locations/bulk/archive'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_locations_bulk_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_locations_bulk_archive_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.locations.archive': {
    methods: ["POST"]
    pattern: '/admin/locations/:id/archive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_locations_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_locations_archive_controller').default['handle']>>>
    }
  }
  'admin.locations.unarchive': {
    methods: ["POST"]
    pattern: '/admin/locations/:id/unarchive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_locations_unarchive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_locations_unarchive_controller').default['handle']>>>
    }
  }
  'admin.locations.import.sample': {
    methods: ["GET","HEAD"]
    pattern: '/admin/locations/import/sample'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_locations_import_sample_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_locations_import_sample_controller').default['handle']>>>
    }
  }
  'admin.locations.import.store': {
    methods: ["POST"]
    pattern: '/admin/locations/import'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_csv_import_store_validator').adminCsvImportStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_csv_import_store_validator').adminCsvImportStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_locations_import_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_locations_import_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.locations.export': {
    methods: ["GET","HEAD"]
    pattern: '/admin/locations/export'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_locations_export_query_validator').adminLocationsExportQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_locations_export_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_locations_export_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.dashboard.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/dashboard/view'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_dashboard_view_query_validator').adminDashboardViewQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_dashboard_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_dashboard_view_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.orders.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/orders'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_orders_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_orders_home_controller').default['handle']>>>
    }
  }
  'admin.orders.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/orders/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_orders_list_query_validator').adminOrdersListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_orders_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_orders_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.orders.show': {
    methods: ["GET","HEAD"]
    pattern: '/admin/orders/show/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_orders_show_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_orders_show_controller').default['handle']>>>
    }
  }
  'admin.orders.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/orders/view/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_orders_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_orders_view_controller').default['handle']>>>
    }
  }
  'admin.orders.activity.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/orders/:id/activity'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_order_activity_list_query_validator').adminOrderActivityListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_order_activity_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_order_activity_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.orders.variants.search': {
    methods: ["GET","HEAD"]
    pattern: '/admin/orders/variants/search'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_order_variants_search_query_validator').adminOrderVariantsSearchQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_orders_variants_search_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_orders_variants_search_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.orders.drafts.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/orders/drafts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_draft_orders_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_draft_orders_home_controller').default['handle']>>>
    }
  }
  'admin.orders.drafts.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/orders/drafts/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_draft_orders_list_query_validator').adminDraftOrdersListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_draft_orders_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_draft_orders_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.orders.drafts.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/orders/drafts/view/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_draft_orders_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_draft_orders_view_controller').default['handle']>>>
    }
  }
  'admin.orders.returns.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/orders/:id/returns'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_order_returns_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_order_returns_list_controller').default['handle']>>>
    }
  }
  'admin.orders.notes.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/orders/:id/notes/list'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_order_notes_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_order_notes_list_controller').default['handle']>>>
    }
  }
  'admin.orders.payment_proof.image.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/orders/:id/payment-proof/image'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_order_payment_proof_image_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_order_payment_proof_image_view_controller').default['handle']>>>
    }
  }
  'admin.orders.invoice.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/orders/:id/invoice'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_order_invoice_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_order_invoice_view_controller').default['handle']>>>
    }
  }
  'admin.orders.receipt.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/orders/:id/receipt'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_order_receipt_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_order_receipt_view_controller').default['handle']>>>
    }
  }
  'admin.orders.packing_slip.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/orders/:id/packing-slip'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_order_packing_slip_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_order_packing_slip_view_controller').default['handle']>>>
    }
  }
  'admin.returns.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/returns'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_returns_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_returns_home_controller').default['handle']>>>
    }
  }
  'admin.returns.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/returns/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_returns_list_query_validator').adminReturnsListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_returns_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_returns_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.orders.drafts.create': {
    methods: ["GET","HEAD"]
    pattern: '/admin/orders/drafts/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_draft_orders_create_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_draft_orders_create_controller').default['handle']>>>
    }
  }
  'admin.orders.drafts.store': {
    methods: ["POST"]
    pattern: '/admin/orders/drafts'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_draft_order_store_validator').adminDraftOrderStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_draft_order_store_validator').adminDraftOrderStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_draft_orders_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_draft_orders_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.orders.drafts.calculate': {
    methods: ["POST"]
    pattern: '/admin/orders/drafts/calculate'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_draft_order_calculate_validator').adminDraftOrderCalculateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_draft_order_calculate_validator').adminDraftOrderCalculateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_draft_orders_calculate_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_draft_orders_calculate_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.orders.drafts.edit': {
    methods: ["GET","HEAD"]
    pattern: '/admin/orders/drafts/edit/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_draft_orders_edit_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_draft_orders_edit_controller').default['handle']>>>
    }
  }
  'admin.orders.drafts.update': {
    methods: ["PUT"]
    pattern: '/admin/orders/drafts/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_draft_order_update_validator').adminDraftOrderUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_draft_order_update_validator').adminDraftOrderUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_draft_orders_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_draft_orders_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.orders.drafts.complete': {
    methods: ["POST"]
    pattern: '/admin/orders/drafts/:id/complete'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_draft_order_complete_validator').adminDraftOrderCompleteValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_draft_order_complete_validator').adminDraftOrderCompleteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_draft_orders_complete_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_draft_orders_complete_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.orders.update': {
    methods: ["PUT"]
    pattern: '/admin/orders/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_order_update_validator').adminOrderUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_order_update_validator').adminOrderUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_orders_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_orders_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.orders.fulfillments.store': {
    methods: ["POST"]
    pattern: '/admin/orders/:id/fulfillments'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_fulfillment_store_validator').adminFulfillmentStoreValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_fulfillment_store_validator').adminFulfillmentStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_order_fulfillments_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_order_fulfillments_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.orders.fulfillment_status.update': {
    methods: ["PUT"]
    pattern: '/admin/orders/:id/fulfillment-status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_order_fulfillment_status_update_validator').adminOrderFulfillmentStatusUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_order_fulfillment_status_update_validator').adminOrderFulfillmentStatusUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_orders_fulfillment_status_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_orders_fulfillment_status_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.fulfillments.update': {
    methods: ["PUT"]
    pattern: '/admin/fulfillments/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_fulfillment_tracking_update_validator').adminFulfillmentTrackingUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_fulfillment_tracking_update_validator').adminFulfillmentTrackingUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_fulfillments_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_fulfillments_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.fulfillments.cancel.update': {
    methods: ["PUT"]
    pattern: '/admin/fulfillments/:id/cancel'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_fulfillments_cancel_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_fulfillments_cancel_controller').default['handle']>>>
    }
  }
  'admin.orders.returns.store': {
    methods: ["POST"]
    pattern: '/admin/orders/:id/returns'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_return_store_validator').adminReturnStoreValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_return_store_validator').adminReturnStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_order_returns_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_order_returns_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.orders.notes.store': {
    methods: ["POST"]
    pattern: '/admin/orders/:id/notes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_order_note_store_validator').adminOrderNoteStoreValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_order_note_store_validator').adminOrderNoteStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_order_notes_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_order_notes_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.orders.payment_proof.review.update': {
    methods: ["PUT"]
    pattern: '/admin/orders/:id/payment-proof/review'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_order_payment_proof_review_validator').adminOrderPaymentProofReviewValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_order_payment_proof_review_validator').adminOrderPaymentProofReviewValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_order_payment_proof_review_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_order_payment_proof_review_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.returns.approve.update': {
    methods: ["PUT"]
    pattern: '/admin/returns/:id/approve'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_return_approve_validator').adminReturnApproveValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_return_approve_validator').adminReturnApproveValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_returns_approve_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_returns_approve_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.returns.decline.update': {
    methods: ["PUT"]
    pattern: '/admin/returns/:id/decline'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_return_decline_validator').adminReturnDeclineValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_return_decline_validator').adminReturnDeclineValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_returns_decline_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_returns_decline_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.returns.receive.update': {
    methods: ["PUT"]
    pattern: '/admin/returns/:id/receive'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_return_receive_validator').adminReturnReceiveValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_return_receive_validator').adminReturnReceiveValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_returns_receive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_returns_receive_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.returns.cancel.update': {
    methods: ["PUT"]
    pattern: '/admin/returns/:id/cancel'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_returns_cancel_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_returns_cancel_controller').default['handle']>>>
    }
  }
  'admin.orders.refunds.calculate': {
    methods: ["POST"]
    pattern: '/admin/orders/:id/refunds/calculate'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_order_refund_calculate_validator').adminOrderRefundCalculateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_order_refund_calculate_validator').adminOrderRefundCalculateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_order_refunds_calculate_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_order_refunds_calculate_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.orders.refunds.store': {
    methods: ["POST"]
    pattern: '/admin/orders/:id/refunds'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_order_refund_store_validator').adminOrderRefundStoreValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_order_refund_store_validator').adminOrderRefundStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_order_refunds_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_order_refunds_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.orders.cancel': {
    methods: ["POST"]
    pattern: '/admin/orders/:id/cancel'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_order_cancel_validator').adminOrderCancelValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_order_cancel_validator').adminOrderCancelValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_orders_cancel_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_orders_cancel_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.orders.drafts.delete': {
    methods: ["DELETE"]
    pattern: '/admin/orders/drafts/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_draft_orders_delete_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_draft_orders_delete_controller').default['handle']>>>
    }
  }
  'admin.orders.bulk.archive.update': {
    methods: ["PUT"]
    pattern: '/admin/orders/bulk/archive'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_orders_bulk_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_orders_bulk_archive_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.orders.archive': {
    methods: ["POST"]
    pattern: '/admin/orders/:id/archive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_orders_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_orders_archive_controller').default['handle']>>>
    }
  }
  'admin.orders.unarchive': {
    methods: ["POST"]
    pattern: '/admin/orders/:id/unarchive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_orders_unarchive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_orders_unarchive_controller').default['handle']>>>
    }
  }
  'admin.discounts.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/discounts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_discounts_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_discounts_home_controller').default['handle']>>>
    }
  }
  'admin.discounts.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/discounts/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_discounts_list_query_validator').adminDiscountsListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_discounts_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_discounts_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.discounts.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/discounts/view/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_discounts_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_discounts_view_controller').default['handle']>>>
    }
  }
  'admin.discounts.create': {
    methods: ["GET","HEAD"]
    pattern: '/admin/discounts/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_discounts_create_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_discounts_create_controller').default['handle']>>>
    }
  }
  'admin.discounts.store': {
    methods: ["POST"]
    pattern: '/admin/discounts'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_discount_store_validator').adminDiscountStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_discount_store_validator').adminDiscountStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_discounts_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_discounts_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.discounts.edit': {
    methods: ["GET","HEAD"]
    pattern: '/admin/discounts/edit/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_discounts_edit_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_discounts_edit_controller').default['handle']>>>
    }
  }
  'admin.discounts.update': {
    methods: ["PUT"]
    pattern: '/admin/discounts/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_discount_update_validator').adminDiscountUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_discount_update_validator').adminDiscountUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_discounts_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_discounts_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.discounts.bulk.archive.update': {
    methods: ["PUT"]
    pattern: '/admin/discounts/bulk/archive'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_discounts_bulk_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_discounts_bulk_archive_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.discounts.archive': {
    methods: ["POST"]
    pattern: '/admin/discounts/:id/archive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_discounts_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_discounts_archive_controller').default['handle']>>>
    }
  }
  'admin.discounts.unarchive': {
    methods: ["POST"]
    pattern: '/admin/discounts/:id/unarchive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_discounts_unarchive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_discounts_unarchive_controller').default['handle']>>>
    }
  }
  'admin.newsletter_subscribers.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/marketing/newsletter'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_newsletter_subscribers_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_newsletter_subscribers_home_controller').default['handle']>>>
    }
  }
  'admin.newsletter_subscribers.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/marketing/newsletter/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_newsletter_subscribers_list_query_validator').adminNewsletterSubscribersListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_newsletter_subscribers_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_newsletter_subscribers_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.newsletter_subscribers.bulk.subscription.update': {
    methods: ["PUT"]
    pattern: '/admin/marketing/newsletter/bulk/subscription'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_newsletter_subscribers_bulk_subscription_validator').adminNewsletterSubscribersBulkSubscriptionValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_newsletter_subscribers_bulk_subscription_validator').adminNewsletterSubscribersBulkSubscriptionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_newsletter_subscribers_bulk_subscription_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_newsletter_subscribers_bulk_subscription_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.store_settings.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/settings'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_store_settings_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_store_settings_home_controller').default['handle']>>>
    }
  }
  'admin.store_settings.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/settings/view'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_store_settings_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_store_settings_view_controller').default['handle']>>>
    }
  }
  'admin.store_settings.business.update': {
    methods: ["PUT"]
    pattern: '/admin/settings/business'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_store_settings_business_update_validator').adminStoreSettingsBusinessUpdateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_store_settings_business_update_validator').adminStoreSettingsBusinessUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_store_settings_business_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_store_settings_business_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.store_settings.contact.update': {
    methods: ["PUT"]
    pattern: '/admin/settings/contact'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_store_settings_contact_update_validator').adminStoreSettingsContactUpdateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_store_settings_contact_update_validator').adminStoreSettingsContactUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_store_settings_contact_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_store_settings_contact_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.store_settings.address.update': {
    methods: ["PUT"]
    pattern: '/admin/settings/address'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_store_settings_address_update_validator').adminStoreSettingsAddressUpdateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_store_settings_address_update_validator').adminStoreSettingsAddressUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_store_settings_address_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_store_settings_address_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.store_settings.defaults.update': {
    methods: ["PUT"]
    pattern: '/admin/settings/defaults'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_store_settings_defaults_update_validator').adminStoreSettingsDefaultsUpdateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_store_settings_defaults_update_validator').adminStoreSettingsDefaultsUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_store_settings_defaults_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_store_settings_defaults_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.store_settings.notifications.update': {
    methods: ["PUT"]
    pattern: '/admin/settings/notifications'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_store_settings_notifications_update_validator').adminStoreSettingsNotificationsUpdateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_store_settings_notifications_update_validator').adminStoreSettingsNotificationsUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_store_settings_notifications_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_store_settings_notifications_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.store_settings.checkout.update': {
    methods: ["PUT"]
    pattern: '/admin/settings/checkout'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_store_settings_checkout_update_validator').adminStoreSettingsCheckoutUpdateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_store_settings_checkout_update_validator').adminStoreSettingsCheckoutUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_store_settings_checkout_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_store_settings_checkout_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.maintenance.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/settings/maintenance/view'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_maintenance_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_maintenance_view_controller').default['handle']>>>
    }
  }
  'admin.maintenance.update': {
    methods: ["PUT"]
    pattern: '/admin/settings/maintenance'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_maintenance_update_validator').adminMaintenanceUpdateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_maintenance_update_validator').adminMaintenanceUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_maintenance_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_maintenance_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.emails.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/emails'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_emails_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_emails_home_controller').default['handle']>>>
    }
  }
  'admin.emails.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/emails/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_emails_list_query_validator').adminEmailsListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_emails_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_emails_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.emails.show': {
    methods: ["GET","HEAD"]
    pattern: '/admin/emails/show/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_emails_show_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_emails_show_controller').default['handle']>>>
    }
  }
  'admin.emails.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/emails/view/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_emails_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_emails_view_controller').default['handle']>>>
    }
  }
  'admin.emails.resend.store': {
    methods: ["POST"]
    pattern: '/admin/emails/:id/resend'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_email_resend_validator').adminEmailResendValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_email_resend_validator').adminEmailResendValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_emails_resend_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_emails_resend_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.support.tickets.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/support/tickets'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_support_tickets_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_support_tickets_home_controller').default['handle']>>>
    }
  }
  'admin.support.tickets.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/support/tickets/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_support_tickets_list_query_validator').adminSupportTicketsListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_support_tickets_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_support_tickets_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.support.tickets.open_count.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/support/tickets/open-count'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_support_tickets_open_count_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_support_tickets_open_count_controller').default['handle']>>>
    }
  }
  'admin.support.tickets.assignees.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/support/tickets/assignees'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_support_tickets_assignees_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_support_tickets_assignees_list_controller').default['handle']>>>
    }
  }
  'admin.support.tickets.show': {
    methods: ["GET","HEAD"]
    pattern: '/admin/support/tickets/show/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_support_tickets_show_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_support_tickets_show_controller').default['handle']>>>
    }
  }
  'admin.support.tickets.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/support/tickets/view/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_support_tickets_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_support_tickets_view_controller').default['handle']>>>
    }
  }
  'admin.support.tickets.bulk.status.update': {
    methods: ["PUT"]
    pattern: '/admin/support/tickets/bulk/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_support_tickets_bulk_status_validator').adminSupportTicketsBulkStatusValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_support_tickets_bulk_status_validator').adminSupportTicketsBulkStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_support_tickets_bulk_status_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_support_tickets_bulk_status_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.support.tickets.messages.store': {
    methods: ["POST"]
    pattern: '/admin/support/tickets/:id/messages'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_support_ticket_message_store_validator').adminSupportTicketMessageStoreValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_support_ticket_message_store_validator').adminSupportTicketMessageStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_support_ticket_messages_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_support_ticket_messages_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.support.tickets.update': {
    methods: ["PUT"]
    pattern: '/admin/support/tickets/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_support_ticket_update_validator').adminSupportTicketUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_support_ticket_update_validator').adminSupportTicketUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_support_tickets_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_support_tickets_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.help_articles.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/help/articles'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_articles_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_articles_home_controller').default['handle']>>>
    }
  }
  'admin.help_articles.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/help/articles/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_help_articles_list_query_validator').adminHelpArticlesListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_articles_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_articles_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.help_articles.options.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/help/articles/options'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_articles_options_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_articles_options_controller').default['handle']>>>
    }
  }
  'admin.help_articles.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/help/articles/view/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_articles_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_articles_view_controller').default['handle']>>>
    }
  }
  'admin.help_categories.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/help/categories'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_categories_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_categories_home_controller').default['handle']>>>
    }
  }
  'admin.help_categories.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/help/categories/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_help_categories_list_query_validator').adminHelpCategoriesListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_categories_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_categories_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.help_categories.options.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/help/categories/options'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_categories_options_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_categories_options_controller').default['handle']>>>
    }
  }
  'admin.help_categories.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/help/categories/view/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_categories_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_categories_view_controller').default['handle']>>>
    }
  }
  'admin.help_articles.preview.store': {
    methods: ["POST"]
    pattern: '/admin/help/articles/preview'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_help_article_preview_validator').adminHelpArticlePreviewValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_help_article_preview_validator').adminHelpArticlePreviewValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_articles_preview_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_articles_preview_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.help_articles.create': {
    methods: ["GET","HEAD"]
    pattern: '/admin/help/articles/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_articles_create_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_articles_create_controller').default['handle']>>>
    }
  }
  'admin.help_articles.store': {
    methods: ["POST"]
    pattern: '/admin/help/articles'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_help_article_store_validator').adminHelpArticleStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_help_article_store_validator').adminHelpArticleStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_articles_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_articles_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.help_categories.store': {
    methods: ["POST"]
    pattern: '/admin/help/categories'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_help_category_store_validator').adminHelpCategoryStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_help_category_store_validator').adminHelpCategoryStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_categories_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_categories_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.help_articles.bulk.status.update': {
    methods: ["PUT"]
    pattern: '/admin/help/articles/bulk/status'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_bulk_status_validator').adminBulkStatusValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_bulk_status_validator').adminBulkStatusValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_articles_bulk_status_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_articles_bulk_status_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.help_articles.edit': {
    methods: ["GET","HEAD"]
    pattern: '/admin/help/articles/edit/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_articles_edit_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_articles_edit_controller').default['handle']>>>
    }
  }
  'admin.help_articles.update': {
    methods: ["PUT"]
    pattern: '/admin/help/articles/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_help_article_update_validator').adminHelpArticleUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_help_article_update_validator').adminHelpArticleUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_articles_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_articles_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.help_categories.update': {
    methods: ["PUT"]
    pattern: '/admin/help/categories/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_help_category_update_validator').adminHelpCategoryUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_help_category_update_validator').adminHelpCategoryUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_categories_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_categories_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.help_articles.bulk.archive.update': {
    methods: ["PUT"]
    pattern: '/admin/help/articles/bulk/archive'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_articles_bulk_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_articles_bulk_archive_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.help_articles.archive': {
    methods: ["POST"]
    pattern: '/admin/help/articles/:id/archive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_articles_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_articles_archive_controller').default['handle']>>>
    }
  }
  'admin.help_articles.unarchive': {
    methods: ["POST"]
    pattern: '/admin/help/articles/:id/unarchive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_articles_unarchive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_articles_unarchive_controller').default['handle']>>>
    }
  }
  'admin.help_categories.bulk.archive.update': {
    methods: ["PUT"]
    pattern: '/admin/help/categories/bulk/archive'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_categories_bulk_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_categories_bulk_archive_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.help_categories.archive': {
    methods: ["POST"]
    pattern: '/admin/help/categories/:id/archive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_categories_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_categories_archive_controller').default['handle']>>>
    }
  }
  'admin.help_categories.unarchive': {
    methods: ["POST"]
    pattern: '/admin/help/categories/:id/unarchive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_categories_unarchive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_help_categories_unarchive_controller').default['handle']>>>
    }
  }
  'admin.notifications.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/notifications/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_notifications_list_query_validator').adminNotificationsListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_notifications_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_notifications_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.notifications.seen.update': {
    methods: ["PUT"]
    pattern: '/admin/notifications/seen'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_notifications_seen_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_notifications_seen_update_controller').default['handle']>>>
    }
  }
  'admin.notifications.read_all.update': {
    methods: ["PUT"]
    pattern: '/admin/notifications/read-all'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_notifications_read_all_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_notifications_read_all_update_controller').default['handle']>>>
    }
  }
  'admin.notifications.read.update': {
    methods: ["PUT"]
    pattern: '/admin/notifications/:id/read'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_notifications_read_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_notifications_read_update_controller').default['handle']>>>
    }
  }
  'admin.events.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/events'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_events_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_events_home_controller').default['handle']>>>
    }
  }
  'admin.events.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/events/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_events_list_query_validator').adminEventsListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_events_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_events_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.events.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/events/view/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_events_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_events_view_controller').default['handle']>>>
    }
  }
  'admin.events.retry_failed.store': {
    methods: ["POST"]
    pattern: '/admin/events/retry-failed'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_events_retry_failed_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_events_retry_failed_store_controller').default['handle']>>>
    }
  }
  'admin.events.retry.store': {
    methods: ["POST"]
    pattern: '/admin/events/:id/retry'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_events_retry_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_events_retry_store_controller').default['handle']>>>
    }
  }
  'admin.payments.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/payments'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_payments_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_payments_home_controller').default['handle']>>>
    }
  }
  'admin.payments.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/payments/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_payments_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_payments_list_controller').default['handle']>>>
    }
  }
  'admin.payments.markets.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/payments/markets'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_payments_markets_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_payments_markets_list_controller').default['handle']>>>
    }
  }
  'admin.payments.bank_transfer.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/payments/bank-transfer/view'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_payments_bank_transfer_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_payments_bank_transfer_view_controller').default['handle']>>>
    }
  }
  'admin.payments.stripe.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/payments/stripe/view'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_payments_stripe_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_payments_stripe_view_controller').default['handle']>>>
    }
  }
  'admin.payments.poli.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/payments/poli/view'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_payments_poli_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_payments_poli_view_controller').default['handle']>>>
    }
  }
  'admin.payments.bank_transfer.update': {
    methods: ["PUT"]
    pattern: '/admin/payments/bank-transfer/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_payment_bank_transfer_update_validator').adminPaymentBankTransferUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_payment_bank_transfer_update_validator').adminPaymentBankTransferUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_payments_bank_transfer_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_payments_bank_transfer_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.payments.stripe.update': {
    methods: ["PUT"]
    pattern: '/admin/payments/stripe'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_payment_stripe_update_validator').adminPaymentStripeUpdateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_payment_stripe_update_validator').adminPaymentStripeUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_payments_stripe_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_payments_stripe_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.payments.poli.update': {
    methods: ["PUT"]
    pattern: '/admin/payments/poli'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_payment_poli_update_validator').adminPaymentPoliUpdateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_payment_poli_update_validator').adminPaymentPoliUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_payments_poli_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_payments_poli_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.storefront_theme.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/storefront/theme'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_theme_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_theme_home_controller').default['handle']>>>
    }
  }
  'admin.storefront_theme.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/storefront/theme/view'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_theme_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_theme_view_controller').default['handle']>>>
    }
  }
  'admin.storefront_menu.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/storefront/menu'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_menu_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_menu_home_controller').default['handle']>>>
    }
  }
  'admin.storefront_menu.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/storefront/menu/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_menu_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_menu_list_controller').default['handle']>>>
    }
  }
  'admin.storefront_menu.collections': {
    methods: ["GET","HEAD"]
    pattern: '/admin/storefront/menu/collections'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_menu_collections_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_menu_collections_controller').default['handle']>>>
    }
  }
  'admin.storefront_menu.pages': {
    methods: ["GET","HEAD"]
    pattern: '/admin/storefront/menu/pages'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_menu_pages_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_menu_pages_controller').default['handle']>>>
    }
  }
  'admin.storefront_hero.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/storefront/hero'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_hero_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_hero_home_controller').default['handle']>>>
    }
  }
  'admin.storefront_hero.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/storefront/hero-slides/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_hero_slides_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_hero_slides_list_controller').default['handle']>>>
    }
  }
  'admin.storefront_content.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/storefront/content'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_content_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_content_home_controller').default['handle']>>>
    }
  }
  'admin.storefront_promo_banners.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/storefront/promo-banners/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_promo_banners_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_promo_banners_list_controller').default['handle']>>>
    }
  }
  'admin.storefront_features.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/storefront/features/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_features_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_features_list_controller').default['handle']>>>
    }
  }
  'admin.storefront_featured_reviews.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/storefront/featured-reviews/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_featured_reviews_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_featured_reviews_list_controller').default['handle']>>>
    }
  }
  'admin.storefront_menu.store': {
    methods: ["POST"]
    pattern: '/admin/storefront/menu'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_storefront_menu_item_store_validator').adminStorefrontMenuItemStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_storefront_menu_item_store_validator').adminStorefrontMenuItemStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_menu_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_menu_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.storefront_hero.store': {
    methods: ["POST"]
    pattern: '/admin/storefront/hero-slides'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_storefront_hero_slide_store_validator').adminStorefrontHeroSlideStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_storefront_hero_slide_store_validator').adminStorefrontHeroSlideStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_hero_slides_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_hero_slides_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.storefront_promo_banners.store': {
    methods: ["POST"]
    pattern: '/admin/storefront/promo-banners'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_storefront_promo_banner_store_validator').adminStorefrontPromoBannerStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_storefront_promo_banner_store_validator').adminStorefrontPromoBannerStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_promo_banners_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_promo_banners_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.storefront_theme.update': {
    methods: ["PUT"]
    pattern: '/admin/storefront/theme'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_storefront_theme_update_validator').adminStorefrontThemeUpdateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_storefront_theme_update_validator').adminStorefrontThemeUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_theme_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_theme_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.storefront_theme.brand.update': {
    methods: ["PUT"]
    pattern: '/admin/storefront/theme/brand'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_storefront_brand_update_validator').adminStorefrontBrandUpdateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_storefront_brand_update_validator').adminStorefrontBrandUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_brand_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_brand_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.storefront_menu.reorder': {
    methods: ["PUT"]
    pattern: '/admin/storefront/menu/reorder'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_storefront_menu_reorder_validator').adminStorefrontMenuReorderValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_storefront_menu_reorder_validator').adminStorefrontMenuReorderValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_menu_reorder_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_menu_reorder_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.storefront_menu.update': {
    methods: ["PUT"]
    pattern: '/admin/storefront/menu/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_storefront_menu_item_update_validator').adminStorefrontMenuItemUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_storefront_menu_item_update_validator').adminStorefrontMenuItemUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_menu_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_menu_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.storefront_hero.reorder': {
    methods: ["PUT"]
    pattern: '/admin/storefront/hero-slides/reorder'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_storefront_hero_slide_reorder_validator').adminStorefrontHeroSlideReorderValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_storefront_hero_slide_reorder_validator').adminStorefrontHeroSlideReorderValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_hero_slides_reorder_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_hero_slides_reorder_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.storefront_hero.update': {
    methods: ["PUT"]
    pattern: '/admin/storefront/hero-slides/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_storefront_hero_slide_update_validator').adminStorefrontHeroSlideUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_storefront_hero_slide_update_validator').adminStorefrontHeroSlideUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_hero_slides_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_hero_slides_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.storefront_content.update': {
    methods: ["PUT"]
    pattern: '/admin/storefront/content'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_storefront_content_update_validator').adminStorefrontContentUpdateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_storefront_content_update_validator').adminStorefrontContentUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_content_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_content_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.storefront_promo_banners.reorder': {
    methods: ["PUT"]
    pattern: '/admin/storefront/promo-banners/reorder'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_storefront_promo_banner_reorder_validator').adminStorefrontPromoBannerReorderValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_storefront_promo_banner_reorder_validator').adminStorefrontPromoBannerReorderValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_promo_banners_reorder_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_promo_banners_reorder_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.storefront_promo_banners.update': {
    methods: ["PUT"]
    pattern: '/admin/storefront/promo-banners/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_storefront_promo_banner_update_validator').adminStorefrontPromoBannerUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_storefront_promo_banner_update_validator').adminStorefrontPromoBannerUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_promo_banners_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_promo_banners_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.storefront_features.update': {
    methods: ["PUT"]
    pattern: '/admin/storefront/features'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_storefront_features_update_validator').adminStorefrontFeaturesUpdateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_storefront_features_update_validator').adminStorefrontFeaturesUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_features_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_features_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.storefront_theme.logo.store': {
    methods: ["POST"]
    pattern: '/admin/storefront/theme/logo'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_storefront_logo_store_validator').adminStorefrontLogoStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_storefront_logo_store_validator').adminStorefrontLogoStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_logo_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_logo_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.storefront_theme.logo.delete': {
    methods: ["DELETE"]
    pattern: '/admin/storefront/theme/logo'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_logo_delete_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_logo_delete_controller').default['handle']>>>
    }
  }
  'admin.storefront_theme.favicon.store': {
    methods: ["POST"]
    pattern: '/admin/storefront/theme/favicon'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_storefront_favicon_store_validator').adminStorefrontFaviconStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_storefront_favicon_store_validator').adminStorefrontFaviconStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_favicon_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_favicon_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.storefront_theme.favicon.delete': {
    methods: ["DELETE"]
    pattern: '/admin/storefront/theme/favicon'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_favicon_delete_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_favicon_delete_controller').default['handle']>>>
    }
  }
  'admin.storefront_hero.image.store': {
    methods: ["POST"]
    pattern: '/admin/storefront/hero-slides/:id/image'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_storefront_hero_slide_image_store_validator').adminStorefrontHeroSlideImageStoreValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_storefront_hero_slide_image_store_validator').adminStorefrontHeroSlideImageStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_hero_slide_image_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_hero_slide_image_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.storefront_hero.image.delete': {
    methods: ["DELETE"]
    pattern: '/admin/storefront/hero-slides/:id/image'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_hero_slide_image_delete_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_hero_slide_image_delete_controller').default['handle']>>>
    }
  }
  'admin.storefront_promo_banners.image.store': {
    methods: ["POST"]
    pattern: '/admin/storefront/promo-banners/:id/image'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_storefront_promo_banner_image_store_validator').adminStorefrontPromoBannerImageStoreValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_storefront_promo_banner_image_store_validator').adminStorefrontPromoBannerImageStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_promo_banner_image_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_promo_banner_image_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.storefront_promo_banners.image.delete': {
    methods: ["DELETE"]
    pattern: '/admin/storefront/promo-banners/:id/image'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_promo_banner_image_delete_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_promo_banner_image_delete_controller').default['handle']>>>
    }
  }
  'admin.storefront_menu.delete': {
    methods: ["DELETE"]
    pattern: '/admin/storefront/menu/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_menu_delete_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_menu_delete_controller').default['handle']>>>
    }
  }
  'admin.storefront_hero.delete': {
    methods: ["DELETE"]
    pattern: '/admin/storefront/hero-slides/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_hero_slides_delete_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_hero_slides_delete_controller').default['handle']>>>
    }
  }
  'admin.storefront_promo_banners.delete': {
    methods: ["DELETE"]
    pattern: '/admin/storefront/promo-banners/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_promo_banners_delete_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_storefront_promo_banners_delete_controller').default['handle']>>>
    }
  }
  'admin.plugins.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/plugins'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_plugins_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_plugins_home_controller').default['handle']>>>
    }
  }
  'admin.plugins.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/plugins/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_plugins_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_plugins_list_controller').default['handle']>>>
    }
  }
  'admin.plugins.install': {
    methods: ["POST"]
    pattern: '/admin/plugins/:key/install'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_plugins_install_validator').adminPluginsInstallValidator)>>
      paramsTuple: [ParamValue]
      params: { key: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_plugins_install_validator').adminPluginsInstallValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_plugins_install_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_plugins_install_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.plugins.uninstall': {
    methods: ["DELETE"]
    pattern: '/admin/plugins/:key/install'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_plugins_install_validator').adminPluginsInstallValidator)>>
      paramsTuple: [ParamValue]
      params: { key: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_plugins_install_validator').adminPluginsInstallValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_plugins_uninstall_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_plugins_uninstall_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.markets.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/markets'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_markets_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_markets_home_controller').default['handle']>>>
    }
  }
  'admin.markets.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/markets/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_markets_list_query_validator').adminMarketsListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_markets_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_markets_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.markets.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/markets/view/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_markets_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_markets_view_controller').default['handle']>>>
    }
  }
  'admin.markets.store': {
    methods: ["POST"]
    pattern: '/admin/markets'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_market_store_validator').adminMarketStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_market_store_validator').adminMarketStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_markets_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_markets_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.markets.edit': {
    methods: ["GET","HEAD"]
    pattern: '/admin/markets/edit/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_markets_edit_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_markets_edit_controller').default['handle']>>>
    }
  }
  'admin.markets.update': {
    methods: ["PUT"]
    pattern: '/admin/markets/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_market_update_validator').adminMarketUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_market_update_validator').adminMarketUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_markets_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_markets_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.markets.bulk.archive.update': {
    methods: ["PUT"]
    pattern: '/admin/markets/bulk/archive'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_markets_bulk_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_markets_bulk_archive_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.markets.archive': {
    methods: ["POST"]
    pattern: '/admin/markets/:id/archive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_markets_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_markets_archive_controller').default['handle']>>>
    }
  }
  'admin.markets.unarchive': {
    methods: ["POST"]
    pattern: '/admin/markets/:id/unarchive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_markets_unarchive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_markets_unarchive_controller').default['handle']>>>
    }
  }
  'admin.taxes.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/taxes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_taxes_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_taxes_home_controller').default['handle']>>>
    }
  }
  'admin.taxes.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/taxes/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_tax_rates_list_query_validator').adminTaxRatesListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_taxes_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_taxes_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.taxes.store': {
    methods: ["POST"]
    pattern: '/admin/taxes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_tax_rate_store_validator').adminTaxRateStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_tax_rate_store_validator').adminTaxRateStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_taxes_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_taxes_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.taxes.update': {
    methods: ["PUT"]
    pattern: '/admin/taxes/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_tax_rate_update_validator').adminTaxRateUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_tax_rate_update_validator').adminTaxRateUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_taxes_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_taxes_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.taxes.bulk.archive.update': {
    methods: ["PUT"]
    pattern: '/admin/taxes/bulk/archive'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_taxes_bulk_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_taxes_bulk_archive_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.taxes.archive': {
    methods: ["POST"]
    pattern: '/admin/taxes/:id/archive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_taxes_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_taxes_archive_controller').default['handle']>>>
    }
  }
  'admin.taxes.unarchive': {
    methods: ["POST"]
    pattern: '/admin/taxes/:id/unarchive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_taxes_unarchive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_taxes_unarchive_controller').default['handle']>>>
    }
  }
  'admin.shipping.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/shipping'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_home_controller').default['handle']>>>
    }
  }
  'admin.shipping.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/shipping/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_shipping_zones_list_query_validator').adminShippingZonesListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.shipping.markets.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/shipping/markets'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_pricing_markets_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_pricing_markets_list_controller').default['handle']>>>
    }
  }
  'admin.shipping.regions.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/shipping/regions'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_regions_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_regions_list_controller').default['handle']>>>
    }
  }
  'admin.shipping.market_countries.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/shipping/market-countries'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_market_countries_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_market_countries_list_controller').default['handle']>>>
    }
  }
  'admin.shipping.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/shipping/view/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_view_controller').default['handle']>>>
    }
  }
  'admin.shipping.store': {
    methods: ["POST"]
    pattern: '/admin/shipping'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_shipping_zone_store_validator').adminShippingZoneStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_shipping_zone_store_validator').adminShippingZoneStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.shipping.edit': {
    methods: ["GET","HEAD"]
    pattern: '/admin/shipping/edit/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_edit_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_edit_controller').default['handle']>>>
    }
  }
  'admin.shipping.update': {
    methods: ["PUT"]
    pattern: '/admin/shipping/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_shipping_zone_update_validator').adminShippingZoneUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_shipping_zone_update_validator').adminShippingZoneUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.shipping.rates.store': {
    methods: ["POST"]
    pattern: '/admin/shipping/:id/rates'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_shipping_rate_store_validator').adminShippingRateStoreValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_shipping_rate_store_validator').adminShippingRateStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_rates_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_rates_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.shipping.rates.update': {
    methods: ["PUT"]
    pattern: '/admin/shipping/:zoneId/rates/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_shipping_rate_params_validator').adminShippingRateParamsValidator)>|InferInput<(typeof import('#validators/admin_shipping_rate_update_validator').adminShippingRateUpdateValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { zoneId: ParamValue; id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_shipping_rate_params_validator').adminShippingRateParamsValidator)>|InferInput<(typeof import('#validators/admin_shipping_rate_update_validator').adminShippingRateUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_rates_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_rates_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.shipping.rates.delete': {
    methods: ["DELETE"]
    pattern: '/admin/shipping/:zoneId/rates/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_shipping_rate_params_validator').adminShippingRateParamsValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { zoneId: ParamValue; id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_shipping_rate_params_validator').adminShippingRateParamsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_rates_delete_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_rates_delete_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.shipping.bulk.archive.update': {
    methods: ["PUT"]
    pattern: '/admin/shipping/bulk/archive'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_bulk_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_bulk_archive_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.shipping.archive': {
    methods: ["POST"]
    pattern: '/admin/shipping/:id/archive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_archive_controller').default['handle']>>>
    }
  }
  'admin.shipping.unarchive': {
    methods: ["POST"]
    pattern: '/admin/shipping/:id/unarchive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_unarchive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_shipping_unarchive_controller').default['handle']>>>
    }
  }
  'admin.customers.home': {
    methods: ["GET","HEAD"]
    pattern: '/admin/customers'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_home_controller').default['handle']>>>
    }
  }
  'admin.customers.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/customers/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_customers_list_query_validator').adminCustomersListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.customers.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/customers/view/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_view_controller').default['handle']>>>
    }
  }
  'admin.customers.edit': {
    methods: ["GET","HEAD"]
    pattern: '/admin/customers/edit/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_edit_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_edit_controller').default['handle']>>>
    }
  }
  'admin.customers.activity.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/customers/:id/activity'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/admin_customer_activity_list_query_validator').adminCustomerActivityListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_customer_activity_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_customer_activity_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.customers.location_options.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/customers/location-options'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_location_options_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_location_options_view_controller').default['handle']>>>
    }
  }
  'admin.customers.filter_options.view': {
    methods: ["GET","HEAD"]
    pattern: '/admin/customers/filter-options'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_filter_options_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_filter_options_view_controller').default['handle']>>>
    }
  }
  'admin.customer_segments.list': {
    methods: ["GET","HEAD"]
    pattern: '/admin/customers/segments/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_customer_segments_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_customer_segments_list_controller').default['handle']>>>
    }
  }
  'admin.customers.impersonation.store': {
    methods: ["POST"]
    pattern: '/admin/customers/:id/impersonate'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_customer_impersonation_store_validator').adminCustomerImpersonationStoreValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_customer_impersonation_store_validator').adminCustomerImpersonationStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_impersonation_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_impersonation_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.customers.create': {
    methods: ["GET","HEAD"]
    pattern: '/admin/customers/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_create_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_create_controller').default['handle']>>>
    }
  }
  'admin.customers.store': {
    methods: ["POST"]
    pattern: '/admin/customers'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_customer_store_validator').adminCustomerStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_customer_store_validator').adminCustomerStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.customers.update': {
    methods: ["PUT"]
    pattern: '/admin/customers/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_customer_update_validator').adminCustomerUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_customer_update_validator').adminCustomerUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.customers.notes.update': {
    methods: ["PUT"]
    pattern: '/admin/customers/:id/notes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_customer_notes_update_validator').adminCustomerNotesUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_customer_notes_update_validator').adminCustomerNotesUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_notes_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_notes_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.customers.marketing.update': {
    methods: ["PUT"]
    pattern: '/admin/customers/:id/marketing'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_customer_marketing_update_validator').adminCustomerMarketingUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_customer_marketing_update_validator').adminCustomerMarketingUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_marketing_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_marketing_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.customer_segments.store': {
    methods: ["POST"]
    pattern: '/admin/customers/segments'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_customer_segment_store_validator').adminCustomerSegmentStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_customer_segment_store_validator').adminCustomerSegmentStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_customer_segments_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_customer_segments_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.customer_segments.update': {
    methods: ["PUT"]
    pattern: '/admin/customers/segments/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_customer_segment_update_validator').adminCustomerSegmentUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_customer_segment_update_validator').adminCustomerSegmentUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_customer_segments_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_customer_segments_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.customer_segments.delete': {
    methods: ["DELETE"]
    pattern: '/admin/customers/segments/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_customer_segments_delete_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_customer_segments_delete_controller').default['handle']>>>
    }
  }
  'admin.customers.addresses.store': {
    methods: ["POST"]
    pattern: '/admin/customers/:id/addresses'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_customer_address_store_validator').adminCustomerAddressStoreValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_customer_address_store_validator').adminCustomerAddressStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_customer_addresses_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_customer_addresses_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.customers.addresses.update': {
    methods: ["PUT"]
    pattern: '/admin/customers/:customerId/addresses/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_customer_address_params_validator').adminCustomerAddressParamsValidator)>|InferInput<(typeof import('#validators/admin_customer_address_update_validator').adminCustomerAddressUpdateValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { customerId: ParamValue; id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_customer_address_params_validator').adminCustomerAddressParamsValidator)>|InferInput<(typeof import('#validators/admin_customer_address_update_validator').adminCustomerAddressUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_customer_addresses_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_customer_addresses_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.customers.addresses.delete': {
    methods: ["DELETE"]
    pattern: '/admin/customers/:customerId/addresses/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_customer_address_params_validator').adminCustomerAddressParamsValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { customerId: ParamValue; id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_customer_address_params_validator').adminCustomerAddressParamsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_customer_addresses_delete_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_customer_addresses_delete_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.customers.bulk.archive.update': {
    methods: ["PUT"]
    pattern: '/admin/customers/bulk/archive'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_bulk_archive_validator').adminBulkArchiveValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_bulk_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_bulk_archive_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.customers.archive': {
    methods: ["POST"]
    pattern: '/admin/customers/:id/archive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_archive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_archive_controller').default['handle']>>>
    }
  }
  'admin.customers.unarchive': {
    methods: ["POST"]
    pattern: '/admin/customers/:id/unarchive'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_unarchive_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_customers_unarchive_controller').default['handle']>>>
    }
  }
  'admin.roles.store': {
    methods: ["POST"]
    pattern: '/admin/roles'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_role_store_validator').adminRoleStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_role_store_validator').adminRoleStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_roles_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_roles_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.roles.update': {
    methods: ["PUT"]
    pattern: '/admin/roles/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_role_update_validator').adminRoleUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_role_update_validator').adminRoleUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_roles_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_roles_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'admin.roles.delete': {
    methods: ["DELETE"]
    pattern: '/admin/roles/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_roles_delete_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_roles_delete_controller').default['handle']>>>
    }
  }
  'admin.roles.permissions.update': {
    methods: ["PUT"]
    pattern: '/admin/roles/:id/permissions'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/admin_role_permission_update_validator').adminRolePermissionUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/admin_role_permission_update_validator').adminRolePermissionUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/admin/admin_role_permissions_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/admin/admin_role_permissions_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storefront.sitemap.view': {
    methods: ["GET","HEAD"]
    pattern: '/sitemap.xml'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_sitemap_show_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_sitemap_show_controller').default['handle']>>>
    }
  }
  'storefront.robots.view': {
    methods: ["GET","HEAD"]
    pattern: '/robots.txt'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_robots_show_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_robots_show_controller').default['handle']>>>
    }
  }
  'storefront.settings.view': {
    methods: ["GET","HEAD"]
    pattern: '/store/settings'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_settings_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_settings_view_controller').default['handle']>>>
    }
  }
  'storefront.theme.view': {
    methods: ["GET","HEAD"]
    pattern: '/store/theme'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_theme_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_theme_view_controller').default['handle']>>>
    }
  }
  'storefront.menu.list': {
    methods: ["GET","HEAD"]
    pattern: '/store/menu'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_menu_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_menu_list_controller').default['handle']>>>
    }
  }
  'storefront.hero_slides.list': {
    methods: ["GET","HEAD"]
    pattern: '/store/hero-slides'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_hero_slides_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_hero_slides_list_controller').default['handle']>>>
    }
  }
  'storefront.plugins.list': {
    methods: ["GET","HEAD"]
    pattern: '/store/plugins'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_plugins_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_plugins_list_controller').default['handle']>>>
    }
  }
  'storefront.home_content.view': {
    methods: ["GET","HEAD"]
    pattern: '/store/home-content'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_home_content_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_home_content_view_controller').default['handle']>>>
    }
  }
  'storefront.home.view': {
    methods: ["GET","HEAD"]
    pattern: '/store/home'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_home_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_home_view_controller').default['handle']>>>
    }
  }
  'storefront.collections.show': {
    methods: ["GET","HEAD"]
    pattern: '/collections/:slug'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { slug: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_collections_show_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_collections_show_controller').default['handle']>>>
    }
  }
  'storefront.catalog_token.view': {
    methods: ["GET","HEAD"]
    pattern: '/store/catalog-token'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_catalog_token_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_catalog_token_view_controller').default['handle']>>>
    }
  }
  'storefront.collections.view': {
    methods: ["GET","HEAD"]
    pattern: '/store/collections/view/:slug'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { slug: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_collections_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_collections_view_controller').default['handle']>>>
    }
  }
  'storefront.collections.products.list': {
    methods: ["GET","HEAD"]
    pattern: '/store/collections/:slug/products'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { slug: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/storefront_collection_products_query_validator').storefrontCollectionProductsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_collection_products_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_collection_products_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storefront.collections.filters.list': {
    methods: ["GET","HEAD"]
    pattern: '/store/collections/:slug/filters'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { slug: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_collection_filters_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_collection_filters_list_controller').default['handle']>>>
    }
  }
  'storefront.pages.show': {
    methods: ["GET","HEAD"]
    pattern: '/pages/:slug'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { slug: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_pages_show_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_pages_show_controller').default['handle']>>>
    }
  }
  'storefront.pages.view': {
    methods: ["GET","HEAD"]
    pattern: '/store/pages/view/:slug'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { slug: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_pages_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_pages_view_controller').default['handle']>>>
    }
  }
  'storefront.policies.list': {
    methods: ["GET","HEAD"]
    pattern: '/store/policies'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_policies_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_policies_list_controller').default['handle']>>>
    }
  }
  'storefront.help.home': {
    methods: ["GET","HEAD"]
    pattern: '/help'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_help_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_help_home_controller').default['handle']>>>
    }
  }
  'storefront.help.categories.show': {
    methods: ["GET","HEAD"]
    pattern: '/help/:category'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { category: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_help_categories_show_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_help_categories_show_controller').default['handle']>>>
    }
  }
  'storefront.help.articles.show': {
    methods: ["GET","HEAD"]
    pattern: '/help/:category/:slug'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { category: ParamValue; slug: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_help_articles_show_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_help_articles_show_controller').default['handle']>>>
    }
  }
  'storefront.help.categories.list': {
    methods: ["GET","HEAD"]
    pattern: '/store/help/categories'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_help_categories_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_help_categories_list_controller').default['handle']>>>
    }
  }
  'storefront.help.categories.view': {
    methods: ["GET","HEAD"]
    pattern: '/store/help/categories/view/:category'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { category: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_help_categories_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_help_categories_view_controller').default['handle']>>>
    }
  }
  'storefront.help.articles.view': {
    methods: ["GET","HEAD"]
    pattern: '/store/help/articles/view/:category/:slug'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { category: ParamValue; slug: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_help_articles_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_help_articles_view_controller').default['handle']>>>
    }
  }
  'storefront.help.search.list': {
    methods: ["GET","HEAD"]
    pattern: '/store/help/search'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/storefront_help_search_query_validator').storefrontHelpSearchQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_help_search_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_help_search_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storefront.products.show': {
    methods: ["GET","HEAD"]
    pattern: '/products/:slug'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { slug: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_products_show_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_products_show_controller').default['handle']>>>
    }
  }
  'storefront.products.view': {
    methods: ["GET","HEAD"]
    pattern: '/store/products/view/:slug'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { slug: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_products_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_products_view_controller').default['handle']>>>
    }
  }
  'storefront.products.reviews.list': {
    methods: ["GET","HEAD"]
    pattern: '/store/products/:slug/reviews'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { slug: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/storefront_product_reviews_query_validator').storefrontProductReviewsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_product_reviews_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_product_reviews_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storefront.products.reviews.summary': {
    methods: ["GET","HEAD"]
    pattern: '/store/products/:slug/reviews/summary'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { slug: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_product_reviews_summary_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_product_reviews_summary_controller').default['handle']>>>
    }
  }
  'storefront.search.list': {
    methods: ["GET","HEAD"]
    pattern: '/store/search'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/storefront_search_query_validator').storefrontSearchQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_search_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_search_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storefront.session.view': {
    methods: ["GET","HEAD"]
    pattern: '/store/session'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_session_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_session_view_controller').default['handle']>>>
    }
  }
  'storefront.market.view': {
    methods: ["GET","HEAD"]
    pattern: '/store/market'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_market_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_market_view_controller').default['handle']>>>
    }
  }
  'storefront.market.update': {
    methods: ["PUT"]
    pattern: '/store/market'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/storefront_market_update_validator').storefrontMarketUpdateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/storefront_market_update_validator').storefrontMarketUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_market_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_market_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storefront.cart.prices.update': {
    methods: ["POST"]
    pattern: '/store/cart/prices'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/storefront_cart_prices_validator').storefrontCartPricesValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/storefront_cart_prices_validator').storefrontCartPricesValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_cart_prices_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_cart_prices_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storefront.analytics.events.store': {
    methods: ["POST"]
    pattern: '/store/analytics/events'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/storefront_analytics_event_store_validator').storefrontAnalyticsEventStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/storefront_analytics_event_store_validator').storefrontAnalyticsEventStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_analytics_events_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_analytics_events_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storefront.newsletter.store': {
    methods: ["POST"]
    pattern: '/newsletter'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/storefront_newsletter_store_validator').storefrontNewsletterStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/storefront_newsletter_store_validator').storefrontNewsletterStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_newsletter_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_newsletter_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storefront.maintenance.newsletter.store': {
    methods: ["POST"]
    pattern: '/maintenance/newsletter'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/storefront_newsletter_store_validator').storefrontNewsletterStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/storefront_newsletter_store_validator').storefrontNewsletterStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_maintenance_newsletter_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_maintenance_newsletter_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storefront.support.chat.view': {
    methods: ["GET","HEAD"]
    pattern: '/store/support/chat'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/storefront_support_chat_query_validator').storefrontSupportChatQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_support_chat_ask_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_support_chat_ask_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storefront.support.tickets.store': {
    methods: ["POST"]
    pattern: '/support/tickets'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/storefront_support_ticket_store_validator').storefrontSupportTicketStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/storefront_support_ticket_store_validator').storefrontSupportTicketStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_support_tickets_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_support_tickets_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storefront.support.tickets.show': {
    methods: ["GET","HEAD"]
    pattern: '/support/tickets/:token'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_support_tickets_show_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_support_tickets_show_controller').default['handle']>>>
    }
  }
  'storefront.support.tickets.view': {
    methods: ["GET","HEAD"]
    pattern: '/store/support/tickets/view/:token'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_support_tickets_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_support_tickets_view_controller').default['handle']>>>
    }
  }
  'storefront.support.tickets.messages.store': {
    methods: ["POST"]
    pattern: '/support/tickets/:token/messages'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/support_ticket_reply_store_validator').supportTicketReplyStoreValidator)>>
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/support_ticket_reply_store_validator').supportTicketReplyStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_support_ticket_messages_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_support_ticket_messages_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storefront.brand.favicon.view': {
    methods: ["GET","HEAD"]
    pattern: '/brand/favicons/:file'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { file: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/brand_favicon_show_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/brand_favicon_show_controller').default['handle']>>>
    }
  }
  'storefront.brand.manifest.view': {
    methods: ["GET","HEAD"]
    pattern: '/brand/manifest.json'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/brand_manifest_show_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/brand_manifest_show_controller').default['handle']>>>
    }
  }
  'storefront.places.autocomplete.list': {
    methods: ["GET","HEAD"]
    pattern: '/places/autocomplete'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/places_autocomplete_query_validator').placesAutocompleteQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/places_autocomplete_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/places_autocomplete_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storefront.places.details.view': {
    methods: ["GET","HEAD"]
    pattern: '/places/details/:placeId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { placeId: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/places_details_query_validator').placesDetailsQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/places_details_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/places_details_view_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'stripe.webhook': {
    methods: ["POST"]
    pattern: '/stripe/webhook'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/stripe_webhook_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/stripe_webhook_controller').default['handle']>>>
    }
  }
  'poli.nudge': {
    methods: ["POST"]
    pattern: '/poli/nudge'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/poli_nudge_validator').poliNudgeValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/poli_nudge_validator').poliNudgeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/poli_nudge_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/poli_nudge_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storefront.impersonation.delete': {
    methods: ["DELETE"]
    pattern: '/impersonation'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_impersonation_delete_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_impersonation_delete_controller').default['handle']>>>
    }
  }
  'storefront.checkout.home': {
    methods: ["GET","HEAD"]
    pattern: '/checkout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_checkout_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_checkout_home_controller').default['handle']>>>
    }
  }
  'storefront.checkout.store': {
    methods: ["POST"]
    pattern: '/checkout'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/checkout_store_validator').checkoutStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/checkout_store_validator').checkoutStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_checkout_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_checkout_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storefront.checkout.quote': {
    methods: ["POST"]
    pattern: '/checkout/quote'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/checkout_quote_validator').checkoutQuoteValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/checkout_quote_validator').checkoutQuoteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_checkout_quote_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_checkout_quote_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storefront.checkout.addresses.list': {
    methods: ["GET","HEAD"]
    pattern: '/checkout/addresses'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_checkout_addresses_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_checkout_addresses_list_controller').default['handle']>>>
    }
  }
  'storefront.checkout.payment_methods.list': {
    methods: ["GET","HEAD"]
    pattern: '/checkout/payment-methods'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_checkout_payment_methods_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_checkout_payment_methods_list_controller').default['handle']>>>
    }
  }
  'storefront.checkout.show': {
    methods: ["GET","HEAD"]
    pattern: '/checkout/thank-you/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/checkout_show_query_validator').checkoutShowQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_checkout_show_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_checkout_show_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storefront.checkout.orders.view': {
    methods: ["GET","HEAD"]
    pattern: '/checkout/orders/view/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_checkout_order_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_checkout_order_view_controller').default['handle']>>>
    }
  }
  'storefront.checkout.orders.invoice.view': {
    methods: ["GET","HEAD"]
    pattern: '/checkout/orders/:id/invoice'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_checkout_order_invoice_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_checkout_order_invoice_view_controller').default['handle']>>>
    }
  }
  'storefront.checkout.orders.receipt.view': {
    methods: ["GET","HEAD"]
    pattern: '/checkout/orders/:id/receipt'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_checkout_order_receipt_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_checkout_order_receipt_view_controller').default['handle']>>>
    }
  }
  'storefront.checkout.orders.payment.store': {
    methods: ["POST"]
    pattern: '/checkout/orders/:id/payment'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_checkout_payment_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_checkout_payment_store_controller').default['handle']>>>
    }
  }
  'storefront.checkout.orders.stripe_return': {
    methods: ["GET","HEAD"]
    pattern: '/checkout/orders/:id/stripe-return'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/checkout_stripe_return_validator').checkoutStripeReturnValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_checkout_stripe_return_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_checkout_stripe_return_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storefront.checkout.orders.poli_return': {
    methods: ["GET","HEAD"]
    pattern: '/checkout/orders/:id/poli-return'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/checkout_poli_return_validator').checkoutPoliReturnValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_checkout_poli_return_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront/storefront_checkout_poli_return_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.registration.create': {
    methods: ["GET","HEAD"]
    pattern: '/signup'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_registration_create_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_registration_create_controller').default['handle']>>>
    }
  }
  'customers.registration.store': {
    methods: ["POST"]
    pattern: '/signup'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/customer_register_validator').customerRegisterValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/customer_register_validator').customerRegisterValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_registration_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_registration_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.registration.verify.create': {
    methods: ["GET","HEAD"]
    pattern: '/signup/verify'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_registration_verify_create_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_registration_verify_create_controller').default['handle']>>>
    }
  }
  'customers.registration.verify.view': {
    methods: ["GET","HEAD"]
    pattern: '/signup/verify/view'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_registration_verify_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_registration_verify_view_controller').default['handle']>>>
    }
  }
  'customers.registration.verify.store': {
    methods: ["POST"]
    pattern: '/signup/verify'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/customer_verification_code_validator').customerVerificationCodeValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/customer_verification_code_validator').customerVerificationCodeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_registration_verify_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_registration_verify_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.registration.verify.resend.store': {
    methods: ["POST"]
    pattern: '/signup/verify/resend'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_registration_verify_resend_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_registration_verify_resend_store_controller').default['handle']>>>
    }
  }
  'customers.session.create': {
    methods: ["GET","HEAD"]
    pattern: '/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_session_create_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_session_create_controller').default['handle']>>>
    }
  }
  'customers.session.store': {
    methods: ["POST"]
    pattern: '/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/customer_login_validator').customerLoginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/customer_login_validator').customerLoginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_session_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_session_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.social.redirect': {
    methods: ["GET","HEAD"]
    pattern: '/:provider/oauth/redirect/:intent'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { provider: ParamValue; intent: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/customer_social_redirect_validator').customerSocialRedirectValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_social_redirect_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_social_redirect_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.social.callback': {
    methods: ["GET","HEAD"]
    pattern: '/:provider/oauth/callback'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { provider: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/customer_social_provider_validator').customerSocialProviderValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_social_callback_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_social_callback_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.password.forgot.create': {
    methods: ["GET","HEAD"]
    pattern: '/forgot-password'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_password_forgot_create_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_password_forgot_create_controller').default['handle']>>>
    }
  }
  'customers.password.forgot.store': {
    methods: ["POST"]
    pattern: '/forgot-password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/customer_forgot_password_validator').customerForgotPasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/customer_forgot_password_validator').customerForgotPasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_password_forgot_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_password_forgot_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.password.reset.create': {
    methods: ["GET","HEAD"]
    pattern: '/reset-password'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_password_reset_create_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_password_reset_create_controller').default['handle']>>>
    }
  }
  'customers.password.reset.view': {
    methods: ["GET","HEAD"]
    pattern: '/reset-password/view'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_password_reset_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_password_reset_view_controller').default['handle']>>>
    }
  }
  'customers.password.reset.store': {
    methods: ["POST"]
    pattern: '/reset-password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/customer_reset_password_validator').customerResetPasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/customer_reset_password_validator').customerResetPasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_password_reset_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_password_reset_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.password.reset.resend.store': {
    methods: ["POST"]
    pattern: '/reset-password/resend'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_password_reset_resend_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_password_reset_resend_store_controller').default['handle']>>>
    }
  }
  'customers.session.delete': {
    methods: ["POST"]
    pattern: '/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_session_delete_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_session_delete_controller').default['handle']>>>
    }
  }
  'customers.account.view': {
    methods: ["GET","HEAD"]
    pattern: '/account/me'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_view_controller').default['handle']>>>
    }
  }
  'customers.account.welcome.create': {
    methods: ["GET","HEAD"]
    pattern: '/account/welcome'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_welcome_create_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_welcome_create_controller').default['handle']>>>
    }
  }
  'customers.account.location.options.view': {
    methods: ["GET","HEAD"]
    pattern: '/account/location/options'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_location_options_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_location_options_view_controller').default['handle']>>>
    }
  }
  'customers.account.location.update': {
    methods: ["PUT"]
    pattern: '/account/location'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/customers_account_location_update_validator').customersAccountLocationUpdateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/customers_account_location_update_validator').customersAccountLocationUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_location_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_location_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.account.wishlist.ids.view': {
    methods: ["GET","HEAD"]
    pattern: '/account/wishlist/ids'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_wishlist_ids_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_wishlist_ids_view_controller').default['handle']>>>
    }
  }
  'customers.account.wishlist.store': {
    methods: ["POST"]
    pattern: '/account/wishlist'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/customers_account_wishlist_store_validator').customersAccountWishlistStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/customers_account_wishlist_store_validator').customersAccountWishlistStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_wishlist_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_wishlist_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.account.wishlist.delete': {
    methods: ["DELETE"]
    pattern: '/account/wishlist/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_wishlist_delete_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_wishlist_delete_controller').default['handle']>>>
    }
  }
  'customers.account.home': {
    methods: ["GET","HEAD"]
    pattern: '/account'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_home_controller').default['handle']>>>
    }
  }
  'customers.account.orders.home': {
    methods: ["GET","HEAD"]
    pattern: '/account/orders'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_orders_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_orders_home_controller').default['handle']>>>
    }
  }
  'customers.account.orders.list': {
    methods: ["GET","HEAD"]
    pattern: '/account/orders/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/customers_account_orders_list_query_validator').customersAccountOrdersListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_orders_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_orders_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.account.orders.view': {
    methods: ["GET","HEAD"]
    pattern: '/account/orders/view/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_orders_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_orders_view_controller').default['handle']>>>
    }
  }
  'customers.account.orders.show': {
    methods: ["GET","HEAD"]
    pattern: '/account/orders/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_orders_show_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_orders_show_controller').default['handle']>>>
    }
  }
  'customers.account.orders.returns.list': {
    methods: ["GET","HEAD"]
    pattern: '/account/orders/:id/returns'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_order_returns_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_order_returns_list_controller').default['handle']>>>
    }
  }
  'customers.account.orders.notes.list': {
    methods: ["GET","HEAD"]
    pattern: '/account/orders/:id/notes/list'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_order_notes_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_order_notes_list_controller').default['handle']>>>
    }
  }
  'customers.account.orders.notes.store': {
    methods: ["POST"]
    pattern: '/account/orders/:id/notes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/customers_order_note_reply_store_validator').customersOrderNoteReplyStoreValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/customers_order_note_reply_store_validator').customersOrderNoteReplyStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_order_notes_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_order_notes_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.account.orders.returns.store': {
    methods: ["POST"]
    pattern: '/account/orders/:id/returns'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/customers_order_return_store_validator').customersOrderReturnStoreValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/customers_order_return_store_validator').customersOrderReturnStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_order_returns_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_order_returns_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.account.orders.payment_proof.store': {
    methods: ["POST"]
    pattern: '/account/orders/:id/payment-proof'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/customers_order_payment_proof_store_validator').customersOrderPaymentProofStoreValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/customers_order_payment_proof_store_validator').customersOrderPaymentProofStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_order_payment_proof_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_order_payment_proof_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.account.orders.payment_proof.image.view': {
    methods: ["GET","HEAD"]
    pattern: '/account/orders/:id/payment-proof/image'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_order_payment_proof_image_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_order_payment_proof_image_view_controller').default['handle']>>>
    }
  }
  'customers.account.orders.invoice.view': {
    methods: ["GET","HEAD"]
    pattern: '/account/orders/:id/invoice'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_order_invoice_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_order_invoice_view_controller').default['handle']>>>
    }
  }
  'customers.account.orders.receipt.view': {
    methods: ["GET","HEAD"]
    pattern: '/account/orders/:id/receipt'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_order_receipt_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_order_receipt_view_controller').default['handle']>>>
    }
  }
  'customers.account.addresses.home': {
    methods: ["GET","HEAD"]
    pattern: '/account/addresses'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_addresses_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_addresses_home_controller').default['handle']>>>
    }
  }
  'customers.account.addresses.list': {
    methods: ["GET","HEAD"]
    pattern: '/account/addresses/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_addresses_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_addresses_list_controller').default['handle']>>>
    }
  }
  'customers.account.addresses.store': {
    methods: ["POST"]
    pattern: '/account/addresses'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/customers_account_address_store_validator').customersAccountAddressStoreValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/customers_account_address_store_validator').customersAccountAddressStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_addresses_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_addresses_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.account.addresses.update': {
    methods: ["PUT"]
    pattern: '/account/addresses/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/customers_account_address_update_validator').customersAccountAddressUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/customers_account_address_update_validator').customersAccountAddressUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_addresses_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_addresses_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.account.addresses.delete': {
    methods: ["DELETE"]
    pattern: '/account/addresses/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_addresses_delete_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_addresses_delete_controller').default['handle']>>>
    }
  }
  'customers.account.details.home': {
    methods: ["GET","HEAD"]
    pattern: '/account/details'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_details_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_details_home_controller').default['handle']>>>
    }
  }
  'customers.account.details.update': {
    methods: ["PUT"]
    pattern: '/account/details'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/customers_account_details_update_validator').customersAccountDetailsUpdateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/customers_account_details_update_validator').customersAccountDetailsUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_details_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_details_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.account.marketing.update': {
    methods: ["PUT"]
    pattern: '/account/marketing'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/customers_account_marketing_update_validator').customersAccountMarketingUpdateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/customers_account_marketing_update_validator').customersAccountMarketingUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_marketing_update_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_marketing_update_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.account.activity.home': {
    methods: ["GET","HEAD"]
    pattern: '/account/activity'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_activity_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_activity_home_controller').default['handle']>>>
    }
  }
  'customers.account.activity.list': {
    methods: ["GET","HEAD"]
    pattern: '/account/activity/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/customers_account_activity_list_query_validator').customersAccountActivityListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_activity_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_activity_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.account.support.home': {
    methods: ["GET","HEAD"]
    pattern: '/account/support'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_support_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_support_home_controller').default['handle']>>>
    }
  }
  'customers.account.support.list': {
    methods: ["GET","HEAD"]
    pattern: '/account/support/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/customers_account_support_list_query_validator').customersAccountSupportListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_support_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_support_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.account.support.view': {
    methods: ["GET","HEAD"]
    pattern: '/account/support/view/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_support_view_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_support_view_controller').default['handle']>>>
    }
  }
  'customers.account.support.show': {
    methods: ["GET","HEAD"]
    pattern: '/account/support/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_support_show_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_support_show_controller').default['handle']>>>
    }
  }
  'customers.account.support.messages.store': {
    methods: ["POST"]
    pattern: '/account/support/:id/messages'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/support_ticket_reply_store_validator').supportTicketReplyStoreValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/support_ticket_reply_store_validator').supportTicketReplyStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_support_messages_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_support_messages_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.account.wishlist.home': {
    methods: ["GET","HEAD"]
    pattern: '/account/wishlist'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_wishlist_home_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_wishlist_home_controller').default['handle']>>>
    }
  }
  'customers.account.wishlist.list': {
    methods: ["GET","HEAD"]
    pattern: '/account/wishlist/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/customers_account_wishlist_list_query_validator').customersAccountWishlistListQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_wishlist_list_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_account_wishlist_list_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'customers.product_reviews.store': {
    methods: ["POST"]
    pattern: '/store/products/:slug/reviews'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/customers_product_review_store_validator').customersProductReviewStoreValidator)>>
      paramsTuple: [ParamValue]
      params: { slug: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/customers_product_review_store_validator').customersProductReviewStoreValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/customers/customers_product_reviews_store_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/customers/customers_product_reviews_store_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
}
