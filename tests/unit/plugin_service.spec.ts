import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import PluginInstallation from '#models/plugin_installation'
import PluginService from '#services/plugin_service'

async function makeService() {
  return app.container.make(PluginService)
}

test.group('PluginService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('the hero slideshow is installed out of the box', async ({ assert }) => {
    const service = await makeService()

    assert.isTrue(await service.isInstalled('hero_slideshow'))
    assert.include(await service.installedKeys(), 'hero_slideshow')
  })

  test('a plugin without a row falls back to its default', async ({ assert }) => {
    await PluginInstallation.query().where('key', 'hero_slideshow').delete()
    const service = await makeService()

    const catalog = await service.catalog()
    const hero = catalog.find((plugin) => plugin.key === 'hero_slideshow')

    assert.isTrue(hero?.isInstalled)
    assert.isNull(hero?.installedAt)
  })

  test('uninstall and install toggle the stored state', async ({ assert }) => {
    const service = await makeService()

    await service.uninstall('hero_slideshow')
    assert.isFalse(await service.isInstalled('hero_slideshow'))
    assert.notInclude(await service.installedKeys(), 'hero_slideshow')

    await service.install('hero_slideshow')
    assert.isTrue(await service.isInstalled('hero_slideshow'))

    const rows = await PluginInstallation.query().where('key', 'hero_slideshow')
    assert.lengthOf(rows, 1)
    assert.isNotNull(rows[0].installedAt)
  })

  test('unknown plugins are never installed', async ({ assert }) => {
    const service = await makeService()

    assert.isFalse(await service.isInstalled('not_a_plugin'))
  })
})
