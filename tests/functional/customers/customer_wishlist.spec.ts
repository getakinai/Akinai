import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import type CustomerAccount from '#models/customer_account'
import Product from '#models/product'
import ProductLabel from '#models/product_label'
import WishlistItem, { MAX_WISHLIST_ITEMS } from '#models/wishlist_item'
import MarketService from '#services/market_service'
import { createTestProduct } from '#tests/helpers/collections'
import { createCustomerAccount } from '#tests/helpers/customers'

async function seedMarket() {
  const marketService = await app.container.make(MarketService)
  await marketService.ensurePrimary({
    name: 'New Zealand',
    currencyCode: 'NZD',
    pricesIncludeTax: true,
    countryCodes: ['NZ'],
  })
}

function save(client: any, account: CustomerAccount, productId: unknown) {
  return client
    .post('/account/wishlist')
    .json({ productId })
    .accept('json')
    .withCsrfToken()
    .withGuard('customer')
    .loginAs(account)
}

function remove(client: any, account: CustomerAccount, productId: string) {
  return client
    .delete(`/account/wishlist/${productId}`)
    .accept('json')
    .withCsrfToken()
    .withGuard('customer')
    .loginAs(account)
}

function get(client: any, account: CustomerAccount, url: string) {
  return client.get(url).accept('json').withGuard('customer').loginAs(account)
}

test.group('Customer wishlist: save and remove', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('saves a product once, even when saved twice', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    const product = await createTestProduct({ title: 'Candle' })

    const first = await save(client, account, product.id)
    const second = await save(client, account, product.id)

    first.assertStatus(201)
    second.assertStatus(201)
    const rows = await WishlistItem.query().where('customer_id', customer.id)
    assert.lengthOf(rows, 1)
    assert.equal(rows[0].productId, product.id)
  })

  test('lists saved product ids for the session customer only', async ({ client, assert }) => {
    const { account } = await createCustomerAccount()
    const { account: otherAccount } = await createCustomerAccount()
    const mine = await createTestProduct({ title: 'Mine' })
    const theirs = await createTestProduct({ title: 'Theirs' })
    await save(client, account, mine.id).then((response: any) => response.assertStatus(201))
    await save(client, otherAccount, theirs.id).then((response: any) => response.assertStatus(201))

    const response = await get(client, account, '/account/wishlist/ids')

    response.assertStatus(200)
    assert.deepEqual(response.body().data.productIds, [mine.id])
  })

  test('removes a saved product', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    const product = await createTestProduct({ title: 'Candle' })
    await save(client, account, product.id).then((response: any) => response.assertStatus(201))

    const response = await remove(client, account, product.id)

    response.assertStatus(204)
    assert.lengthOf(await WishlistItem.query().where('customer_id', customer.id), 0)
  })

  test("another customer can't remove my saved product (404)", async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    const { account: otherAccount } = await createCustomerAccount()
    const product = await createTestProduct({ title: 'Candle' })
    await save(client, account, product.id).then((response: any) => response.assertStatus(201))

    const response = await remove(client, otherAccount, product.id)

    response.assertStatus(404)
    assert.lengthOf(await WishlistItem.query().where('customer_id', customer.id), 1)
  })

  test('draft and unknown products are a 404', async ({ client }) => {
    const { account } = await createCustomerAccount()
    const draft = await createTestProduct({ title: 'Hidden', status: 'draft' })

    const drafted = await save(client, account, draft.id)
    const unknown = await save(client, account, '0190a3c2-0000-7000-8000-000000000000')

    drafted.assertStatus(404)
    unknown.assertStatus(404)
  })

  test('rejects a product id that is not a uuid', async ({ client }) => {
    const { account } = await createCustomerAccount()

    const invalid = await save(client, account, 'not-a-uuid')
    const numeric = await save(client, account, 12)

    invalid.assertStatus(422)
    numeric.assertStatus(422)
  })

  test('rejects saving past the wishlist limit', async ({ client, assert }) => {
    const { account, customer } = await createCustomerAccount()
    const extra = await createTestProduct({ title: 'Extra' })
    const stamp = Date.now()
    const products = await Product.createMany(
      Array.from({ length: MAX_WISHLIST_ITEMS }, (_, index) => ({
        title: `Filler ${index}`,
        slug: `wishlist-filler-${stamp}-${index}`,
        description: null,
        status: 'active' as const,
      }))
    )
    await WishlistItem.createMany(
      products.map((product) => ({ customerId: customer.id, productId: product.id }))
    )

    const response = await save(client, account, extra.id)

    response.assertStatus(422)
    assert.lengthOf(
      await WishlistItem.query().where('customer_id', customer.id),
      MAX_WISHLIST_ITEMS
    )
  })

  test('guests get 401', async ({ client }) => {
    const product = await createTestProduct({ title: 'Candle' })

    const ids = await client.get('/account/wishlist/ids').accept('json')
    const store = await client
      .post('/account/wishlist')
      .json({ productId: product.id })
      .accept('json')
      .withCsrfToken()
    const list = await client.get('/account/wishlist/list').accept('json')

    ids.assertStatus(401)
    store.assertStatus(401)
    list.assertStatus(401)
  })

  test('guests are redirected away from the wishlist page', async ({ client }) => {
    const response = await client.get('/account/wishlist').redirects(0)

    response.assertStatus(302)
  })
})

test.group('Customer wishlist: list', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('lists saved active products as cards, newest first', async ({ client, assert }) => {
    await seedMarket()
    const { account } = await createCustomerAccount()
    const label = await ProductLabel.create({ name: 'Hot', color: 'red', isActive: true })
    const older = await createTestProduct({ title: 'Older', price: 12 })
    const newer = await createTestProduct({ title: 'Newer', price: 30 })
    await newer.merge({ productLabelId: label.id }).save()
    await save(client, account, older.id).then((response: any) => response.assertStatus(201))
    await save(client, account, newer.id).then((response: any) => response.assertStatus(201))

    const response = await get(client, account, '/account/wishlist/list')

    response.assertStatus(200)
    const cards = response.body().data
    assert.deepEqual(
      cards.map((card: { title: string }) => card.title),
      ['Newer', 'Older']
    )
    assert.deepEqual(cards[0].label, { name: 'Hot', color: 'red' })
    assert.isNull(cards[1].label)
  })

  test('hides products that were archived after saving', async ({ client, assert }) => {
    await seedMarket()
    const { account } = await createCustomerAccount()
    const product = await createTestProduct({ title: 'Gone soon' })
    await save(client, account, product.id).then((response: any) => response.assertStatus(201))
    await product.merge({ status: 'archived' }).save()

    const list = await get(client, account, '/account/wishlist/list')
    const ids = await get(client, account, '/account/wishlist/ids')

    assert.lengthOf(list.body().data, 0)
    assert.lengthOf(ids.body().data.productIds, 0)
  })

  test("doesn't list other customers' saved products", async ({ client, assert }) => {
    await seedMarket()
    const { account } = await createCustomerAccount()
    const { account: otherAccount } = await createCustomerAccount()
    const product = await createTestProduct({ title: 'Theirs' })
    await save(client, otherAccount, product.id).then((response: any) => response.assertStatus(201))

    const response = await get(client, account, '/account/wishlist/list')

    response.assertStatus(200)
    assert.lengthOf(response.body().data, 0)
  })
})

test.group('Customer wishlist: activity', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('removing a product shows in my activity without ids', async ({ client, assert }) => {
    const { account } = await createCustomerAccount()
    const { account: otherAccount } = await createCustomerAccount()
    const product = await createTestProduct({ title: 'Scented candle' })
    await save(client, account, product.id).then((response: any) => response.assertStatus(201))
    await remove(client, account, product.id).then((response: any) => response.assertStatus(204))

    const mine = await get(client, account, '/account/activity/list')
    const theirs = await get(client, otherAccount, '/account/activity/list')

    const [entry] = mine.body().data
    assert.equal(entry.action, 'deleted')
    assert.equal(entry.auditableType, 'WishlistItem')
    assert.equal(entry.auditableLabel, 'Scented candle')
    assert.notProperty(entry, 'auditableId')
    assert.notProperty(entry.changes.before, 'productId')
    assert.notProperty(entry.changes.before, 'customerId')
    assert.lengthOf(theirs.body().data, 0)
  })
})
