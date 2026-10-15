import OrderMail from '#mails/order_mail'

/** Proof of bank transfer payment alert to the staff notification recipients. */
export default class StaffPaymentSubmittedMail extends OrderMail {
  readonly type = 'staff_payment_submitted'
}
