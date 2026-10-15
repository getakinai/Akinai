import OrderMail from '#mails/order_mail'

/** Sent when staff cancel an order. */
export default class OrderCancelledMail extends OrderMail {
  readonly type = 'order_cancelled'
}
