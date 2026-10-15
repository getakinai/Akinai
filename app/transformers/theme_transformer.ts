import type Theme from '#models/theme'
import { BaseTransformer } from '@adonisjs/core/transformers'

/** A theme library entry. Requires the `uploadedBy` relation to be preloaded. */
export default class ThemeTransformer extends BaseTransformer<Theme> {
  toObject() {
    const { uploadedBy, previewImage, packageHash } = this.resource
    return {
      ...this.pick(this.resource, [
        'id',
        'key',
        'name',
        'version',
        'author',
        'description',
        'role',
        'source',
        'publishedAt',
        'createdAt',
        'updatedAt',
      ]),
      previewImageUrl: previewImage ? `/themes/assets/${packageHash}/${previewImage}` : null,
      uploadedBy: uploadedBy ? { id: uploadedBy.id, fullName: uploadedBy.fullName } : null,
    }
  }
}
