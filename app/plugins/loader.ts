import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import app from '@adonisjs/core/services/app'
import { PLUGIN_SLOTS } from '#constants/plugins'
import { registerPlugin } from '#plugin_host/registry'
import type { PluginDefinition } from '#plugin_host/types'

function validateManifest(plugin: PluginDefinition, folderName: string) {
  for (const slot of plugin.manifest.slots) {
    if (!(PLUGIN_SLOTS as readonly string[]).includes(slot)) {
      throw new Error(`Plugin "${plugin.manifest.key}" uses unknown slot "${slot}"`)
    }
  }
  if (!plugin.manifest.key || !plugin.manifest.name) {
    throw new Error(`Plugin folder "${folderName}" has an invalid manifest`)
  }
}

/** Imports every plugins/<key>/plugin.ts and registers it before routes load. */
export async function loadPlugins() {
  const root = app.makePath('plugins')
  if (!existsSync(root)) return

  const folders = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  for (const folder of folders) {
    const entry = join(root, folder, 'plugin.ts')
    if (!existsSync(entry)) continue

    const module = (await import(pathToFileURL(entry).href)) as { default: PluginDefinition }
    const plugin = module.default
    validateManifest(plugin, folder)
    registerPlugin(plugin, folder)
    await plugin.onBoot?.()
  }
}
