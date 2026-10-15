import { inject } from '@adonisjs/core'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import logger from '@adonisjs/core/services/logger'
import { errors } from '@vinejs/vine'
import { PAYMENT_PROOF_FOLDER } from '#constants/upload_limits'
import type Order from '#models/order'
import type OrderPaymentProof from '#models/order_payment_proof'
import OrderPaymentProofRepository from '#repositories/order_payment_proof_repository'
import AuditLogService from '#services/audit_log_service'
import OrderNotificationService from '#services/order_notification_service'
import { deletePrivateFiles, readPrivateImage, uploadPrivateImage } from '#utils/uploader'

export type PaymentProofSubmitPayload = {
  image: MultipartFile | null
  details: string | null
}

export type PaymentProofDecision = { decision: 'approve' } | { decision: 'reject'; reason: string }

function fieldError(field: string, message: string): never {
  throw new errors.E_VALIDATION_ERROR([{ field, message, rule: 'paymentProof' }])
}

const excerpt = (value: string) => (value.length > 120 ? `${value.slice(0, 117)}…` : value)

/**
 * Proof of payment for bank transfer orders: the customer sends a
 * screenshot and/or details (order moves to `payment_submitted`), then
 * staff approve it (paid) or reject it (back to pending, with a reason).
 */
@inject()
export default class OrderPaymentProofService {
  constructor(
    protected orderPaymentProofRepository: OrderPaymentProofRepository,
    protected auditLogService: AuditLogService,
    protected orderNotificationService: OrderNotificationService
  ) {}

  async submit(order: Order, payload: PaymentProofSubmitPayload): Promise<void> {
    if (!payload.image && !payload.details) {
      fieldError('details', 'Add a screenshot or the payment details')
    }
    if (!order.acceptsPaymentProof) {
      fieldError('order', 'This order no longer accepts proof of payment')
    }

    const imageKey = payload.image
      ? await uploadPrivateImage(payload.image, PAYMENT_PROOF_FOLDER)
      : null

    let previousImageKey: string | null
    try {
      ;({ previousImageKey } = await this.orderPaymentProofRepository.submit(order.id, {
        imageKey,
        details: payload.details,
      }))
    } catch (error) {
      if (imageKey) await deletePrivateFiles([imageKey])
      throw error
    }
    if (previousImageKey && previousImageKey !== imageKey) {
      await deletePrivateFiles([previousImageKey])
    }

    await this.auditLogService.recordOrderEvent(order, 'payment_submitted', {
      before: { paymentStatus: order.paymentStatus },
      after: {
        paymentStatus: 'payment_submitted',
        screenshot: imageKey !== null,
        ...(payload.details ? { details: excerpt(payload.details) } : {}),
      },
    })
    await this.orderNotificationService.paymentProofSubmitted(order.id, payload.details)
  }

  async review(order: Order, userId: string, input: PaymentProofDecision): Promise<void> {
    if (input.decision === 'approve') {
      await this.orderPaymentProofRepository.approve(order.id, userId)
      await this.auditLogService.recordOrderEvent(order, 'paid', {
        before: { paymentStatus: 'payment_submitted' },
        after: { paymentStatus: 'paid' },
      })
      await this.orderNotificationService.paymentReceived(order.id)
      return
    }

    await this.orderPaymentProofRepository.reject(order.id, userId, input.reason)
    await this.auditLogService.recordOrderEvent(order, 'updated', {
      before: { paymentStatus: 'payment_submitted' },
      after: { paymentStatus: 'pending', rejectionReason: input.reason },
    })
    await this.orderNotificationService.paymentProofRejected(order.id, input.reason)
  }

  /** The proof's screenshot, or null when there is none (or the file is gone). */
  async image(orderId: string): Promise<{ contents: Uint8Array; contentType: string } | null> {
    const proof: OrderPaymentProof | null =
      await this.orderPaymentProofRepository.findForOrder(orderId)
    if (!proof?.imageKey) return null
    try {
      return await readPrivateImage(proof.imageKey)
    } catch (error) {
      logger.warn(
        { err: error, orderId, event: 'payment_proof_image_missing' },
        'Could not read payment proof image'
      )
      return null
    }
  }
}
