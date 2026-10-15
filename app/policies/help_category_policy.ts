import { inject } from '@adonisjs/core'
import { AuthorizationResponse, BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type HelpCategory from '#models/help_category'
import type User from '#models/user'
import HelpCategoryService from '#services/help_category_service'

@inject()
export default class HelpCategoryPolicy extends BasePolicy {
  constructor(protected helpCategoryService: HelpCategoryService) {
    super()
  }

  update(user: User, category: HelpCategory): AuthorizerResponse {
    if (!user.hasPermission('help_articles.edit')) {
      return false
    }
    if (category.isArchived) {
      return AuthorizationResponse.deny('Restore this category before editing it', 422)
    }
    return true
  }

  async archive(user: User, category: HelpCategory): Promise<AuthorizerResponse> {
    if (!user.hasPermission('help_articles.archive')) {
      return false
    }
    if (category.isArchived) {
      return AuthorizationResponse.deny('This category is already archived', 422)
    }
    if (await this.helpCategoryService.hasActiveArticles(category)) {
      return AuthorizationResponse.deny(
        'Archive or move the active articles in this category first',
        422
      )
    }
    return true
  }

  unarchive(user: User, category: HelpCategory): AuthorizerResponse {
    if (!user.hasPermission('help_articles.archive')) {
      return false
    }
    if (!category.isArchived) {
      return AuthorizationResponse.deny('This category is not archived', 422)
    }
    return true
  }
}
