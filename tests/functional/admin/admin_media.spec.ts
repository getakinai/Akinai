import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import drive from '@adonisjs/drive/services/main'
import sharp from 'sharp'
import Media from '#models/media'
import type User from '#models/user'
import Vendor from '#models/vendor'
import { createAdminUser } from '#tests/helpers/admin'

async function pngBuffer() {
  return sharp({ create: { width: 8, height: 4, channels: 3, background: '#14532d' } })
    .png()
    .toBuffer()
}

async function uploadMedia(client: ApiClient, user: User, names: string[]) {
  const png = await pngBuffer()
  let request = client.post('/admin/media')
  for (const name of names) request = request.file('images[]', png, { filename: name })
  return request.accept('json').withCsrfToken().withGuard('web').loginAs(user)
}

async function deleteMedia(client: ApiClient, user: User, media: Media) {
  return client
    .delete(`/admin/media/${media.id}`)
    .accept('json')
    .withCsrfToken()
    .withGuard('web')
    .loginAs(user)
}

test.group('Staff media gallery', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    drive.fake()
    return () => drive.restore()
  })

  test('any staff user can upload and list images', async ({ client, assert }) => {
    const user = await createAdminUser(['orders.view'])

    const upload = await uploadMedia(client, user, ['one.png', 'two.png'])
    upload.assertStatus(201)
    assert.equal(upload.body().data.count, 2)

    const media = await Media.query().where('folder', 'media').orderBy('original_name')
    assert.lengthOf(media, 2)
    assert.equal(media[0].originalName, 'one.png')
    assert.equal(media[0].uploadedById, user.id)
    assert.equal(media[0].width, 8)
    assert.equal(media[0].height, 4)
    assert.isTrue(await drive.use().exists(media[0].key))

    const list = await client
      .get('/admin/media/list?folder=media&q=two')
      .accept('json')
      .withGuard('web')
      .loginAs(user)
    list.assertStatus(200)
    const data = list.body().data
    assert.lengthOf(data, 1)
    assert.equal(data[0].originalName, 'two.png')
    assert.isTrue(data[0].url.endsWith(media[1].key))
    assert.equal(data[0].uploadedBy.fullName, user.fullName)
  })

  test('rejects files that are not images', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await client
      .post('/admin/media')
      .file('images[]', Buffer.from('<svg></svg>'), { filename: 'logo.svg' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('requires a signed-in staff user', async ({ client }) => {
    const response = await client.get('/admin/media/list').accept('json')
    response.assertStatus(401)
  })

  test('only admins can delete', async ({ client, assert }) => {
    const staff = await createAdminUser(['orders.view'])
    await uploadMedia(client, staff, ['photo.png'])
    const media = await Media.query().where('folder', 'media').firstOrFail()

    const forbidden = await deleteMedia(client, staff, media)
    forbidden.assertStatus(403)
    assert.isNotNull(await Media.find(media.id))

    const admin = await createAdminUser('admin')
    const deleted = await deleteMedia(client, admin, media)
    deleted.assertStatus(204)
    assert.isNull(await Media.find(media.id))
    assert.isFalse(await drive.use().exists(media.key))
  })

  test('blocks deleting an image that is still in use', async ({ client, assert }) => {
    const admin = await createAdminUser('admin')
    const vendor = await Vendor.create({ name: `Acme ${Date.now()}`, isActive: true })

    const upload = await client
      .post(`/admin/vendors/${vendor.id}/image`)
      .file('image', await pngBuffer(), { filename: 'acme.png' })
      .accept('json')
      .withCsrfToken()
      .withGuard('web')
      .loginAs(admin)
    upload.assertStatus(200)
    await vendor.refresh()
    const media = await Media.findByOrFail('key', vendor.image!)

    const response = await deleteMedia(client, admin, media)

    response.assertStatus(422)
    assert.include(response.body().errors[0].message, `Vendor: ${vendor.name}`)
    assert.isNotNull(await Media.find(media.id))
    assert.isTrue(await drive.use().exists(media.key))
  })

  test('replacing a record image keeps the old one in the gallery', async ({
    client,
    assert,
  }) => {
    const admin = await createAdminUser('admin')
    const vendor = await Vendor.create({ name: `Keep ${Date.now()}`, isActive: true })
    const png = await pngBuffer()
    const upload = () =>
      client
        .post(`/admin/vendors/${vendor.id}/image`)
        .file('image', png, { filename: 'cover.png' })
        .accept('json')
        .withCsrfToken()
        .withGuard('web')
        .loginAs(admin)

    ;(await upload()).assertStatus(200)
    await vendor.refresh()
    const firstKey = vendor.image!
    ;(await upload()).assertStatus(200)
    await vendor.refresh()

    assert.notEqual(vendor.image, firstKey)
    const old = await Media.findByOrFail('key', firstKey)
    assert.isTrue(await drive.use().exists(firstKey))

    const deleted = await deleteMedia(client, admin, old)
    deleted.assertStatus(204)
    assert.isFalse(await drive.use().exists(firstKey))
  })
})
