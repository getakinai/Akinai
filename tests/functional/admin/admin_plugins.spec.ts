import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import PluginInstallation from '#models/plugin_installation'
import { createAdminUser } from '#tests/helpers/admin'

async function uninstallHero() {
  await PluginInstallation.query().where('key', 'hero_slideshow').update({ is_installed: false })
}

test.group('Staff plugins: marketplace', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('lists bundled plugins with their installed state', async ({ client, assert }) => {
    const user = await createAdminUser(['plugins.view'])

    const response = await client
      .get('/admin/plugins/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    const hero = response
      .body()
      .data.find((plugin: { key: string }) => plugin.key === 'hero_slideshow')
    assert.isTrue(hero.isInstalled)
    assert.deepEqual(hero.slots, ['home.hero'])
    assert.equal(hero.adminRoute, 'admin.storefront_hero.home')
  })

  test('needs plugins.view to list', async ({ client }) => {
    const user = await createAdminUser(['storefront.view'])

    const response = await client
      .get('/admin/plugins/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })
})

test.group('Staff plugins: install and uninstall', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('uninstalls and reinstalls a plugin', async ({ client, assert }) => {
    const user = await createAdminUser(['plugins.view', 'plugins.edit'])

    const uninstall = await client
      .delete('/admin/plugins/hero_slideshow/install')
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    uninstall.assertStatus(204)
    let row = await PluginInstallation.findByOrFail('key', 'hero_slideshow')
    assert.isFalse(row.isInstalled)

    const install = await client
      .post('/admin/plugins/hero_slideshow/install')
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    install.assertStatus(204)
    row = await PluginInstallation.findByOrFail('key', 'hero_slideshow')
    assert.isTrue(row.isInstalled)
  })

  test('needs plugins.edit', async ({ client, assert }) => {
    const user = await createAdminUser(['plugins.view'])

    const response = await client
      .delete('/admin/plugins/hero_slideshow/install')
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
    const row = await PluginInstallation.findByOrFail('key', 'hero_slideshow')
    assert.isTrue(row.isInstalled)
  })

  test('rejects unknown plugin keys', async ({ client }) => {
    const user = await createAdminUser(['plugins.edit'])

    const response = await client
      .post('/admin/plugins/not_a_plugin/install')
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })
})

test.group('Plugins: route gating', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('the storefront lists installed plugins', async ({ client }) => {
    const response = await client.get('/store/plugins').accept('json')

    response.assertStatus(200)
    response.assertBodyContains({ data: [{ key: 'hero_slideshow', slots: ['home.hero'] }] })
  })

  test('an uninstalled plugin is left out of the storefront list', async ({ client, assert }) => {
    await uninstallHero()

    const response = await client.get('/store/plugins').accept('json')

    response.assertStatus(200)
    const keys = response.body().data.map((plugin: { key: string }) => plugin.key)
    assert.notInclude(keys, 'hero_slideshow')
  })

  test('hero routes return 404 while the hero slideshow is uninstalled', async ({ client }) => {
    await uninstallHero()
    const user = await createAdminUser(['storefront.view'])

    const publicResponse = await client.get('/store/hero-slides').accept('json')
    publicResponse.assertStatus(404)

    const adminResponse = await client
      .get('/admin/storefront/hero-slides/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)
    adminResponse.assertStatus(404)
  })
})
