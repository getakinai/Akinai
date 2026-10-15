import SupportTicketMail from '#mails/support_ticket_mail'

/** A staff reply on a support ticket, sent to the customer with the thread link. */
export default class SupportTicketRepliedMail extends SupportTicketMail {
  readonly type = 'support_ticket_replied'
}
