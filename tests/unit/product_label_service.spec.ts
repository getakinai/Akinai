import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import ProductLabel from '#models/product_label'
import ProductLabelService from '#services/product_label_service'
import { createTestProduct } from '#tests/helpers/collections'

test.group('ProductLabelService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('create trims the name and starts active', async ({ assert }) => {
    const service = await app.container.make(ProductLabelService)

    const label = await service.create({ name: '  Limited  ', color: 'purple' })

    assert.equal(label.name, 'Limited')
    assert.equal(label.color, 'purple')
    assert.isTrue(label.isActive)
  })

  test('update changes the name and color', async ({ assert }) => {
    const service = await app.container.make(ProductLabelService)
    const label = await service.create({ name: 'New', color: 'red' })

    const updated = await service.update(label, { name: ' Fresh ', color: 'green' })

    assert.equal(updated.name, 'Fresh')
    assert.equal(updated.color, 'green')
  })

  test('archive and unarchive toggle isActive', async ({ assert }) => {
    const service = await app.container.make(ProductLabelService)
    const label = await service.create({ name: 'Seasonal', color: 'orange' })

    assert.isFalse((await service.archive(label)).isActive)
    assert.isTrue((await service.unarchive(label)).isActive)
  })

  test('bulkSetArchived skips labels already in that state', async ({ assert }) => {
    const service = await app.container.make(ProductLabelService)
    const first = await service.create({ name: 'Bulk one', color: 'red' })
    const second = await service.create({ name: 'Bulk two', color: 'blue' })
    await service.archive(second)

    const result = await service.bulkSetArchived([first.id, second.id], true)

    assert.deepEqual(result, { updated: 1, skipped: 1 })
    const labels = await ProductLabel.query().whereIn('id', [first.id, second.id])
    assert.isTrue(labels.every((label) => !label.isActive))
  })

  test('findOrFail loads how many products use the label', async ({ assert }) => {
    const service = await app.container.make(ProductLabelService)
    const label = await service.create({ name: 'Counted', color: 'black' })
    const product = await createTestProduct({ title: 'Lamp' })
    await product.merge({ productLabelId: label.id }).save()

    const found = await service.findOrFail(label.id)

    assert.equal(Number(found.$extras.products_count), 1)
  })
})
