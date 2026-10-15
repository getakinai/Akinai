import { inject } from '@adonisjs/core'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { errors } from '@vinejs/vine'
import type StorefrontHeroSlide from '#models/storefront_hero_slide'
import { HERO_IMAGE_FOLDER, MAX_HERO_SLIDES, type MenuItemType } from '#constants/storefront'
import StorefrontHeroSlideRepository from '#repositories/storefront_hero_slide_repository'
import { deleteImages, uploadImage } from '#utils/uploader'

export type StorefrontHeroSlideInput = {
  eyebrow?: string | null
  heading: string
  subheading?: string | null
  buttonLabel?: string | null
  type: MenuItemType
  collectionId?: string | null
  pageId?: string | null
  url?: string | null
  isVisible?: boolean
}

@inject()
export default class StorefrontHeroSlideService {
  constructor(protected storefrontHeroSlideRepository: StorefrontHeroSlideRepository) {}

  async list(): Promise<StorefrontHeroSlide[]> {
    return this.storefrontHeroSlideRepository.list()
  }

  async listPublic(): Promise<StorefrontHeroSlide[]> {
    return this.storefrontHeroSlideRepository.listPublic()
  }

  async findOrFail(id: string): Promise<StorefrontHeroSlide> {
    return this.storefrontHeroSlideRepository.findOrFail(id)
  }

  async create(input: StorefrontHeroSlideInput): Promise<StorefrontHeroSlide> {
    if ((await this.storefrontHeroSlideRepository.count()) >= MAX_HERO_SLIDES) {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'heading',
          message: `The hero can hold at most ${MAX_HERO_SLIDES} slides`,
          rule: 'maxLength',
        },
      ])
    }
    return this.storefrontHeroSlideRepository.create(normalize(input))
  }

  async update(slide: StorefrontHeroSlide, input: StorefrontHeroSlideInput) {
    return this.storefrontHeroSlideRepository.update(slide, {
      ...normalize(input),
      isVisible: input.isVisible ?? slide.isVisible,
    })
  }

  async delete(slide: StorefrontHeroSlide): Promise<void> {
    const image = slide.image
    await this.storefrontHeroSlideRepository.delete(slide)
    if (image) await deleteImages([image])
  }

  /**
   * The new file is written before the slide points at it, and the previous
   * file is removed only after the slide is saved.
   */
  async setImage(slide: StorefrontHeroSlide, file: MultipartFile): Promise<StorefrontHeroSlide> {
    const previous = slide.image
    const { key } = await uploadImage(file, HERO_IMAGE_FOLDER)
    const saved = await this.storefrontHeroSlideRepository.update(slide, { image: key })
    if (previous) await deleteImages([previous])
    return saved
  }

  async removeImage(slide: StorefrontHeroSlide): Promise<StorefrontHeroSlide> {
    const previous = slide.image
    if (!previous) return slide
    const saved = await this.storefrontHeroSlideRepository.update(slide, { image: null })
    await deleteImages([previous])
    return saved
  }

  /**
   * `ids` must list every slide exactly once, in the new order.
   */
  async reorder(ids: string[]): Promise<void> {
    const existing = new Set(await this.storefrontHeroSlideRepository.ids())
    const complete = ids.length === existing.size && ids.every((id) => existing.has(id))
    if (!complete) {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'ids',
          message: 'The slides changed. Refresh the page and try again',
          rule: 'heroOrder',
        },
      ])
    }
    await this.storefrontHeroSlideRepository.reorder(ids)
  }
}

/**
 * Keeps only the target that matches the slide type and turns blank
 * optional texts into null.
 */
function normalize(input: StorefrontHeroSlideInput) {
  const { type, collectionId, pageId, url } = input
  return {
    eyebrow: input.eyebrow || null,
    heading: input.heading,
    subheading: input.subheading || null,
    buttonLabel: input.buttonLabel || null,
    type,
    collectionId: type === 'collection' ? (collectionId ?? null) : null,
    pageId: type === 'page' ? (pageId ?? null) : null,
    url: type === 'url' ? (url ?? null) : null,
    isVisible: input.isVisible ?? true,
  }
}
