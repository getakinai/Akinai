import type HelpCategory from '#models/help_category'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * `toObject` is the back-office record with its sections; `articlesCount`
 * reads the `articles_count` extra (non-archived articles). `toOption`
 * feeds the article form's category and section pickers.
 */
export default class AdminHelpCategoryTransformer extends BaseTransformer<HelpCategory> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'slug',
        'title',
        'description',
        'icon',
        'popular',
        'position',
        'archivedAt',
        'createdAt',
        'updatedAt',
      ]),
      articlesCount: Number(this.resource.$extras.articles_count ?? 0),
      groups: this.groups(),
    }
  }

  toOption() {
    return {
      ...this.pick(this.resource, ['id', 'slug', 'title']),
      groups: this.groups(),
    }
  }

  protected groups() {
    return (this.resource.groups ?? []).map((group) => ({
      id: group.id,
      slug: group.slug,
      title: group.title,
      position: group.position,
    }))
  }
}
