import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import SupportChatService from '#services/support_chat_service'
import SupportChatReplyTransformer from '#transformers/support_chat_reply_transformer'
import { storefrontSupportChatQueryValidator } from '#validators/storefront_support_chat_query_validator'

@inject()
export default class StorefrontSupportChatAskController {
  constructor(protected supportChatService: SupportChatService) {}

  async handle(ctx: HttpContext) {
    const { q } = await ctx.request.validateUsing(storefrontSupportChatQueryValidator, {
      data: ctx.request.qs(),
    })
    const reply = await this.supportChatService.answer(q)
    return ctx.serialize(SupportChatReplyTransformer.transform(reply))
  }
}
