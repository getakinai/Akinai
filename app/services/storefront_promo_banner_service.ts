import { inject } from '@adonisjs/core'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { errors } from '@vinejs/vine'
import type StorefrontPromoBanner from '#models/storefront_promo_banner'
import {
  MAX_PROMO_BANNERS_PER_PLACEMENT,
  PROMO_IMAGE_FOLDER,
  type MenuItemType,
  type PromoPlacement,
  type PromoTone,
} from '#constants/storefront'
import StorefrontPromoBannerRepository from '#repositories/storefront_promo_banner_repository'
import { deleteImages, uploadImage } from '#utils/uploader'

export type StorefrontPromoBannerInput = {
  eyebrow?: string | null
  title: string
  buttonLabel?: string | null
  tone: PromoTone
  type: MenuItemType
  collectionId?: string | null
  pageId?: string | null
  url?: string | null
  isVisible?: boolean
}

export type StorefrontPromoBannersByPlacement = Record<PromoPlacement, StorefrontPromoBanner[]>

@inject()
export default class StorefrontPromoBannerService {
  constructor(protected storefrontPromoBannerRepository: StorefrontPromoBannerRepository) {}

  async list(): Promise<StorefrontPromoBanner[]> {
    return this.storefrontPromoBannerRepository.list()
  }

  async listPublic(): Promise<StorefrontPromoBannersByPlacement> {
    const banners = await this.storefrontPromoBannerRepository.listPublic()
    return {
      home_middle: banners.filter(({ placement }) => placement === 'home_middle'),
      home_bottom: banners.filter(({ placement }) => placement === 'home_bottom'),
    }
  }

  async findOrFail(id: string): Promise<StorefrontPromoBanner> {
    return this.storefrontPromoBannerRepository.findOrFail(id)
  }

  async create(
    placement: PromoPlacement,
    input: StorefrontPromoBannerInput
  ): Promise<StorefrontPromoBanner> {
    const count = await this.storefrontPromoBannerRepository.countIn(placement)
    if (count >= MAX_PROMO_BANNERS_PER_PLACEMENT) {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'placement',
          message: `This spot can hold at most ${MAX_PROMO_BANNERS_PER_PLACEMENT} banners`,
          rule: 'maxLength',
        },
      ])
    }
    return this.storefrontPromoBannerRepository.create(placement, normalize(input))
  }

  async update(banner: StorefrontPromoBanner, input: StorefrontPromoBannerInput) {
    return this.storefrontPromoBannerRepository.update(banner, {
      ...normalize(input),
      isVisible: input.isVisible ?? banner.isVisible,
    })
  }

  async delete(banner: StorefrontPromoBanner): Promise<void> {
    const image = banner.image
    await this.storefrontPromoBannerRepository.delete(banner)
    if (image) await deleteImages([image])
  }

  /**
   * The new file is written before the banner points at it, and the
   * previous file is removed only after the banner is saved.
   */
  async setImage(
    banner: StorefrontPromoBanner,
    file: MultipartFile
  ): Promise<StorefrontPromoBanner> {
    const previous = banner.image
    const { key } = await uploadImage(file, PROMO_IMAGE_FOLDER)
    const saved = await this.storefrontPromoBannerRepository.update(banner, { image: key })
    if (previous) await deleteImages([previous])
    return saved
  }

  async removeImage(banner: StorefrontPromoBanner): Promise<StorefrontPromoBanner> {
    const previous = banner.image
    if (!previous) return banner
    const saved = await this.storefrontPromoBannerRepository.update(banner, { image: null })
    await deleteImages([previous])
    return saved
  }

  /**
   * `ids` must list every banner in the placement exactly once, in the new
   * order.
   */
  async reorder(placement: PromoPlacement, ids: string[]): Promise<void> {
    const existing = new Set(await this.storefrontPromoBannerRepository.idsIn(placement))
    const complete = ids.length === existing.size && ids.every((id) => existing.has(id))
    if (!complete) {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'ids',
          message: 'The banners changed. Refresh the page and try again',
          rule: 'promoOrder',
        },
      ])
    }
    await this.storefrontPromoBannerRepository.reorder(placement, ids)
  }
}

/**
 * Keeps only the target that matches the banner type and turns blank
 * optional texts into null.
 */
function normalize(input: StorefrontPromoBannerInput) {
  const { type, collectionId, pageId, url } = input
  return {
    eyebrow: input.eyebrow || null,
    title: input.title,
    buttonLabel: input.buttonLabel || null,
    tone: input.tone,
    type,
    collectionId: type === 'collection' ? (collectionId ?? null) : null,
    pageId: type === 'page' ? (pageId ?? null) : null,
    url: type === 'url' ? (url ?? null) : null,
    isVisible: input.isVisible ?? true,
  }
}
