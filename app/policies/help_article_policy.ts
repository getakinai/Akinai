import { AuthorizationResponse, BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type HelpArticle from '#models/help_article'
import type User from '#models/user'

export default class HelpArticlePolicy extends BasePolicy {
  update(user: User, article: HelpArticle): AuthorizerResponse {
    if (!user.hasPermission('help_articles.edit')) {
      return false
    }
    if (article.isArchived) {
      return AuthorizationResponse.deny('Unarchive this article before editing it', 422)
    }
    return true
  }

  archive(user: User, article: HelpArticle): AuthorizerResponse {
    if (!user.hasPermission('help_articles.archive')) {
      return false
    }
    if (article.isArchived) {
      return AuthorizationResponse.deny('This article is already archived', 422)
    }
    return true
  }

  unarchive(user: User, article: HelpArticle): AuthorizerResponse {
    if (!user.hasPermission('help_articles.archive')) {
      return false
    }
    if (!article.isArchived) {
      return AuthorizationResponse.deny('This article is not archived', 422)
    }
    return true
  }
}
