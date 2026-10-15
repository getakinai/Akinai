import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import StorefrontFeature from '#models/storefront_feature'
import StorefrontFeatureService from '#services/storefront_feature_service'

async function makeService() {
  return app.container.make(StorefrontFeatureService)
}

test.group('StorefrontFeatureService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('replace swaps the whole list and numbers positions in order', async ({ assert }) => {
    const service = await makeService()
    await service.replace([{ icon: 'gift', title: 'Old', text: 'Old text' }])

    const saved = await service.replace([
      { icon: 'truck', title: 'Delivery', text: 'To your door' },
      { icon: 'heart', title: 'Care', text: 'Packed with care' },
    ])

    assert.deepEqual(
      saved.map(({ title, position }) => [title, position]),
      [
        ['Delivery', 0],
        ['Care', 1],
      ]
    )
    const stored = await StorefrontFeature.query().orderBy('position', 'asc')
    assert.deepEqual(
      stored.map(({ title }) => title),
      ['Delivery', 'Care']
    )
  })

  test('replace with an empty list clears the features', async ({ assert }) => {
    const service = await makeService()
    await service.replace([{ icon: 'gift', title: 'Old', text: 'Old text' }])

    const saved = await service.replace([])

    assert.lengthOf(saved, 0)
    assert.lengthOf(await service.list(), 0)
  })

  test('list returns features in position order', async ({ assert }) => {
    const service = await makeService()
    await StorefrontFeature.createMany([
      { icon: 'star', title: 'B', text: 'b', position: 1 },
      { icon: 'star', title: 'A', text: 'a', position: 0 },
    ])

    const list = await service.list()

    assert.deepEqual(
      list.map(({ title }) => title),
      ['A', 'B']
    )
  })
})
