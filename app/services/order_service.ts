import { DateTime } from 'luxon'
import { inject } from '@adonisjs/core'
import { errors } from '@vinejs/vine'
import Order from '#models/order'
import type { OrderPaymentStatus } from '#models/order'
import type ProductVariant from '#models/product_variant'
import OrderRepository, {
  type PaginateOrdersData,
  type PlacedOrderLineData,
} from '#repositories/order_repository'
import type { MarketPrice } from '#repositories/price_repository'
import ProductVariantRepository from '#repositories/product_variant_repository'
import AuditLogService from '#services/audit_log_service'
import { allocate, type DiscountCartLine } from '#services/discount_calculator'
import DiscountService from '#services/discount_service'
import LocationService from '#services/location_service'
import MarketService from '#services/market_service'
import { orderAuditDiff, orderAuditSnapshot } from '#services/order_audit'
import OrderNotificationService from '#services/order_notification_service'
import OrderPricingService from '#services/order_pricing_service'
import PriceService from '#services/price_service'
import { bulkResult, type BulkResult } from '#transformers/bulk_result_transformer'
export type ListOrdersFilters = Partial<Omit<PaginateOrdersData, 'status'>>

export type PlacedOrderInput = {
  paymentStatus: OrderPaymentStatus
  lineItems: { lineItemId?: string; variantId?: string; quantity: number }[]
  totalOverride: number | null
  totalOverrideReason?: string | null
}

type FieldError = { field: string; message: string; rule: string }

@inject()
export default class OrderService {
  constructor(
    protected orderRepository: OrderRepository,
    protected productVariantRepository: ProductVariantRepository,
    protected pricing: OrderPricingService,
    protected discountService: DiscountService,
    protected locationService: LocationService,
    protected auditLogService: AuditLogService,
    protected marketService: MarketService,
    protected priceService: PriceService,
    protected orderNotificationService: OrderNotificationService
  ) {}

  async paginateDrafts(filters: ListOrdersFilters = {}) {
    return this.paginate('draft', filters)
  }

  async paginateOrders(filters: ListOrdersFilters = {}) {
    return this.paginate('open', filters)
  }

  async paginateForCustomer(customerId: string, page = 1, perPage = 10) {
    return this.orderRepository.paginateForCustomer(customerId, page, perPage)
  }

  async findForCustomerOrFail(customerId: string, id: string): Promise<Order> {
    return this.orderRepository.findForCustomerOrFail(customerId, id)
  }

  async findOrFail(id: string): Promise<Order> {
    return this.orderRepository.findOrFail(id)
  }

  async findDetailOrFail(id: string): Promise<Order> {
    return this.orderRepository.findDetailOrFail(id)
  }

  /**
   * Variants of active products matching the product title, variant title
   * or SKU, for the draft order product picker.
   */
  async searchVariants(q?: string): Promise<ProductVariant[]> {
    return this.productVariantRepository.searchForOrder(q || undefined)
  }

  /**
   * Staff edit of a placed order. Kept lines stay at their saved price;
   * added variants take their current price. Totals are re-priced with the
   * order's saved discount, shipping and tax, so market rules that changed
   * since checkout don't apply. `totalOverride` replaces the priced total
   * (kept in `calculatedTotal`); null clears it. Callers authorize first
   * (OrderPolicy.editPlaced).
   */
  async updatePlaced(order: Order, input: PlacedOrderInput): Promise<Order> {
    const fieldErrors: FieldError[] = []
    const fail = (field: string, message: string) =>
      fieldErrors.push({ field, message, rule: 'order' })

    const current = await this.orderRepository.findDetailOrFail(order.id)
    const linesById = new Map(current.lineItems.map((line) => [line.id, line]))
    const newVariantIds = input.lineItems
      .filter((line) => !line.lineItemId && line.variantId)
      .map((line) => line.variantId!)
    const keptVariantIds = current.lineItems.flatMap(({ productVariantId }) =>
      productVariantId ? [productVariantId] : []
    )
    const [variants, market] = await Promise.all([
      this.orderRepository.findVariants([...new Set([...newVariantIds, ...keptVariantIds])]),
      this.marketService.findForOrder(current.marketId),
    ])
    const variantsById = new Map(variants.map((variant) => [variant.id, variant]))
    const prices = market
      ? await this.priceService.forMarket(newVariantIds, market)
      : new Map<string, MarketPrice>()

    const lines: PlacedOrderLineData[] = []
    const seenVariants = new Set(
      input.lineItems.flatMap(({ lineItemId }) => {
        const variantId = lineItemId ? linesById.get(lineItemId)?.productVariantId : null
        return variantId ? [variantId] : []
      })
    )
    input.lineItems.forEach(({ lineItemId, variantId, quantity }, index) => {
      if (lineItemId) {
        const line = linesById.get(lineItemId)
        if (!line)
          return fail(`lineItems.${index}.variantId`, 'This line is no longer on the order')
        linesById.delete(lineItemId)
        lines.push({
          productVariantId: line.productVariantId,
          productTitle: line.productTitle,
          variantTitle: line.variantTitle,
          sku: line.sku,
          unitPrice: line.unitPrice,
          quantity,
          lineTotal: 0,
          discountAllocation: 0,
          taxable: line.taxable,
        })
        return
      }
      const variant = variantsById.get(variantId!)
      if (!variant || variant.product.status !== 'active') {
        return fail(`lineItems.${index}.variantId`, 'This product is no longer available')
      }
      if (seenVariants.has(variant.id)) {
        return fail(`lineItems.${index}.variantId`, 'This product is already on the order')
      }
      const price = prices.get(variant.id)
      if (!price) {
        return fail(
          `lineItems.${index}.variantId`,
          `This product has no price in ${market?.name ?? 'this market'}`
        )
      }
      seenVariants.add(variant.id)
      lines.push({
        productVariantId: variant.id,
        productTitle: variant.product.title,
        variantTitle: variant.title,
        sku: variant.sku,
        unitPrice: price.price,
        quantity,
        lineTotal: 0,
        discountAllocation: 0,
        taxable: variant.product.chargeTax,
      })
    })

    const reason = input.totalOverrideReason?.trim() || null
    if (input.totalOverride !== null && !reason) {
      fail('totalOverrideReason', 'Add a reason for the override')
    }
    if (fieldErrors.length > 0) throw new errors.E_VALIDATION_ERROR(fieldErrors)

    const lineDiscounts = await this.lineDiscountsFor(
      current,
      lines.map((line) => ({
        productId: line.productVariantId
          ? (variantsById.get(line.productVariantId)?.productId ?? null)
          : null,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
      }))
    )
    const totals = this.pricing.price({
      lines,
      pricesIncludeTax: current.pricesIncludeTax,
      lineDiscounts,
      shippingDiscount: current.shippingDiscountTotal,
      shippingPrice: current.shippingPrice,
      tax:
        current.taxRate !== null
          ? { rate: current.taxRate, appliesToShipping: current.taxAppliesToShipping }
          : null,
    })
    lines.forEach((line, index) => {
      line.lineTotal = totals.lineTotals[index]
      line.discountAllocation = lineDiscounts?.[index] ?? 0
    })

    const overridden = input.totalOverride !== null
    const location = await this.locationService.findDefault()
    await this.orderRepository.updatePlaced(
      current,
      {
        paymentStatus:
          input.paymentStatus === 'pending' && current.paymentStatus === 'payment_submitted'
            ? 'payment_submitted'
            : input.paymentStatus,
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        shippingDiscountTotal: totals.shippingDiscountTotal,
        shippingTotal: totals.shippingTotal,
        taxTotal: totals.taxTotal,
        total: overridden ? input.totalOverride! : totals.total,
        calculatedTotal: overridden ? totals.total : null,
        totalOverrideReason: overridden ? reason : null,
      },
      lines,
      location?.id ?? null
    )
    const updated = await this.orderRepository.findDetailOrFail(order.id)
    const changes = orderAuditDiff(
      orderAuditSnapshot(current, current.lineItems),
      orderAuditSnapshot(updated, updated.lineItems)
    )
    if (changes) await this.auditLogService.recordOrderEvent(updated, 'updated', changes)
    if (
      (current.paymentStatus === 'pending' || current.paymentStatus === 'payment_submitted') &&
      updated.paymentStatus === 'paid'
    ) {
      await this.orderNotificationService.paymentReceived(updated.id)
    }
    return updated
  }

  /**
   * Each line's share of the order's main discount as it applies now. When
   * the discount record is gone, the saved amount is spread over the lines.
   */
  protected async lineDiscountsFor(
    order: Order,
    lines: DiscountCartLine[]
  ): Promise<number[] | null> {
    if (!order.discountId) return null
    const discount = await this.discountService.find(order.discountId)
    if (discount) {
      const application = await this.discountService.reapply(discount, lines, null)
      return application.lineAllocations
    }
    if (order.discountTotal <= 0) return null
    return allocate(
      order.discountTotal,
      lines.map(({ unitPrice, quantity }) => unitPrice * quantity)
    )
  }

  async archive(order: Order): Promise<Order> {
    await this.orderRepository.setArchivedAt(order, DateTime.now())
    return this.orderRepository.findDetailOrFail(order.id)
  }

  async unarchive(order: Order): Promise<Order> {
    await this.orderRepository.setArchivedAt(order, null)
    return this.orderRepository.findDetailOrFail(order.id)
  }

  /**
   * Archives or unarchives many placed orders at once. Drafts and orders
   * already in that state are skipped.
   */
  async bulkSetArchived(ids: string[], archived: boolean): Promise<BulkResult> {
    const archivedAt = archived ? DateTime.now() : null
    const changed = await this.orderRepository.setArchivedAtMany(ids, archivedAt)
    await this.auditLogService.recordBulkUpdate(Order, changed, { archivedAt })
    return bulkResult(ids, changed)
  }

  /**
   * Sets the payment date of paid orders saved before it was recorded,
   * using the date they were placed. Returns how many orders changed.
   */
  async backfillPaidAt(): Promise<number> {
    return this.orderRepository.backfillPaidAt()
  }

  protected async paginate(status: PaginateOrdersData['status'], filters: ListOrdersFilters) {
    return this.orderRepository.paginate({
      status,
      q: filters.q || undefined,
      customerId: filters.customerId,
      paymentStatus: filters.paymentStatus,
      fulfillmentStatus: filters.fulfillmentStatus,
      archived: filters.archived,
      sort: filters.sort ?? 'number',
      direction: filters.direction ?? 'desc',
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 15,
    })
  }
}
