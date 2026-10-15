import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import { errors } from '@vinejs/vine'
import type Order from '#models/order'
import type OrderLineItem from '#models/order_line_item'
import type OrderReturn from '#models/order_return'
import type { ReturnStatus } from '#models/order_return'
import ReturnRepository, {
  type ListReturnsFilters,
  type ReceiveLineInput,
  type ReturnLineInput,
} from '#repositories/return_repository'
import AuditLogService from '#services/audit_log_service'
import LocationService from '#services/location_service'
import OrderNotificationService from '#services/order_notification_service'
import OrderRepository from '#repositories/order_repository'
import {
  returnableLines,
  returnWindowEndsAt,
  type EligibilityData,
  type ReturnableLine,
} from '#services/return_eligibility'
import StoreSettingService from '#services/store_setting_service'
import { orderLineSummary } from '#services/order_audit'

export type ReturnRequestInput = {
  lines: ReturnLineInput[]
  note?: string | null
}

export type CustomerReturnsOverview = {
  returnWindowEndsAt: DateTime | null
  returnableLines: ReturnableLine[]
  returns: OrderReturn[]
}

export type StaffReturnsOverview = Omit<CustomerReturnsOverview, 'returnWindowEndsAt'>

function fieldError(field: string, message: string): never {
  throw new errors.E_VALIDATION_ERROR([{ field, message, rule: 'return' }])
}

/**
 * Returns: requested by the customer (within the store's return window) or
 * created by staff, then approved or declined, received (restocking), and
 * closed by a refund through RefundService.
 */
@inject()
export default class ReturnService {
  constructor(
    protected returnRepository: ReturnRepository,
    protected orderRepository: OrderRepository,
    protected storeSettingService: StoreSettingService,
    protected locationService: LocationService,
    protected auditLogService: AuditLogService,
    protected orderNotificationService: OrderNotificationService
  ) {}

  async findOrFail(id: string): Promise<OrderReturn> {
    return this.returnRepository.findOrFail(id)
  }

  async listForOrder(orderId: string): Promise<OrderReturn[]> {
    return this.returnRepository.listForOrder(orderId)
  }

  async paginate(filters: Partial<ListReturnsFilters>) {
    return this.returnRepository.paginate({
      ...filters,
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 25,
    })
  }

  async countByStatus(status: ReturnStatus): Promise<number> {
    return this.returnRepository.countByStatus(status)
  }

  /** What the customer can still return from the order, and their returns so far. */
  async customerOverview(order: Order): Promise<CustomerReturnsOverview> {
    const [settings, data, lines, returns] = await Promise.all([
      this.storeSettingService.get(),
      this.returnRepository.eligibilityData(order.id),
      this.orderRepository.lineItems(order.id),
      this.returnRepository.listForOrder(order.id),
    ])
    const windowDays = settings.returnWindowDays
    return {
      returnWindowEndsAt: order.isCancelled ? null : returnWindowEndsAt(data, windowDays),
      returnableLines: order.isCancelled
        ? []
        : returnableLines(lines, data, { windowDays, now: DateTime.now() }),
      returns,
    }
  }

  /** The order's returns, and the lines staff can still put in one (no time window). */
  async staffOverview(order: Order): Promise<StaffReturnsOverview> {
    const [data, lines, returns] = await Promise.all([
      this.returnRepository.eligibilityData(order.id),
      this.orderRepository.lineItems(order.id),
      this.returnRepository.listForOrder(order.id),
    ])
    return {
      returnableLines:
        order.status === 'open'
          ? returnableLines(lines, data, { windowDays: null, now: DateTime.now() })
          : [],
      returns,
    }
  }

  async requestByCustomer(order: Order, customerId: string, input: ReturnRequestInput) {
    const settings = await this.storeSettingService.get()
    if (settings.returnWindowDays <= 0) {
      fieldError('lines', 'This store doesn’t accept return requests online')
    }
    const created = await this.returnRepository.create({
      orderId: order.id,
      customerId,
      customerNote: input.note ?? null,
      staffNote: null,
      lines: input.lines,
      check: (locked, lines, data) =>
        this.checkLines(locked, lines, data, input.lines, settings.returnWindowDays),
    })
    await this.recordEvent(order, created, 'return_requested')
    await this.orderNotificationService.returnRequested(order.id, created.id)
    return created
  }

  async createByStaff(order: Order, input: ReturnRequestInput) {
    const created = await this.returnRepository.create({
      orderId: order.id,
      customerId: order.customerId,
      customerNote: null,
      staffNote: input.note ?? null,
      lines: input.lines,
      check: (locked, lines, data) => this.checkLines(locked, lines, data, input.lines, null),
    })
    await this.recordEvent(order, created, 'return_requested')
    return created
  }

  async approve(ret: OrderReturn, input: { staffNote?: string | null; notifyCustomer: boolean }) {
    const updated = await this.returnRepository.transition(ret.id, ['requested'], 'approved', {
      staffNote: input.staffNote ?? null,
    })
    await this.recordEvent(await this.orderOf(updated), updated, 'return_approved')
    if (input.notifyCustomer) {
      await this.orderNotificationService.returnApproved(updated.orderId, updated.id)
    }
    return updated
  }

  async decline(ret: OrderReturn, input: { reason: string; notifyCustomer: boolean }) {
    const updated = await this.returnRepository.transition(ret.id, ['requested'], 'declined', {
      declineReason: input.reason,
    })
    await this.recordEvent(await this.orderOf(updated), updated, 'return_declined', {
      reason: input.reason,
    })
    if (input.notifyCustomer) {
      await this.orderNotificationService.returnDeclined(updated.orderId, updated.id)
    }
    return updated
  }

  async receive(ret: OrderReturn, lines: ReceiveLineInput[]) {
    if (lines.some((line) => line.restock && line.locationId)) {
      const locations = await this.locationService.allActive()
      const active = new Set(locations.map(({ id }) => id))
      lines.forEach((line, index) => {
        if (line.restock && line.locationId && !active.has(line.locationId)) {
          fieldError(`lines.${index}.locationId`, 'Choose an active location')
        }
      })
    }
    const location = await this.locationService.findDefault()
    const updated = await this.returnRepository.receive(ret.id, lines, location?.id ?? null)
    await this.recordEvent(await this.orderOf(updated), updated, 'return_received', {
      restocked: updated.lines
        .filter((line) => line.restock)
        .reduce((sum, line) => sum + line.quantity, 0),
    })
    return updated
  }

  async cancel(ret: OrderReturn) {
    const updated = await this.returnRepository.transition(
      ret.id,
      ['requested', 'approved'],
      'cancelled'
    )
    await this.recordEvent(await this.orderOf(updated), updated, 'return_cancelled')
    return updated
  }

  protected checkLines(
    order: Order,
    lines: OrderLineItem[],
    data: EligibilityData,
    requested: ReturnLineInput[],
    windowDays: number | null
  ) {
    if (order.status !== 'open') fieldError('lines', 'This order can’t be returned')
    const returnable = new Map(
      returnableLines(lines, data, { windowDays, now: DateTime.now() }).map((line) => [
        line.lineItemId,
        line.quantity,
      ])
    )
    requested.forEach((line, index) => {
      const left = returnable.get(line.orderLineItemId)
      if (left === undefined) {
        fieldError(
          `lines.${index}.orderLineItemId`,
          windowDays === null
            ? 'This item can’t be returned'
            : 'This item can’t be returned (not shipped yet, already returned, or past the return window)'
        )
      }
      if (line.quantity > left) {
        fieldError(`lines.${index}.quantity`, `Only ${left} can be returned`)
      }
    })
  }

  protected async orderOf(ret: OrderReturn): Promise<Order> {
    return this.orderRepository.findOrFail(ret.orderId)
  }

  protected async recordEvent(
    order: Order,
    ret: OrderReturn,
    action:
      | 'return_requested'
      | 'return_approved'
      | 'return_declined'
      | 'return_received'
      | 'return_cancelled',
    extra: Record<string, string | number> = {}
  ) {
    const lines = await this.orderRepository.lineItems(order.id)
    const byId = new Map(lines.map((line) => [line.id, line]))
    await this.auditLogService.recordOrderEvent(order, action, {
      before: {},
      after: {
        return: `#${ret.number}`,
        status: ret.status,
        items: orderLineSummary(
          ret.lines.map((line) => {
            const orderLine = byId.get(line.orderLineItemId)
            return {
              productTitle: orderLine?.productTitle ?? 'Item',
              variantTitle: orderLine?.variantTitle ?? null,
              quantity: line.quantity,
            }
          })
        ),
        ...extra,
      },
    })
  }
}
