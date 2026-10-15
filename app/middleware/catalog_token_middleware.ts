import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { CATALOG_TOKEN_ERROR_CODE, CATALOG_TOKEN_HEADER } from '#constants/storefront'
import StorefrontCatalogTokenService from '#services/storefront_catalog_token_service'

/**
 * Lets a storefront catalog JSON route run only with a valid catalog token
 * (`X-Catalog-Token`, from `GET /store/catalog-token`) bound to this
 * session. Otherwise answers `401 { error, code: 'E_CATALOG_TOKEN' }`.
 */
@inject()
export default class CatalogTokenMiddleware {
  constructor(protected catalogTokenService: StorefrontCatalogTokenService) {}

  async handle(ctx: HttpContext, next: NextFn) {
    const header = ctx.request.header(CATALOG_TOKEN_HEADER)
    const token = typeof header === 'string' && header.length <= 2048 ? header : undefined
    const result = this.catalogTokenService.check(ctx.session, token)
    if (result === 'valid') return next()

    if (result === 'invalid') {
      ctx.logger.warn(
        {
          event: 'storefront_catalog_token_rejected',
          ip: ctx.request.ip(),
          url: ctx.request.url(),
        },
        'Rejected storefront catalog token'
      )
    }
    return ctx.response.unauthorized({
      error: 'Your session has expired. Please reload the page.',
      code: CATALOG_TOKEN_ERROR_CODE,
    })
  }
}
