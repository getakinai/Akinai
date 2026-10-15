import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import drive from '@adonisjs/drive/services/main'
import sharp from 'sharp'
import Collection, { type CollectionStatus } from '#models/collection'
import type Product from '#models/product'
import ProductReview from '#models/product_review'
import StorefrontFeature from '#models/storefront_feature'
import StorefrontPromoBanner from '#models/storefront_promo_banner'
import type User from '#models/user'
import {
  MAX_FEATURES,
  MAX_PROMO_BANNERS_PER_PLACEMENT,
  type PromoPlacement,
} from '#constants/storefront'
import { createAdminUser } from '#tests/helpers/admin'
import { createTestProduct } from '#tests/helpers/collections'
import { createCustomerAccount } from '#tests/helpers/customers'

let sequence = 0

async function createCollection(status: CollectionStatus = 'active') {
  sequence++
  return Collection.create({
    title: `Promo collection ${sequence}`,
    slug: `promo-collection-${sequence}-${Date.now()}`,
    description: null,
    type: 'manual',
    match: 'all',
    sortOrder: 'manual',
    seoTitle: null,
    seoDescription: null,
    status,
    archivedAt: null,
  })
}

async function pngBuffer() {
  return sharp({ create: { width: 8, height: 8, channels: 3, background: '#14532d' } })
    .png()
    .toBuffer()
}

function bannerPayload(extra: Record<string, unknown> = {}) {
  return {
    placement: 'home_middle',
    eyebrow: 'This week',
    title: 'Seasonal favourites',
    buttonLabel: 'Shop now',
    tone: 'primary',
    type: 'url',
    collectionId: null,
    url: '/sale',
    isVisible: true,
    ...extra,
  }
}

async function seedBanner(data: Partial<StorefrontPromoBanner> = {}) {
  const placement: PromoPlacement = data.placement ?? 'home_middle'
  const count = await StorefrontPromoBanner.query()
    .where('placement', placement)
    .count('* as total')
    .first()
  return StorefrontPromoBanner.create({
    placement,
    eyebrow: null,
    title: 'Seeded banner',
    buttonLabel: null,
    tone: 'primary',
    type: 'url',
    collectionId: null,
    url: '/sale',
    image: null,
    position: Number(count?.$extras.total ?? 0),
    isVisible: true,
    ...data,
  })
}

async function seedReview(
  product: Product,
  data: Partial<ProductReview> = {},
  fullName: string | null = 'Maria Santos'
) {
  const { customer } = await createCustomerAccount({ fullName })
  return ProductReview.create({
    productId: product.id,
    customerId: customer.id,
    rating: 5,
    title: 'Great',
    body: 'Arrived quickly and well packed.',
    isHidden: false,
    isFeatured: false,
    ...data,
  })
}

async function storeBanner(client: ApiClient, user: User, payload: Record<string, unknown>) {
  return client
    .post('/admin/storefront/promo-banners')
    .json(payload)
    .accept('json')
    .withCsrfToken()
    .withGuard('web')
    .loginAs(user)
}

async function expectStatus(
  request: PromiseLike<{ assertStatus: (status: number) => void }>,
  status: number
) {
  const response = await request
  response.assertStatus(status)
}

function totalOf(row: { $extras: Record<string, unknown> } | null) {
  return Number(row?.$extras.total ?? 0)
}

test.group('Staff storefront content: announcement and footer', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('saves the announcement and footer tagline', async ({ client, assert }) => {
    const user = await createAdminUser(['storefront.view', 'storefront.edit'])

    const response = await client
      .put('/admin/storefront/content')
      .json({
        announcementText: '  Free delivery over $50  ',
        announcementUrl: '/collections/sale',
        footerTagline: 'Local goods, delivered.',
      })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    const data = response.body().data
    assert.equal(data.announcementText, 'Free delivery over $50')
    assert.equal(data.announcementUrl, '/collections/sale')
    assert.equal(data.footerTagline, 'Local goods, delivered.')

    const theme = await client.get('/store/theme').accept('json')
    assert.equal(theme.body().data.announcementText, 'Free delivery over $50')
    assert.equal(theme.body().data.footerTagline, 'Local goods, delivered.')
  })

  test('clears blank texts and drops the link without an announcement', async ({
    client,
    assert,
  }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .put('/admin/storefront/content')
      .json({ announcementText: '   ', announcementUrl: '/sale', footerTagline: '' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    const data = response.body().data
    assert.isNull(data.announcementText)
    assert.isNull(data.announcementUrl)
    assert.isNull(data.footerTagline)
  })

  test('validates lengths and the link', async ({ client }) => {
    const user = await createAdminUser('admin')
    const put = (body: Record<string, unknown>) =>
      client
        .put('/admin/storefront/content')
        .json(body)
        .accept('json')
        .withCsrfToken()
        .withGuard('web')
        .loginAs(user)

    await expectStatus(put({ announcementText: 'a'.repeat(161) }), 422)
    await expectStatus(put({ footerTagline: 'a'.repeat(201) }), 422)
    await expectStatus(
      put({ announcementText: 'Sale', announcementUrl: 'javascript:alert(1)' }),
      422
    )
  })

  test('forbids staff without storefront.edit', async ({ client }) => {
    const user = await createAdminUser(['storefront.view'])

    const response = await client
      .put('/admin/storefront/content')
      .json({ announcementText: 'Sale' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })
})

test.group('Staff storefront content: promo banners', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('lists banners for staff with storefront.view', async ({ client, assert }) => {
    const user = await createAdminUser(['storefront.view'])
    await seedBanner({ title: 'Middle' })
    await seedBanner({ title: 'Bottom', placement: 'home_bottom' })

    const response = await client
      .get('/admin/storefront/promo-banners/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    const titles = response.body().data.map((banner: { title: string }) => banner.title)
    assert.includeMembers(titles, ['Middle', 'Bottom'])
    assert.notProperty(response.body().data[0], 'image')
  })

  test('creates a banner at the end of its placement', async ({ client, assert }) => {
    const user = await createAdminUser(['storefront.view', 'storefront.create'])
    await seedBanner({ placement: 'home_middle' })

    const response = await storeBanner(client, user, bannerPayload({ tone: 'accent' }))

    response.assertStatus(201)
    const data = response.body().data
    assert.equal(data.placement, 'home_middle')
    assert.equal(data.tone, 'accent')
    assert.equal(data.position, 1)
    assert.isNull(data.imageUrl)
  })

  test('keeps only the collection target for collection banners', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const collection = await createCollection()

    const response = await storeBanner(
      client,
      user,
      bannerPayload({ type: 'collection', collectionId: collection.id, url: '/ignored' })
    )

    response.assertStatus(201)
    assert.equal(response.body().data.collectionId, collection.id)
    assert.isNull(response.body().data.url)
  })

  test('validates the title, tone, placement and link', async ({ client }) => {
    const user = await createAdminUser('admin')

    await expectStatus(storeBanner(client, user, bannerPayload({ title: '' })), 422)
    await expectStatus(storeBanner(client, user, bannerPayload({ tone: 'neon' })), 422)
    await expectStatus(storeBanner(client, user, bannerPayload({ placement: 'sidebar' })), 422)
    await expectStatus(
      storeBanner(client, user, bannerPayload({ url: 'javascript:alert(1)' })),
      422
    )
  })

  test('limits the banners per placement', async ({ client }) => {
    const user = await createAdminUser('admin')
    for (let index = 0; index < MAX_PROMO_BANNERS_PER_PLACEMENT; index++) {
      await seedBanner({ placement: 'home_middle', position: index })
    }

    const full = await storeBanner(client, user, bannerPayload())
    full.assertStatus(422)

    const otherPlacement = await storeBanner(
      client,
      user,
      bannerPayload({ placement: 'home_bottom' })
    )
    otherPlacement.assertStatus(201)
  })

  test('forbids creating without storefront.create', async ({ client }) => {
    const user = await createAdminUser(['storefront.view'])

    const response = await storeBanner(client, user, bannerPayload())

    response.assertStatus(403)
  })

  test('updates a banner', async ({ client, assert }) => {
    const user = await createAdminUser(['storefront.view', 'storefront.edit'])
    const banner = await seedBanner()

    const response = await client
      .put(`/admin/storefront/promo-banners/${banner.id}`)
      .json(bannerPayload({ title: 'Renamed', isVisible: false, url: 'https://example.com' }))
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    await banner.refresh()
    assert.equal(banner.title, 'Renamed')
    assert.isFalse(banner.isVisible)
    assert.equal(banner.url, 'https://example.com')
  })

  test('reorders one placement without touching the other', async ({ client, assert }) => {
    const user = await createAdminUser(['storefront.view', 'storefront.edit'])
    const first = await seedBanner({ position: 0 })
    const second = await seedBanner({ position: 1 })
    const bottom = await seedBanner({ placement: 'home_bottom', position: 0 })

    const response = await client
      .put('/admin/storefront/promo-banners/reorder')
      .json({ placement: 'home_middle', ids: [second.id, first.id] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(204)
    await Promise.all([first.refresh(), second.refresh(), bottom.refresh()])
    assert.equal(second.position, 0)
    assert.equal(first.position, 1)
    assert.equal(bottom.position, 0)
  })

  test('rejects a reorder that mixes placements', async ({ client }) => {
    const user = await createAdminUser('admin')
    const middle = await seedBanner({ position: 0 })
    const bottom = await seedBanner({ placement: 'home_bottom', position: 0 })

    const response = await client
      .put('/admin/storefront/promo-banners/reorder')
      .json({ placement: 'home_middle', ids: [bottom.id, middle.id] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('deletes a banner with storefront.archive only', async ({ client, assert }) => {
    const editor = await createAdminUser(['storefront.view', 'storefront.edit'])
    const archiver = await createAdminUser(['storefront.view', 'storefront.archive'])
    const banner = await seedBanner()
    const remove = (user: User) =>
      client
        .delete(`/admin/storefront/promo-banners/${banner.id}`)
        .accept('json')
        .withCsrfToken()
        .withGuard('web')
        .loginAs(user)

    await expectStatus(remove(editor), 403)
    await expectStatus(remove(archiver), 204)
    assert.isNull(await StorefrontPromoBanner.find(banner.id))
  })
})

test.group('Staff storefront content: promo banner image', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    drive.fake()
    return () => drive.restore()
  })

  test('uploads, replaces and removes the image', async ({ client, assert }) => {
    const user = await createAdminUser(['storefront.view', 'storefront.upload'])
    const banner = await seedBanner()
    const png = await pngBuffer()
    const upload = () =>
      client
        .post(`/admin/storefront/promo-banners/${banner.id}/image`)
        .file('image', png, { filename: 'promo.png' })
        .accept('json')
        .withCsrfToken()
        .withGuard('web')
        .loginAs(user)

    const first = await upload()
    first.assertStatus(200)
    await banner.refresh()
    const firstKey = banner.image!
    assert.isTrue(firstKey.startsWith('storefront/promos/'))
    assert.isTrue(await drive.use().exists(firstKey))
    assert.isString(first.body().data.imageUrl)

    await expectStatus(upload(), 200)
    await banner.refresh()
    assert.notEqual(banner.image, firstKey)
    assert.isFalse(await drive.use().exists(firstKey))

    const secondKey = banner.image!
    const removed = await client
      .delete(`/admin/storefront/promo-banners/${banner.id}/image`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    removed.assertStatus(200)
    assert.isNull(removed.body().data.imageUrl)
    assert.isFalse(await drive.use().exists(secondKey))
  })

  test('rejects files that are not images', async ({ client }) => {
    const user = await createAdminUser('admin')
    const banner = await seedBanner()

    const response = await client
      .post(`/admin/storefront/promo-banners/${banner.id}/image`)
      .file('image', Buffer.from('<svg></svg>'), { filename: 'promo.svg' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('forbids uploads without storefront.upload', async ({ client }) => {
    const user = await createAdminUser(['storefront.view', 'storefront.edit'])
    const banner = await seedBanner()

    const response = await client
      .post(`/admin/storefront/promo-banners/${banner.id}/image`)
      .file('image', await pngBuffer(), { filename: 'promo.png' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })
})

test.group('Staff storefront content: feature highlights', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const put = (client: ApiClient, user: User, items: unknown[]) =>
    client
      .put('/admin/storefront/features')
      .json({ items })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

  test('replaces the whole list in order', async ({ client, assert }) => {
    const user = await createAdminUser(['storefront.view', 'storefront.edit'])
    await StorefrontFeature.create({ icon: 'gift', title: 'Old', text: 'Old text', position: 0 })

    const response = await put(client, user, [
      { icon: 'truck', title: 'Delivery', text: 'To your door' },
      { icon: 'heart', title: 'Care', text: 'Packed with care' },
    ])

    response.assertStatus(200)
    assert.deepEqual(
      response.body().data.map((feature: { title: string }) => feature.title),
      ['Delivery', 'Care']
    )

    const list = await client
      .get('/admin/storefront/features/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)
    assert.deepEqual(
      list.body().data.map((feature: { position: number }) => feature.position),
      [0, 1]
    )
    assert.equal(totalOf(await StorefrontFeature.query().count('* as total').first()), 2)
  })

  test('an empty list clears the features', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    await StorefrontFeature.create({ icon: 'gift', title: 'Old', text: 'Old text', position: 0 })

    const response = await put(client, user, [])

    response.assertStatus(200)
    assert.lengthOf(response.body().data, 0)
  })

  test('validates the icon, texts and item limit', async ({ client }) => {
    const user = await createAdminUser('admin')
    const item = { icon: 'truck', title: 'Delivery', text: 'To your door' }

    await expectStatus(put(client, user, [{ ...item, icon: 'rocket' }]), 422)
    await expectStatus(put(client, user, [{ ...item, title: '' }]), 422)
    await expectStatus(put(client, user, [{ ...item, text: 'a'.repeat(121) }]), 422)
    await expectStatus(
      put(
        client,
        user,
        Array.from({ length: MAX_FEATURES + 1 }, () => item)
      ),
      422
    )
  })

  test('forbids staff without storefront.edit', async ({ client }) => {
    const user = await createAdminUser(['storefront.view'])

    const response = await put(client, user, [])

    response.assertStatus(403)
  })
})

test.group('Staff storefront content: featured reviews', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const setFlags = (client: ApiClient, user: User, review: ProductReview, body: object) =>
    client
      .put(`/admin/products/${review.productId}/reviews/${review.id}`)
      .json(body)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

  test('features a review and lists it on the content page', async ({ client, assert }) => {
    const user = await createAdminUser(['products.view', 'products.edit', 'storefront.view'])
    const product = await createTestProduct({ title: 'Featured product' })
    const review = await seedReview(product)

    const response = await setFlags(client, user, review, { isFeatured: true })

    response.assertStatus(200)
    assert.isTrue(response.body().data.isFeatured)

    const list = await client
      .get('/admin/storefront/featured-reviews/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)
    list.assertStatus(200)
    const [listed] = list.body().data
    assert.equal(listed.id, review.id)
    assert.equal(listed.product.title, 'Featured product')
  })

  test('hiding a review also unfeatures it', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const product = await createTestProduct({ title: 'Hide product' })
    const review = await seedReview(product, { isFeatured: true })

    const response = await setFlags(client, user, review, { isHidden: true })

    response.assertStatus(200)
    await review.refresh()
    assert.isTrue(review.isHidden)
    assert.isFalse(review.isFeatured)
  })

  test('rejects featuring a hidden review', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const product = await createTestProduct({ title: 'Hidden product' })
    const review = await seedReview(product, { isHidden: true })

    const response = await setFlags(client, user, review, { isFeatured: true })

    response.assertStatus(422)
    await review.refresh()
    assert.isFalse(review.isFeatured)
  })

  test('forbids featuring without products.edit', async ({ client }) => {
    const user = await createAdminUser(['products.view', 'storefront.view'])
    const product = await createTestProduct({ title: 'Forbidden product' })
    const review = await seedReview(product)

    const response = await setFlags(client, user, review, { isFeatured: true })

    response.assertStatus(403)
  })

  test('forbids the featured list without storefront.view', async ({ client }) => {
    const user = await createAdminUser(['products.view'])

    const response = await client
      .get('/admin/storefront/featured-reviews/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })
})

test.group('Storefront home content: public', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns empty sections when nothing is set up', async ({ client, assert }) => {
    const response = await client.get('/store/home-content').accept('json')

    response.assertStatus(200)
    assert.deepEqual(response.body().data, {
      middleBanners: [],
      bottomBanners: [],
      features: [],
      testimonials: [],
    })
  })

  test('returns visible banners with live targets, split by placement', async ({
    client,
    assert,
  }) => {
    const active = await createCollection('active')
    const draft = await createCollection('draft')
    await seedBanner({ title: 'Hidden', isVisible: false, position: 0 })
    await seedBanner({
      title: 'Draft collection',
      type: 'collection',
      collectionId: draft.id,
      url: null,
      position: 1,
    })
    await seedBanner({
      title: 'Active collection',
      type: 'collection',
      collectionId: active.id,
      url: null,
      position: 2,
    })
    await seedBanner({
      title: 'External',
      placement: 'home_bottom',
      url: 'https://example.com',
      position: 0,
    })

    const response = await client.get('/store/home-content').accept('json')

    response.assertStatus(200)
    const { middleBanners, bottomBanners } = response.body().data
    assert.deepEqual(
      middleBanners.map((banner: { title: string }) => banner.title),
      ['Active collection']
    )
    assert.equal(middleBanners[0].href, `/collections/${active.slug}`)
    assert.isFalse(middleBanners[0].isExternal)
    assert.notProperty(middleBanners[0], 'image')
    assert.notProperty(middleBanners[0], 'isVisible')
    assert.equal(bottomBanners[0].href, 'https://example.com')
    assert.isTrue(bottomBanners[0].isExternal)
  })

  test('returns the features in order', async ({ client, assert }) => {
    await StorefrontFeature.createMany([
      { icon: 'heart', title: 'Second', text: 'Two', position: 1 },
      { icon: 'truck', title: 'First', text: 'One', position: 0 },
    ])

    const response = await client.get('/store/home-content').accept('json')

    assert.deepEqual(
      response.body().data.features.map((feature: { title: string }) => feature.title),
      ['First', 'Second']
    )
  })

  test('shows only featured, visible reviews of active products, with masked names', async ({
    client,
    assert,
  }) => {
    const active = await createTestProduct({ title: 'Active product' })
    const draft = await createTestProduct({ title: 'Draft product', status: 'draft' })
    const shown = await seedReview(active, { isFeatured: true, body: 'Shown' }, 'Maria Santos')
    await seedReview(active, { isFeatured: false, body: 'Not featured' })
    await seedReview(active, { isFeatured: true, isHidden: true, body: 'Hidden' })
    await seedReview(draft, { isFeatured: true, body: 'Draft product' })

    const response = await client.get('/store/home-content').accept('json')

    response.assertStatus(200)
    const { testimonials } = response.body().data
    assert.lengthOf(testimonials, 1)
    const [testimonial] = testimonials
    assert.equal(testimonial.id, shown.id)
    assert.equal(testimonial.authorName, 'Maria S.')
    assert.deepEqual(testimonial.product, { title: 'Active product', slug: active.slug })
    assert.notProperty(testimonial, 'customer')
    assert.notProperty(testimonial, 'customerId')
    assert.notInclude(JSON.stringify(testimonial), '@example.com')
  })
})
