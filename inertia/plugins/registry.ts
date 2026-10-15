import type { PluginClientEntry } from './types'

const modules = import.meta.glob<{ default: PluginClientEntry }>(
  '../../plugins/*/client/index.tsx',
  { eager: true }
)

/**
 * Storefront components of bundled plugins, keyed by folder name. Must match
 * each plugin manifest key in plugins/<key>/manifest.ts.
 */
export const pluginRegistry: Record<string, PluginClientEntry> = Object.fromEntries(
  Object.entries(modules).map(([path, module]) => {
    const key = path.split('/')[2]
    return [key, module.default]
  })
)
