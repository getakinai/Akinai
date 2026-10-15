import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'

export default class AdminMeViewController {
  async handle(ctx: HttpContext) {
    const user = ctx.auth.use('web').getUserOrFail()
    return ctx.serialize(UserTransformer.transform(user).useVariant('toMe'))
  }
}
