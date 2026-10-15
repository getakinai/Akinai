import SupportTicketMail from '#mails/support_ticket_mail'

/** The customer replied on a support ticket, sent to the staff notification recipients. */
export default class StaffSupportTicketRepliedMail extends SupportTicketMail {
  readonly type = 'staff_support_ticket_replied'
}
