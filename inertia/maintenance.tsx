import './lib/csp_style_patch'
import './css/app.css'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import NewsletterForm from './components/storefront/newsletter_form'
import { createQueryClient } from './lib/query_client'

/**
 * Mounts the shared newsletter form on the maintenance page
 * (`resources/views/maintenance.edge`), which is plain HTML, not Inertia.
 */
const root = document.getElementById('newsletter-root')

if (root) {
  createRoot(root).render(
    <QueryClientProvider client={createQueryClient()}>
      <NewsletterForm variant="maintenance" />
    </QueryClientProvider>
  )
}
