import type { SupportChatReply } from '#services/support_chat_service'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class SupportChatReplyTransformer extends BaseTransformer<SupportChatReply> {
  toObject() {
    const reply = this.resource
    return {
      intent: reply.intent,
      messages: reply.messages,
      links: reply.links.map((link) => ({
        title: link.title,
        description: link.description,
        href: link.href,
      })),
      suggestions: reply.suggestions,
      offerHandoff: reply.offerHandoff,
    }
  }
}
