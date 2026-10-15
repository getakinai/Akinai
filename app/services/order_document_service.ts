import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import {
  documentFilename,
  invoiceData,
  packingSlipData,
  receiptData,
  type OrderDocumentKind,
} from '#documents/order_document_data'
import { renderOrderPdf } from '#documents/order_pdf'
import type Order from '#models/order'
import type StoreSetting from '#models/store_setting'
import PaymentMethodService from '#services/payment_method_service'
import StoreSettingService from '#services/store_setting_service'

export type OrderDocument = { filename: string; buffer: Buffer }

/** A PDF ready to attach to an email; base64 so queued mail options stay serializable. */
export type OrderDocumentAttachment = { filename: string; contentBase64: string }

/**
 * Invoice, payment receipt and packing slip PDFs for placed orders. They
 * are rendered on request and never stored.
 */
@inject()
export default class OrderDocumentService {
  constructor(
    protected storeSettingService: StoreSettingService,
    protected paymentMethodService: PaymentMethodService
  ) {}

  /** Drafts have no documents, and receipts need a paid order. */
  isAvailable(kind: OrderDocumentKind, order: Order): boolean {
    if (order.isDraft) return false
    return kind !== 'receipt' || order.isPaid
  }

  /**
   * Renders the document, or returns null when it isn't available for the
   * order. Expects `lineItems` (and `refunds` for receipts) preloaded.
   */
  async render(
    kind: OrderDocumentKind,
    order: Order,
    settings?: StoreSetting
  ): Promise<OrderDocument | null> {
    if (!this.isAvailable(kind, order)) return null
    const store = settings ?? (await this.storeSettingService.get())
    const data =
      kind === 'invoice'
        ? invoiceData(order, store, await this.bankFor(order))
        : kind === 'receipt'
          ? receiptData(order, store)
          : packingSlipData(order, store)
    return { filename: documentFilename(kind, order), buffer: await renderOrderPdf(data) }
  }

  /**
   * The available documents as email attachments. A document that fails to
   * render is logged and left out, so the email still goes.
   */
  async emailAttachments(
    order: Order,
    kinds: OrderDocumentKind[],
    settings: StoreSetting
  ): Promise<OrderDocumentAttachment[]> {
    const attachments: OrderDocumentAttachment[] = []
    for (const kind of kinds) {
      try {
        const document = await this.render(kind, order, settings)
        if (document) {
          attachments.push({
            filename: document.filename,
            contentBase64: document.buffer.toString('base64'),
          })
        }
      } catch (error) {
        logger.warn(
          { err: error, event: 'order_document_failed', orderId: order.id, document: kind },
          'Could not render an order document for the email'
        )
      }
    }
    return attachments
  }

  protected async bankFor(order: Order) {
    if (order.paymentMethod !== 'bank_transfer' || order.isPaid) return null
    return this.paymentMethodService.bankTransferForMarket(order.marketId)
  }
}
