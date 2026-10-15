import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { renderHelpMarkdown } from '#utils/help_markdown'
import { createHelpArticle, createHelpCategory, relateHelpArticles } from '#tests/helpers/help'

type Summary = { slug: string; categorySlug: string; title: string }

test.group('Storefront help center: reads from the database', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('home lists active categories with only their active articles', async ({
    client,
    assert,
  }) => {
    const { category } = await createHelpCategory()
    const { category: archived } = await createHelpCategory({ archived: true })
    const active = await createHelpArticle(category, { popular: true })
    const draft = await createHelpArticle(category, { status: 'draft', popular: true })
    await createHelpArticle(archived)

    const response = await client.get('/store/help/categories').accept('json')

    response.assertStatus(200)
    const { categories, popular } = response.body().data
    const slugs = categories.map((item: { slug: string }) => item.slug)
    assert.include(slugs, category.slug)
    assert.notInclude(slugs, archived.slug)

    const listed = categories.find((item: { slug: string }) => item.slug === category.slug)
    assert.equal(listed.articleCount, 1)
    assert.deepEqual(
      listed.articles.map((item: Summary) => item.slug),
      [active.slug]
    )
    assert.notInclude(
      popular.map((item: Summary) => item.slug),
      draft.slug
    )
  })

  test('category view groups articles by section order', async ({ client, assert }) => {
    const { category, groups } = await createHelpCategory({ groups: ['First', 'Second'] })
    const [first, second] = groups
    const late = await createHelpArticle(category, { groupId: second.id, position: 1 })
    const early = await createHelpArticle(category, { groupId: first.id, position: 2 })
    const loose = await createHelpArticle(category)

    const response = await client
      .get(`/store/help/categories/view/${category.slug}`)
      .accept('json')

    response.assertStatus(200)
    const sections = response.body().data.sections
    assert.deepEqual(
      sections.map((section: { group: { title: string } | null }) => section.group?.title ?? null),
      ['First', 'Second', null]
    )
    assert.deepEqual(
      sections.map((section: { articles: Summary[] }) => section.articles[0].slug),
      [early.slug, late.slug, loose.slug]
    )
  })

  test('article view returns rendered HTML and only visible related articles', async ({
    client,
    assert,
  }) => {
    const { category } = await createHelpCategory()
    const article = await createHelpArticle(category, { markdown: '## Steps\n\n1. Open orders' })
    const visible = await createHelpArticle(category)
    const draft = await createHelpArticle(category, { status: 'draft' })
    await relateHelpArticles(article, [draft, visible])

    const response = await client
      .get(`/store/help/articles/view/${category.slug}/${article.slug}`)
      .accept('json')

    response.assertStatus(200)
    const { data } = response.body()
    assert.include(data.body, '<h2>Steps</h2>')
    assert.include(data.body, '<li>Open orders</li>')
    assert.deepEqual(
      data.related.map((item: Summary) => item.slug),
      [visible.slug]
    )
  })

  test('draft articles and articles in archived categories are 404', async ({ client }) => {
    const { category } = await createHelpCategory()
    const { category: archived } = await createHelpCategory({ archived: true })
    const draft = await createHelpArticle(category, { status: 'draft' })
    const hidden = await createHelpArticle(archived)

    const draftResponse = await client
      .get(`/store/help/articles/view/${category.slug}/${draft.slug}`)
      .accept('json')
    const hiddenResponse = await client
      .get(`/store/help/articles/view/${archived.slug}/${hidden.slug}`)
      .accept('json')
    const categoryResponse = await client
      .get(`/store/help/categories/view/${archived.slug}`)
      .accept('json')

    draftResponse.assertStatus(404)
    hiddenResponse.assertStatus(404)
    categoryResponse.assertStatus(404)
  })

  test('staff edits show on the storefront straight away', async ({ client, assert }) => {
    const { category } = await createHelpCategory()
    const article = await createHelpArticle(category, { markdown: 'Old answer' })
    const rendered = renderHelpMarkdown('New answer')
    await article
      .merge({
        bodyMarkdown: 'New answer',
        bodyHtml: rendered.html,
        bodyText: rendered.text,
        bodyParagraphs: rendered.paragraphs,
      })
      .save()

    const response = await client
      .get(`/store/help/articles/view/${category.slug}/${article.slug}`)
      .accept('json')

    response.assertStatus(200)
    assert.include(response.body().data.body, 'New answer')
    assert.notInclude(response.body().data.body, 'Old answer')
  })

  test('search finds active articles by keyword, not drafts', async ({ client, assert }) => {
    const { category } = await createHelpCategory()
    const active = await createHelpArticle(category, { keywords: ['zorbleflux'] })
    const draft = await createHelpArticle(category, {
      keywords: ['zorbleflux'],
      status: 'draft',
    })

    const response = await client
      .get('/store/help/search')
      .qs({ q: 'zorbleflux' })
      .accept('json')

    response.assertStatus(200)
    const slugs = response.body().data.map((item: Summary) => item.slug)
    assert.include(slugs, active.slug)
    assert.notInclude(slugs, draft.slug)
  })

  test('the help chat answers from active articles only', async ({ client, assert }) => {
    const { category } = await createHelpCategory()
    const active = await createHelpArticle(category, {
      title: 'Quuxberry vouchers',
      keywords: ['quuxberry'],
      markdown: 'Quuxberry vouchers can be used at checkout.',
    })
    const draft = await createHelpArticle(category, {
      title: 'Quuxberry secrets',
      keywords: ['quuxberry'],
      markdown: 'Quuxberry secrets are not published yet.',
      status: 'draft',
    })

    const response = await client
      .get('/store/support/chat')
      .qs({ q: 'quuxberry vouchers' })
      .accept('json')

    response.assertStatus(200)
    const hrefs = response.body().data.links.map((link: { href: string }) => link.href)
    assert.include(hrefs, `/help/${category.slug}/${active.slug}`)
    assert.notInclude(hrefs, `/help/${category.slug}/${draft.slug}`)
  })

  test('the help chat quotes the latest wording staff saved', async ({ client, assert }) => {
    const { category } = await createHelpCategory()
    const article = await createHelpArticle(category, {
      title: 'Quuxberry vouchers',
      keywords: ['quuxberry'],
      markdown: 'Quuxberry vouchers were retired last year.',
    })
    const rendered = renderHelpMarkdown('Quuxberry vouchers work at checkout today.')
    await article
      .merge({
        bodyMarkdown: 'Quuxberry vouchers work at checkout today.',
        bodyHtml: rendered.html,
        bodyText: rendered.text,
        bodyParagraphs: rendered.paragraphs,
      })
      .save()

    const response = await client
      .get('/store/support/chat')
      .qs({ q: 'quuxberry vouchers' })
      .accept('json')

    response.assertStatus(200)
    const said = response.body().data.messages.join(' ')
    assert.include(said, 'work at checkout today')
    assert.notInclude(said, 'retired last year')
  })
})
