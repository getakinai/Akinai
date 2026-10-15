import OrderMail from '#mails/order_mail'

/** New order alert to the staff notification recipients. */
export default class StaffOrderPlacedMail extends OrderMail {
  readonly type = 'staff_order_placed'
}
