import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Rejects requests whose `:id` route param is not a valid UUID, so
 * controllers can use `params.id` without re-validating it.
 */
export default class UuidRouteParamMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const id = ctx.params.id

    if (id !== undefined && !UUID_PATTERN.test(String(id))) {
      return ctx.response.notFound({ error: 'Resource not found' })
    }

    return next()
  }
}
