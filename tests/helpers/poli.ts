import app from '@adonisjs/core/services/app'
import type Order from '#models/order'
import PaymentMethodRepository from '#repositories/payment_method_repository'
import PaymentMethodService from '#services/payment_method_service'
import PoliGatewayService, {
  type PoliInitiateUrls,
  type PoliTransaction,
  type PoliTransactionResult,
} from '#services/poli_gateway_service'

export const POLI_NAVIGATE_URL = 'https://txn.uat3.paywithpoli.com/?Token=FakeToken123'
export const POLI_TOKEN = 'FakeToken123'

/**
 * Stands in for POLi's API. `transactions` maps a token to what
 * GetTransaction returns; unknown tokens fail like POLi would.
 */
export class FakePoliGateway extends PoliGatewayService {
  initiated: { orderId: string; urls: PoliInitiateUrls }[] = []
  transactions = new Map<string, PoliTransactionResult>()
  lookups: string[] = []

  constructor() {
    super(new PaymentMethodRepository())
  }

  async initiate(order: Order, urls: PoliInitiateUrls): Promise<PoliTransaction> {
    this.initiated.push({ orderId: order.id, urls })
    return { token: POLI_TOKEN, navigateUrl: POLI_NAVIGATE_URL }
  }

  async getTransaction(token: string): Promise<PoliTransactionResult> {
    this.lookups.push(token)
    const result = this.transactions.get(token)
    if (!result) throw new Error('POLi transaction lookup failed')
    return result
  }

  /** A completed payment of the order's total, in its currency. */
  paid(order: Order, overrides: Partial<PoliTransactionResult> = {}, token = POLI_TOKEN) {
    this.transactions.set(token, {
      status: 'Completed',
      paid: true,
      merchantReference: order.id,
      amountPaid: Math.round(order.total * 100),
      currency: order.currencyCode,
      ...overrides,
    })
  }
}

/** Swaps the POLi gateway for a fake; returns it and a restore function. */
export function fakePoliGateway() {
  const gateway = new FakePoliGateway()
  app.container.swap(PoliGatewayService, () => gateway)
  return { gateway, restore: () => app.container.restore(PoliGatewayService) }
}

/** Sets POLi up in sandbox mode and offers it in the markets. */
export async function enablePoli(marketIds: string[]) {
  const paymentMethodService = await app.container.make(PaymentMethodService)
  return paymentMethodService.updatePoli({
    mode: 'test',
    test: { merchantCode: 'SS6100', authenticationCode: 'auth-code-1234' },
    marketIds,
  })
}
