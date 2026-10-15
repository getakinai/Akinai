import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { errors } from '@vinejs/vine'
import Collection from '#models/collection'
import StorefrontHeroSlide from '#models/storefront_hero_slide'
import { MAX_HERO_SLIDES } from '#constants/storefront'
import StorefrontHeroSlideService from '#services/storefront_hero_slide_service'

async function makeService() {
  return app.container.make(StorefrontHeroSlideService)
}

async function createCollection() {
  return Collection.create({
    title: 'Unit hero collection',
    slug: `unit-hero-collection-${Date.now()}`,
    description: null,
    type: 'manual',
    match: 'all',
    sortOrder: 'manual',
    seoTitle: null,
    seoDescription: null,
    status: 'active',
    archivedAt: null,
  })
}

test.group('StorefrontHeroSlideService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('create appends slides in order', async ({ assert }) => {
    const service = await makeService()

    const first = await service.create({ heading: 'One', type: 'url', url: '/one' })
    const second = await service.create({ heading: 'Two', type: 'url', url: '/two' })

    assert.equal(first.position, 0)
    assert.equal(second.position, 1)
    assert.isTrue(first.isVisible)
  })

  test('create keeps only the target that matches the type', async ({ assert }) => {
    const service = await makeService()
    const collection = await createCollection()

    const collectionSlide = await service.create({
      heading: 'Collection',
      type: 'collection',
      collectionId: collection.id,
      url: '/ignored',
    })
    const urlSlide = await service.create({
      heading: 'Url',
      type: 'url',
      collectionId: collection.id,
      url: '/sale',
    })

    assert.equal(collectionSlide.collectionId, collection.id)
    assert.isNull(collectionSlide.url)
    assert.isNull(urlSlide.collectionId)
    assert.equal(urlSlide.url, '/sale')
  })

  test('create turns blank optional texts into null', async ({ assert }) => {
    const service = await makeService()

    const slide = await service.create({
      heading: 'Texts',
      eyebrow: '',
      subheading: '',
      buttonLabel: '',
      type: 'url',
      url: '/',
    })

    assert.isNull(slide.eyebrow)
    assert.isNull(slide.subheading)
    assert.isNull(slide.buttonLabel)
  })

  test('create rejects slides past the limit', async ({ assert }) => {
    const service = await makeService()
    for (let index = 0; index < MAX_HERO_SLIDES; index++) {
      await service.create({ heading: `Slide ${index}`, type: 'url', url: '/' })
    }

    await assert.rejects(
      () => service.create({ heading: 'One too many', type: 'url', url: '/' }),
      errors.E_VALIDATION_ERROR
    )
  })

  test('update keeps visibility when it is not sent', async ({ assert }) => {
    const service = await makeService()
    const slide = await service.create({
      heading: 'Hidden',
      type: 'url',
      url: '/',
      isVisible: false,
    })

    const updated = await service.update(slide, { heading: 'Renamed', type: 'url', url: '/' })

    assert.equal(updated.heading, 'Renamed')
    assert.isFalse(updated.isVisible)
  })

  test('reorder sets positions and requires every slide', async ({ assert }) => {
    const service = await makeService()
    const first = await service.create({ heading: 'A', type: 'url', url: '/' })
    const second = await service.create({ heading: 'B', type: 'url', url: '/' })

    await assert.rejects(() => service.reorder([first.id]), errors.E_VALIDATION_ERROR)

    await service.reorder([second.id, first.id])
    const ordered = await StorefrontHeroSlide.query().orderBy('position', 'asc')
    assert.deepEqual(
      ordered.map(({ id }) => id),
      [second.id, first.id]
    )
  })

  test('removeImage is a no-op when the slide has no image', async ({ assert }) => {
    const service = await makeService()
    const slide = await service.create({ heading: 'No image', type: 'url', url: '/' })

    const result = await service.removeImage(slide)

    assert.strictEqual(result, slide)
    assert.notExists(result.image)
  })
})
