import { client } from '~/client'
import ReactDOMServer from 'react-dom/server'
import { QueryClientProvider } from '@tanstack/react-query'
import { TuyauProvider } from '@adonisjs/inertia/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react'
import { APP_NAME } from '~/lib/brand'
import { createQueryClient } from '~/lib/query_client'
import { setServerSanitizer } from '~/lib/sanitize_html'
import { sanitizeHtmlOnServer } from '~/lib/sanitize_html_server'
import { seedStorefrontQueries } from '~/pages/_hooks'

setServerSanitizer(sanitizeHtmlOnServer)

/** Keep in sync with `ssr.pages` in `config/inertia.ts`. */
const pages = import.meta.glob<{ default: ResolvedComponent }>(
  [
    './pages/home.tsx',
    './pages/products/show.tsx',
    './pages/collections/show.tsx',
    './pages/pages/show.tsx',
  ],
  { eager: true }
)

/** What `@inertia()` prints without SSR; the browser then renders the page itself. */
function clientRenderedBody(page: unknown) {
  const json = JSON.stringify(page).replace(/\//g, '\\/').replace(/</g, '\\u003c')
  return `<script data-page="app" type="application/json">${json}</script><div id="app"></div>`
}

/** A page that fails to render on the server falls back to client rendering instead of a 500. */
export default async function render(page: any) {
  try {
    return await renderOnServer(page)
  } catch (error) {
    console.error(`SSR failed for ${page?.component}; falling back to client rendering`, error)
    return { head: [], body: clientRenderedBody(page) }
  }
}

function renderOnServer(page: any) {
  return createInertiaApp({
    page,
    render: ReactDOMServer.renderToString,
    title: (title) => (title ? `${title} - ${APP_NAME}` : APP_NAME),
    resolve: async (name) => {
      const resolvedPage = await resolvePageComponent(`./pages/${name}.tsx`, pages)
      return resolvedPage.default
    },
    setup: ({ App, props }) => {
      const queryClient = createQueryClient()
      seedStorefrontQueries(queryClient, props.initialPage.props)
      return (
        <QueryClientProvider client={queryClient}>
          <TuyauProvider client={client}>
            <App {...props} />
          </TuyauProvider>
        </QueryClientProvider>
      )
    },
  })
}
