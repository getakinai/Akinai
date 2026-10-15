import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import mail from '@adonisjs/mail/services/main'
import type { BaseMail } from '@adonisjs/mail'
import type { EmailType } from '#constants/email_logs'
import type Fulfillment from '#models/fulfillment'
import type Order from '#models/order'
import type OrderLineItem from '#models/order_line_item'
import type StoreSetting from '#models/store_setting'
import {
  customerOrderUrl,
  moneyFormatFor,
  orderEmailData,
  staffOrderUrl,
  storeUrl,
  type OrderEmailBlock,
  type OrderEmailContent,
} from '#mails/helpers/order_email_data'
import type { OrderMailOptions } from '#mails/order_mail'
import OrderCancelledMail from '#mails/order_cancelled_mail'
import OrderNoteAddedMail from '#mails/order_note_added_mail'
import OrderConfirmationMail from '#mails/order_confirmation_mail'
import OrderPaymentReceivedMail from '#mails/order_payment_received_mail'
import OrderPaymentRejectedMail from '#mails/order_payment_rejected_mail'
import OrderRefundedMail from '#mails/order_refunded_mail'
import OrderShippedMail from '#mails/order_shipped_mail'
import OrderShippingUpdatedMail from '#mails/order_shipping_updated_mail'
import ReturnApprovedMail from '#mails/return_approved_mail'
import ReturnDeclinedMail from '#mails/return_declined_mail'
import ReturnRequestedMail from '#mails/return_requested_mail'
import StaffOrderNoteRepliedMail from '#mails/staff_order_note_replied_mail'
import StaffOrderPlacedMail from '#mails/staff_order_placed_mail'
import StaffPaymentSubmittedMail from '#mails/staff_payment_submitted_mail'
import StaffReturnRequestedMail from '#mails/staff_return_requested_mail'
import type OrderReturn from '#models/order_return'
import type Refund from '#models/refund'
import OrderRepository from '#repositories/order_repository'
import RefundRepository from '#repositories/refund_repository'
import ReturnRepository from '#repositories/return_repository'
import AuditLogService from '#services/audit_log_service'
import { orderAuditLabel } from '#services/order_audit'
import OrderDocumentService, {
  type OrderDocumentAttachment,
} from '#services/order_document_service'
import PaymentMethodService from '#services/payment_method_service'
import StoreSettingService from '#services/store_setting_service'
import { formatMoney } from '#utils/money'

type Recipient = 'customer' | 'staff'

const STAFF_FOOTER =
  'You get this email because your address is listed under Settings → Store details → Notifications.'

/**
 * Sends the emails about an order (confirmation, payment, shipping,
 * cancellation, refunds, returns) and records each one in the order's
 * activity. Called after the change has committed. A failure to build an
 * email is logged and never undoes the order change.
 */
@inject()
export default class OrderNotificationService {
  constructor(
    protected orderRepository: OrderRepository,
    protected storeSettingService: StoreSettingService,
    protected paymentMethodService: PaymentMethodService,
    protected auditLogService: AuditLogService,
    protected refundRepository: RefundRepository,
    protected returnRepository: ReturnRepository,
    protected orderDocumentService: OrderDocumentService
  ) {}

  /**
   * Order confirmation to the customer and, unless staff placed it, a new
   * order alert to staff.
   */
  async orderPlaced(orderId: string, { notifyStaff }: { notifyStaff: boolean }) {
    await this.safely(orderId, 'order_confirmation', async () => {
      const { order, settings } = await this.load(orderId)
      await this.sendToCustomer(order, settings, 'order_confirmation', async () => ({
        subject: `Order ${orderAuditLabel(order)} confirmed`,
        content: await this.confirmationContent(order, settings),
        Mail: OrderConfirmationMail,
        attachments: await this.orderDocumentService.emailAttachments(
          order,
          ['invoice', 'receipt'],
          settings
        ),
      }))
      if (notifyStaff) await this.sendStaffOrderAlert(order, settings)
    })
  }

  /** Staff marked a pending (bank transfer) order as paid. */
  async paymentReceived(orderId: string) {
    await this.safely(orderId, 'order_payment_received', async () => {
      const { order, settings } = await this.load(orderId)
      await this.sendToCustomer(order, settings, 'order_payment_received', async () => ({
        subject: `Payment received for order ${orderAuditLabel(order)}`,
        content: {
          title: 'Payment received',
          lines: [
            `${this.greeting(order)}we’ve received your payment of ${this.money(order, settings, order.total)}.`,
            'We’ll let you know when your order ships.',
          ],
          action: this.customerAction(order),
        },
        Mail: OrderPaymentReceivedMail,
        attachments: await this.orderDocumentService.emailAttachments(order, ['receipt'], settings),
      }))
    })
  }

  /** A customer sent proof of a bank transfer payment: alert staff to check it. */
  async paymentProofSubmitted(orderId: string, details: string | null) {
    await this.safely(orderId, 'staff_payment_submitted', async () => {
      const { order, settings } = await this.load(orderId)
      const recipients = await this.storeSettingService.staffRecipients()
      if (recipients.length === 0) return
      const who = order.customer?.fullName || order.email || 'A customer'
      await this.send(order, 'staff_payment_submitted', 'staff', StaffPaymentSubmittedMail, {
        to: recipients,
        subject: `Proof of payment for order ${orderAuditLabel(order)}`,
        data: orderEmailData(order, settings, {
          title: `Proof of payment for order ${orderAuditLabel(order)}`,
          lines: [
            `${who} says they paid ${this.money(order, settings, order.total)} by bank transfer${order.bankReference ? ` (reference ${order.bankReference})` : ''}.`,
            ...(details ? [`Their details: “${details}”`] : []),
            'Check your bank account, then mark the order as paid or reject the proof.',
          ],
          hideTotals: true,
          action: { label: 'Review the payment', url: staffOrderUrl(order) },
          footer: STAFF_FOOTER,
        }),
      })
    })
  }

  /** Staff couldn't match the customer's proof of payment; it's pending again. */
  async paymentProofRejected(orderId: string, reason: string) {
    await this.safely(orderId, 'order_payment_rejected', async () => {
      const { order, settings } = await this.load(orderId)
      await this.sendToCustomer(order, settings, 'order_payment_rejected', async () => ({
        subject: `We couldn’t confirm your payment for order ${orderAuditLabel(order)}`,
        content: {
          title: 'We couldn’t confirm your payment',
          lines: [
            `${this.greeting(order)}we couldn’t match the proof of payment you sent for order ${orderAuditLabel(order)}.`,
            `Reason: ${reason}`,
            'Please check the details and send your proof again from your order page.',
          ],
          blocks: await this.bankTransferBlocks(order, settings),
          action: this.customerAction(order),
        },
        Mail: OrderPaymentRejectedMail,
      }))
    })
  }

  /** Staff added a note the customer can see on their order. */
  async noteAdded(orderId: string, body: string) {
    await this.safely(orderId, 'order_note_added', async () => {
      const { order, settings } = await this.load(orderId)
      await this.sendToCustomer(order, settings, 'order_note_added', async () => ({
        subject: `Update on order ${orderAuditLabel(order)}`,
        content: {
          title: 'Message about your order',
          lines: [
            `${this.greeting(order)}we added a note to your order:`,
            body,
            'You can also read this note when you view your order online.',
          ],
          action: this.customerAction(order),
        },
        Mail: OrderNoteAddedMail,
      }))
    })
  }

  /** The customer replied to a note on their order: alert staff. */
  async noteReplied(orderId: string, body: string) {
    await this.safely(orderId, 'staff_order_note_replied', async () => {
      const { order, settings } = await this.load(orderId)
      const recipients = await this.storeSettingService.staffRecipients()
      if (recipients.length === 0) return
      const who = order.customer?.fullName || order.email || 'The customer'
      await this.send(order, 'staff_order_note_replied', 'staff', StaffOrderNoteRepliedMail, {
        to: recipients,
        subject: `New reply on order ${orderAuditLabel(order)}`,
        data: orderEmailData(order, settings, {
          title: `New reply on order ${orderAuditLabel(order)}`,
          lines: [`${who} replied to a note on their order:`, body],
          hideTotals: true,
          action: { label: 'View the order', url: staffOrderUrl(order) },
          footer: STAFF_FOOTER,
        }),
      })
    })
  }

  /** A new fulfillment shipped items of the order. */
  async shipped(orderId: string, fulfillmentId: string) {
    await this.safely(orderId, 'order_shipped', async () => {
      const { order, settings } = await this.load(orderId)
      const fulfillment = this.fulfillmentOf(order, fulfillmentId)
      const everything = order.fulfillmentStatus === 'fulfilled'
      await this.sendToCustomer(order, settings, 'order_shipped', async () => ({
        subject: `${everything ? 'Your order' : 'Items from your order'} ${orderAuditLabel(order)} ${everything ? 'is' : 'are'} on the way`,
        content: {
          title: everything ? 'Your order is on the way' : 'Some items are on the way',
          lines: [
            `${this.greeting(order)}${everything ? 'your order has shipped' : 'part of your order has shipped'}.`,
            ...(everything ? [] : ['We’ll email you again when the rest ships.']),
          ],
          blocks: this.trackingBlocks(fulfillment),
          items: this.fulfillmentItems(order, fulfillment),
          itemsHeading: 'Items in this shipment',
          hideTotals: true,
          action: this.customerAction(order),
        },
        Mail: OrderShippedMail,
      }))
    })
  }

  /** The tracking of a fulfillment changed. */
  async shippingUpdated(orderId: string, fulfillmentId: string) {
    await this.safely(orderId, 'order_shipping_updated', async () => {
      const { order, settings } = await this.load(orderId)
      const fulfillment = this.fulfillmentOf(order, fulfillmentId)
      await this.sendToCustomer(order, settings, 'order_shipping_updated', async () => ({
        subject: `Shipping update for order ${orderAuditLabel(order)}`,
        content: {
          title: 'Shipping update',
          lines: [`${this.greeting(order)}the tracking details for your shipment have changed.`],
          blocks: this.trackingBlocks(fulfillment),
          items: this.fulfillmentItems(order, fulfillment),
          itemsHeading: 'Items in this shipment',
          hideTotals: true,
          action: this.customerAction(order),
        },
        Mail: OrderShippingUpdatedMail,
      }))
    })
  }

  /** Staff cancelled the order; `refundId` is the refund issued with it. */
  async cancelled(orderId: string, { refundId }: { refundId: string | null }) {
    await this.safely(orderId, 'order_cancelled', async () => {
      const { order, settings } = await this.load(orderId)
      const refund = refundId ? await this.refundRepository.findWithLinesOrFail(refundId) : null
      await this.sendToCustomer(order, settings, 'order_cancelled', async () => ({
        subject: `Order ${orderAuditLabel(order)} has been cancelled`,
        content: {
          title: 'Your order has been cancelled',
          lines: [
            `${this.greeting(order)}your order ${orderAuditLabel(order)} has been cancelled.`,
            refund
              ? `We’ve refunded ${this.money(order, settings, refund.amount)}. ${this.refundTiming(refund)}`
              : order.paymentStatus === 'voided'
                ? 'You haven’t been charged, so there is nothing to pay.'
                : 'Reply to this email if you have questions about your payment.',
          ],
          action: this.customerAction(order),
        },
        Mail: OrderCancelledMail,
      }))
    })
  }

  /** A refund was issued on the order. */
  async refunded(orderId: string, refundId: string) {
    await this.safely(orderId, 'order_refunded', async () => {
      const [{ order, settings }, refund] = await Promise.all([
        this.load(orderId),
        this.refundRepository.findWithLinesOrFail(refundId),
      ])
      const amount = this.money(order, settings, refund.amount)
      const rows = [
        { label: 'Refund', value: amount },
        ...(refund.shippingAmount > 0
          ? [
              {
                label: 'Includes shipping',
                value: this.money(order, settings, refund.shippingAmount),
              },
            ]
          : []),
        { label: 'Refunded in total', value: this.money(order, settings, order.refundedTotal) },
      ]
      const lineAmounts = new Map(refund.lines.map((line) => [line.orderLineItemId, line.amount]))
      const items = this.linesWith(
        order,
        new Map(refund.lines.map((line) => [line.orderLineItemId, line.quantity]))
      ).map((item) => ({ ...item, amount: lineAmounts.get(item.line.id) }))

      await this.sendToCustomer(order, settings, 'order_refunded', async () => ({
        subject: `Refund of ${amount} for order ${orderAuditLabel(order)}`,
        content: {
          title: 'Your refund is on the way',
          lines: [
            `${this.greeting(order)}we’ve refunded ${amount} for order ${orderAuditLabel(order)}.`,
            this.refundTiming(refund),
          ],
          blocks: [{ heading: 'Refund details', rows, note: null, link: null }],
          ...(items.length > 0 ? { items, itemsHeading: 'Refunded items' } : {}),
          hideTotals: true,
          action: this.customerAction(order),
        },
        Mail: OrderRefundedMail,
      }))
    })
  }

  /** A customer asked to return items: confirmation to them and an alert to staff. */
  async returnRequested(orderId: string, returnId: string) {
    await this.safely(orderId, 'return_requested', async () => {
      const [{ order, settings }, ret] = await Promise.all([
        this.load(orderId),
        this.returnRepository.findOrFail(returnId),
      ])
      const items = this.returnItems(order, ret)
      await this.sendToCustomer(order, settings, 'return_requested', async () => ({
        subject: `We received your return request for order ${orderAuditLabel(order)}`,
        content: {
          title: 'Return request received',
          lines: [
            `${this.greeting(order)}we’ve received your request to return the items below.`,
            'We’ll review it and email you with the next steps. Please don’t send anything back until your return is approved.',
          ],
          items,
          itemsHeading: 'Items to return',
          hideTotals: true,
          action: this.customerAction(order),
        },
        Mail: ReturnRequestedMail,
      }))

      const recipients = await this.storeSettingService.staffRecipients()
      if (recipients.length === 0) return
      const who = order.customer?.fullName || order.email || 'A customer'
      await this.send(order, 'staff_return_requested', 'staff', StaffReturnRequestedMail, {
        to: recipients,
        subject: `Return requested for order ${orderAuditLabel(order)}`,
        data: orderEmailData(order, settings, {
          title: `Return requested for order ${orderAuditLabel(order)}`,
          lines: [
            `${who} asked to return ${items.reduce((sum, item) => sum + item.quantity, 0)} item(s).`,
            ...(ret.customerNote ? [`Their note: “${ret.customerNote}”`] : []),
          ],
          items,
          itemsHeading: 'Items to return',
          hideTotals: true,
          action: { label: 'Review the return', url: staffOrderUrl(order) },
          footer: STAFF_FOOTER,
        }),
      })
    })
  }

  /** Staff approved a return; the staff note carries the return instructions. */
  async returnApproved(orderId: string, returnId: string) {
    await this.safely(orderId, 'return_approved', async () => {
      const [{ order, settings }, ret] = await Promise.all([
        this.load(orderId),
        this.returnRepository.findOrFail(returnId),
      ])
      await this.sendToCustomer(order, settings, 'return_approved', async () => ({
        subject: `Your return for order ${orderAuditLabel(order)} is approved`,
        content: {
          title: 'Your return is approved',
          lines: [
            `${this.greeting(order)}your return for order ${orderAuditLabel(order)} is approved.`,
            'Please send the items back. We’ll refund you once they arrive.',
          ],
          blocks: ret.staffNote
            ? [{ heading: 'How to return your items', rows: [], note: ret.staffNote, link: null }]
            : [],
          items: this.returnItems(order, ret),
          itemsHeading: 'Items to return',
          hideTotals: true,
          action: this.customerAction(order),
        },
        Mail: ReturnApprovedMail,
      }))
    })
  }

  /** Staff declined a return, with the reason. */
  async returnDeclined(orderId: string, returnId: string) {
    await this.safely(orderId, 'return_declined', async () => {
      const [{ order, settings }, ret] = await Promise.all([
        this.load(orderId),
        this.returnRepository.findOrFail(returnId),
      ])
      await this.sendToCustomer(order, settings, 'return_declined', async () => ({
        subject: `Update on your return for order ${orderAuditLabel(order)}`,
        content: {
          title: 'We can’t accept this return',
          lines: [
            `${this.greeting(order)}we’re unable to accept your return for order ${orderAuditLabel(order)}.`,
            ...(ret.declineReason ? [`Reason: ${ret.declineReason}`] : []),
            'Reply to this email if you have any questions.',
          ],
          items: this.returnItems(order, ret),
          itemsHeading: 'Items in the request',
          hideTotals: true,
          action: this.customerAction(order),
        },
        Mail: ReturnDeclinedMail,
      }))
    })
  }

  protected returnItems(order: Order, ret: OrderReturn) {
    return this.linesWith(
      order,
      new Map(ret.lines.map((line) => [line.orderLineItemId, line.quantity]))
    )
  }

  protected refundTiming(refund: Refund) {
    return refund.method === 'stripe'
      ? 'It goes back to your card and may take 5–10 business days to appear.'
      : 'We’re sending it back to you by bank transfer.'
  }

  protected async sendStaffOrderAlert(order: Order, settings: StoreSetting) {
    const recipients = await this.storeSettingService.staffRecipients()
    if (recipients.length === 0) {
      logger.warn(
        {
          event: 'order_notification_skipped',
          orderId: order.id,
          notification: 'staff_order_placed',
        },
        'No staff notification email or owner email is set'
      )
      return
    }
    const total = this.money(order, settings, order.total)
    const who =
      order.customer?.fullName || order.shippingAddress?.fullName || order.email || 'A guest'
    const payment =
      order.paymentStatus === 'paid'
        ? 'Paid by card.'
        : order.bankReference
          ? `Payment pending: bank transfer with reference ${order.bankReference}.`
          : 'Payment pending.'

    await this.send(order, 'staff_order_placed', 'staff', StaffOrderPlacedMail, {
      to: recipients,
      subject: `New order ${orderAuditLabel(order)} · ${total}`,
      data: orderEmailData(order, settings, {
        title: `New order ${orderAuditLabel(order)}`,
        lines: [`${who} placed an order for ${total}.`, payment],
        action: { label: 'View order', url: staffOrderUrl(order) },
        footer: STAFF_FOOTER,
      }),
    })
  }

  protected async confirmationContent(
    order: Order,
    settings: StoreSetting
  ): Promise<OrderEmailContent> {
    const greeting = `${this.greeting(order)}thanks for your order.`
    if (order.paymentStatus === 'paid') {
      return {
        title: 'Thank you for your order',
        lines: [greeting, 'Your payment was received and we’re getting your order ready.'],
        action: this.customerAction(order),
      }
    }
    if (order.paymentMethod === 'bank_transfer') {
      return {
        title: 'Thank you for your order',
        lines: [
          greeting,
          'Please pay by bank transfer using the details below. We’ll start preparing your order once the payment arrives.',
        ],
        blocks: await this.bankTransferBlocks(order, settings),
        action: this.customerAction(order),
      }
    }
    return {
      title: 'Thank you for your order',
      lines: [greeting, 'We’ll be in touch about payment.'],
      action: this.customerAction(order),
    }
  }

  protected async bankTransferBlocks(
    order: Order,
    settings: StoreSetting
  ): Promise<OrderEmailBlock[]> {
    const config = await this.paymentMethodService.bankTransferForMarket(order.marketId)
    const rows = [
      ...(config
        ? [
            { label: 'Account name', value: config.accountName },
            { label: 'Bank', value: config.bankName },
            ...(config.bsb ? [{ label: 'BSB', value: config.bsb }] : []),
            { label: 'Account number', value: config.accountNumber },
          ]
        : []),
      ...(order.bankReference ? [{ label: 'Reference', value: order.bankReference }] : []),
      { label: 'Amount', value: this.money(order, settings, order.total) },
    ]
    return [
      {
        heading: 'Bank transfer details',
        rows,
        note: config?.instructions ?? 'Use the reference above so we can match your payment.',
        link: null,
      },
    ]
  }

  protected trackingBlocks(fulfillment: Fulfillment): OrderEmailBlock[] {
    const rows = [
      ...(fulfillment.trackingCompany
        ? [{ label: 'Carrier', value: fulfillment.trackingCompany }]
        : []),
      ...(fulfillment.trackingNumber
        ? [{ label: 'Tracking number', value: fulfillment.trackingNumber }]
        : []),
    ]
    if (rows.length === 0 && !fulfillment.trackingUrl) return []
    return [
      {
        heading: 'Tracking',
        rows,
        note: null,
        link: fulfillment.trackingUrl
          ? { label: 'Track your package', url: fulfillment.trackingUrl }
          : null,
      },
    ]
  }

  protected fulfillmentItems(order: Order, fulfillment: Fulfillment) {
    const linesById = new Map(order.lineItems.map((line) => [line.id, line]))
    return fulfillment.lines.flatMap((item) => {
      const line = linesById.get(item.orderLineItemId)
      return line ? [{ line, quantity: item.quantity }] : []
    })
  }

  protected fulfillmentOf(order: Order, fulfillmentId: string): Fulfillment {
    const fulfillment = order.fulfillments.find(({ id }) => id === fulfillmentId)
    if (!fulfillment) throw new Error(`Fulfillment ${fulfillmentId} is not on order ${order.id}`)
    return fulfillment
  }

  protected async load(orderId: string) {
    const [order, settings] = await Promise.all([
      this.orderRepository.findForNotificationOrFail(orderId),
      this.storeSettingService.get(),
    ])
    return { order, settings }
  }

  protected greeting(order: Order) {
    const name = order.shippingAddress?.fullName || order.customer?.fullName
    const first = name?.trim().split(/\s+/)[0]
    return first ? `Hi ${first}, ` : 'Hi, '
  }

  protected money(order: Order, settings: StoreSetting, amount: number) {
    return formatMoney(amount, moneyFormatFor(order, settings))
  }

  protected customerAction(order: Order) {
    const url = customerOrderUrl(order)
    return url ? { label: 'View your order', url } : { label: 'Visit the store', url: storeUrl() }
  }

  /** Line picker for emails that list some lines of the order. */
  protected linesWith(order: Order, quantities: Map<string, number>) {
    return order.lineItems.flatMap((line: OrderLineItem) => {
      const quantity = quantities.get(line.id) ?? 0
      return quantity > 0 ? [{ line, quantity }] : []
    })
  }

  protected async sendToCustomer(
    order: Order,
    settings: StoreSetting,
    type: EmailType,
    build: () => Promise<{
      subject: string
      content: OrderEmailContent
      Mail: new (options: OrderMailOptions) => BaseMail
      attachments?: OrderDocumentAttachment[]
    }>
  ) {
    if (!order.email) return
    const { subject, content, Mail, attachments } = await build()
    await this.send(order, type, 'customer', Mail, {
      to: order.email,
      subject,
      data: orderEmailData(order, settings, content),
      attachments,
    })
  }

  protected async send(
    order: Order,
    type: EmailType,
    recipient: Recipient,
    Mail: new (options: OrderMailOptions) => BaseMail,
    options: Omit<OrderMailOptions, 'orderId' | 'customerId'>
  ) {
    await mail.sendLater(new Mail({ ...options, orderId: order.id, customerId: order.customerId }))
    await this.auditLogService.recordOrderEvent(order, 'notified', {
      before: {},
      after: { notification: type, recipient },
    })
  }

  /**
   * Runs one notification. Errors are logged, not thrown: the order change
   * it reports has already committed.
   */
  protected async safely(orderId: string, notification: EmailType, run: () => Promise<void>) {
    try {
      await run()
    } catch (error) {
      logger.warn(
        { err: error, event: 'order_notification_failed', orderId, notification },
        'Could not send order notification'
      )
    }
  }
}
