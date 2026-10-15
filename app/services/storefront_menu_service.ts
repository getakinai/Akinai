import { inject } from '@adonisjs/core'
import { errors } from '@vinejs/vine'
import type Collection from '#models/collection'
import type StorefrontMenuItem from '#models/storefront_menu_item'
import type { MenuItemType } from '#constants/storefront'
import StorefrontCatalogRepository from '#repositories/storefront_catalog_repository'
import StorefrontMenuItemRepository from '#repositories/storefront_menu_item_repository'

export const MAX_MENU_ITEMS = 30

export type StorefrontMenuItemInput = {
  label: string
  type: MenuItemType
  collectionId?: string | null
  pageId?: string | null
  url?: string | null
  isVisible?: boolean
}

@inject()
export default class StorefrontMenuService {
  constructor(
    protected storefrontMenuItemRepository: StorefrontMenuItemRepository,
    protected storefrontCatalogRepository: StorefrontCatalogRepository
  ) {}

  async list(): Promise<StorefrontMenuItem[]> {
    return this.storefrontMenuItemRepository.list()
  }

  async collectionOptions(): Promise<Collection[]> {
    return this.storefrontCatalogRepository.linkableCollections()
  }

  async listPublic(): Promise<StorefrontMenuItem[]> {
    return this.storefrontMenuItemRepository.listPublic()
  }

  async findOrFail(id: string): Promise<StorefrontMenuItem> {
    return this.storefrontMenuItemRepository.findOrFail(id)
  }

  async create(input: StorefrontMenuItemInput): Promise<StorefrontMenuItem> {
    if ((await this.storefrontMenuItemRepository.count()) >= MAX_MENU_ITEMS) {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'label',
          message: `The menu can hold at most ${MAX_MENU_ITEMS} items`,
          rule: 'maxLength',
        },
      ])
    }
    return this.storefrontMenuItemRepository.create(normalize(input))
  }

  async update(item: StorefrontMenuItem, input: StorefrontMenuItemInput) {
    return this.storefrontMenuItemRepository.update(item, {
      ...normalize(input),
      isVisible: input.isVisible ?? item.isVisible,
    })
  }

  async delete(item: StorefrontMenuItem): Promise<void> {
    await this.storefrontMenuItemRepository.delete(item)
  }

  /**
   * `ids` must list every menu item exactly once, in the new order.
   */
  async reorder(ids: string[]): Promise<void> {
    const existing = new Set(await this.storefrontMenuItemRepository.ids())
    const complete = ids.length === existing.size && ids.every((id) => existing.has(id))
    if (!complete) {
      throw new errors.E_VALIDATION_ERROR([
        {
          field: 'ids',
          message: 'The menu changed. Refresh the page and try again',
          rule: 'menuOrder',
        },
      ])
    }
    await this.storefrontMenuItemRepository.reorder(ids)
  }
}

/**
 * Keeps only the target that matches the item type.
 */
function normalize({ label, type, collectionId, pageId, url, isVisible }: StorefrontMenuItemInput) {
  return {
    label,
    type,
    collectionId: type === 'collection' ? (collectionId ?? null) : null,
    pageId: type === 'page' ? (pageId ?? null) : null,
    url: type === 'url' ? (url ?? null) : null,
    isVisible: isVisible ?? true,
  }
}
