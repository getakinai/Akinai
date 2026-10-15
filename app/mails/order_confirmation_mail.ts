import OrderMail from '#mails/order_mail'

/** Order confirmation, sent when an order is placed (bank transfer) or paid (Stripe). */
export default class OrderConfirmationMail extends OrderMail {
  readonly type = 'order_confirmation'
}
