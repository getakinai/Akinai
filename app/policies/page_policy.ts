import { AuthorizationResponse, BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type Page from '#models/page'
import type User from '#models/user'

export default class PagePolicy extends BasePolicy {
  update(user: User, page: Page): AuthorizerResponse {
    if (!user.hasPermission('pages.edit')) {
      return false
    }
    if (page.isArchived) {
      return AuthorizationResponse.deny('Unarchive this page before editing it', 422)
    }
    return true
  }

  archive(user: User, page: Page): AuthorizerResponse {
    if (!user.hasPermission('pages.archive')) {
      return false
    }
    if (page.isArchived) {
      return AuthorizationResponse.deny('This page is already archived', 422)
    }
    return true
  }

  unarchive(user: User, page: Page): AuthorizerResponse {
    if (!user.hasPermission('pages.archive')) {
      return false
    }
    if (!page.isArchived) {
      return AuthorizationResponse.deny('This page is not archived', 422)
    }
    return true
  }
}
