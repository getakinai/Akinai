import OrderMail from '#mails/order_mail'

/** Sent when staff mark a bank transfer order as paid. */
export default class OrderPaymentReceivedMail extends OrderMail {
  readonly type = 'order_payment_received'
}
