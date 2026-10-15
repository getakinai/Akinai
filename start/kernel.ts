/*
|--------------------------------------------------------------------------
| HTTP kernel file
|--------------------------------------------------------------------------
|
| The HTTP kernel file is used to register the middleware with the server
| or the router.
|
*/

import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'

/**
 * The error handler is used to convert an exception
 * to a HTTP response.
 */
server.errorHandler(() => import('#exceptions/handler'))

/**
 * The server middleware stack runs middleware on all the HTTP
 * requests, even if there is no route registered for
 * the request URL.
 */
server.use([
  () => import('#middleware/container_bindings_middleware'),
  () => import('#middleware/hide_server_bundle_middleware'),
  () => import('@adonisjs/static/static_middleware'),
  () => import('@adonisjs/cors/cors_middleware'),
  () => import('@adonisjs/vite/vite_middleware'),
  () => import('#middleware/maintenance_middleware'),
  () => import('#middleware/inertia_middleware'),
])

/**
 * The router middleware stack runs middleware on all the HTTP
 * requests with a registered route.
 */
router.use([
  () => import('@adonisjs/core/bodyparser_middleware'),
  () => import('@adonisjs/session/session_middleware'),
  () => import('@adonisjs/shield/shield_middleware'),
  () => import('@adonisjs/auth/initialize_auth_middleware'),
  () => import('#middleware/silent_auth_middleware'),
  () => import('#middleware/customer_session_version_middleware'),
  () => import('#middleware/user_session_version_middleware'),
  () => import('#middleware/maintenance_gate_middleware'),
  () => import('#middleware/uuid_route_param_middleware'),
  () => import('#middleware/initialize_bouncer_middleware'),
])

/**
 * Named middleware collection must be explicitly assigned to
 * the routes or the routes group.
 */
export const middleware = router.named({
  guest: () => import('#middleware/guest_middleware'),
  auth: () => import('#middleware/auth_middleware'),
  can: () => import('#middleware/permission_middleware'),
  requireMfa: () => import('#middleware/require_mfa_middleware'),
  customerOwns: () => import('#middleware/customer_owns_middleware'),
  auditActor: () => import('#middleware/audit_actor_middleware'),
  customerAuditActor: () => import('#middleware/customer_audit_actor_middleware'),
  customerProfileComplete: () => import('#middleware/customer_profile_complete_middleware'),
  recaptcha: () => import('#middleware/recaptcha_middleware'),
  catalogToken: () => import('#middleware/catalog_token_middleware'),
  plugin: () => import('#middleware/plugin_installed_middleware'),
})
