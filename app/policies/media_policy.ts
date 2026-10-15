import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type User from '#models/user'

/** Every staff User can browse and upload media; only admins delete it. */
export default class MediaPolicy extends BasePolicy {
  delete(user: User): AuthorizerResponse {
    return user.isAdmin
  }
}
