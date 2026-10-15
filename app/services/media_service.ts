import { inject } from '@adonisjs/core'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { MEDIA_FOLDER } from '#constants/media'
import type Media from '#models/media'
import { registeredPlugins } from '#plugin_host/registry'
import MediaRepository, {
  type MediaUsage,
  type PaginateMediaData,
} from '#repositories/media_repository'
import { deleteImages, uploadImage } from '#utils/uploader'

export type ListMediaFilters = Partial<PaginateMediaData>

export class MediaInUseError extends Error {
  constructor(public usages: MediaUsage[]) {
    super('This image is still in use')
  }
}

/**
 * The media gallery: every public image upload. Records keep their own
 * image keys; deleting from the gallery is the only way a file is removed.
 */
@inject()
export default class MediaService {
  constructor(protected mediaRepository: MediaRepository) {}

  async paginate(filters: ListMediaFilters = {}) {
    return this.mediaRepository.paginate({
      q: filters.q || undefined,
      folder: filters.folder || undefined,
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 50,
    })
  }

  async findOrFail(id: string): Promise<Media> {
    return this.mediaRepository.findOrFail(id)
  }

  async upload(files: MultipartFile[]): Promise<string[]> {
    const keys: string[] = []
    for (const file of files) {
      const { key } = await uploadImage(file, MEDIA_FOLDER)
      keys.push(key)
    }
    return keys
  }

  /**
   * Includes plugins that are uninstalled but still keep records, so an
   * image they show again on reinstall is not deleted.
   */
  async usages(media: Media): Promise<MediaUsage[]> {
    const [core, ...fromPlugins] = await Promise.all([
      this.mediaRepository.usages(media.key),
      ...registeredPlugins().map((plugin) => plugin.mediaUsages?.(media.key) ?? []),
    ])
    return [...core, ...fromPlugins.flat()]
  }

  /** Throws `MediaInUseError` while a record still shows the image. */
  async delete(media: Media): Promise<void> {
    const usages = await this.usages(media)
    if (usages.length > 0) throw new MediaInUseError(usages)

    await media.delete()
    await deleteImages([media.key])
  }
}
