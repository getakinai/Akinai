import type Page from '#models/page'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * `toObject` is the full back-office record; `toListItem` is the list row
 * (no body or SEO fields); `toOption` feeds the link pickers.
 */
export default class PageTransformer extends BaseTransformer<Page> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'title',
      'slug',
      'body',
      'seoTitle',
      'seoDescription',
      'status',
      'policyType',
      'archivedAt',
      'createdAt',
      'updatedAt',
    ])
  }

  toListItem() {
    return this.pick(this.resource, [
      'id',
      'title',
      'slug',
      'status',
      'policyType',
      'archivedAt',
      'createdAt',
      'updatedAt',
    ])
  }

  toOption() {
    return this.pick(this.resource, ['id', 'title', 'slug', 'status'])
  }
}
