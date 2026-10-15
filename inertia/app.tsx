import './lib/csp_style_patch'
import './css/app.css'
import { client } from './client'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { TuyauProvider } from '@adonisjs/inertia/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react'
import { createQueryClient } from './lib/query_client'
import { APP_NAME } from './lib/brand'
import { seedStorefrontQueries } from './pages/_hooks'

const queryClient = createQueryClient()
const cspNonce =
  document.querySelector<HTMLMetaElement>('meta[property=csp-nonce]')?.nonce || undefined

createInertiaApp({
  title: (title) => (title ? `${title} - ${APP_NAME}` : APP_NAME),
  resolve: async (name) => {
    const page = await resolvePageComponent(
      `./pages/${name}.tsx`,
      import.meta.glob<{ default: ResolvedComponent }>('./pages/**/*.tsx')
    )
    return page.default
  },
  setup({ el, App, props }) {
    seedStorefrontQueries(queryClient, props.initialPage.props)
    const app = (
      <QueryClientProvider client={queryClient}>
        <TuyauProvider client={client}>
          <App {...props} />
        </TuyauProvider>
      </QueryClientProvider>
    )
    if (el.hasAttribute('data-server-rendered')) hydrateRoot(el, app)
    else createRoot(el).render(app)
  },
  nonce: cspNonce,
  progress: {
    color: '#4B5563',
  },
})
