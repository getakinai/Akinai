import OrderMail from '#mails/order_mail'

/** Confirms a return request to the customer. */
export default class ReturnRequestedMail extends OrderMail {
  readonly type = 'return_requested'
}
