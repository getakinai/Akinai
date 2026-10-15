import OrderMail from '#mails/order_mail'

/** Shipping confirmation for one fulfillment. */
export default class OrderShippedMail extends OrderMail {
  readonly type = 'order_shipped'
}
