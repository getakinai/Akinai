import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import app from '@adonisjs/core/services/app'

/** Lucid migration directories for each bundled plugin under plugins/<key>/migrations. */
export function pluginMigrationPaths(): string[] {
  const root = app.makePath('plugins')
  if (!existsSync(root)) return []

  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join('plugins', entry.name, 'migrations'))
    .filter((path) => existsSync(app.makePath(path)))
}
