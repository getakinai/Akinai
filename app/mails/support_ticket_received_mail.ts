import SupportTicketMail from '#mails/support_ticket_mail'

/** Confirms to the customer that their question reached the team, with the thread link. */
export default class SupportTicketReceivedMail extends SupportTicketMail {
  readonly type = 'support_ticket_received'
}
