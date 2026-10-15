import { BaseTransformer } from '@adonisjs/core/transformers'
import type { CatalogToken } from '#services/storefront_catalog_token_service'

export default class StorefrontCatalogTokenTransformer extends BaseTransformer<CatalogToken> {
  toObject() {
    return {
      token: this.resource.token,
      expiresIn: this.resource.expiresIn,
    }
  }
}
