import { defineConfig } from '@adonisjs/inertia'

const inertiaConfig = defineConfig({
  /**
   * Server-side rendering options.
   */
  ssr: {
    /**
     * Toggle SSR mode for Inertia pages.
     */
    enabled: true,

    /**
     * Public storefront pages crawlers index. Their shells pass a `prefetch`
     * prop (StorefrontPrefetchService) so the server render has real
     * content. Keep in sync with the page glob in `inertia/ssr.tsx`.
     */
    pages: ['home', 'products/show', 'collections/show', 'pages/show'],

    /**
     * Entry file used by the SSR server build.
     */
    entrypoint: 'inertia/ssr.tsx',
  },
})

export default inertiaConfig
