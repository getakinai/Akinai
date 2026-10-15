import type Media from '#models/media'
import { BaseTransformer } from '@adonisjs/core/transformers'
import { imageUrl } from '#utils/image_url'

/** Requires the `uploadedBy` relation to be preloaded. */
export default class MediaTransformer extends BaseTransformer<Media> {
  toObject() {
    const { uploadedBy } = this.resource
    return {
      ...this.pick(this.resource, [
        'id',
        'key',
        'folder',
        'contentType',
        'sizeBytes',
        'width',
        'height',
        'originalName',
        'createdAt',
      ]),
      url: imageUrl(this.resource.key),
      uploadedBy: uploadedBy ? { id: uploadedBy.id, fullName: uploadedBy.fullName } : null,
    }
  }
}
