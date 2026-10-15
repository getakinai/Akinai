import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import HelpArticle from '#models/help_article'
import HelpArticleRelated from '#models/help_article_related'
import HelpCategory from '#models/help_category'
import HelpCategoryGroup from '#models/help_category_group'
import HelpCenterService from '#services/help_center_service'
import { HELP_CENTER_CONTENT } from '#database/data/help_center_content'

test.group('HelpCenterService.importStarterContent', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.timeout(20_000)

  async function clearHelpTables() {
    await HelpArticleRelated.query().delete()
    await HelpArticle.query().delete()
    await HelpCategoryGroup.query().delete()
    await HelpCategory.query().delete()
  }

  test('copies every starter guide into the database', async ({ assert }) => {
    await clearHelpTables()
    const service = await app.container.make(HelpCenterService)
    const templates = HELP_CENTER_CONTENT
    const articleCount = templates.reduce((sum, category) => sum + category.articles.length, 0)

    const result = await service.importStarterContent(HELP_CENTER_CONTENT)

    assert.deepEqual(result, { categories: templates.length, articles: articleCount })
    const groupCount = templates.reduce((sum, category) => sum + category.groups.length, 0)
    assert.lengthOf(await HelpCategoryGroup.all(), groupCount)

    const relatedCount = templates
      .flatMap((category) => category.articles)
      .reduce((sum, article) => sum + article.related.length, 0)
    assert.lengthOf(await HelpArticleRelated.all(), relatedCount)

    const sample = templates[0].articles[0]
    const saved = await HelpArticle.findByOrFail('slug', sample.slug)
    assert.equal(saved.status, 'active')
    assert.equal(saved.bodyMarkdown, sample.markdown)
    assert.isAbove(saved.bodyHtml.length, 0)
    assert.isAbove(saved.bodyParagraphs.length, 0)
  })

  test('the imported library matches the templates', async ({ assert }) => {
    await clearHelpTables()
    const service = await app.container.make(HelpCenterService)
    const templates = HELP_CENTER_CONTENT
    await service.importStarterContent(HELP_CENTER_CONTENT)

    const home = await service.home()

    assert.deepEqual(
      home.categories.map((category) => category.slug),
      templates.map((category) => category.slug)
    )
    for (const template of templates) {
      const category = home.categories.find((item) => item.slug === template.slug)!
      assert.sameMembers(
        category.articles.map((article) => article.slug),
        template.articles.map((article) => article.slug)
      )
      for (const article of template.articles) {
        const loaded = category.articles.find((item) => item.slug === article.slug)!
        assert.equal(loaded.group, article.group)
        assert.deepEqual(loaded.related, article.related)
      }
    }
  })

  test('running it again inserts nothing and keeps staff edits', async ({ assert }) => {
    await clearHelpTables()
    const service = await app.container.make(HelpCenterService)
    await service.importStarterContent(HELP_CENTER_CONTENT)
    const edited = await HelpArticle.query().orderBy('slug', 'asc').firstOrFail()
    await edited.merge({ title: 'Edited by staff', bodyMarkdown: 'Staff wording' }).save()
    const category = await HelpCategory.query().firstOrFail()
    await category.merge({ title: 'Renamed by staff' }).save()

    const result = await service.importStarterContent(HELP_CENTER_CONTENT)

    assert.deepEqual(result, { categories: 0, articles: 0 })
    await edited.refresh()
    await category.refresh()
    assert.equal(edited.title, 'Edited by staff')
    assert.equal(edited.bodyMarkdown, 'Staff wording')
    assert.equal(category.title, 'Renamed by staff')
  })

  test('re-adds only a starter guide that is missing', async ({ assert }) => {
    await clearHelpTables()
    const service = await app.container.make(HelpCenterService)
    await service.importStarterContent(HELP_CENTER_CONTENT)
    const removed = await HelpArticle.query().orderBy('slug', 'asc').firstOrFail()
    await HelpArticleRelated.query()
      .where('help_article_id', removed.id)
      .orWhere('related_article_id', removed.id)
      .delete()
    await removed.delete()

    const result = await service.importStarterContent(HELP_CENTER_CONTENT)

    assert.deepEqual(result, { categories: 0, articles: 1 })
    assert.isNotNull(await HelpArticle.findBy('slug', removed.slug))
  })
})
