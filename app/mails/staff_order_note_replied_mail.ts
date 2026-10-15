import OrderMail from '#mails/order_mail'

/** Customer reply to an order note, sent to the staff notification recipients. */
export default class StaffOrderNoteRepliedMail extends OrderMail {
  readonly type = 'staff_order_note_replied'
}
