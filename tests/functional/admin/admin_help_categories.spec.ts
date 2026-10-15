import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import HelpCategory from '#models/help_category'
import HelpCategoryGroup from '#models/help_category_group'
import type User from '#models/user'
import { createAdminUser } from '#tests/helpers/admin'
import { createHelpArticle, createHelpCategory } from '#tests/helpers/help'

type Body = Record<string, unknown>

function send(client: any, method: 'post' | 'put', user: User, url: string, body: Body = {}) {
  return client[method](url)
    .json(body)
    .accept('json')
    .withCsrfToken()
    .withGuard('web')
    .loginAs(user)
}

function get(client: any, user: User, url: string, qs: Body = {}) {
  return client.get(url).qs(qs).accept('json').withGuard('web').loginAs(user)
}

function categoryPayload(overrides: Body = {}) {
  return {
    title: 'Delivery questions',
    slug: null,
    description: 'Couriers, fees and delivery times',
    icon: 'truck',
    popular: true,
    position: 2,
    groups: [],
    ...overrides,
  }
}

async function groupsOf(categoryId: string) {
  return HelpCategoryGroup.query()
    .where('help_category_id', categoryId)
    .orderBy('position', 'asc')
}

test.group('Staff help categories: create and update', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates a category with sections', async ({ client, assert }) => {
    const user = await createAdminUser('admin')

    const response = await send(
      client,
      'post',
      user,
      '/admin/help/categories',
      categoryPayload({
        groups: [
          { id: null, title: 'Before it ships', position: 1 },
          { id: null, title: 'On the way', position: 2 },
          { id: null, title: 'On the way', position: 3 },
        ],
      })
    )

    response.assertStatus(201)
    const { data } = response.body()
    assert.equal(data.slug, 'delivery-questions')
    assert.equal(data.icon, 'truck')
    assert.isTrue(data.popular)
    assert.equal(data.articlesCount, 0)
    assert.deepEqual(
      data.groups.map((item: { slug: string }) => item.slug),
      ['before-it-ships', 'on-the-way', 'on-the-way-2']
    )
  })

  test('rejects an unknown icon and loose types', async ({ client, assert }) => {
    const user = await createAdminUser('admin')

    const response = await send(
      client,
      'post',
      user,
      '/admin/help/categories',
      categoryPayload({ icon: 'skull', popular: 'yes', position: '1' })
    )

    response.assertStatus(422)
    const fields = response.body().errors.map((error: { field: string }) => error.field)
    assert.includeMembers(fields, ['icon', 'popular', 'position'])
  })

  test('rejects a custom slug another category uses', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { category } = await createHelpCategory()

    const response = await send(
      client,
      'post',
      user,
      '/admin/help/categories',
      categoryPayload({ slug: category.slug })
    )

    response.assertStatus(422)
    assert.equal(response.body().errors[0].field, 'slug')
  })

  test('updates sections: keeps, renames, removes and adds', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { category, groups } = await createHelpCategory({ groups: ['Keep', 'Remove'] })
    const [kept, removed] = groups
    const grouped = await createHelpArticle(category, { groupId: removed.id })

    const response = await send(
      client,
      'put',
      user,
      `/admin/help/categories/${category.id}`,
      categoryPayload({
        title: category.title,
        groups: [
          { id: kept.id, title: 'Kept and renamed', position: 5 },
          { id: null, title: 'Brand new', position: 1 },
        ],
      })
    )

    response.assertStatus(200)
    const rows = await groupsOf(category.id)
    assert.deepEqual(
      rows.map((row) => [row.title, row.position]),
      [
        ['Brand new', 1],
        ['Kept and renamed', 5],
      ]
    )
    const renamed = rows.find((row) => row.id === kept.id)!
    assert.equal(renamed.slug, kept.slug)
    await grouped.refresh()
    assert.isNull(grouped.helpCategoryGroupId)
  })

  test('keeps the slug when no slug is sent', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { category } = await createHelpCategory()

    const response = await send(
      client,
      'put',
      user,
      `/admin/help/categories/${category.id}`,
      categoryPayload({ title: 'Totally new name' })
    )

    response.assertStatus(200)
    assert.equal(response.body().data.slug, category.slug)
  })

  test('rejects a section id from another category', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { category } = await createHelpCategory()
    const { groups } = await createHelpCategory({ groups: ['Not yours'] })

    const response = await send(
      client,
      'put',
      user,
      `/admin/help/categories/${category.id}`,
      categoryPayload({ groups: [{ id: groups[0].id, title: 'Stolen', position: 1 }] })
    )

    response.assertStatus(422)
    assert.equal(response.body().errors[0].field, 'groups.0.id')
    assert.lengthOf(await groupsOf(groups[0].helpCategoryId), 1)
  })

  test('rejects more than 20 sections', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await send(
      client,
      'post',
      user,
      '/admin/help/categories',
      categoryPayload({
        groups: Array.from({ length: 21 }, (_, index) => ({
          id: null,
          title: `Section ${index}`,
          position: index,
        })),
      })
    )

    response.assertStatus(422)
  })

  test('cannot edit an archived category', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { category } = await createHelpCategory({ archived: true })

    const response = await send(
      client,
      'put',
      user,
      `/admin/help/categories/${category.id}`,
      categoryPayload()
    )

    response.assertStatus(422)
  })
})

test.group('Staff help categories: list and archive', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('lists categories with non-archived article counts', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { category } = await createHelpCategory({ title: 'Zx counted topic' })
    await createHelpCategory({ title: 'Zx archived topic', archived: true })
    await createHelpArticle(category)
    await createHelpArticle(category, { status: 'draft' })
    await createHelpArticle(category, { status: 'archived' })

    const response = await get(client, user, '/admin/help/categories/list', {
      q: 'Zx',
      status: 'active',
    })

    response.assertStatus(200)
    const rows = response.body().data
    assert.lengthOf(rows, 1)
    assert.equal(rows[0].id, category.id)
    assert.equal(rows[0].articlesCount, 2)
  })

  test('options list only active categories with their sections', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { category } = await createHelpCategory({ groups: ['Section A'] })
    const { category: archived } = await createHelpCategory({ archived: true })

    const response = await get(client, user, '/admin/help/categories/options')

    response.assertStatus(200)
    const rows = response.body().data
    const found = rows.find((row: { id: string }) => row.id === category.id)
    assert.equal(found.groups[0].title, 'Section A')
    assert.notInclude(
      rows.map((row: { id: string }) => row.id),
      archived.id
    )
  })

  test('cannot archive a category that has active articles', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { category } = await createHelpCategory()
    await createHelpArticle(category)

    const response = await send(client, 'post', user, `/admin/help/categories/${category.id}/archive`)

    response.assertStatus(422)
    await category.refresh()
    assert.isNull(category.archivedAt)
  })

  test('archives a category with only drafts and restores it', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { category } = await createHelpCategory()
    await createHelpArticle(category, { status: 'draft' })

    const archive = await send(client, 'post', user, `/admin/help/categories/${category.id}/archive`)
    archive.assertStatus(200)
    await category.refresh()
    assert.isNotNull(category.archivedAt)

    const restore = await send(
      client,
      'post',
      user,
      `/admin/help/categories/${category.id}/unarchive`
    )
    restore.assertStatus(200)
    await category.refresh()
    assert.isNull(category.archivedAt)
  })

  test('bulk archive skips categories with active articles', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { category: empty } = await createHelpCategory()
    const { category: busy } = await createHelpCategory()
    const { category: archived } = await createHelpCategory({ archived: true })
    await createHelpArticle(busy)

    const response = await send(client, 'put', user, '/admin/help/categories/bulk/archive', {
      ids: [empty.id, busy.id, archived.id],
      archived: true,
    })

    response.assertStatus(200)
    assert.deepEqual(response.body().data, { updated: 1, skipped: 2 })
    const rows = await HelpCategory.query().whereIn('id', [empty.id, busy.id])
    const byId = new Map(rows.map((row) => [row.id, row]))
    assert.isNotNull(byId.get(empty.id)!.archivedAt)
    assert.isNull(byId.get(busy.id)!.archivedAt)
  })
})

test.group('Staff help categories: permissions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('staff without help_articles.view get 403', async ({ client }) => {
    const user = await createAdminUser(['support_tickets.view'])

    const response = await get(client, user, '/admin/help/categories/list')

    response.assertStatus(403)
  })

  test('view-only staff cannot create, edit or archive', async ({ client }) => {
    const user = await createAdminUser(['help_articles.view'])
    const { category } = await createHelpCategory()

    const store = await send(client, 'post', user, '/admin/help/categories', categoryPayload())
    const update = await send(
      client,
      'put',
      user,
      `/admin/help/categories/${category.id}`,
      categoryPayload()
    )
    const archive = await send(client, 'post', user, `/admin/help/categories/${category.id}/archive`)
    const bulk = await send(client, 'put', user, '/admin/help/categories/bulk/archive', {
      ids: [category.id],
      archived: true,
    })

    store.assertStatus(403)
    update.assertStatus(403)
    archive.assertStatus(403)
    bulk.assertStatus(403)
  })

  test('guests are rejected', async ({ client }) => {
    const response = await client.get('/admin/help/categories/list').accept('json')

    response.assertStatus(401)
  })
})
