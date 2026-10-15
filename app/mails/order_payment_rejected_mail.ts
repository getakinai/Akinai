import OrderMail from '#mails/order_mail'

/** Tells the customer staff couldn't match their proof of payment, with the reason. */
export default class OrderPaymentRejectedMail extends OrderMail {
  readonly type = 'order_payment_rejected'
}
