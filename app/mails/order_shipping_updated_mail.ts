import OrderMail from '#mails/order_mail'

/** Sent when the tracking of a fulfillment changes. */
export default class OrderShippingUpdatedMail extends OrderMail {
  readonly type = 'order_shipping_updated'
}
