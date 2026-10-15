import OrderMail from '#mails/order_mail'

/** Return request alert to the staff notification recipients. */
export default class StaffReturnRequestedMail extends OrderMail {
  readonly type = 'staff_return_requested'
}
