import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import StoreSettingService from '#services/store_setting_service'
import { createAdminUser } from '#tests/helpers/admin'

const URL = '/admin/settings/checkout'

const payload = {
  checkoutDeliveryHeading: 'Where should we deliver in the Philippines?',
  checkoutDeliveryNote: 'Add your family member’s address in Manila.',
}

test.group('Admin store settings: checkout delivery message', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(20_000)

  test('saves the heading and note', async ({ client, assert }) => {
    const user = await createAdminUser(['store_settings.view', 'store_settings.edit'])

    const response = await client
      .put(URL)
      .json(payload)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({ data: payload })
    const settings = await (await app.container.make(StoreSettingService)).get()
    assert.equal(settings.checkoutDeliveryHeading, payload.checkoutDeliveryHeading)
    assert.equal(settings.checkoutDeliveryNote, payload.checkoutDeliveryNote)
  })

  test('the storefront settings endpoint returns the message', async ({ client }) => {
    const settingsService = await app.container.make(StoreSettingService)
    await settingsService.updateCheckout(payload)

    const response = await client.get('/store/settings').accept('json')

    response.assertStatus(200)
    response.assertBodyContains({ data: payload })
  })

  test('blank fields are stored as null so the defaults show', async ({ client, assert }) => {
    const user = await createAdminUser(['store_settings.view', 'store_settings.edit'])
    const settingsService = await app.container.make(StoreSettingService)
    await settingsService.updateCheckout(payload)

    const response = await client
      .put(URL)
      .json({ checkoutDeliveryHeading: '   ', checkoutDeliveryNote: null })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    assert.isNull(response.body().data.checkoutDeliveryHeading)
    assert.isNull(response.body().data.checkoutDeliveryNote)
  })

  test('rejects text that is too long', async ({ client }) => {
    const user = await createAdminUser(['store_settings.view', 'store_settings.edit'])

    const response = await client
      .put(URL)
      .json({ checkoutDeliveryHeading: 'a'.repeat(121), checkoutDeliveryNote: 'b'.repeat(501) })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [{ field: 'checkoutDeliveryHeading' }, { field: 'checkoutDeliveryNote' }],
    })
  })

  test('rejects values that are not strings', async ({ client }) => {
    const user = await createAdminUser(['store_settings.view', 'store_settings.edit'])

    const response = await client
      .put(URL)
      .json({ checkoutDeliveryHeading: 123, checkoutDeliveryNote: true })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('staff without store_settings.edit get 403', async ({ client }) => {
    const user = await createAdminUser(['store_settings.view'])

    const response = await client
      .put(URL)
      .json(payload)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })

  test('guests are rejected', async ({ client }) => {
    const response = await client.put(URL).json(payload).accept('json').withCsrfToken()

    response.assertStatus(401)
  })
})
