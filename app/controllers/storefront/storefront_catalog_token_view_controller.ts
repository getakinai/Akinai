import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import StorefrontCatalogTokenService from '#services/storefront_catalog_token_service'
import StorefrontCatalogTokenTransformer from '#transformers/storefront_catalog_token_transformer'

/**
 * A short-lived token, bound to this session, that the storefront sends
 * with every catalog request (`X-Catalog-Token`).
 */
@inject()
export default class StorefrontCatalogTokenViewController {
  constructor(protected catalogTokenService: StorefrontCatalogTokenService) {}

  async handle(ctx: HttpContext) {
    ctx.response.header('Cache-Control', 'no-store')
    return ctx.serialize(
      StorefrontCatalogTokenTransformer.transform(this.catalogTokenService.issue(ctx.session))
    )
  }
}
