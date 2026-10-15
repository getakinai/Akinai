import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import limiter from '@adonisjs/limiter/services/main'
import PluginInstallation from '#models/plugin_installation'
import { createAdminUser } from '#tests/helpers/admin'

type NavPlugin = {
  key: string
  category: string
  adminRoute: string | null
  adminPermission: string | null
}

async function uninstallNewsletter() {
  await PluginInstallation.updateOrCreate({ key: 'newsletter' }, { isInstalled: false })
}

test.group('Newsletter plugin: installation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => limiter.clear(['memory']))

  test('is installed by default and fills the footer slot', async ({ client }) => {
    const response = await client.get('/store/plugins').accept('json')

    response.assertStatus(200)
    response.assertBodyContains({ data: [{ key: 'newsletter', slots: ['layout.footer'] }] })
  })

  test('an uninstalled newsletter is left out of the storefront list', async ({
    client,
    assert,
  }) => {
    await uninstallNewsletter()

    const response = await client.get('/store/plugins').accept('json')

    response.assertStatus(200)
    const keys = response.body().data.map((plugin: { key: string }) => plugin.key)
    assert.notInclude(keys, 'newsletter')
  })

  test('signup routes return 404 while uninstalled', async ({ client }) => {
    await uninstallNewsletter()

    for (const url of ['/newsletter', '/maintenance/newsletter']) {
      const response = await client
        .post(url)
        .json({ email: 'reader@example.com' })
        .accept('json')
        .withCsrfToken()
      response.assertStatus(404)
    }
  })

  test('admin routes return 404 while uninstalled', async ({ client }) => {
    await uninstallNewsletter()
    const user = await createAdminUser(['newsletter_subscribers.view'])

    const response = await client
      .get('/admin/marketing/newsletter/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(404)
  })
})

test.group('Newsletter plugin: admin sidebar', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('the nav list puts the newsletter under marketing', async ({ client, assert }) => {
    const user = await createAdminUser([])

    const response = await client
      .get('/admin/plugins/nav')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    const newsletter = response.body().data.find((plugin: NavPlugin) => plugin.key === 'newsletter')
    assert.deepInclude(newsletter, {
      category: 'marketing',
      adminRoute: 'admin.newsletter_subscribers.home',
      adminPermission: 'newsletter_subscribers.view',
    })
  })

  test('the nav list omits the newsletter while uninstalled', async ({ client, assert }) => {
    await uninstallNewsletter()
    const user = await createAdminUser([])

    const response = await client
      .get('/admin/plugins/nav')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    const keys = response.body().data.map((plugin: NavPlugin) => plugin.key)
    assert.notInclude(keys, 'newsletter')
  })
})
