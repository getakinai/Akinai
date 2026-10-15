import { BaseTransformer } from '@adonisjs/core/transformers'

export type HelpMarkdownPreview = { html: string }

/** Sanitized storefront HTML for a help article draft. */
export default class HelpMarkdownPreviewTransformer extends BaseTransformer<HelpMarkdownPreview> {
  toObject() {
    return { html: this.resource.html }
  }
}
