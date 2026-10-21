#!/usr/bin/env node
/**
 * Capture SSR/Inertia HTML snapshots from a running local Akinai app into
 * docs/html/sample/{storefront,admin}.
 *
 * Storefront uses HTTP SSR. Admin is client-rendered, so those pages are
 * captured with Playwright (system Chrome) after React hydrates.
 *
 * Usage:
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/capture-html-samples.mjs
 *
 * Optional:
 *   BASE_URL=http://localhost:3333
 *   OUT_DIR=docs/html/sample
 *   INDEX_ONLY=1 | SANITIZE_ONLY=1 | ADMIN_ONLY=1 | STOREFRONT_ONLY=1
 *
 * SANITIZE_ONLY rewrites snapshots and vendors CSS/fonts/images into
 * docs/html/sample/media/ (needs the app at BASE_URL for Vite-compiled CSS).
 *
 * Requires: yarn add -D playwright (uses channel: chrome, no browser download)
 */

import { access, copyFile, constants as fsConstants, mkdir, writeFile, readdir, readFile, stat } from 'node:fs/promises'
import { dirname, join, relative, posix as pathPosix } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3333').replace(/\/$/, '')
const OUT_DIR = join(ROOT, process.env.OUT_DIR || 'docs/html/sample')
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''

/** Shared static files for samples (never localhost — that triggers Chrome LNA). */
const MEDIA_PREFIX = 'media'
/** appPath (`/inertia/css/app.css`) → path under OUT_DIR (`media/inertia/css/app.css`). */
const mediaCache = new Map()

/** Cookie jar: name -> value (raw, as stored in Set-Cookie). */
const cookies = new Map()

function storeCookies(res) {
  const raw = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : []
  const list = raw.length ? raw : (() => {
    const single = res.headers.get('set-cookie')
    return single ? [single] : []
  })()
  for (const line of list) {
    const [pair] = line.split(';')
    const eq = pair.indexOf('=')
    if (eq === -1) continue
    cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim())
  }
}

function cookieHeader() {
  return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}

function xsrfToken() {
  const raw = cookies.get('XSRF-TOKEN')
  if (!raw) return ''
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

async function request(pathOrUrl, { method = 'GET', body, headers = {}, expectJson = false } = {}) {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${BASE_URL}${pathOrUrl}`
  const hdrs = {
    Accept: expectJson ? 'application/json' : 'text/html,application/xhtml+xml',
    ...headers,
  }
  const jar = cookieHeader()
  if (jar) hdrs.Cookie = jar
  if (method !== 'GET' && method !== 'HEAD') {
    const token = xsrfToken()
    if (token) hdrs['X-XSRF-TOKEN'] = token
    if (body !== undefined && !hdrs['Content-Type']) {
      hdrs['Content-Type'] = 'application/json'
    }
  }
  const res = await fetch(url, {
    method,
    headers: hdrs,
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    redirect: 'manual',
  })
  storeCookies(res)
  const text = await res.text()
  return { res, text, url }
}

/**
 * Turn a live app pathname into a sample file path under storefront/ or admin/,
 * or null when we have no snapshot for it.
 */
function appPathToSampleFile(pathname) {
  let p = pathname.split('?')[0].split('#')[0]
  if (!p.startsWith('/')) p = `/${p}`

  if (p === '/' || p === '') return 'storefront/home.html'

  if (p.startsWith('/admin')) {
    // Mirror adminUrlToRel without the admin/ prefix handling duplication
    let rest = p.replace(/^\/admin\/?/, '').replace(/\/$/, '')
    if (!rest) rest = 'dashboard'
    rest = rest.replace(/\/(edit|show|view)\/([^/]+)$/, '/$1-$2')
    rest = rest.replace(/^themes\/([^/]+)\/editor$/, 'themes/editor-$1')
    return `admin/${rest}.html`
  }

  // Public storefront paths from the sitemap
  if (
    p.startsWith('/collections/') ||
    p.startsWith('/products/') ||
    p.startsWith('/pages/')
  ) {
    return `storefront${p}.html`
  }

  return null
}

function hrefToSampleRelative(href, fromRelPath) {
  let url
  try {
    url = new URL(href, BASE_URL)
  } catch {
    return null
  }
  if (url.origin !== BASE_URL && !href.startsWith('/')) return null
  const sample = appPathToSampleFile(url.pathname)
  if (!sample) return '#'
  // fromRelPath is like storefront/home.html
  const fromDir = pathPosix.dirname(fromRelPath.replace(/\\/g, '/'))
  let rel = pathPosix.relative(fromDir, sample)
  if (!rel.startsWith('.')) rel = `./${rel}`
  return rel
}

/**
 * Origins the capture app may appear under. Public docs must never keep these
 * — Chrome treats a request from https://getakinai.com to localhost as
 * "Apps on device" / loopback access and prompts on first visit.
 */
function appOrigins() {
  return [...new Set([BASE_URL, 'http://localhost:3333', 'http://127.0.0.1:3333'])]
}

/** Rewrite absolute app URLs back to root-relative paths (`/…`). */
function stripAppOrigins(html) {
  let out = html
  for (const origin of appOrigins()) {
    const escaped = origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    out = out.replace(new RegExp(escaped, 'g'), '')
  }
  return out
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function pathExists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK)
    return true
  } catch {
    return false
  }
}

/** Root-relative app paths that should be vendored into sample/media/. */
function isAssetPath(pathname) {
  if (!pathname.startsWith('/')) return false
  if (pathname.startsWith('/@') || pathname.includes('/@vite/')) return false
  if (pathname === '/brand/manifest.json') return false
  if (pathname.startsWith('/uploads/')) return true
  if (pathname.startsWith('/inertia/css/')) return true
  // Brand favicons are route-served and often 404 in capture; skip them.
  if (pathname.startsWith('/brand/')) return false
  return /\.(css|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot)(\?|$)/i.test(pathname)
}

function toRelative(fromRelPath, targetRelPath) {
  const fromDir = pathPosix.dirname(fromRelPath.replace(/\\/g, '/'))
  let rel = pathPosix.relative(fromDir, targetRelPath.replace(/\\/g, '/'))
  if (!rel.startsWith('.')) rel = `./${rel}`
  return rel
}

/**
 * Copy or fetch one app asset into sample/media/, rewrite CSS url() deps.
 * Returns the path under OUT_DIR (posix), e.g. media/inertia/css/app.css.
 */
async function ensureMedia(appPath) {
  let path = appPath.split('?')[0].split('#')[0]
  if (!path.startsWith('/')) path = `/${path}`
  if (mediaCache.has(path)) return mediaCache.get(path)

  const relOut = `${MEDIA_PREFIX}${path}`
  const dest = join(OUT_DIR, ...relOut.split('/'))
  // Reserve the cache entry before recursion (CSS → fonts) so we don't loop.
  mediaCache.set(path, relOut)
  await mkdir(dirname(dest), { recursive: true })

  let wrote = false
  // Vite must compile /inertia/css/* — never copy the Tailwind source.
  if (!path.startsWith('/inertia/')) {
    if (path.startsWith('/uploads/')) {
      const disk = join(ROOT, 'storage', path.slice('/uploads/'.length))
      if (await pathExists(disk)) {
        await copyFile(disk, dest)
        wrote = true
      }
    } else {
      const disk = join(ROOT, path.slice(1))
      if (await pathExists(disk)) {
        await copyFile(disk, dest)
        wrote = true
      }
    }
  }

  if (!wrote) {
    const needsDirect = path.endsWith('.css') || path.startsWith('/inertia/')
    const fetchUrl = needsDirect ? `${BASE_URL}${path}?direct` : `${BASE_URL}${path}`
    const res = await fetch(fetchUrl)
    if (!res.ok) {
      mediaCache.delete(path)
      throw new Error(`${fetchUrl} → HTTP ${res.status}`)
    }
    const ct = res.headers.get('content-type') || ''
    if (path.endsWith('.css') && ct.includes('javascript')) {
      mediaCache.delete(path)
      throw new Error(`${fetchUrl} returned JS; expected CSS (?direct)`)
    }
    await writeFile(dest, Buffer.from(await res.arrayBuffer()))
    wrote = true
  }

  if (path.endsWith('.css')) {
    const css = await readFile(dest, 'utf8')
    await writeFile(dest, await rewriteCssAssetUrls(css, relOut), 'utf8')
  }

  return relOut
}

/** Vendor url(...) targets inside a CSS file and rewrite them relatively. */
async function rewriteCssAssetUrls(css, cssMediaRel) {
  const cssDir = pathPosix.dirname(cssMediaRel)
  const found = new Set()
  for (const match of css.matchAll(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/gi)) {
    let url = match[2].trim()
    if (!url || url.startsWith('data:') || url.startsWith('#')) continue
    for (const origin of appOrigins()) {
      if (url.startsWith(origin)) url = url.slice(origin.length)
    }
    if (url.startsWith('/')) found.add(url.split('?')[0].split('#')[0])
  }

  const replacements = []
  for (const assetPath of [...found].sort((a, b) => b.length - a.length)) {
    if (!isAssetPath(assetPath)) continue
    try {
      const mediaRel = await ensureMedia(assetPath)
      let rel = pathPosix.relative(cssDir, mediaRel)
      if (!rel.startsWith('.')) rel = `./${rel}`
      replacements.push([assetPath, rel])
    } catch (error) {
      console.warn(`  css asset skip ${assetPath}: ${error.message}`)
    }
  }

  let out = css
  for (const [from, to] of replacements) {
    out = out.replace(new RegExp(escapeRegExp(from), 'g'), to)
  }
  return out
}

/** Collect root-relative asset paths from HTML and point them at sample/media/. */
async function rewriteHtmlAssets(html, fromRelPath) {
  const found = new Set()
  const consider = (raw) => {
    if (!raw || !raw.startsWith('/')) return
    const path = raw.split('?')[0].split('#')[0]
    if (isAssetPath(path)) found.add(path)
  }

  for (const match of html.matchAll(/\b(?:href|src|poster|content)=(["'])([^"']+)\1/gi)) {
    consider(match[2])
  }
  for (const match of html.matchAll(/\bsrcset=(["'])([^"']+)\1/gi)) {
    for (const part of match[2].split(',')) {
      consider(part.trim().split(/\s+/)[0])
    }
  }
  for (const match of html.matchAll(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/gi)) {
    consider(match[2].trim())
  }

  const replacements = []
  for (const assetPath of [...found].sort((a, b) => b.length - a.length)) {
    try {
      const mediaRel = await ensureMedia(assetPath)
      replacements.push([assetPath, toRelative(fromRelPath, mediaRel)])
    } catch (error) {
      console.warn(`  asset skip ${assetPath}: ${error.message}`)
    }
  }

  let out = html
  for (const [from, to] of replacements) {
    out = out.replace(new RegExp(escapeRegExp(from), 'g'), to)
  }
  return out
}

/**
 * Make a snapshot safe to open under file:// or a static server:
 * - drop Vite / React-refresh / Inertia entry scripts (they break off-origin)
 * - vendor CSS/fonts/images into sample/media/ (no localhost — Chrome LNA)
 * - point in-page links at sibling sample HTML (never frame the live app —
 *   Adonis sets frame-ancestors 'none')
 */
async function sanitizeSnapshot(html, fromRelPath) {
  let out = html
  // Inline + external module scripts (Vite client, react-refresh preamble, inertia entry)
  out = out.replace(/<script\b[^>]*\btype=["']module["'][^>]*>[\s\S]*?<\/script>/gi, '')
  out = out.replace(/<script\b[^>]*\btype=["']module["'][^>]*\/>/gi, '')
  out = out.replace(/<link\b[^>]*\brel=["']modulepreload["'][^>]*>/gi, '')

  // Older captures pointed assets at localhost; normalize before vendoring.
  out = stripAppOrigins(out)
  out = await rewriteHtmlAssets(out, fromRelPath)

  // Anchors: map to sample files or neutralize (avoid framing the live app —
  // Adonis sends CSP frame-ancestors 'none').
  out = out.replace(/<a\b([^>]*)>/gi, (full, attrs) => {
    const hrefMatch = attrs.match(/\bhref=(["'])([^"']*)\1/i)
    if (!hrefMatch) return full
    const quote = hrefMatch[1]
    const href = hrefMatch[2]
    if (
      !href ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('javascript:') ||
      href.startsWith('data:') ||
      href.startsWith('vbscript:') ||
      href.startsWith('.') ||
      href.startsWith('media/')
    ) {
      return full
    }
    const isAppUrl =
      href.startsWith('/') ||
      href.startsWith(BASE_URL) ||
      href.startsWith('http://localhost:3333') ||
      href.startsWith('http://127.0.0.1:3333')
    if (!isAppUrl) {
      // External — open outside the iframe
      if (/^https?:\/\//i.test(href)) {
        let next = attrs
        if (!/\btarget=/i.test(next)) next += ' target="_blank"'
        if (!/\brel=/i.test(next)) next += ' rel="noopener noreferrer"'
        return `<a${next}>`
      }
      return full
    }
    const mapped = hrefToSampleRelative(href, fromRelPath) ?? '#'
    const nextAttrs = attrs.replace(/\bhref=(["'])([^"']*)\1/i, `href=${quote}${mapped}${quote}`)
    return `<a${nextAttrs}>`
  })

  return out
}

function pathToFile(urlPath, { homeName = 'home.html' } = {}) {
  let p = urlPath.split('?')[0]
  if (!p.startsWith('/')) p = `/${p}`
  if (p === '/' || p === '') return homeName
  p = p.replace(/^\//, '').replace(/\/$/, '')
  return `${p}.html`
}

async function writeHtml(relPath, html) {
  const out = join(OUT_DIR, relPath)
  await mkdir(dirname(out), { recursive: true })
  await writeFile(out, await sanitizeSnapshot(html, relPath.replace(/\\/g, '/')), 'utf8')
  return relPath
}

/** Re-sanitize already-captured files and vendor assets into sample/media/. */
async function sanitizeExisting() {
  console.log('\n=== Sanitize existing snapshots (vendor assets) ===')
  mediaCache.clear()
  for (const section of ['storefront', 'admin']) {
    const files = await listHtmlFiles(join(OUT_DIR, section))
    for (const file of files) {
      const rel = join(section, file).replace(/\\/g, '/')
      const full = join(OUT_DIR, rel)
      const raw = await readFile(full, 'utf8')
      await writeFile(full, await sanitizeSnapshot(raw, rel), 'utf8')
      console.log(`  ok   ${rel}`)
    }
  }
  console.log(`  media files cached: ${mediaCache.size}`)
}

async function captureGet(urlPath, relOut) {
  const { res, text } = await request(urlPath)
  if (res.status >= 400) {
    console.warn(`  skip ${urlPath} → HTTP ${res.status}`)
    return null
  }
  // Follow one redirect if needed
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get('location')
    if (loc) {
      const next = loc.startsWith('http') ? new URL(loc).pathname : loc
      return captureGet(next, relOut)
    }
  }
  const ctype = res.headers.get('content-type') || ''
  if (!ctype.includes('text/html')) {
    console.warn(`  skip ${urlPath} → ${ctype || 'non-html'}`)
    return null
  }
  const written = await writeHtml(relOut, text)
  console.log(`  ok   ${urlPath} → ${written} (${text.length} bytes)`)
  return written
}

async function captureStorefront() {
  console.log('\n=== Storefront (sitemap) ===')
  const { res, text } = await request('/sitemap.xml')
  if (!res.ok) throw new Error(`sitemap.xml HTTP ${res.status}`)
  const locs = [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  const written = []
  for (const loc of locs) {
    const u = new URL(loc)
    const urlPath = u.pathname || '/'
    const file = pathToFile(urlPath, { homeName: 'home.html' })
    const rel = join('storefront', file)
    const w = await captureGet(urlPath, rel)
    if (w) written.push(w)
  }
  return written
}

/** Static admin Inertia shells (no :id). Login is captured before auth. */
const ADMIN_SHELLS = [
  '/admin/dashboard',
  '/admin/account',
  '/admin/orders',
  '/admin/orders/drafts',
  '/admin/orders/drafts/create',
  '/admin/returns',
  '/admin/products',
  '/admin/products/create',
  '/admin/collections',
  '/admin/collections/create',
  '/admin/product-types',
  '/admin/product-labels',
  '/admin/vendors',
  '/admin/options',
  '/admin/customers',
  '/admin/customers/create',
  '/admin/media',
  '/admin/analytics',
  '/admin/analytics/reports',
  '/admin/analytics/live',
  '/admin/discounts',
  '/admin/discounts/create',
  '/admin/support/tickets',
  '/admin/help/articles',
  '/admin/help/articles/create',
  '/admin/help/categories',
  '/admin/storefront/theme',
  '/admin/storefront/menu',
  '/admin/storefront/hero',
  '/admin/pages',
  '/admin/pages/create',
  '/admin/themes',
  '/admin/plugins',
  '/admin/settings',
  '/admin/markets',
  '/admin/taxes',
  '/admin/shipping',
  '/admin/locations',
  '/admin/payments',
  '/admin/emails',
  '/admin/events',
  '/admin/users',
  '/admin/users/create',
  '/admin/roles',
]

/**
 * After login, fetch list JSON and capture one show/edit page per resource.
 * `listPath` returns JSON; `detailPaths(id)` returns Inertia HTML paths.
 */
const ADMIN_DETAIL_SOURCES = [
  {
    list: '/admin/products/list?perPage=15',
    pick: (data) => firstId(data),
    details: (id) => [`/admin/products/edit/${id}`],
  },
  {
    list: '/admin/collections/list?perPage=15',
    pick: (data) => firstId(data),
    details: (id) => [`/admin/collections/edit/${id}`],
  },
  {
    list: '/admin/orders/list?perPage=15',
    pick: (data) => firstId(data),
    details: (id) => [`/admin/orders/show/${id}`],
  },
  {
    list: '/admin/customers/list?perPage=15',
    pick: (data) => firstId(data),
    details: (id) => [`/admin/customers/edit/${id}`],
  },
  {
    list: '/admin/users/list?perPage=15',
    pick: (data) => firstId(data),
    details: (id) => [`/admin/users/show/${id}`, `/admin/users/edit/${id}`],
  },
  {
    list: '/admin/pages/list?perPage=15',
    pick: (data) => firstId(data),
    details: (id) => [`/admin/pages/edit/${id}`],
  },
  {
    list: '/admin/discounts/list?perPage=15',
    pick: (data) => firstId(data),
    details: (id) => [`/admin/discounts/edit/${id}`],
  },
  {
    list: '/admin/support/tickets/list?perPage=15',
    pick: (data) => firstId(data),
    details: (id) => [`/admin/support/tickets/show/${id}`],
  },
  {
    list: '/admin/emails/list?perPage=15',
    pick: (data) => firstId(data),
    details: (id) => [`/admin/emails/show/${id}`],
  },
  {
    list: '/admin/themes/list',
    pick: (data) => firstId(data),
    details: (id) => [`/admin/themes/${id}/editor`],
  },
  {
    list: '/admin/help/articles/list?perPage=15',
    pick: (data) => firstId(data),
    details: (id) => [`/admin/help/articles/edit/${id}`],
  },
  {
    list: '/admin/orders/drafts/list?perPage=15',
    pick: (data) => firstId(data),
    details: (id) => [`/admin/orders/drafts/edit/${id}`],
  },
]

function firstId(payload) {
  const root = payload?.data ?? payload
  const arrays = []
  if (Array.isArray(root)) arrays.push(root)
  else if (root && typeof root === 'object') {
    for (const v of Object.values(root)) {
      if (Array.isArray(v)) arrays.push(v)
    }
  }
  for (const arr of arrays) {
    for (const item of arr) {
      if (item && typeof item === 'object' && item.id != null) return String(item.id)
    }
  }
  return null
}

function adminUrlToRel(urlPath) {
  // /admin/foo/bar → admin/foo/bar.html ; /admin/products/edit/UUID → admin/products/edit-<uuid>.html
  let p = urlPath.replace(/^\/admin\/?/, '').replace(/\/$/, '')
  if (!p) p = 'home'
  // Collapse edit|show|view/:id into edit-id style leaf names for flatter trees
  p = p.replace(/\/(edit|show|view)\/([^/]+)$/, '/$1-$2')
  // themes/:id/editor → themes/editor-<id>
  p = p.replace(/^themes\/([^/]+)\/editor$/, 'themes/editor-$1')
  return join('admin', `${p}.html`)
}

async function loadPlaywright() {
  try {
    return await import('playwright')
  } catch {
    throw new Error(
      'playwright is required for admin snapshots. Run: yarn add -D playwright'
    )
  }
}

/** Wait until Inertia has painted into #app (admin has no SSR). */
async function waitForHydratedApp(page) {
  await page.waitForFunction(
    () => {
      const app = document.getElementById('app')
      return Boolean(app && app.children.length > 0)
    },
    { timeout: 20000 }
  )
  // Let lists/queries settle briefly
  await new Promise((r) => setTimeout(r, 500))
}

async function gotoAdminPath(page, urlPath) {
  const target = urlPath.split('?')[0]
  try {
    const res = await page.goto(`${BASE_URL}${urlPath}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })
    if (res && res.status() >= 400) {
      throw new Error(`HTTP ${res.status()}`)
    }
  } catch (navErr) {
    // Inertia / Vite sometimes abort the document request; URL may still update.
    if (!/ERR_ABORTED|Navigation interrupted/i.test(navErr.message)) throw navErr
  }
  // Ensure we landed on the requested path (not a stale SPA screen).
  await page.waitForFunction(
    (path) => {
      const here = window.location.pathname.replace(/\/$/, '') || '/'
      const want = path.replace(/\/$/, '') || '/'
      return here === want
    },
    target,
    { timeout: 15000 }
  )
  await waitForHydratedApp(page)
}

async function captureAdminPage(page, urlPath, written) {
  const rel = adminUrlToRel(urlPath).replace(/\\/g, '/')
  try {
    await gotoAdminPath(page, urlPath)
    const here = new URL(page.url())
    if (here.pathname.includes('/login')) {
      console.warn(`  skip ${urlPath} → redirected to login`)
      return
    }
    const html = await page.content()
    await writeHtml(rel, html)
    console.log(`  ok   ${urlPath} → ${rel} (${html.length} bytes)`)
    written.push(rel)
  } catch (err) {
    console.warn(`  skip ${urlPath} → ${err.message.split('\n')[0]}`)
  }
}

async function captureAdmin() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD to capture admin pages')
  }

  const { chromium } = await loadPlaywright()
  console.log('\n=== Admin (Playwright hydrate) ===')
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const written = []

  try {
    // Capture the guest login screen first.
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle', timeout: 30000 })
    await waitForHydratedApp(page)
    const loginRel = adminUrlToRel('/admin/login').replace(/\\/g, '/')
    await writeHtml(loginRel, await page.content())
    written.push(loginRel)
    console.log('  ok   /admin/login (guest)')

    // Sign in via the JSON API (same as the SPA). More reliable than clicking the form
    // under headless Chrome, and reuses the XSRF cookie from the login page visit.
    const xsrf = (await context.cookies()).find((c) => c.name === 'XSRF-TOKEN')?.value
    if (!xsrf) throw new Error('Missing XSRF-TOKEN cookie after visiting /admin/login')
    const loginRes = await context.request.post(`${BASE_URL}/admin/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': decodeURIComponent(xsrf),
      },
    })
    const loginBody = await loginRes.json().catch(() => ({}))
    if (!loginRes.ok()) {
      throw new Error(`Admin login HTTP ${loginRes.status()}: ${JSON.stringify(loginBody).slice(0, 200)}`)
    }
    if (loginBody?.data?.mfaRequired) {
      throw new Error('Admin account requires MFA; disable MFA for the capture user')
    }

    try {
      await page.goto(`${BASE_URL}/admin/dashboard`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      })
    } catch (navErr) {
      if (!/ERR_ABORTED|Navigation interrupted/i.test(navErr.message)) throw navErr
    }
    await waitForHydratedApp(page)
    const afterLogin = new URL(page.url())
    if (afterLogin.pathname.includes('/login')) {
      throw new Error('Session missing after API login — still on /admin/login')
    }
    console.log(`  logged in as ${ADMIN_EMAIL} → ${afterLogin.pathname}`)

    console.log('\n=== Admin shells ===')
    for (const path of ADMIN_SHELLS) {
      await captureAdminPage(page, path, written)
    }

    console.log('\n=== Admin detail samples ===')
    for (const src of ADMIN_DETAIL_SOURCES) {
      try {
        const res = await page.request.get(`${BASE_URL}${src.list}`, {
          headers: { Accept: 'application/json' },
        })
        if (!res.ok()) {
          console.warn(`  skip list ${src.list} → HTTP ${res.status()}`)
          continue
        }
        const payload = await res.json()
        const id = src.pick(payload)
        if (!id) {
          console.warn(`  skip list ${src.list} → no rows`)
          continue
        }
        for (const detailPath of src.details(id)) {
          await captureAdminPage(page, detailPath, written)
        }
      } catch (err) {
        console.warn(`  skip list ${src.list} → ${err.message}`)
      }
    }
  } finally {
    await browser.close()
  }

  return written
}

function githubSvg() {
  return `<svg class="docs-topbar-github-icon" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"
          />
        </svg>`
}

/** `depth` is how many levels under docs/html/ this file lives (sample=1, sample/x=2). */
function docsChrome({ title, breadcrumb, active, bodyHtml, depth, viewer = false }) {
  const up = '../'.repeat(depth)
  const sampleRoot = depth === 1 ? '' : '../'
  const bodyClass = viewer ? ' class="docs-sample-viewer"' : ''
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <link rel="stylesheet" href="${up}assets/docs.css" />
  </head>
  <body${bodyClass}>
    <header class="docs-topbar">
      <a class="docs-brand" href="${up}index.html">Akinai docs</a>
      <nav class="docs-breadcrumb" aria-label="Breadcrumb">
        ${breadcrumb}
      </nav>
      <a
        class="docs-topbar-github"
        href="https://github.com/getakinai/storefront"
        rel="noopener noreferrer"
      >
        ${githubSvg()}
        <span class="docs-topbar-github-label">View on GitHub</span>
      </a>
    </header>

    <div class="docs-shell">
      <aside class="docs-sidebar">
        <nav aria-label="Docs">
          <div class="docs-nav-group">
            <span class="docs-nav-label">Start</span>
            <a href="${up}index.html">Overview</a>
            <a href="${up}getting-started.html">Getting started</a>
            <a href="${up}deployment.html">Deployment</a>
            <a href="${up}architecture/index.html">Architecture</a>
          </div>
          <div class="docs-nav-group">
            <span class="docs-nav-label">Demo</span>
            <a class="${active === 'hub' ? 'is-active' : ''}" href="${sampleRoot}index.html">See Demo</a>
            <a class="docs-nav-child ${active === 'storefront' ? 'is-active' : ''}" href="${active === 'storefront' ? 'index.html' : `${sampleRoot}storefront/index.html`}">Storefront</a>
            <a class="docs-nav-child ${active === 'admin' ? 'is-active' : ''}" href="${active === 'admin' ? 'index.html' : `${sampleRoot}admin/index.html`}">Admin</a>
          </div>
        </nav>
      </aside>

      <main class="docs-main">
${bodyHtml}
      </main>
    </div>
  </body>
</html>
`
}

async function listHtmlFiles(dir) {
  const out = []
  async function walk(current) {
    let entries
    try {
      entries = await readdir(current)
    } catch {
      return
    }
    for (const name of entries) {
      if (name === 'index.html') continue
      const full = join(current, name)
      const st = await stat(full)
      if (st.isDirectory()) await walk(full)
      else if (name.endsWith('.html')) out.push(relative(dir, full))
    }
  }
  await walk(dir)
  return out.sort()
}

function escapeHtml(s) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function pickDefaultPage(files, preferred) {
  for (const name of preferred) {
    if (files.includes(name)) return name
  }
  return files[0] || ''
}

/** Page picker + iframe that loads a captured snapshot. */
function sampleViewerBody({ title, lead, files, defaultSrc, iframeTitle }) {
  const options = files
    .map((f) => {
      const selected = f === defaultSrc ? ' selected' : ''
      return `            <option value="${escapeHtml(f)}"${selected}>${escapeHtml(f.replace(/\.html$/, ''))}</option>`
    })
    .join('\n')

  return `        <div class="sample-viewer">
          <div class="sample-viewer-toolbar">
            <div class="sample-viewer-heading">
              <h1>${escapeHtml(title)}</h1>
              <p class="lead">${lead}</p>
            </div>
            <label class="sample-viewer-picker">
              <span>Page</span>
              <select id="sample-page" aria-label="Sample page">
${options}
              </select>
            </label>
          </div>
          <iframe
            id="sample-frame"
            class="sample-viewer-frame"
            title="${escapeHtml(iframeTitle)}"
            src="${escapeHtml(defaultSrc)}"
          ></iframe>
        </div>
        <script>
          (function () {
            var select = document.getElementById('sample-page')
            var frame = document.getElementById('sample-frame')
            if (!select || !frame) return
            select.addEventListener('change', function () {
              frame.src = select.value
            })
          })()
        </script>
`
}

async function writeIndexes() {
  const storefrontFiles = await listHtmlFiles(join(OUT_DIR, 'storefront'))
  const adminFiles = await listHtmlFiles(join(OUT_DIR, 'admin'))
  const storefrontDefault = pickDefaultPage(storefrontFiles, ['home.html'])
  const adminDefault = pickDefaultPage(adminFiles, ['dashboard.html', 'login.html'])

  const hubBody = `        <h1>See Demo</h1>
        <p class="lead">
          Static SSR snapshots (Vite/Inertia scripts stripped). Styles and
          images are bundled under <code>sample/media/</code> — no local app required.
        </p>
        <div class="sample-hub-previews">
          <section class="sample-hub-preview">
            <div class="sample-hub-preview-bar">
              <h2>Storefront</h2>
              <a href="storefront/index.html">Open viewer</a>
            </div>
            <iframe
              class="sample-hub-frame"
              title="Storefront home sample"
              src="storefront/${escapeHtml(storefrontDefault)}"
            ></iframe>
          </section>
          <section class="sample-hub-preview">
            <div class="sample-hub-preview-bar">
              <h2>Admin</h2>
              <a href="admin/index.html">Open viewer</a>
            </div>
            <iframe
              class="sample-hub-frame"
              title="Admin dashboard sample"
              src="admin/${escapeHtml(adminDefault)}"
            ></iframe>
          </section>
        </div>
`

  await writeFile(
    join(OUT_DIR, 'index.html'),
    docsChrome({
      title: 'See Demo — Akinai docs',
      breadcrumb: `<a href="../index.html">Docs</a>
        <span class="sep">/</span>
        <span>See Demo</span>`,
      active: 'hub',
      bodyHtml: hubBody,
      depth: 1,
      viewer: true,
    }),
    'utf8'
  )

  await writeFile(
    join(OUT_DIR, 'storefront', 'index.html'),
    docsChrome({
      title: 'Storefront demo — Akinai docs',
      breadcrumb: `<a href="../../index.html">Docs</a>
        <span class="sep">/</span>
        <a href="../index.html">See Demo</a>
        <span class="sep">/</span>
        <span>Storefront</span>`,
      active: 'storefront',
      bodyHtml: sampleViewerBody({
        title: 'Storefront',
        lead: 'Static SSR markup from the public sitemap (no client hydrate). Styles and images load from sample/media/.',
        files: storefrontFiles,
        defaultSrc: storefrontDefault,
        iframeTitle: 'Storefront sample',
      }),
      depth: 2,
      viewer: true,
    }),
    'utf8'
  )

  await writeFile(
    join(OUT_DIR, 'admin', 'index.html'),
    docsChrome({
      title: 'Admin demo — Akinai docs',
      breadcrumb: `<a href="../../index.html">Docs</a>
        <span class="sep">/</span>
        <a href="../index.html">See Demo</a>
        <span class="sep">/</span>
        <span>Admin</span>`,
      active: 'admin',
      bodyHtml: sampleViewerBody({
        title: 'Admin',
        lead: 'Hydrated back-office snapshots (Vite scripts stripped). Styles and images load from sample/media/.',
        files: adminFiles,
        defaultSrc: adminDefault,
        iframeTitle: 'Admin sample',
      }),
      depth: 2,
      viewer: true,
    }),
    'utf8'
  )

  console.log(`\nWrote indexes (${storefrontFiles.length} storefront, ${adminFiles.length} admin)`)
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  if (process.env.SANITIZE_ONLY === '1') {
    await sanitizeExisting()
    await writeIndexes()
  } else if (process.env.INDEX_ONLY === '1') {
    await writeIndexes()
  } else if (process.env.ADMIN_ONLY === '1') {
    await captureAdmin()
    await writeIndexes()
  } else if (process.env.STOREFRONT_ONLY === '1') {
    await captureStorefront()
    await writeIndexes()
  } else {
    await captureStorefront()
    await captureAdmin()
    await writeIndexes()
  }
  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
