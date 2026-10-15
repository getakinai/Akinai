import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * A theme package that can't be installed. Every problem found is listed, so
 * a theme author can fix them in one pass. Rendered as
 * `422 { errors: [{ message }, …] }`.
 */
export default class ThemePackageException extends Exception {
  constructor(public problems: string[]) {
    super(problems[0] ?? 'The theme package is invalid', {
      status: 422,
      code: 'E_THEME_PACKAGE',
    })
  }

  async handle(error: this, ctx: HttpContext) {
    return ctx.response
      .status(error.status)
      .send({ errors: error.problems.map((message) => ({ message })) })
  }
}
