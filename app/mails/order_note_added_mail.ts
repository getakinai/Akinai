import OrderMail from '#mails/order_mail'

/** Sent when staff add a customer-visible note on an order. */
export default class OrderNoteAddedMail extends OrderMail {
  readonly type = 'order_note_added'
}
