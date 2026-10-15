import { BaseTransformer } from '@adonisjs/core/transformers'
import type { UploadedImage } from '#utils/uploader'

/**
 * A stored photo: the Drive `key` the forms send back, and its public `url`.
 */
export default class UploadedImageTransformer extends BaseTransformer<UploadedImage> {
  toObject() {
    return { key: this.resource.key, url: this.resource.url }
  }
}
