import type HelpArticle from '#models/help_article'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * `toObject` is the full back-office record (markdown, not the rendered
 * HTML); `toListItem` is the list row; `toOption` feeds the related
 * articles picker.
 */
export default class AdminHelpArticleTransformer extends BaseTransformer<HelpArticle> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'slug',
        'title',
        'description',
        'keywords',
        'bodyMarkdown',
        'popular',
        'position',
        'ctaLabel',
        'ctaHref',
        'status',
        'archivedAt',
        'createdAt',
        'updatedAt',
      ]),
      categoryId: this.resource.helpCategoryId,
      groupId: this.resource.helpCategoryGroupId,
      category: this.category(),
      relatedIds: (this.resource.relatedLinks ?? []).map((link) => link.relatedArticleId),
    }
  }

  toListItem() {
    return {
      ...this.pick(this.resource, [
        'id',
        'slug',
        'title',
        'description',
        'popular',
        'position',
        'status',
        'archivedAt',
        'createdAt',
        'updatedAt',
      ]),
      categoryId: this.resource.helpCategoryId,
      category: this.category(),
    }
  }

  toOption() {
    return this.pick(this.resource, ['id', 'slug', 'title', 'status'])
  }

  protected category() {
    const category = this.resource.category
    return category ? { id: category.id, slug: category.slug, title: category.title } : null
  }
}
