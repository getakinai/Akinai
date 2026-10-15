import OrderMail from '#mails/order_mail'

/** Tells the customer their return was declined, with the reason. */
export default class ReturnDeclinedMail extends OrderMail {
  readonly type = 'return_declined'
}
