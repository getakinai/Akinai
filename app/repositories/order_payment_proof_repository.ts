import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { errors } from '@vinejs/vine'
import { DateTime } from 'luxon'
import Order from '#models/order'
import OrderPaymentProof from '#models/order_payment_proof'

function fieldError(field: string, message: string): never {
  throw new errors.E_VALIDATION_ERROR([{ field, message, rule: 'paymentProof' }])
}

export type PaymentProofSubmitData = {
  imageKey: string | null
  details: string | null
}

/** The saved proof plus the image key it replaced, so the caller can delete the old file. */
export type PaymentProofSubmitResult = {
  proof: OrderPaymentProof
  previousImageKey: string | null
}

export default class OrderPaymentProofRepository {
  async findForOrder(orderId: string): Promise<OrderPaymentProof | null> {
    return OrderPaymentProof.findBy('order_id', orderId)
  }

  /**
   * Saves (or replaces) the order's proof and moves the order to
   * `payment_submitted`, in one transaction with the order row locked.
   * Replacing clears the previous review. Throws a validation error when
   * the order no longer accepts proof (paid, cancelled, not bank transfer).
   */
  async submit(orderId: string, data: PaymentProofSubmitData): Promise<PaymentProofSubmitResult> {
    return db.transaction(async (trx) => {
      const order = await this.lockOrder(orderId, trx)
      if (!order.acceptsPaymentProof) {
        fieldError('order', 'This order no longer accepts proof of payment')
      }

      const existing = await OrderPaymentProof.query({ client: trx })
        .where('order_id', orderId)
        .forUpdate()
        .first()
      const previousImageKey = existing?.imageKey ?? null
      const proof = existing ?? new OrderPaymentProof()
      proof.useTransaction(trx)
      proof.merge({
        orderId,
        imageKey: data.imageKey,
        details: data.details,
        submittedAt: DateTime.now(),
        reviewedAt: null,
        reviewedByUserId: null,
        rejectionReason: null,
      })
      await proof.save()

      if (order.paymentStatus !== 'payment_submitted') {
        order.useTransaction(trx)
        order.$skipAudit = true
        order.paymentStatus = 'payment_submitted'
        await order.save()
      }

      return { proof, previousImageKey }
    })
  }

  /** Staff confirmed the transfer arrived: the order is paid. */
  async approve(orderId: string, userId: string): Promise<void> {
    await db.transaction(async (trx) => {
      const { order, proof } = await this.lockForReview(orderId, trx)
      proof.merge({ reviewedAt: DateTime.now(), reviewedByUserId: userId, rejectionReason: null })
      await proof.save()
      order.merge({ paymentStatus: 'paid', paidAt: DateTime.now() })
      await order.save()
    })
  }

  /** Staff couldn't match the transfer: back to pending, with the reason for the customer. */
  async reject(orderId: string, userId: string, reason: string): Promise<void> {
    await db.transaction(async (trx) => {
      const { order, proof } = await this.lockForReview(orderId, trx)
      proof.merge({ reviewedAt: DateTime.now(), reviewedByUserId: userId, rejectionReason: reason })
      await proof.save()
      order.paymentStatus = 'pending'
      await order.save()
    })
  }

  protected async lockOrder(orderId: string, trx: TransactionClientContract): Promise<Order> {
    return Order.query({ client: trx }).where('id', orderId).forUpdate().firstOrFail()
  }

  protected async lockForReview(orderId: string, trx: TransactionClientContract) {
    const order = await this.lockOrder(orderId, trx)
    if (order.status !== 'open' || order.paymentStatus !== 'payment_submitted') {
      fieldError('order', 'There is no proof of payment waiting for review')
    }
    const proof = await OrderPaymentProof.query({ client: trx })
      .where('order_id', orderId)
      .forUpdate()
      .first()
    if (!proof) fieldError('order', 'There is no proof of payment waiting for review')

    order.useTransaction(trx)
    order.$skipAudit = true
    proof.useTransaction(trx)
    return { order, proof }
  }
}
