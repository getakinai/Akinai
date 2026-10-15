import type { PluginManifest } from '#constants/plugins'
import type { PluginDefinition } from './types.js'

const plugins: PluginDefinition[] = []

export function registerPlugin(plugin: PluginDefinition, folderName: string) {
  if (plugin.manifest.key !== folderName) {
    throw new Error(
      `Plugin folder "${folderName}" must match manifest.key "${plugin.manifest.key}"`
    )
  }
  if (plugins.some((entry) => entry.manifest.key === plugin.manifest.key)) {
    throw new Error(`Duplicate plugin key "${plugin.manifest.key}"`)
  }
  plugins.push(plugin)
}

export function registeredPlugins(): readonly PluginDefinition[] {
  return plugins
}

export function pluginManifest(key: string): PluginManifest | null {
  return plugins.find((plugin) => plugin.manifest.key === key)?.manifest ?? null
}

export function pluginKeys(): string[] {
  return plugins.map((plugin) => plugin.manifest.key)
}

export function findPlugin(key: string): PluginDefinition | null {
  return plugins.find((plugin) => plugin.manifest.key === key) ?? null
}
