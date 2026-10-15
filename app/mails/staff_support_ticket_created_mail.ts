import SupportTicketMail from '#mails/support_ticket_mail'

/** A new support ticket, sent to the staff notification recipients. */
export default class StaffSupportTicketCreatedMail extends SupportTicketMail {
  readonly type = 'staff_support_ticket_created'
}
