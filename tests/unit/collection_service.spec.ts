import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { errors as lucidErrors } from '@adonisjs/lucid'
import { errors } from '@vinejs/vine'
import CollectionProduct from '#models/collection_product'
import CollectionService, { ruleErrors } from '#services/collection_service'
import { normalizeTags } from '#services/product_service'
import { createTestProduct, createTestProducts } from '#tests/helpers/collections'

async function makeService() {
  return app.container.make(CollectionService)
}

async function entryOrder(collectionId: string) {
  const rows = await CollectionProduct.query()
    .where('collection_id', collectionId)
    .orderBy('position', 'asc')
  return rows.map(({ productId }) => productId)
}

test.group('ruleErrors', () => {
  test('accepts valid rules', ({ assert }) => {
    assert.deepEqual(
      ruleErrors([
        { field: 'tag', operator: 'equals', value: 'new' },
        { field: 'compare_at_price', operator: 'is_set', value: null },
        { field: 'variant_price', operator: 'less_than', value: '1000' },
      ]),
      []
    )
  })

  test('rejects an operator the field does not support', ({ assert }) => {
    const found = ruleErrors([{ field: 'tag', operator: 'greater_than', value: 'x' }])
    assert.deepEqual(
      found.map(({ field }) => field),
      ['rules.0.operator']
    )
  })

  test('requires a value unless the operator takes none', ({ assert }) => {
    const found = ruleErrors([
      { field: 'title', operator: 'contains', value: '  ' },
      { field: 'compare_at_price', operator: 'is_not_set', value: null },
    ])
    assert.deepEqual(
      found.map(({ field }) => field),
      ['rules.0.value']
    )
  })

  test('requires a non-negative number for numeric fields', ({ assert }) => {
    const found = ruleErrors([
      { field: 'variant_price', operator: 'greater_than', value: 'abc' },
      { field: 'inventory_available', operator: 'less_than', value: '-1' },
      { field: 'variant_price', operator: 'equals', value: '0' },
    ])
    assert.deepEqual(
      found.map(({ field }) => field),
      ['rules.0.value', 'rules.1.value']
    )
  })
})

test.group('normalizeTags', () => {
  test('trims, lowercases and de-duplicates in first-seen order', ({ assert }) => {
    assert.deepEqual(normalizeTags([' New ', 'sale', 'NEW', '', 'Sale ']), ['new', 'sale'])
  })
})

test.group('CollectionService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('defaults the sort order by type and normalizes rules', async ({ assert }) => {
    const service = await makeService()

    const automated = await service.create({
      type: 'automated',
      title: 'On Sale',
      description: null,
      status: 'draft',
      rules: [
        { field: 'compare_at_price', operator: 'is_set', value: 'ignored' },
        { field: 'tag', operator: 'equals', value: '  new  ' },
      ],
    })
    const manual = await service.create({
      type: 'manual',
      title: 'Staff Picks',
      description: null,
      status: 'draft',
    })

    const detail = await service.findDetail(automated.id)
    assert.equal(automated.sortOrder, 'best_selling')
    assert.equal(automated.match, 'all')
    assert.equal(manual.sortOrder, 'manual')
    assert.deepEqual(
      detail.rules.map(({ value }) => value),
      [null, 'new']
    )
  })

  test('generates unique slugs from the title', async ({ assert }) => {
    const service = await makeService()
    const input = {
      type: 'manual' as const,
      title: 'Gift Bundles',
      description: null,
      status: 'draft' as const,
    }

    const first = await service.create(input)
    const second = await service.create(input)

    assert.equal(first.slug, 'gift-bundles')
    assert.equal(second.slug, 'gift-bundles-2')
  })

  test('rejects a custom slug that is already taken', async ({ assert }) => {
    const service = await makeService()
    await service.create({
      type: 'manual',
      title: 'Picks',
      description: null,
      status: 'draft',
      slug: 'picks',
    })

    await assert.rejects(
      () =>
        service.create({
          type: 'manual',
          title: 'Other',
          description: null,
          status: 'draft',
          slug: 'Picks',
        }),
      errors.E_VALIDATION_ERROR
    )
  })

  test('rejects rules on manual collections and missing rules on automated ones', async ({
    assert,
  }) => {
    const service = await makeService()

    await assert.rejects(
      () =>
        service.create({
          type: 'manual',
          title: 'Manual',
          description: null,
          status: 'draft',
          rules: [{ field: 'tag', operator: 'equals', value: 'new' }],
        }),
      errors.E_VALIDATION_ERROR
    )
    await assert.rejects(
      () =>
        service.create({
          type: 'automated',
          title: 'Automated',
          description: null,
          status: 'draft',
          rules: [],
        }),
      errors.E_VALIDATION_ERROR
    )
  })

  test('rejects manual sorting for automated collections', async ({ assert }) => {
    const service = await makeService()

    await assert.rejects(
      () =>
        service.create({
          type: 'automated',
          title: 'Automated',
          description: null,
          status: 'draft',
          sortOrder: 'manual',
          rules: [{ field: 'tag', operator: 'equals', value: 'new' }],
        }),
      errors.E_VALIDATION_ERROR
    )
  })

  test('keeps the slug when only the title changes', async ({ assert }) => {
    const service = await makeService()
    const collection = await service.create({
      type: 'manual',
      title: 'Picks',
      description: null,
      status: 'draft',
    })

    const updated = await service.update(collection, {
      title: 'Staff Picks',
      description: null,
      status: 'active',
    })

    assert.equal(updated.slug, 'picks')
    assert.equal(updated.title, 'Staff Picks')
    assert.equal(updated.type, 'manual')
  })

  test('counts automated products from their rules', async ({ assert }) => {
    const service = await makeService()
    await createTestProduct({ title: 'A', tags: ['new'] })
    await createTestProduct({ title: 'B', tags: ['new'], status: 'archived' })
    await createTestProduct({ title: 'C' })
    const collection = await service.create({
      type: 'automated',
      title: 'New',
      description: null,
      status: 'draft',
      rules: [{ field: 'tag', operator: 'equals', value: 'new' }],
    })

    const detail = await service.findDetail(collection.id)

    assert.equal(detail.$extras.products_count, 1)
  })

  test('moves a product and renumbers the entries in between', async ({ assert }) => {
    const service = await makeService()
    const products = await createTestProducts(['A', 'B', 'C', 'D'])
    const ids = products.map(({ id }) => id)
    const collection = await service.create({
      type: 'manual',
      title: 'Picks',
      description: null,
      status: 'draft',
    })
    await service.addProducts(collection, ids)

    await service.moveProduct(collection, ids[3], 1)
    assert.deepEqual(await entryOrder(collection.id), [ids[0], ids[3], ids[1], ids[2]])

    await service.moveProduct(collection, ids[0], 99)
    assert.deepEqual(await entryOrder(collection.id), [ids[3], ids[1], ids[2], ids[0]])
  })

  test('keeps the order after a removal leaves a gap', async ({ assert }) => {
    const service = await makeService()
    const products = await createTestProducts(['A', 'B', 'C', 'D'])
    const ids = products.map(({ id }) => id)
    const collection = await service.create({
      type: 'manual',
      title: 'Picks',
      description: null,
      status: 'draft',
    })
    await service.addProducts(collection, ids)
    await service.removeProduct(collection, ids[1])

    await service.moveProduct(collection, ids[3], 0)

    assert.deepEqual(await entryOrder(collection.id), [ids[3], ids[0], ids[2]])
  })

  test('addProducts skips duplicates and unknown ids', async ({ assert }) => {
    const service = await makeService()
    const product = await createTestProduct({ title: 'A' })
    const collection = await service.create({
      type: 'manual',
      title: 'Picks',
      description: null,
      status: 'draft',
    })

    const added = await service.addProducts(collection, [
      product.id,
      product.id,
      '019a0000-0000-7000-8000-000000000000',
    ])
    const again = await service.addProducts(collection, [product.id])

    assert.equal(added, 1)
    assert.equal(again, 0)
  })

  test('throws not found when moving or removing a product outside the collection', async ({
    assert,
  }) => {
    const service = await makeService()
    const product = await createTestProduct({ title: 'A' })
    const collection = await service.create({
      type: 'manual',
      title: 'Picks',
      description: null,
      status: 'draft',
    })

    await assert.rejects(
      () => service.moveProduct(collection, product.id, 0),
      lucidErrors.E_ROW_NOT_FOUND
    )
    await assert.rejects(
      () => service.removeProduct(collection, product.id),
      lucidErrors.E_ROW_NOT_FOUND
    )
  })
})
