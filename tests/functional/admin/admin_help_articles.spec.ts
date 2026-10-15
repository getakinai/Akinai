import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import HelpArticle from '#models/help_article'
import HelpArticleRelated from '#models/help_article_related'
import type User from '#models/user'
import { createAdminUser } from '#tests/helpers/admin'
import {
  createHelpArticle,
  createHelpCategory,
  helpArticlePayload,
  relateHelpArticles,
} from '#tests/helpers/help'

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

function errorFields(response: any): string[] {
  return response.body().errors.map((error: { field: string }) => error.field)
}

test.group('Staff help articles: create and update', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('creates an article and renders its markdown on save', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { category, groups } = await createHelpCategory({ groups: ['Tracking'] })
    const other = await createHelpArticle(category)

    const response = await send(
      client,
      'post',
      user,
      '/admin/help/articles',
      helpArticlePayload(category.id, {
        groupId: groups[0].id,
        relatedIds: [other.id],
        ctaLabel: 'My orders',
        ctaHref: '/account/orders',
      })
    )

    response.assertStatus(201)
    const { data } = response.body()
    assert.equal(data.slug, 'track-your-parcel')
    assert.equal(data.categoryId, category.id)
    assert.equal(data.groupId, groups[0].id)
    assert.deepEqual(data.relatedIds, [other.id])
    assert.equal(data.bodyMarkdown, '## Where is my order\n\nOpen **Orders** in your account.')
    assert.notProperty(data, 'bodyHtml')

    const saved = await HelpArticle.findOrFail(data.id)
    assert.include(saved.bodyHtml, '<h2>Where is my order</h2>')
    assert.include(saved.bodyHtml, '<strong>Orders</strong>')
    assert.equal(saved.bodyText, 'Where is my order Open Orders in your account.')
    assert.deepEqual(saved.bodyParagraphs, ['Where is my order', 'Open Orders in your account.'])
  })

  test('gives a duplicate title a numbered slug', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { category } = await createHelpCategory()

    const first = await send(client, 'post', user, '/admin/help/articles', {
      ...helpArticlePayload(category.id),
      title: 'Same title here',
    })
    const second = await send(client, 'post', user, '/admin/help/articles', {
      ...helpArticlePayload(category.id),
      title: 'Same title here',
    })

    first.assertStatus(201)
    second.assertStatus(201)
    assert.equal(first.body().data.slug, 'same-title-here')
    assert.equal(second.body().data.slug, 'same-title-here-2')
  })

  test('rejects a custom slug another article already uses', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { category } = await createHelpCategory()
    const existing = await createHelpArticle(category)

    const response = await send(
      client,
      'post',
      user,
      '/admin/help/articles',
      helpArticlePayload(category.id, { slug: existing.slug })
    )

    response.assertStatus(422)
    assert.include(errorFields(response), 'slug')
  })

  test('rejects a section from another category', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { category } = await createHelpCategory()
    const { groups } = await createHelpCategory({ groups: ['Elsewhere'] })

    const response = await send(
      client,
      'post',
      user,
      '/admin/help/articles',
      helpArticlePayload(category.id, { groupId: groups[0].id })
    )

    response.assertStatus(422)
    assert.include(errorFields(response), 'groupId')
  })

  test('rejects an archived or unknown category', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { category: archived } = await createHelpCategory({ archived: true })

    const archivedResponse = await send(
      client,
      'post',
      user,
      '/admin/help/articles',
      helpArticlePayload(archived.id)
    )
    const unknownResponse = await send(
      client,
      'post',
      user,
      '/admin/help/articles',
      helpArticlePayload('0190a5c4-0000-7000-8000-000000000000')
    )

    archivedResponse.assertStatus(422)
    unknownResponse.assertStatus(422)
    assert.include(errorFields(archivedResponse), 'categoryId')
    assert.include(errorFields(unknownResponse), 'categoryId')
  })

  test('rejects a button with only text or only a link', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { category } = await createHelpCategory()

    const response = await send(
      client,
      'post',
      user,
      '/admin/help/articles',
      helpArticlePayload(category.id, { ctaLabel: 'Go', ctaHref: null })
    )

    response.assertStatus(422)
    assert.include(errorFields(response), 'ctaHref')
  })

  test('rejects button links outside the store', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { category } = await createHelpCategory()

    for (const ctaHref of ['https://evil.example', '//evil.example', 'javascript:alert(1)']) {
      const response = await send(
        client,
        'post',
        user,
        '/admin/help/articles',
        helpArticlePayload(category.id, { ctaLabel: 'Go', ctaHref })
      )
      response.assertStatus(422)
      assert.include(errorFields(response), 'ctaHref')
    }
  })

  test('rejects loose types and oversize fields', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { category } = await createHelpCategory()

    const response = await send(
      client,
      'post',
      user,
      '/admin/help/articles',
      helpArticlePayload(category.id, {
        popular: 'true',
        position: '3',
        status: 'archived',
        bodyMarkdown: 'x'.repeat(50_001),
        keywords: Array.from({ length: 31 }, (_, index) => `word${index}`),
      })
    )

    response.assertStatus(422)
    assert.includeMembers(errorFields(response), [
      'popular',
      'position',
      'status',
      'bodyMarkdown',
      'keywords',
    ])
  })

  test('updates an article, its section and related links', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { category, groups } = await createHelpCategory({ groups: ['One', 'Two'] })
    const article = await createHelpArticle(category, { groupId: groups[0].id })
    const first = await createHelpArticle(category)
    const second = await createHelpArticle(category)
    await relateHelpArticles(article, [first])

    const response = await send(
      client,
      'put',
      user,
      `/admin/help/articles/${article.id}`,
      helpArticlePayload(category.id, {
        title: 'Renamed article',
        groupId: groups[1].id,
        relatedIds: [second.id, first.id],
        bodyMarkdown: 'Updated body',
      })
    )

    response.assertStatus(200)
    await article.refresh()
    assert.equal(article.title, 'Renamed article')
    assert.equal(article.helpCategoryGroupId, groups[1].id)
    assert.include(article.bodyHtml, 'Updated body')
    const links = await HelpArticleRelated.query()
      .where('help_article_id', article.id)
      .orderBy('position', 'asc')
    assert.deepEqual(
      links.map((link) => link.relatedArticleId),
      [second.id, first.id]
    )
  })

  test('keeps the slug when the title changes and no slug is sent', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { category } = await createHelpCategory()
    const article = await createHelpArticle(category)
    const slug = article.slug

    const response = await send(
      client,
      'put',
      user,
      `/admin/help/articles/${article.id}`,
      helpArticlePayload(category.id, { title: 'Brand new title' })
    )

    response.assertStatus(200)
    assert.equal(response.body().data.slug, slug)
  })

  test('rejects relating an article to itself or a missing one', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { category } = await createHelpCategory()
    const article = await createHelpArticle(category)

    const self = await send(
      client,
      'put',
      user,
      `/admin/help/articles/${article.id}`,
      helpArticlePayload(category.id, { relatedIds: [article.id] })
    )
    const missing = await send(
      client,
      'put',
      user,
      `/admin/help/articles/${article.id}`,
      helpArticlePayload(category.id, { relatedIds: ['0190a5c4-0000-7000-8000-000000000000'] })
    )

    self.assertStatus(422)
    missing.assertStatus(422)
    assert.include(errorFields(self), 'relatedIds')
    assert.include(errorFields(missing), 'relatedIds')
  })

  test('cannot edit an archived article', async ({ client }) => {
    const user = await createAdminUser('admin')
    const { category } = await createHelpCategory()
    const article = await createHelpArticle(category, { status: 'archived' })

    const response = await send(
      client,
      'put',
      user,
      `/admin/help/articles/${article.id}`,
      helpArticlePayload(category.id)
    )

    response.assertStatus(422)
  })

  test('views an article with its markdown and related ids', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { category } = await createHelpCategory()
    const article = await createHelpArticle(category, { markdown: '**Hello**' })
    const related = await createHelpArticle(category)
    await relateHelpArticles(article, [related])

    const response = await get(client, user, `/admin/help/articles/view/${article.id}`)

    response.assertStatus(200)
    const { data } = response.body()
    assert.equal(data.bodyMarkdown, '**Hello**')
    assert.deepEqual(data.relatedIds, [related.id])
    assert.equal(data.category.id, category.id)
  })

  test('returns 404 for an unknown article id', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await get(
      client,
      user,
      '/admin/help/articles/view/0190a5c4-0000-7000-8000-000000000000'
    )

    response.assertStatus(404)
  })
})

test.group('Staff help articles: list, archive and bulk actions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('lists articles filtered by category, status and search', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { category } = await createHelpCategory()
    const { category: other } = await createHelpCategory()
    const match = await createHelpArticle(category, { title: 'Zq refunds guide' })
    await createHelpArticle(category, { title: 'Zq refunds draft', status: 'draft' })
    await createHelpArticle(other, { title: 'Zq refunds elsewhere' })

    const response = await get(client, user, '/admin/help/articles/list', {
      q: 'Zq refunds',
      categoryId: category.id,
      status: 'active',
    })

    response.assertStatus(200)
    const rows = response.body().data
    assert.deepEqual(
      rows.map((row: { id: string }) => row.id),
      [match.id]
    )
    assert.equal(rows[0].category.title, category.title)
    assert.notProperty(rows[0], 'bodyMarkdown')
  })

  test('options leave out archived articles', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { category } = await createHelpCategory()
    const active = await createHelpArticle(category)
    const draft = await createHelpArticle(category, { status: 'draft' })
    const archived = await createHelpArticle(category, { status: 'archived' })

    const response = await get(client, user, '/admin/help/articles/options')

    response.assertStatus(200)
    const ids = response.body().data.map((row: { id: string }) => row.id)
    assert.includeMembers(ids, [active.id, draft.id])
    assert.notInclude(ids, archived.id)
  })

  test('archives an article and restores it as a draft', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { category } = await createHelpCategory()
    const article = await createHelpArticle(category)

    const archive = await send(client, 'post', user, `/admin/help/articles/${article.id}/archive`)
    archive.assertStatus(200)
    await article.refresh()
    assert.equal(article.status, 'archived')
    assert.isNotNull(article.archivedAt)

    const again = await send(client, 'post', user, `/admin/help/articles/${article.id}/archive`)
    again.assertStatus(422)

    const restore = await send(
      client,
      'post',
      user,
      `/admin/help/articles/${article.id}/unarchive`
    )
    restore.assertStatus(200)
    await article.refresh()
    assert.equal(article.status, 'draft')
    assert.isNull(article.archivedAt)
  })

  test('bulk sets status and skips articles already at it', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { category } = await createHelpCategory()
    const draft = await createHelpArticle(category, { status: 'draft' })
    const active = await createHelpArticle(category)

    const response = await send(client, 'put', user, '/admin/help/articles/bulk/status', {
      ids: [draft.id, active.id],
      status: 'active',
    })

    response.assertStatus(200)
    assert.deepEqual(response.body().data, { updated: 1, skipped: 1 })
    await draft.refresh()
    assert.equal(draft.status, 'active')
  })

  test('bulk archives and unarchives', async ({ client, assert }) => {
    const user = await createAdminUser('admin')
    const { category } = await createHelpCategory()
    const first = await createHelpArticle(category)
    const archived = await createHelpArticle(category, { status: 'archived' })

    const archive = await send(client, 'put', user, '/admin/help/articles/bulk/archive', {
      ids: [first.id, archived.id],
      archived: true,
    })
    archive.assertStatus(200)
    assert.deepEqual(archive.body().data, { updated: 1, skipped: 1 })

    const restore = await send(client, 'put', user, '/admin/help/articles/bulk/archive', {
      ids: [first.id, archived.id],
      archived: false,
    })
    restore.assertStatus(200)
    assert.deepEqual(restore.body().data, { updated: 2, skipped: 0 })
    const rows = await HelpArticle.query().whereIn('id', [first.id, archived.id])
    assert.isTrue(rows.every((row) => row.status === 'draft'))
  })
})

test.group('Staff help articles: markdown preview', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('renders markdown with the storefront sanitizer', async ({ client, assert }) => {
    const user = await createAdminUser('admin')

    const response = await send(client, 'post', user, '/admin/help/articles/preview', {
      markdown: [
        '## Title',
        '',
        '<script>alert(1)</script>',
        '',
        '<img src="x" onerror="alert(1)">',
        '',
        '[bad](javascript:alert(1)) and [good](https://example.com)',
        '',
        '<div style="color:red">raw html</div>',
      ].join('\n'),
    })

    response.assertStatus(200)
    const html: string = response.body().data.html
    assert.include(html, '<h2>Title</h2>')
    assert.include(html, 'href="https://example.com"')
    assert.notInclude(html, '<script')
    assert.notInclude(html, '<img')
    assert.notInclude(html, 'onerror')
    assert.notMatch(html, /href="javascript:/i)
    assert.notInclude(html, '<div')
    assert.notInclude(html, 'style=')
  })

  test('rejects markdown over the size limit', async ({ client }) => {
    const user = await createAdminUser('admin')

    const response = await send(client, 'post', user, '/admin/help/articles/preview', {
      markdown: 'x'.repeat(50_001),
    })

    response.assertStatus(422)
  })

  test('staff who can only create can still preview', async ({ client }) => {
    const user = await createAdminUser(['help_articles.view', 'help_articles.create'])

    const response = await send(client, 'post', user, '/admin/help/articles/preview', {
      markdown: 'Hello',
    })

    response.assertStatus(200)
  })
})

test.group('Staff help articles: permissions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('staff without help_articles.view get 403', async ({ client }) => {
    const user = await createAdminUser(['support_tickets.view'])

    const list = await get(client, user, '/admin/help/articles/list')
    const preview = await send(client, 'post', user, '/admin/help/articles/preview', {
      markdown: 'Hello',
    })

    list.assertStatus(403)
    preview.assertStatus(403)
  })

  test('view-only staff cannot create, edit, archive or bulk update', async ({ client }) => {
    const user = await createAdminUser(['help_articles.view'])
    const { category } = await createHelpCategory()
    const article = await createHelpArticle(category)

    const requests: [method: 'post' | 'put', url: string, body: Body][] = [
      ['post', '/admin/help/articles', helpArticlePayload(category.id)],
      ['put', `/admin/help/articles/${article.id}`, helpArticlePayload(category.id)],
      ['post', `/admin/help/articles/${article.id}/archive`, {}],
      ['put', '/admin/help/articles/bulk/status', { ids: [article.id], status: 'draft' }],
      ['put', '/admin/help/articles/bulk/archive', { ids: [article.id], archived: true }],
      ['post', '/admin/help/articles/preview', { markdown: 'Hello' }],
    ]

    for (const [method, url, body] of requests) {
      const response = await send(client, method, user, url, body)
      response.assertStatus(403)
    }
  })

  test('editors without archive cannot archive', async ({ client }) => {
    const user = await createAdminUser(['help_articles.view', 'help_articles.edit'])
    const { category } = await createHelpCategory()
    const article = await createHelpArticle(category)

    const response = await send(client, 'post', user, `/admin/help/articles/${article.id}/archive`)

    response.assertStatus(403)
  })

  test('guests are rejected', async ({ client }) => {
    const response = await client.get('/admin/help/articles/list').accept('json')

    response.assertStatus(401)
  })
})
