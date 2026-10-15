import OrderMail from '#mails/order_mail'

/** Tells the customer their return was approved, with instructions. */
export default class ReturnApprovedMail extends OrderMail {
  readonly type = 'return_approved'
}
