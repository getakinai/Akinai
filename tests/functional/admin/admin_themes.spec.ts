import { rm, writeFile } from 'node:fs/promises'
import { test } from '@japa/runner'
import type { Group } from '@japa/runner/core'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import drive from '@adonisjs/drive/services/main'
import { strToU8, zipSync } from 'fflate'
import Theme from '#models/theme'
import ThemeSetting from '#models/theme_setting'
import MarketService from '#services/market_service'
import ThemeService from '#services/theme_service'
import { THEME_EDITOR_SESSION_KEY, THEME_PREVIEW_SESSION_KEY } from '#theme_host/renderer'
import { privateDriveDisk } from '#utils/drive_disk'
import { createAdminUser } from '#tests/helpers/admin'

const MINIMAL: Record<string, string> = {
  'theme.json': JSON.stringify({ key: 'minimal', name: 'Minimal', version: '1.0.0' }),
  'layout/theme.edge': '<html><body class="minimal">{{{ contentForLayout }}}</body></html>',
  'sections/hello.edge': '<p class="hello">{{ section.settings.text }}</p>',
  'sections/hello.schema.json': JSON.stringify({
    name: 'Hello',
    settings: [{ type: 'text', id: 'text', label: 'Text', default: 'Hello from Minimal' }],
  }),
  'templates/index.json': JSON.stringify({
    sections: { hello: { type: 'hello', settings: {} } },
    order: ['hello'],
  }),
}

function zip(files: Record<string, string>) {
  return Buffer.from(
    zipSync(Object.fromEntries(Object.entries(files).map(([path, text]) => [path, strToU8(text)])))
  )
}

async function dawnLite(): Promise<Theme> {
  const service = await app.container.make(ThemeService)
  const themes = await service.library()
  return themes.find((theme) => theme.key === 'dawn_lite')!
}

async function publish(theme: Theme) {
  const service = await app.container.make(ThemeService)
  await service.publish(theme.id)
}

function setup(group: Group) {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(async () => {
    drive.fake(privateDriveDisk())
    await createAdminUser('admin')
    const marketService = await app.container.make(MarketService)
    await marketService.ensurePrimary({
      name: 'New Zealand',
      currencyCode: 'NZD',
      pricesIncludeTax: true,
      countryCodes: ['NZ'],
    })
    return () => drive.restore(privateDriveDisk())
  })
}

test.group('Staff themes: library and upload', (group) => {
  setup(group)

  test('lists the bundled reference theme', async ({ client }) => {
    const user = await createAdminUser(['themes.view'])

    const response = await client
      .get('/admin/themes/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({
      data: [{ key: 'dawn_lite', role: 'unpublished', source: 'bundled' }],
    })
  })

  test('uploads a theme zip', async ({ client, assert }) => {
    const user = await createAdminUser(['themes.view', 'themes.upload'])

    const response = await client
      .post('/admin/themes')
      .file('theme', zip(MINIMAL), { filename: 'minimal.zip' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(201)
    response.assertBodyContains({ data: { key: 'minimal', name: 'Minimal', role: 'unpublished' } })
    const service = await app.container.make(ThemeService)
    assert.isTrue((await service.library()).some((theme) => theme.key === 'minimal'))
  })

  test('lists every problem in an invalid package', async ({ client, assert }) => {
    const user = await createAdminUser(['themes.upload'])

    const response = await client
      .post('/admin/themes')
      .file('theme', zip({ 'theme.json': MINIMAL['theme.json'], 'assets/app.js': 'alert(1)' }), {
        filename: 'broken.zip',
      })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    const messages = response.body().errors.map((error: { message: string }) => error.message)
    assert.includeMembers(messages, [
      'layout/theme.edge is missing',
      "assets/app.js: this file type isn't allowed here",
    ])
  })

  test('needs themes.upload to upload and themes.view to list', async ({ client }) => {
    const viewer = await createAdminUser(['themes.view'])
    const nobody = await createAdminUser(['products.view'])

    const upload = await client
      .post('/admin/themes')
      .file('theme', zip(MINIMAL), { filename: 'minimal.zip' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(viewer)
    upload.assertStatus(403)

    const list = await client
      .get('/admin/themes/list')
      .accept('json')
      .withGuard('web')
      .loginAs(nobody)
    list.assertStatus(403)
  })
})

test.group('Staff themes: publishing', (group) => {
  setup(group)

  test('publishes a theme and refuses to delete the live theme', async ({ client, assert }) => {
    const user = await createAdminUser(['themes.view', 'themes.edit', 'themes.archive'])
    const theme = await dawnLite()

    const response = await client
      .post(`/admin/themes/${theme.id}/publish`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    response.assertStatus(204)
    await theme.refresh()
    assert.equal(theme.role, 'live')

    const remove = await client
      .delete(`/admin/themes/${theme.id}`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    remove.assertStatus(422)
  })

  test('bundled themes move to the latest folder files and keep their settings', async ({
    assert,
  }) => {
    const theme = await dawnLite()
    const copy = await (await app.container.make(ThemeService)).duplicate(theme.id, null)
    const settings = await ThemeSetting.findByOrFail('theme_id', theme.id)
    settings.data = { ...settings.data, current: { ...settings.data.current, page_width: 1000 } }
    await settings.save()
    await Theme.query().whereIn('id', [theme.id, copy.id]).update({ package_hash: 'stale' })

    await dawnLite()
    await theme.refresh()
    await copy.refresh()
    await settings.refresh()

    assert.notEqual(theme.packageHash, 'stale')
    assert.equal(copy.packageHash, theme.packageHash)
    assert.equal(settings.data.current.page_width, 1000)
  })

  test('publishing another theme demotes the current live theme', async ({ assert }) => {
    const service = await app.container.make(ThemeService)
    const first = await dawnLite()
    const second = await service.duplicate(first.id, null)

    await publish(first)
    await publish(second)
    await first.refresh()
    await second.refresh()

    assert.equal(first.role, 'unpublished')
    assert.equal(second.role, 'live')
  })
})

test.group('Storefront themes: rendering', (group) => {
  setup(group)

  test('the React storefront renders while no theme is live', async ({ client, assert }) => {
    await dawnLite()

    const response = await client.get('/')

    response.assertStatus(200)
    assert.notInclude(response.text(), 'akinai-section')
  })

  test('the live theme renders the home page with sections and plugin slots', async ({
    client,
    assert,
  }) => {
    await publish(await dawnLite())

    const response = await client.get('/')

    response.assertStatus(200)
    const html = response.text()
    assert.include(html, 'akinai-section--image_banner')
    assert.include(html, 'Made to be used every day')
    assert.include(html, 'data-akinai-island="plugin_slot"')
    assert.include(html, 'data-akinai-island="cart_button"')
    assert.include(html, 'id="akinai-islands-data"')
    assert.notInclude(html, 'Previewing')
  })

  test('Inertia visits to a themed page get a full page load', async ({ client }) => {
    await publish(await dawnLite())

    const response = await client.get('/').header('X-Inertia', 'true').redirects(0)

    response.assertStatus(409)
  })

  test('falls back to the React storefront when the live theme fails', async ({
    client,
    assert,
  }) => {
    const service = await app.container.make(ThemeService)
    const broken = {
      ...MINIMAL,
      'layout/theme.edge': '<html><body>{{ missingHelper() }}</body></html>',
    }
    const path = app.tmpPath(`broken-theme-${Date.now()}.zip`)
    await writeFile(path, zip(broken))
    const user = await createAdminUser('admin')
    const theme = await service.upload(path, user.id).finally(() => rm(path, { force: true }))
    await publish(theme)

    const response = await client.get('/')

    response.assertStatus(200)
    assert.notInclude(response.text(), 'class="minimal"')
  })

  test('serves theme assets', async ({ client, assert }) => {
    const theme = await dawnLite()

    const response = await client.get(`/themes/assets/${theme.packageHash}/assets/base.css`)

    response.assertStatus(200)
    assert.include(response.header('content-type'), 'text/css')
    assert.include(response.header('cache-control'), 'immutable')

    const outside = await client.get(`/themes/assets/${theme.packageHash}/layout/theme.edge`)
    outside.assertStatus(404)
  })
})

test.group('Storefront themes: preview', (group) => {
  setup(group)

  test('storefront pages allow same-origin framing during theme customization', async ({
    client,
    assert,
  }) => {
    const user = await createAdminUser(['themes.edit'])
    const theme = await dawnLite()

    const response = await client
      .get('/')
      .withGuard('web')
      .loginAs(user)
      .withSession({ [THEME_EDITOR_SESSION_KEY]: { themeId: theme.id } })

    response.assertStatus(200)
    assert.include(String(response.header('x-frame-options')), 'SAMEORIGIN')
    assert.include(String(response.header('content-security-policy')), "frame-ancestors 'self'")
  })

  test('staff preview an unpublished theme without affecting customers', async ({
    client,
    assert,
  }) => {
    const user = await createAdminUser(['themes.view'])
    const theme = await dawnLite()

    const start = await client
      .get(`/admin/themes/${theme.id}/preview`)
      .withGuard('web')
      .loginAs(user)
      .redirects(0)
    start.assertStatus(302)
    start.assertHeader('location', '/')

    const preview = await client
      .get('/')
      .withSession({ [THEME_PREVIEW_SESSION_KEY]: { themeId: theme.id, staff: true } })
    assert.include(preview.text(), 'akinai-section--image_banner')
    assert.include(preview.text(), 'Previewing')
    assert.match(preview.text(), /<body[^>]*>\s*<style[^>]*>\s*\.akinai-preview-bar/)
    assert.include(preview.text(), 'noindex')

    const customer = await client.get('/')
    assert.notInclude(customer.text(), 'akinai-section')
  })

  test('a share link starts a preview and a tampered link is refused', async ({
    client,
    assert,
  }) => {
    const user = await createAdminUser(['themes.view'])
    const theme = await dawnLite()

    const share = await client
      .post(`/admin/themes/${theme.id}/share`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    share.assertStatus(200)
    const url = new URL(share.body().data.url)

    const open = await client.get(url.pathname + url.search).redirects(0)
    open.assertStatus(302)
    open.assertHeader('location', '/')
    assert.deepEqual(open.session(THEME_PREVIEW_SESSION_KEY), { themeId: theme.id, staff: false })

    const tampered = await client.get(`/themes/preview/${theme.id}?signature=nope`).redirects(0)
    tampered.assertStatus(410)
  })

  test('editor section_id returns one section without the full layout', async ({
    client,
    assert,
  }) => {
    const user = await createAdminUser(['themes.edit'])
    const theme = await dawnLite()
    await publish(theme)

    const response = await client
      .get('/?section_id=banner')
      .withGuard('web')
      .loginAs(user)
      .withSession({ [THEME_EDITOR_SESSION_KEY]: { themeId: theme.id } })

    response.assertStatus(200)
    const html = response.text()
    assert.include(html, 'akinai-section--image_banner')
    assert.notInclude(html, '<html')
  })

  test('editor data lists installed plugin app blocks', async ({ client, assert }) => {
    const user = await createAdminUser(['themes.edit'])
    const theme = await dawnLite()

    const response = await client
      .get(`/admin/themes/${theme.id}/editor/data`)
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    const plugins = response.body().data.installedPlugins as { key: string; appBlocks: unknown[] }[]
    assert.isTrue(plugins.some((plugin) => plugin.key === 'hero_slideshow'))
    assert.isAbove(
      plugins.find((plugin) => plugin.key === 'hero_slideshow')?.appBlocks.length ?? 0,
      0
    )
  })

  test('exiting the preview clears it', async ({ client, assert }) => {
    const theme = await dawnLite()

    const response = await client
      .get('/themes/preview/exit')
      .withSession({ [THEME_PREVIEW_SESSION_KEY]: { themeId: theme.id, staff: false } })
      .redirects(0)

    response.assertStatus(302)
    assert.isUndefined(response.session(THEME_PREVIEW_SESSION_KEY))
  })
})
