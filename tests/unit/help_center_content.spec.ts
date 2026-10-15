import { test } from '@japa/runner'
import {
  HELP_ICONS,
  HELP_INTERNAL_PATH,
  HELP_SLUG,
  MAX_HELP_BODY_LENGTH,
  MAX_HELP_GROUPS,
  MAX_HELP_KEYWORDS,
  MAX_HELP_RELATED,
} from '#constants/help'
import { HELP_CENTER_CONTENT } from '#database/data/help_center_content'

const articles = HELP_CENTER_CONTENT.flatMap((category) => category.articles)

test.group('Help center starter content', () => {
  test('categories have unique slugs, known icons and valid sections', ({ assert }) => {
    assert.isAbove(HELP_CENTER_CONTENT.length, 0)
    const slugs = HELP_CENTER_CONTENT.map((category) => category.slug)
    assert.equal(new Set(slugs).size, slugs.length)

    for (const category of HELP_CENTER_CONTENT) {
      assert.match(category.slug, HELP_SLUG)
      assert.include(HELP_ICONS, category.icon)
      assert.isAtMost(category.groups.length, MAX_HELP_GROUPS)
      const groupSlugs = category.groups.map((group) => group.slug)
      assert.equal(new Set(groupSlugs).size, groupSlugs.length, `${category.slug} groups`)
      for (const slug of groupSlugs) assert.match(slug, HELP_SLUG)
    }
  })

  test('article slugs are unique across categories', ({ assert }) => {
    const slugs = articles.map((article) => article.slug)
    assert.equal(new Set(slugs).size, slugs.length)
    for (const slug of slugs) assert.match(slug, HELP_SLUG)
  })

  test('articles use sections from their own category', ({ assert }) => {
    for (const category of HELP_CENTER_CONTENT) {
      const groupSlugs = new Set(category.groups.map((group) => group.slug))
      for (const article of category.articles) {
        if (article.group) assert.isTrue(groupSlugs.has(article.group), article.slug)
      }
    }
  })

  test('related links point at real articles, never themselves', ({ assert }) => {
    const slugs = new Set(articles.map((article) => article.slug))
    for (const article of articles) {
      assert.isAtMost(article.related.length, MAX_HELP_RELATED)
      assert.notInclude(article.related, article.slug)
      for (const related of article.related) assert.isTrue(slugs.has(related), related)
    }
  })

  test('bodies, keywords and button links fit the editor limits', ({ assert }) => {
    for (const article of articles) {
      assert.isAbove(article.markdown.trim().length, 0, article.slug)
      assert.isAtMost(article.markdown.length, MAX_HELP_BODY_LENGTH)
      assert.isAtMost(article.keywords.length, MAX_HELP_KEYWORDS)
      if (article.cta) assert.match(article.cta.href, HELP_INTERNAL_PATH, article.slug)
    }
  })

  test('includes the article the chat uses for order status questions', ({ assert }) => {
    assert.isTrue(articles.some((article) => article.slug === 'track-your-order'))
  })
})
