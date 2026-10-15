import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import adonisjs from '@adonisjs/vite/client'

export default defineConfig(({ mode }) => ({
  define: {
    // Keep the fallback in sync with DEFAULT_APP_NAME in config/brand.ts.
    'import.meta.env.VITE_APP_NAME': JSON.stringify(
      process.env.APP_NAME || loadEnv(mode, import.meta.dirname, '').APP_NAME || 'Storefront'
    ),
  },

  plugins: [
    react(),
    tailwindcss(),
    adonisjs({
      entryPoints: ['inertia/app.tsx', 'inertia/maintenance.tsx', 'inertia/islands.tsx'],
      serverEntryPoints: ['inertia/ssr.tsx'],
      reload: ['resources/views/**/*.edge'],
    }),
  ],

  /**
   * Define aliases for importing modules from
   * your frontend code
   */
  resolve: {
    alias: {
      '~/': `${import.meta.dirname}/inertia/`,
      '@plugins/': `${import.meta.dirname}/plugins/`,
      '@generated': `${import.meta.dirname}/.adonisjs/client/`,
    },
  },

  server: {
    watch: {
      ignored: ['**/storage/**', '**/tmp/**'],
    },
  },
}))
