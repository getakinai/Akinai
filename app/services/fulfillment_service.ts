import { inject } from '@adonisjs/core'
import type Fulfillment from '#models/fulfillment'
import type Order from '#models/order'
import type { ManualFulfillmentStatus } from '#models/order'
import FulfillmentRepository, {
  type FulfillmentLineInput,
  type FulfillmentTracking,
} from '#repositories/fulfillment_repository'
import OrderRepository from '#repositories/order_repository'
import AuditLogService from '#services/audit_log_service'
import LocationService from '#services/location_service'
import OrderNotificationService from '#services/order_notification_service'
import { orderLineSummary } from '#services/order_audit'

export type FulfillInput = Partial<FulfillmentTracking> & {
  lineItems: FulfillmentLineInput[]
  /** Email the shipping confirmation (default on). */
  notifyCustomer?: boolean
}

export type TrackingInput = Partial<FulfillmentTracking> & {
  /** Email a shipping update when the tracking changed (default off). */
  notifyCustomer?: boolean
}

function tracking(input: Partial<FulfillmentTracking>): FulfillmentTracking {
  return {
    trackingCompany: input.trackingCompany?.trim() || null,
    trackingNumber: input.trackingNumber?.trim() || null,
    trackingUrl: input.trackingUrl?.trim() || null,
  }
}

/**
 * Records shipped items for placed orders and the order's fulfillment
 * status. Everything ships from the default location. Callers authorize
 * first (OrderPolicy.fulfill).
 */
@inject()
export default class FulfillmentService {
  constructor(
    protected fulfillmentRepository: FulfillmentRepository,
    protected orderRepository: OrderRepository,
    protected locationService: LocationService,
    protected auditLogService: AuditLogService,
    protected orderNotificationService: OrderNotificationService
  ) {}

  async findOrFail(id: string): Promise<Fulfillment> {
    return this.fulfillmentRepository.findOrFail(id)
  }

  async fulfill(order: Order, input: FulfillInput): Promise<Order> {
    const location = await this.locationService.findDefault()
    const fulfillment = await this.fulfillmentRepository.create(
      order.id,
      input.lineItems,
      tracking(input),
      location?.id ?? null
    )
    const updated = await this.orderRepository.findDetailOrFail(order.id)
    await this.auditLogService.recordOrderEvent(updated, 'fulfilled', {
      before: {},
      after: {
        fulfillment: `#${fulfillment.number}`,
        lineItems: this.shippedSummary(updated, fulfillment),
        trackingCompany: fulfillment.trackingCompany,
        trackingNumber: fulfillment.trackingNumber,
        fulfillmentStatus: updated.fulfillmentStatus,
      },
    })
    if (input.notifyCustomer ?? true) {
      await this.orderNotificationService.shipped(updated.id, fulfillment.id)
    }
    return updated
  }

  async updateTracking(fulfillment: Fulfillment, input: TrackingInput) {
    const before = {
      trackingCompany: fulfillment.trackingCompany,
      trackingNumber: fulfillment.trackingNumber,
      trackingUrl: fulfillment.trackingUrl,
    }
    await this.fulfillmentRepository.updateTracking(fulfillment, tracking(input))
    const order = await this.orderRepository.findDetailOrFail(fulfillment.orderId)
    const keys = (Object.keys(before) as (keyof typeof before)[]).filter(
      (key) => before[key] !== fulfillment[key]
    )
    if (keys.length > 0) {
      await this.auditLogService.recordOrderEvent(order, 'updated', {
        before: {
          fulfillment: `#${fulfillment.number}`,
          ...Object.fromEntries(keys.map((key) => [key, before[key]])),
        },
        after: {
          fulfillment: `#${fulfillment.number}`,
          ...Object.fromEntries(keys.map((key) => [key, fulfillment[key]])),
        },
      })
      if (input.notifyCustomer) {
        await this.orderNotificationService.shippingUpdated(order.id, fulfillment.id)
      }
    }
    return order
  }

  async cancel(fulfillment: Fulfillment): Promise<Order> {
    const cancelled = await this.fulfillmentRepository.cancel(fulfillment)
    const order = await this.orderRepository.findDetailOrFail(fulfillment.orderId)
    await this.auditLogService.recordOrderEvent(order, 'fulfill_cancelled', {
      before: {},
      after: {
        fulfillment: `#${cancelled.number}`,
        lineItems: this.shippedSummary(order, cancelled),
        fulfillmentStatus: order.fulfillmentStatus,
      },
    })
    return order
  }

  async setStatus(order: Order, status: ManualFulfillmentStatus): Promise<Order> {
    const previous = order.fulfillmentStatus
    await this.orderRepository.setFulfillmentStatus(order, status)
    const updated = await this.orderRepository.findDetailOrFail(order.id)
    if (previous !== updated.fulfillmentStatus) {
      await this.auditLogService.recordOrderEvent(updated, 'updated', {
        before: { fulfillmentStatus: previous },
        after: { fulfillmentStatus: updated.fulfillmentStatus },
      })
    }
    return updated
  }

  /** `order` needs `lineItems` preloaded; `fulfillment` needs `lines`. */
  protected shippedSummary(order: Order, fulfillment: Fulfillment): string[] {
    const linesById = new Map(order.lineItems.map((line) => [line.id, line]))
    return orderLineSummary(
      fulfillment.lines.flatMap((shipped) => {
        const line = linesById.get(shipped.orderLineItemId)
        return line
          ? [
              {
                productTitle: line.productTitle,
                variantTitle: line.variantTitle,
                quantity: shipped.quantity,
              },
            ]
          : []
      })
    )
  }
}
