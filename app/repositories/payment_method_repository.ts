import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import PaymentMethod, {
  type BankTransferConfig,
  type PaymentMethodConfig,
} from '#models/payment_method'
import PaymentMethodMarket from '#models/payment_method_market'
import type { PaymentMethodCode } from '#constants/payment_methods'

export type PaymentMethodMarketChanges = {
  isEnabled: boolean
  config: BankTransferConfig | null
}

/** Market rows whose `isEnabled` flipped, as they were before the change. */
export type MarketSyncResult = {
  enabled: PaymentMethodMarket[]
  disabled: PaymentMethodMarket[]
}

export default class PaymentMethodRepository {
  async all(): Promise<PaymentMethod[]> {
    return PaymentMethod.query().orderBy('created_at', 'asc')
  }

  async allWithMarkets(): Promise<PaymentMethod[]> {
    return PaymentMethod.query().preload('markets').orderBy('created_at', 'asc')
  }

  async findByCode(code: PaymentMethodCode): Promise<PaymentMethod | null> {
    return PaymentMethod.findBy('code', code)
  }

  async findWithMarketsByCode(code: PaymentMethodCode): Promise<PaymentMethod | null> {
    return PaymentMethod.query().where('code', code).preload('markets').first()
  }

  async findMarketRow(
    code: PaymentMethodCode,
    marketId: string
  ): Promise<PaymentMethodMarket | null> {
    return PaymentMethodMarket.query()
      .where('market_id', marketId)
      .whereHas('paymentMethod', (query) => query.where('code', code))
      .first()
  }

  /**
   * Methods switched on for the market, with only that market's row
   * preloaded.
   */
  async listEnabledForMarket(marketId: string): Promise<PaymentMethod[]> {
    return PaymentMethod.query()
      .where('is_enabled', true)
      .whereHas('markets', (query) => query.where('market_id', marketId).where('is_enabled', true))
      .preload('markets', (query) => query.where('market_id', marketId))
      .orderBy('created_at', 'asc')
  }

  /**
   * Saves one market's row of the method, creating the method when needed.
   * The method's `isEnabled` follows whether any market has it switched on.
   */
  async upsertMarketRow(
    code: PaymentMethodCode,
    marketId: string,
    changes: PaymentMethodMarketChanges
  ): Promise<PaymentMethodMarket> {
    return db.transaction(async (trx) => {
      const method = await this.lockOrCreate(code, null, trx)
      const existing = await PaymentMethodMarket.query({ client: trx })
        .where('payment_method_id', method.id)
        .where('market_id', marketId)
        .forUpdate()
        .first()

      const row = existing
        ? await existing.merge(changes).save()
        : await PaymentMethodMarket.create(
            { paymentMethodId: method.id, marketId, ...changes },
            { client: trx }
          )

      const anyEnabled = await PaymentMethodMarket.query({ client: trx })
        .where('payment_method_id', method.id)
        .where('is_enabled', true)
        .first()
      if (method.isEnabled !== Boolean(anyEnabled)) {
        await method.merge({ isEnabled: Boolean(anyEnabled) }).save()
      }
      return row
    })
  }

  /**
   * Saves the method's config and switches it on in exactly `marketIds`:
   * missing rows are inserted in one batch and the rest flipped with one
   * `UPDATE` per direction.
   */
  async upsertWithMarkets(
    code: PaymentMethodCode,
    config: PaymentMethodConfig,
    marketIds: string[]
  ): Promise<MarketSyncResult> {
    return db.transaction(async (trx) => {
      const method = await this.lockOrCreate(code, config, trx)
      await method.merge({ config, isEnabled: marketIds.length > 0 }).save()

      const rows = await PaymentMethodMarket.query({ client: trx })
        .where('payment_method_id', method.id)
        .forUpdate()
      const selected = new Set(marketIds)
      const existing = new Set(rows.map((row) => row.marketId))
      const enabled = rows.filter((row) => selected.has(row.marketId) && !row.isEnabled)
      const disabled = rows.filter((row) => !selected.has(row.marketId) && row.isEnabled)
      const missing = marketIds.filter((marketId) => !existing.has(marketId))

      if (missing.length > 0) {
        await PaymentMethodMarket.createMany(
          missing.map((marketId) => ({
            paymentMethodId: method.id,
            marketId,
            isEnabled: true,
            config: null,
          })),
          { client: trx }
        )
      }
      await this.setEnabled(enabled, true, trx)
      await this.setEnabled(disabled, false, trx)
      return { enabled, disabled }
    })
  }

  protected async lockOrCreate(
    code: PaymentMethodCode,
    config: PaymentMethodConfig | null,
    trx: TransactionClientContract
  ): Promise<PaymentMethod> {
    const method = await PaymentMethod.query({ client: trx })
      .where('code', code)
      .forUpdate()
      .first()
    if (method) return method
    return PaymentMethod.create({ code, isEnabled: false, config }, { client: trx })
  }

  protected async setEnabled(
    rows: PaymentMethodMarket[],
    isEnabled: boolean,
    trx: TransactionClientContract
  ) {
    if (rows.length === 0) return
    await PaymentMethodMarket.query({ client: trx })
      .whereIn(
        'id',
        rows.map((row) => row.id)
      )
      .update({ is_enabled: isEnabled, updated_at: new Date() })
  }
}
