import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { errors } from '@vinejs/vine'
import Order from '#models/order'
import OrderLineItem from '#models/order_line_item'
import OrderReturn, {
  ACTIVE_RETURN_STATUSES,
  type ReturnReason,
  type ReturnStatus,
} from '#models/order_return'
import ReturnLineItem from '#models/return_line_item'
import { applyStockMoves } from '#repositories/helpers/stock_moves'
import { containsPattern } from '#repositories/helpers/like'
import type { EligibilityData } from '#services/return_eligibility'

export type ReturnLineInput = {
  orderLineItemId: string
  quantity: number
  reason: ReturnReason
  note: string | null
}

export type CreateReturnData = {
  orderId: string
  customerId: string | null
  customerNote: string | null
  staffNote: string | null
  lines: ReturnLineInput[]
  /**
   * Checks the lines against the locked order (window, quantities). Throws
   * to stop the request.
   */
  check: (order: Order, lines: OrderLineItem[], data: EligibilityData) => void
}

export type ReceiveLineInput = { id: string; restock: boolean; locationId: string | null }

export type ListReturnsFilters = {
  q?: string
  status?: ReturnStatus
  page: number
  perPage: number
}

function fieldError(field: string, message: string): never {
  throw new errors.E_VALIDATION_ERROR([{ field, message, rule: 'return' }])
}

export default class ReturnRepository {
  async findOrFail(id: string): Promise<OrderReturn> {
    return OrderReturn.query().where('id', id).preload('lines').firstOrFail()
  }

  async find(id: string): Promise<OrderReturn | null> {
    return OrderReturn.find(id)
  }

  async listForOrder(orderId: string): Promise<OrderReturn[]> {
    return OrderReturn.query()
      .where('order_id', orderId)
      .preload('lines')
      .orderBy('number', 'desc')
      .limit(100)
  }

  async paginate({ q, status, page, perPage }: ListReturnsFilters) {
    const query = OrderReturn.query()
      .preload('order', (order) =>
        order
          .select('id', 'order_number', 'draft_number', 'email', 'currency_code', 'customer_id')
          .preload('customer', (customer) => customer.select('id', 'full_name', 'email'))
      )
      .withAggregate('lines', (lines) => lines.sum('quantity').as('itemCount'))
      .orderBy('created_at', 'desc')
    if (status) query.where('status', status)
    if (q) {
      const pattern = containsPattern(q)
      const number = Number(q.replace(/^#/, ''))
      query.whereHas('order', (order) => {
        order.where((inner) => {
          inner.whereILike('email', pattern)
          if (Number.isInteger(number) && number > 0) inner.orWhere('order_number', number)
        })
      })
    }
    return query.paginate(page, perPage)
  }

  async countByStatus(status: ReturnStatus): Promise<number> {
    const row = await db.from('returns').where('status', status).count('* as total').first()
    return Number(row?.total ?? 0)
  }

  /** Shipment dates and returned/refunded quantities per line, for eligibility. */
  async eligibilityData(
    orderId: string,
    client?: TransactionClientContract
  ): Promise<EligibilityData> {
    const conn = client ?? db
    const [shipped, returned, refunded] = await Promise.all([
      conn
        .from('fulfillment_line_items as fli')
        .join('fulfillments as f', 'f.id', 'fli.fulfillment_id')
        .where('f.order_id', orderId)
        .where('f.status', 'success')
        .groupBy('fli.order_line_item_id')
        .select('fli.order_line_item_id as lineId')
        .max('f.created_at as shippedAt'),
      conn
        .from('return_line_items as rli')
        .join('returns as r', 'r.id', 'rli.return_id')
        .where('r.order_id', orderId)
        .whereIn('r.status', [...ACTIVE_RETURN_STATUSES])
        .groupBy('rli.order_line_item_id')
        .select('rli.order_line_item_id as lineId')
        .sum('rli.quantity as quantity'),
      conn
        .from('refund_line_items as rfl')
        .join('refunds as rf', 'rf.id', 'rfl.refund_id')
        .where('rf.order_id', orderId)
        .whereNotNull('rf.return_id')
        .whereNot('rf.status', 'failed')
        .groupBy('rfl.order_line_item_id')
        .select('rfl.order_line_item_id as lineId')
        .sum('rfl.quantity as quantity'),
    ])
    const toDate = (value: Date | string) =>
      value instanceof Date ? DateTime.fromJSDate(value) : DateTime.fromSQL(value)
    return {
      lastShippedAt: new Map(shipped.map((row) => [row.lineId, toDate(row.shippedAt)])),
      returned: new Map(returned.map((row) => [row.lineId, Number(row.quantity)])),
      refundedByReturns: new Map(refunded.map((row) => [row.lineId, Number(row.quantity)])),
    }
  }

  /**
   * Creates a requested return in one transaction. The order row is locked
   * so two requests can't both claim the same units.
   */
  async create(data: CreateReturnData): Promise<OrderReturn> {
    return db.transaction(async (trx) => {
      const order = await Order.query({ client: trx })
        .where('id', data.orderId)
        .forUpdate()
        .firstOrFail()
      const lines = await OrderLineItem.query({ client: trx }).where('order_id', order.id)
      data.check(order, lines, await this.eligibilityData(order.id, trx))

      const last = await trx
        .from('returns')
        .where('order_id', order.id)
        .max('number as max')
        .first()
      const now = DateTime.now()
      const created = await OrderReturn.create(
        {
          orderId: order.id,
          customerId: data.customerId,
          number: Number(last?.max ?? 0) + 1,
          status: 'requested',
          customerNote: data.customerNote,
          declineReason: null,
          staffNote: data.staffNote,
          refundId: null,
          requestedAt: now,
          approvedAt: null,
          receivedAt: null,
          closedAt: null,
        },
        { client: trx }
      )
      await ReturnLineItem.createMany(
        data.lines.map((line) => ({
          returnId: created.id,
          orderLineItemId: line.orderLineItemId,
          quantity: line.quantity,
          reason: line.reason,
          note: line.note,
          restock: false,
          locationId: null,
        })),
        { client: trx }
      )
      await created.load('lines')
      return created
    })
  }

  /**
   * Moves a return to `to` when it is still in one of `from`, locking the
   * row so concurrent staff actions can't both apply.
   */
  async transition(
    id: string,
    from: readonly ReturnStatus[],
    to: ReturnStatus,
    changes: Partial<Pick<OrderReturn, 'declineReason' | 'staffNote'>> = {}
  ): Promise<OrderReturn> {
    return db.transaction(async (trx) => {
      const locked = await this.lock(id, from, trx)
      const now = DateTime.now()
      locked.useTransaction(trx)
      locked.merge({
        ...changes,
        status: to,
        ...(to === 'approved' ? { approvedAt: now } : {}),
        ...(to === 'declined' || to === 'cancelled' ? { closedAt: now } : {}),
      })
      await locked.save()
      await locked.load('lines')
      return locked
    })
  }

  /**
   * Marks an approved return received in one transaction: records per line
   * whether it was restocked and where, and adds restocked units to
   * `available` at that location.
   */
  async receive(
    id: string,
    lines: ReceiveLineInput[],
    defaultLocationId: string | null
  ): Promise<OrderReturn> {
    return db.transaction(async (trx) => {
      const locked = await this.lock(id, ['approved'], trx)
      const returnLines = await ReturnLineItem.query({ client: trx })
        .where('return_id', locked.id)
        .preload('orderLineItem', (query) => query.select('id', 'product_variant_id'))
      const byId = new Map(lines.map((line) => [line.id, line]))
      for (const [index, line] of lines.entries()) {
        if (!returnLines.some((returnLine) => returnLine.id === line.id)) {
          fieldError(`lines.${index}.id`, 'This item is not in the return')
        }
      }

      const updates = returnLines.map((returnLine) => {
        const input = byId.get(returnLine.id)
        const restock = input?.restock ?? false
        return {
          returnLine,
          restock,
          locationId: restock ? (input?.locationId ?? defaultLocationId) : null,
        }
      })
      if (updates.length > 0) {
        const whens = updates.map(() => 'WHEN ? THEN ?').join(' ')
        await trx
          .from('return_line_items')
          .whereIn(
            'id',
            updates.map(({ returnLine }) => returnLine.id)
          )
          .update({
            restock: trx.raw(
              `CASE id ${whens} END::boolean`,
              updates.flatMap(({ returnLine, restock }) => [returnLine.id, restock])
            ),
            location_id: trx.raw(
              `CASE id ${updates
                .map(({ locationId }) => (locationId ? 'WHEN ? THEN ?::uuid' : 'WHEN ? THEN NULL'))
                .join(' ')} END`,
              updates.flatMap(({ returnLine, locationId }) =>
                locationId ? [returnLine.id, locationId] : [returnLine.id]
              )
            ),
            updated_at: new Date(),
          })
      }

      await applyStockMoves(
        trx,
        updates.flatMap(({ returnLine, restock, locationId }) =>
          restock && locationId && returnLine.orderLineItem?.productVariantId
            ? [
                {
                  variantId: returnLine.orderLineItem.productVariantId,
                  locationId,
                  available: returnLine.quantity,
                  committed: 0,
                },
              ]
            : []
        )
      )

      locked.useTransaction(trx)
      await locked.merge({ status: 'received', receivedAt: DateTime.now() }).save()
      await locked.load('lines')
      return locked
    })
  }

  /** Closes a return once its refund is recorded. False when it can't be closed any more. */
  async close(id: string, refundId: string): Promise<boolean> {
    const updated = await OrderReturn.query()
      .where('id', id)
      .whereIn('status', ['approved', 'received'])
      .update({
        status: 'closed',
        refund_id: refundId,
        closed_at: new Date(),
        updated_at: new Date(),
      })
    return Number(updated[0] ?? 0) > 0
  }

  /** Reopens a return whose refund failed, so it can be refunded again. */
  async reopenAfterFailedRefund(refundId: string): Promise<void> {
    await OrderReturn.query()
      .where('refund_id', refundId)
      .where('status', 'closed')
      .update({ status: 'received', refund_id: null, closed_at: null, updated_at: new Date() })
  }

  protected async lock(
    id: string,
    from: readonly ReturnStatus[],
    trx: TransactionClientContract
  ): Promise<OrderReturn> {
    const locked = await OrderReturn.query({ client: trx })
      .where('id', id)
      .forUpdate()
      .firstOrFail()
    if (!from.includes(locked.status)) {
      fieldError('return', 'This return has already moved on; refresh the page')
    }
    return locked
  }
}
