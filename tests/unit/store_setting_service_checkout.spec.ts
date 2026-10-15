import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import StoreSettingService from '#services/store_setting_service'

test.group('StoreSettingService: checkout delivery message', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('starts empty so the storefront shows its defaults', async ({ assert }) => {
    const service = await app.container.make(StoreSettingService)

    const settings = await service.get()

    assert.isNull(settings.checkoutDeliveryHeading)
    assert.isNull(settings.checkoutDeliveryNote)
  })

  test('updateCheckout saves and clears the message', async ({ assert }) => {
    const service = await app.container.make(StoreSettingService)

    await service.updateCheckout({
      checkoutDeliveryHeading: 'Delivery in the Philippines',
      checkoutDeliveryNote: 'Your family’s address',
    })
    const saved = await service.get()
    await service.updateCheckout({ checkoutDeliveryHeading: null, checkoutDeliveryNote: null })
    const cleared = await service.get()

    assert.equal(saved.checkoutDeliveryHeading, 'Delivery in the Philippines')
    assert.equal(saved.checkoutDeliveryNote, 'Your family’s address')
    assert.isNull(cleared.checkoutDeliveryHeading)
    assert.isNull(cleared.checkoutDeliveryNote)
  })
})
