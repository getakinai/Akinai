import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { createAdminUser } from '#tests/helpers/admin'

test.group('Storefront home', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('redirects to first-run setup while no staff User exists', async ({ client }) => {
    const response = await client.get('/').redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/admin/setup')
  })

  test('does not redirect to setup once a staff User exists', async ({ client, assert }) => {
    await createAdminUser('admin')

    const response = await client.get('/').redirects(0)

    assert.notEqual(response.header('location'), '/admin/setup')
  })
})
