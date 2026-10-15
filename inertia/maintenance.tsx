import './lib/csp_style_patch'
import './css/app.css'
import type { ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { http } from './lib/http'
import { createQueryClient } from './lib/query_client'
import { StorefrontPluginsResponseSchema } from './pages/_types'

const modules = import.meta.glob<{ default: ComponentType }>(
  '../plugins/*/client/maintenance.tsx',
  { eager: true }
)

/**
 * Mounts installed plugins' `client/maintenance.tsx` (e.g. the newsletter
 * form) on the maintenance page (`resources/views/maintenance.edge`), which
 * is plain HTML, not Inertia.
 */
async function mount(root: HTMLElement) {
  const { data } = await http('/store/plugins', { schema: StorefrontPluginsResponseSchema })
  const installed = new Set(data.map((plugin) => plugin.key))
  const components = Object.entries(modules)
    .filter(([path]) => installed.has(path.match(/\/plugins\/([^/]+)\//)?.[1] ?? ''))
    .map(([path, module]) => [path, module.default] as const)
  if (components.length === 0) return

  createRoot(root).render(
    <QueryClientProvider client={createQueryClient()}>
      {components.map(([path, Component]) => (
        <Component key={path} />
      ))}
    </QueryClientProvider>
  )
}

const root = document.getElementById('newsletter-root')

if (root) mount(root).catch(() => {})
