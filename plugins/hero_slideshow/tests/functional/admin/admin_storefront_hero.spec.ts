import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import drive from '@adonisjs/drive/services/main'
import sharp from 'sharp'
import Collection, { type CollectionStatus } from '#models/collection'
import Media from '#models/media'
import type User from '#models/user'
import { MAX_HERO_SLIDES } from '../../../server/constants.js'
import StorefrontHeroSlide from '../../../server/models/storefront_hero_slide.js'
import { createAdminUser } from '#tests/helpers/admin'

let sequence = 0

async function createCollection(status: CollectionStatus = 'active') {
  sequence++
  return Collection.create({
    title: `Hero collection ${sequence}`,
    slug: `hero-collection-${sequence}-${Date.now()}`,
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

function urlPayload(extra: Record<string, unknown> = {}) {
  return {
    eyebrow: 'Weekly deal',
    heading: 'Fresh picks',
    subheading: 'Picked and packed daily',
    buttonLabel: 'Shop deals',
    type: 'url',
    collectionId: null,
    url: '/sale',
    isVisible: true,
    ...extra,
  }
}

async function pngBuffer() {
  return sharp({ create: { width: 8, height: 4, channels: 3, background: '#14532d' } })
    .png()
    .toBuffer()
}

async function storeSlide(client: ApiClient, user: User, payload: Record<string, unknown>) {
  return client
    .post('/admin/storefront/hero-slides')
    .json(payload)
    .accept('json')
    .withCsrfToken()
    .withGuard('web')
    .loginAs(user)
}

async function seedSlide(data: Partial<StorefrontHeroSlide> = {}) {
  const count = await StorefrontHeroSlide.query().count('* as total').first()
  return StorefrontHeroSlide.create({
    eyebrow: null,
    heading: 'Seeded slide',
    subheading: null,
    buttonLabel: null,
    type: 'url',
    collectionId: null,
    url: '/sale',
    image: null,
    position: Number(count?.$extras.total ?? 0),
    isVisible: true,
    ...data,
  })
}

test.group('Staff storefront hero: list', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('lists slides in position order', async ({ client, assert }) => {
    const user = await createAdminUser(['storefront.view'])
    await seedSlide({ heading: 'Second', position: 1 })
    await seedSlide({ heading: 'First', position: 0 })

    const response = await client
      .get('/admin/storefront/hero-slides/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    assert.deepEqual(
      response.body().data.map((slide: { heading: string }) => slide.heading),
      ['First', 'Second']
    )
    assert.notProperty(response.body().data[0], 'image')
  })

  test('forbids staff without storefront.view', async ({ client }) => {
    const user = await createAdminUser(['products.view'])

    const response = await client
      .get('/admin/storefront/hero-slides/list')
      .accept('json')
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })

  test('requires a signed-in staff user', async ({ client }) => {
    const response = await client.get('/admin/storefront/hero-slides/list').accept('json')
    response.assertStatus(401)
  })
})

test.group('Staff storefront hero: store', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates a URL slide and appends it after the last one', async ({ client, assert }) => {
    const user = await createAdminUser(['storefront.view', 'storefront.create'])
    await seedSlide({ position: 0 })

    const response = await storeSlide(client, user, urlPayload())

    response.assertStatus(201)
    const data = response.body().data
    assert.equal(data.heading, 'Fresh picks')
    assert.equal(data.url, '/sale')
    assert.equal(data.position, 1)
    assert.isNull(data.imageUrl)
  })

  test('keeps only the collection target for collection slides', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const collection = await createCollection()

    const response = await storeSlide(
      client,
      user,
      urlPayload({ type: 'collection', collectionId: collection.id, url: '/ignored' })
    )

    response.assertStatus(201)
    const data = response.body().data
    assert.equal(data.collectionId, collection.id)
    assert.isNull(data.url)
    assert.equal(data.collection.title, collection.title)
  })

  test('turns blank optional texts into null', async ({ client, assert }) => {
    const user = await createAdminUser('admin')

    const response = await storeSlide(
      client,
      user,
      urlPayload({ eyebrow: '   ', subheading: '', buttonLabel: '' })
    )

    response.assertStatus(201)
    const data = response.body().data
    assert.isNull(data.eyebrow)
    assert.isNull(data.subheading)
    assert.isNull(data.buttonLabel)
  })

  test('validates the heading and the link target', async ({ client }) => {
    const user = await createAdminUser('admin')

    const missingHeading = await storeSlide(client, user, urlPayload({ heading: '' }))
    missingHeading.assertStatus(422)

    const missingCollection = await storeSlide(
      client,
      user,
      urlPayload({ type: 'collection', collectionId: null, url: null })
    )
    missingCollection.assertStatus(422)

    const badUrl = await storeSlide(client, user, urlPayload({ url: 'javascript:alert(1)' }))
    badUrl.assertStatus(422)

    const unknownCollection = await storeSlide(
      client,
      user,
      urlPayload({
        type: 'collection',
        collectionId: '0198e000-0000-7000-8000-000000000000',
        url: null,
      })
    )
    unknownCollection.assertStatus(422)
  })

  test('rejects a slide once the hero is full', async ({ client }) => {
    const user = await createAdminUser('admin')
    for (let index = 0; index < MAX_HERO_SLIDES; index++) await seedSlide({ position: index })

    const response = await storeSlide(client, user, urlPayload())

    response.assertStatus(422)
  })

  test('forbids staff without storefront.create', async ({ client }) => {
    const user = await createAdminUser(['storefront.view'])

    const response = await storeSlide(client, user, urlPayload())

    response.assertStatus(403)
  })
})

test.group('Staff storefront hero: update, reorder and delete', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('updates the texts, link and visibility', async ({ client, assert }) => {
    const user = await createAdminUser(['storefront.view', 'storefront.edit'])
    const slide = await seedSlide()

    const response = await client
      .put(`/admin/storefront/hero-slides/${slide.id}`)
      .json(urlPayload({ heading: 'Renamed', url: 'https://example.com', isVisible: false }))
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(200)
    await slide.refresh()
    assert.equal(slide.heading, 'Renamed')
    assert.equal(slide.url, 'https://example.com')
    assert.isFalse(slide.isVisible)
  })

  test('returns 404 for an unknown slide', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .put('/admin/storefront/hero-slides/0198e000-0000-7000-8000-000000000000')
      .json(urlPayload())
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(404)
  })

  test('reorders every slide in one request', async ({ client, assert }) => {
    const user = await createAdminUser(['storefront.view', 'storefront.edit'])
    const first = await seedSlide({ heading: 'A', position: 0 })
    const second = await seedSlide({ heading: 'B', position: 1 })

    const response = await client
      .put('/admin/storefront/hero-slides/reorder')
      .json({ ids: [second.id, first.id] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(204)
    await Promise.all([first.refresh(), second.refresh()])
    assert.equal(second.position, 0)
    assert.equal(first.position, 1)
  })

  test('rejects a reorder that does not list every slide', async ({ client }) => {
    const user = await createAdminUser('admin')
    const first = await seedSlide({ position: 0 })
    await seedSlide({ position: 1 })

    const response = await client
      .put('/admin/storefront/hero-slides/reorder')
      .json({ ids: [first.id] })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('deletes a slide', async ({ client, assert }) => {
    const user = await createAdminUser(['storefront.view', 'storefront.archive'])
    const slide = await seedSlide()

    const response = await client
      .delete(`/admin/storefront/hero-slides/${slide.id}`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(204)
    assert.isNull(await StorefrontHeroSlide.find(slide.id))
  })

  test('forbids deleting without storefront.archive', async ({ client }) => {
    const user = await createAdminUser(['storefront.view', 'storefront.edit'])
    const slide = await seedSlide()

    const response = await client
      .delete(`/admin/storefront/hero-slides/${slide.id}`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })
})

test.group('Staff storefront hero: image', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    drive.fake()
    return () => drive.restore()
  })

  test('uploads, replaces and removes the slide image, keeping old files in the gallery', async ({
    client,
    assert,
  }) => {
    const user = await createAdminUser(['storefront.view', 'storefront.upload'])
    const slide = await seedSlide()
    const png = await pngBuffer()

    const upload = () =>
      client
        .post(`/admin/storefront/hero-slides/${slide.id}/image`)
        .file('image', png, { filename: 'hero.png' })
        .accept('json')
        .withCsrfToken()
        .withGuard('web')
        .loginAs(user)

    const first = await upload()
    first.assertStatus(200)
    await slide.refresh()
    const firstKey = slide.image
    assert.isString(firstKey)
    assert.isTrue(firstKey!.startsWith('storefront/hero/'))
    assert.isTrue(await drive.use().exists(firstKey!))
    assert.isString(first.body().data.imageUrl)

    const second = await upload()
    second.assertStatus(200)
    await slide.refresh()
    assert.notEqual(slide.image, firstKey)
    assert.isTrue(await drive.use().exists(firstKey!))
    assert.isNotNull(await Media.findBy('key', firstKey))

    const secondKey = slide.image!
    const removed = await client
      .delete(`/admin/storefront/hero-slides/${slide.id}/image`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    removed.assertStatus(200)
    assert.isNull(removed.body().data.imageUrl)
    await slide.refresh()
    assert.isNull(slide.image)
    assert.isTrue(await drive.use().exists(secondKey))
  })

  test('rejects files that are not images', async ({ client }) => {
    const user = await createAdminUser('admin')
    const slide = await seedSlide()

    const response = await client
      .post(`/admin/storefront/hero-slides/${slide.id}/image`)
      .file('image', Buffer.from('<svg></svg>'), { filename: 'hero.svg' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('forbids uploads without storefront.upload', async ({ client }) => {
    const user = await createAdminUser(['storefront.view', 'storefront.edit'])
    const slide = await seedSlide()

    const response = await client
      .post(`/admin/storefront/hero-slides/${slide.id}/image`)
      .file('image', await pngBuffer(), { filename: 'hero.png' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(403)
  })

  test('deleting a slide keeps its image in the gallery', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const slide = await seedSlide()
    await client
      .post(`/admin/storefront/hero-slides/${slide.id}/image`)
      .file('image', await pngBuffer(), { filename: 'hero.png' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)
    await slide.refresh()
    const key = slide.image!

    const response = await client
      .delete(`/admin/storefront/hero-slides/${slide.id}`)
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(204)
    assert.isTrue(await drive.use().exists(key))
  })
})

test.group('Storefront hero slides: public list', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns visible slides with live targets, in order', async ({ client, assert }) => {
    const active = await createCollection('active')
    const draft = await createCollection('draft')
    await seedSlide({ heading: 'Hidden', isVisible: false, position: 0 })
    await seedSlide({
      heading: 'Draft collection',
      type: 'collection',
      collectionId: draft.id,
      url: null,
      position: 1,
    })
    await seedSlide({
      heading: 'Active collection',
      type: 'collection',
      collectionId: active.id,
      url: null,
      position: 2,
    })
    await seedSlide({ heading: 'External', url: 'https://example.com', position: 3 })

    const response = await client.get('/store/hero-slides').accept('json')

    response.assertStatus(200)
    const data = response.body().data
    assert.deepEqual(
      data.map((slide: { heading: string }) => slide.heading),
      ['Active collection', 'External']
    )
    assert.equal(data[0].href, `/collections/${active.slug}`)
    assert.isFalse(data[0].isExternal)
    assert.equal(data[1].href, 'https://example.com')
    assert.isTrue(data[1].isExternal)
    assert.notProperty(data[0], 'isVisible')
    assert.notProperty(data[0], 'image')
  })
})
