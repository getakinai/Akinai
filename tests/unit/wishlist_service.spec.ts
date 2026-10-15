import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import BusinessRuleException from '#exceptions/business_rule_exception'
import Product from '#models/product'
import WishlistItem, { MAX_WISHLIST_ITEMS } from '#models/wishlist_item'
import MarketService from '#services/market_service'
import WishlistService from '#services/wishlist_service'
import { createTestProduct } from '#tests/helpers/collections'
import { createCustomerAccount } from '#tests/helpers/customers'

test.group('WishlistService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(10_000)

  test('add is idempotent and productIdsFor lists newest first', async ({ assert }) => {
    const service = await app.container.make(WishlistService)
    const { customer } = await createCustomerAccount()
    const first = await createTestProduct({ title: 'First' })
    const second = await createTestProduct({ title: 'Second' })

    await service.add(customer.id, first.id)
    await service.add(customer.id, first.id)
    await new Promise((resolve) => setTimeout(resolve, 5))
    await service.add(customer.id, second.id)

    assert.deepEqual(await service.productIdsFor(customer.id), [second.id, first.id])
  })

  test('add rejects draft, archived and unknown products', async ({ assert }) => {
    const service = await app.container.make(WishlistService)
    const { customer } = await createCustomerAccount()
    const draft = await createTestProduct({ title: 'Draft', status: 'draft' })
    const archived = await createTestProduct({ title: 'Archived', status: 'archived' })

    for (const productId of [draft.id, archived.id, '0190a3c2-0000-7000-8000-000000000000']) {
      await assert.rejects(() => service.add(customer.id, productId))
    }
    assert.lengthOf(await WishlistItem.query().where('customer_id', customer.id), 0)
  })

  test('add throws a business rule error when the wishlist is full', async ({ assert }) => {
    const service = await app.container.make(WishlistService)
    const { customer } = await createCustomerAccount()
    const stamp = Date.now()
    const products = await Product.createMany(
      Array.from({ length: MAX_WISHLIST_ITEMS }, (_, index) => ({
        title: `Filler ${index}`,
        slug: `wishlist-unit-filler-${stamp}-${index}`,
        description: null,
        status: 'active' as const,
      }))
    )
    await WishlistItem.createMany(
      products.map((product) => ({ customerId: customer.id, productId: product.id }))
    )
    const extra = await createTestProduct({ title: 'Extra' })

    try {
      await service.add(customer.id, extra.id)
      assert.fail('Expected the wishlist limit to be enforced')
    } catch (error) {
      assert.instanceOf(error, BusinessRuleException)
    }
  })

  test('remove only deletes the session customer’s item', async ({ assert }) => {
    const service = await app.container.make(WishlistService)
    const { customer } = await createCustomerAccount()
    const { customer: other } = await createCustomerAccount()
    const product = await createTestProduct({ title: 'Shared' })
    await service.add(customer.id, product.id)
    await service.add(other.id, product.id)

    await service.remove(customer.id, product.id)

    assert.deepEqual(await service.productIdsFor(customer.id), [])
    assert.deepEqual(await service.productIdsFor(other.id), [product.id])
    await assert.rejects(() => service.remove(customer.id, product.id))
  })

  test('paginateFor returns active product cards in saved order', async ({ assert }) => {
    const service = await app.container.make(WishlistService)
    const marketService = await app.container.make(MarketService)
    const market = await marketService.ensurePrimary({
      name: 'New Zealand',
      currencyCode: 'NZD',
      pricesIncludeTax: true,
      countryCodes: ['NZ'],
    })
    const { customer } = await createCustomerAccount()
    const older = await createTestProduct({ title: 'Older', price: 10 })
    const newer = await createTestProduct({ title: 'Newer', price: 20 })
    const hidden = await createTestProduct({ title: 'Hidden' })
    await service.add(customer.id, older.id)
    await new Promise((resolve) => setTimeout(resolve, 5))
    await service.add(customer.id, hidden.id)
    await new Promise((resolve) => setTimeout(resolve, 5))
    await service.add(customer.id, newer.id)
    await hidden.merge({ status: 'draft' }).save()

    const { products, meta } = await service.paginateFor(customer.id, 1, market)

    assert.deepEqual(
      products.map(({ title }) => title),
      ['Newer', 'Older']
    )
    assert.equal(meta.total, 2)
  })
})
