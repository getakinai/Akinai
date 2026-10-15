import type { PluginClientEntry } from './types'

const modules = import.meta.glob<{ default: PluginClientEntry }>(
  '../../plugins/*/client/index.tsx',
  { eager: true }
)

/**
 * Storefront components of bundled plugins, keyed by folder name. Must match
 * each plugin manifest key in plugins/<key>/manifest.ts.
 */
function pluginKeyFromClientPath(path: string): string {
  const match = path.match(/\/plugins\/([^/]+)\/client\/index\.tsx$/)
  if (!match) {
    throw new Error(`Unexpected plugin client path: ${path}`)
  }
  return match[1]
}

export const pluginRegistry: Record<string, PluginClientEntry> = Object.fromEntries(
  Object.entries(modules).map(([path, module]) => {
    return [pluginKeyFromClientPath(path), module.default]
  })
)
