import OrderMail from '#mails/order_mail'

/** Sent when a refund is issued. */
export default class OrderRefundedMail extends OrderMail {
  readonly type = 'order_refunded'
}
