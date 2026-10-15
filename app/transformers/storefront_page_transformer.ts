import type Page from '#models/page'
import { sanitizeEditorHtml } from '#utils/sanitize_rich_text'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * `toObject` is the public page; `toPolicy` is a policy link for the
 * storefront and checkout footers.
 */
export default class StorefrontPageTransformer extends BaseTransformer<Page> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'title', 'slug', 'seoTitle', 'seoDescription']),
      body: sanitizeEditorHtml(this.resource.body),
    }
  }

  toPolicy() {
    const { policyType, title, slug } = this.resource
    return { policyType, title, href: `/pages/${slug}` }
  }
}
