import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { errors } from '@vinejs/vine'
import Collection from '#models/collection'
import StorefrontPromoBanner from '#models/storefront_promo_banner'
import { MAX_PROMO_BANNERS_PER_PLACEMENT } from '#constants/storefront'
import StorefrontPromoBannerService from '#services/storefront_promo_banner_service'

async function makeService() {
  return app.container.make(StorefrontPromoBannerService)
}

async function createCollection(status: 'active' | 'draft' = 'active') {
  return Collection.create({
    title: 'Unit promo collection',
    slug: `unit-promo-collection-${status}-${Date.now()}`,
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

const base = { title: 'Banner', tone: 'primary' as const, type: 'url' as const, url: '/' }

test.group('StorefrontPromoBannerService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('create numbers positions per placement', async ({ assert }) => {
    const service = await makeService()

    const middleFirst = await service.create('home_middle', base)
    const bottomFirst = await service.create('home_bottom', base)
    const middleSecond = await service.create('home_middle', base)

    assert.equal(middleFirst.position, 0)
    assert.equal(bottomFirst.position, 0)
    assert.equal(middleSecond.position, 1)
    assert.isTrue(middleFirst.isVisible)
  })

  test('create keeps only the target that matches the type', async ({ assert }) => {
    const service = await makeService()
    const collection = await createCollection()

    const collectionBanner = await service.create('home_middle', {
      ...base,
      type: 'collection',
      collectionId: collection.id,
      url: '/ignored',
    })
    const urlBanner = await service.create('home_middle', {
      ...base,
      collectionId: collection.id,
      url: '/sale',
    })

    assert.equal(collectionBanner.collectionId, collection.id)
    assert.isNull(collectionBanner.url)
    assert.isNull(urlBanner.collectionId)
    assert.equal(urlBanner.url, '/sale')
  })

  test('create turns blank optional texts into null', async ({ assert }) => {
    const service = await makeService()

    const banner = await service.create('home_middle', { ...base, eyebrow: '', buttonLabel: '' })

    assert.isNull(banner.eyebrow)
    assert.isNull(banner.buttonLabel)
  })

  test('create rejects banners past the per-placement limit', async ({ assert }) => {
    const service = await makeService()
    for (let index = 0; index < MAX_PROMO_BANNERS_PER_PLACEMENT; index++) {
      await service.create('home_middle', base)
    }

    await assert.rejects(() => service.create('home_middle', base), errors.E_VALIDATION_ERROR)
    await assert.doesNotReject(() => service.create('home_bottom', base))
  })

  test('update keeps visibility when it is not sent', async ({ assert }) => {
    const service = await makeService()
    const banner = await service.create('home_middle', { ...base, isVisible: false })

    const updated = await service.update(banner, { ...base, title: 'Renamed' })

    assert.equal(updated.title, 'Renamed')
    assert.isFalse(updated.isVisible)
  })

  test('reorder requires every banner of the placement', async ({ assert }) => {
    const service = await makeService()
    const first = await service.create('home_middle', base)
    const second = await service.create('home_middle', base)
    const bottom = await service.create('home_bottom', base)

    await assert.rejects(
      () => service.reorder('home_middle', [first.id]),
      errors.E_VALIDATION_ERROR
    )
    await assert.rejects(
      () => service.reorder('home_middle', [second.id, bottom.id]),
      errors.E_VALIDATION_ERROR
    )

    await service.reorder('home_middle', [second.id, first.id])
    const ordered = await StorefrontPromoBanner.query()
      .where('placement', 'home_middle')
      .orderBy('position', 'asc')
    assert.deepEqual(
      ordered.map(({ id }) => id),
      [second.id, first.id]
    )
  })

  test('listPublic splits visible banners with live targets by placement', async ({ assert }) => {
    const service = await makeService()
    const draft = await createCollection('draft')
    const shown = await service.create('home_middle', base)
    await service.create('home_middle', { ...base, isVisible: false })
    await service.create('home_middle', {
      ...base,
      type: 'collection',
      collectionId: draft.id,
    })
    const bottom = await service.create('home_bottom', base)

    const result = await service.listPublic()

    assert.deepEqual(
      result.home_middle.map(({ id }) => id),
      [shown.id]
    )
    assert.deepEqual(
      result.home_bottom.map(({ id }) => id),
      [bottom.id]
    )
  })

  test('removeImage is a no-op when the banner has no image', async ({ assert }) => {
    const service = await makeService()
    const banner = await service.create('home_middle', base)

    const result = await service.removeImage(banner)

    assert.strictEqual(result, banner)
    assert.notExists(result.image)
  })
})
