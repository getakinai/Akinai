import { definePlugin } from '#plugin_host/types'
import manifest from './manifest.js'
import { admin, storefront } from './server/routes.js'

export default definePlugin({
  manifest,
  routes: { admin, storefront },
})
