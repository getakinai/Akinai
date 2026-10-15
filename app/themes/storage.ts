import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import app from '@adonisjs/core/services/app'
import drive from '@adonisjs/drive/services/main'
import { THEME_DRIVE_FOLDER } from '#constants/themes'
import type Theme from '#models/theme'
import { extractThemePackage, readThemePackage, type ThemePackage } from '#theme_host/package'
import { privateDriveDisk } from '#utils/drive_disk'

function disk() {
  return drive.use(privateDriveDisk())
}

/** Packages are content-addressed, so duplicates of a theme share one zip. */
export function themeDriveKey(hash: string) {
  return `${THEME_DRIVE_FOLDER}/${hash}.zip`
}

export async function storeThemeZip(hash: string, zip: Uint8Array): Promise<string> {
  const key = themeDriveKey(hash)
  if (!(await disk().exists(key))) {
    await disk().put(key, zip, { contentType: 'application/zip' })
  }
  return key
}

export async function deleteThemeZip(key: string) {
  await disk().delete(key)
}

export async function readThemeZip(theme: Theme): Promise<Uint8Array> {
  return disk().getBytes(theme.driveKey)
}

export async function loadThemePackage(theme: Theme): Promise<ThemePackage> {
  return readThemePackage(await readThemeZip(theme))
}

/**
 * Local copy of a theme package, extracted on first use on each server.
 * The folder is named after the package hash, so a new package never reuses
 * a stale copy, and servers don't need to tell each other about changes.
 */
export function themeCacheDir(hash: string) {
  return app.makePath('tmp', 'themes', hash)
}

const extracting = new Map<string, Promise<string>>()

export async function ensureThemeExtracted(theme: Theme): Promise<string> {
  const dir = themeCacheDir(theme.packageHash)
  if (existsSync(join(dir, 'theme.json'))) return dir
  const pending = extracting.get(dir)
  if (pending) return pending
  const job = (async () => {
    const pkg = await loadThemePackage(theme)
    await extractThemePackage(pkg.files, dir)
    return dir
  })().finally(() => extracting.delete(dir))
  extracting.set(dir, job)
  return job
}

export async function readThemeFile(dir: string, path: string): Promise<Buffer | null> {
  const target = join(dir, ...path.split('/'))
  if (!target.startsWith(dir + '/') || !existsSync(target)) return null
  return readFile(target)
}
