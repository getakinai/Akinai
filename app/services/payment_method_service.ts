import { inject } from '@adonisjs/core'
import { errors } from '@vinejs/vine'
import {
  isPluginPaymentMethod,
  isPoliCurrency,
  PAYMENT_METHOD_CATALOG,
  type PaymentMethodCode,
  type PaymentMethodDefinition,
} from '#constants/payment_methods'
import type Market from '#models/market'
import type Order from '#models/order'
import type PaymentMethod from '#models/payment_method'
import type {
  BankTransferConfig,
  PaymentMethodConfig,
  PoliConfig,
  PoliCredentialSet,
  PoliMode,
  StripeConfig,
  StripeKeySet,
  StripeMode,
} from '#models/payment_method'
import PaymentMethodMarket from '#models/payment_method_market'
import MarketRepository from '#repositories/market_repository'
import PaymentMethodRepository from '#repositories/payment_method_repository'
import AuditLogService from '#services/audit_log_service'
import PluginService from '#services/plugin_service'
import PoliGatewayService, {
  activePoliCredentials,
  isPoliConfig,
} from '#services/poli_gateway_service'
import StripeGatewayService, {
  activeStripeKeys,
  isStripeConfig,
} from '#services/stripe_gateway_service'

export type PaymentMethodMarketRef = {
  id: string
  name: string
}

export type PaymentMethodListItem = Omit<PaymentMethodDefinition, 'code'> & {
  /** A catalog code, or the key of a payments plugin the catalog doesn't know. */
  code: string
  /** The plugin's own setup page when it isn't managed on the Payments page. */
  adminRoute: string | null
  isEnabled: boolean
  configured: boolean
  /** Stripe's or POLi's payment mode once it is set up; null for other methods. */
  mode: StripeMode | PoliMode | null
  /** Active markets the method is offered in, primary first. */
  markets: PaymentMethodMarketRef[]
}

type ListedDefinition = Omit<PaymentMethodListItem, 'isEnabled' | 'configured' | 'mode' | 'markets'>

export type BankTransferMarketSetup = {
  marketId: string
  marketName: string
  countryCodes: string[]
  isEnabled: boolean
  config: BankTransferConfig | null
}

export type BankTransferSetup = {
  markets: BankTransferMarketSetup[]
}

/** One mode's saved keys, without the secrets. */
export type StripeKeySetup = {
  publishableKey: string
  secretKeyLastFour: string
  hasWebhookSecret: boolean
}

export type StripeSetup = {
  isEnabled: boolean
  /** The mode taking payments; null until Stripe is set up. */
  mode: StripeMode | null
  test: StripeKeySetup | null
  live: StripeKeySetup | null
  cancelUrl: string | null
  marketIds: string[]
}

/** One POLi mode's saved credentials, without the authentication code. */
export type PoliCredentialSetup = {
  merchantCode: string
  authCodeLastFour: string
}

export type PoliSetup = {
  isEnabled: boolean
  /** The mode taking payments; null until POLi is set up. */
  mode: PoliMode | null
  test: PoliCredentialSetup | null
  live: PoliCredentialSetup | null
  marketIds: string[]
}

/**
 * One mode's credentials. A blank authentication code keeps the stored
 * one; a blank merchant code removes the mode's credentials.
 */
export type PoliCredentialsInput = {
  merchantCode: string | null
  authenticationCode?: string | null
}

export type PoliInput = {
  mode: PoliMode
  /** Left out keeps the stored credentials for that mode. */
  test?: PoliCredentialsInput
  live?: PoliCredentialsInput
  marketIds: string[]
}

export type CheckoutPaymentMethod = {
  code: PaymentMethodCode
  name: string
  bankTransfer: BankTransferConfig | null
}

export type BankTransferInput = Omit<BankTransferConfig, 'bsb' | 'instructions'> & {
  isEnabled: boolean
  bsb?: string | null
  instructions?: string | null
}

/**
 * One mode's keys. A blank secret key or webhook secret keeps the stored
 * one; a blank publishable key removes the mode's keys.
 */
export type StripeKeysInput = {
  publishableKey: string | null
  secretKey?: string | null
  webhookSecret?: string | null
}

export type StripeInput = {
  mode: StripeMode
  /** Left out keeps the stored keys for that mode. */
  test?: StripeKeysInput
  live?: StripeKeysInput
  /** Null clears it; left out keeps the stored one. */
  cancelUrl?: string | null
  marketIds: string[]
}

const MODE_LABELS: Record<StripeMode, string> = { test: 'sandbox', live: 'production' }

/** What shoppers see at checkout when it differs from the admin name. */
const CHECKOUT_NAMES: Partial<Record<PaymentMethodCode, string>> = {
  stripe: 'Credit or debit card',
  poli: 'POLi (online banking)',
}

const AVAILABLE_CODES = new Set(
  PAYMENT_METHOD_CATALOG.filter((method) => method.status === 'available').map(
    (method) => method.code
  )
)

function fieldError(field: string, message: string): never {
  throw new errors.E_VALIDATION_ERROR([{ field, message, rule: 'paymentMethod' }])
}

function isBankTransferConfig(config: PaymentMethodConfig | null): config is BankTransferConfig {
  return config !== null && 'accountNumber' in config
}

function keyMode(key: string): StripeMode {
  return key.includes('_live_') ? 'live' : 'test'
}

/**
 * Whether the method can take payments in the market row's market. Bank
 * transfer needs that market's account details; POLi only pays in NZD and
 * AUD; other methods use the method's own config.
 */
function isOfferedIn(method: PaymentMethod, row: PaymentMethodMarket, currencyCode: string | null) {
  if (!row.isEnabled || !AVAILABLE_CODES.has(method.code)) return false
  if (method.code === 'bank_transfer') return isBankTransferConfig(row.config)
  if (method.code === 'poli' && !isPoliCurrency(currencyCode)) return false
  return isConfigured(method)
}

/** Stripe and POLi need credentials for the mode they are switched to. */
function isConfigured(method: PaymentMethod | undefined): boolean {
  if (!method?.config) return false
  if (method.code === 'stripe') {
    return isStripeConfig(method.config) && activeStripeKeys(method.config) !== null
  }
  if (method.code === 'poli') {
    return isPoliConfig(method.config) && activePoliCredentials(method.config) !== null
  }
  return true
}

function methodMode(method: PaymentMethod | undefined): StripeMode | PoliMode | null {
  if (!method) return null
  if (method.code === 'stripe' && isStripeConfig(method.config)) return method.config.mode
  if (method.code === 'poli' && isPoliConfig(method.config)) return method.config.mode
  return null
}

function poliCredentialSetup(set: PoliCredentialSet | null): PoliCredentialSetup | null {
  if (!set) return null
  return { merchantCode: set.merchantCode, authCodeLastFour: set.authCodeLastFour }
}

function keySetup(keys: StripeKeySet | null): StripeKeySetup | null {
  if (!keys) return null
  return {
    publishableKey: keys.publishableKey,
    secretKeyLastFour: keys.secretKeyLastFour,
    hasWebhookSecret: keys.webhookSecretEncrypted !== null,
  }
}

/**
 * The NZ/AU payment method catalog combined with what the store has set up
 * for each market.
 */
@inject()
export default class PaymentMethodService {
  constructor(
    protected paymentMethodRepository: PaymentMethodRepository,
    protected marketRepository: MarketRepository,
    protected stripeGateway: StripeGatewayService,
    protected poliGateway: PoliGatewayService,
    protected auditLogService: AuditLogService,
    protected pluginService: PluginService
  ) {}

  /** Active markets, primary first, that payment methods can be offered in. */
  async markets(): Promise<Market[]> {
    return this.marketRepository.listActiveWithCountries()
  }

  /** Catalog entries, leaving out plugin-backed methods whose plugin isn't installed. */
  protected async installedCatalog(): Promise<PaymentMethodDefinition[]> {
    const installed = new Set(await this.pluginService.installedKeys())
    return PAYMENT_METHOD_CATALOG.filter(
      (definition) => !isPluginPaymentMethod(definition.code) || installed.has(definition.code)
    )
  }

  /**
   * Installed payments plugins in catalog order (plugins the catalog doesn't
   * know go after), then the coming-soon methods.
   */
  protected async listedMethods(): Promise<ListedDefinition[]> {
    const plugins = await this.pluginService.catalog()
    const catalogIndex = (code: string) => {
      const index = PAYMENT_METHOD_CATALOG.findIndex((definition) => definition.code === code)
      return index === -1 ? PAYMENT_METHOD_CATALOG.length : index
    }
    const installed = plugins
      .filter((plugin) => plugin.category === 'payments' && plugin.isInstalled)
      .sort((a, b) => catalogIndex(a.key) - catalogIndex(b.key))
      .map((plugin): ListedDefinition => {
        const known = PAYMENT_METHOD_CATALOG.find((definition) => definition.code === plugin.key)
        return {
          code: plugin.key,
          name: known?.name ?? plugin.name,
          description: known?.description ?? plugin.description,
          regions: known?.regions ?? [],
          status: 'available',
          adminRoute:
            plugin.adminRoute && plugin.adminRoute !== 'admin.payments.home'
              ? plugin.adminRoute
              : null,
        }
      })
    const pluginKeys = new Set(plugins.map((plugin) => plugin.key))
    const comingSoon = PAYMENT_METHOD_CATALOG.filter(
      (definition) => definition.status === 'coming_soon' && !pluginKeys.has(definition.code)
    ).map((definition): ListedDefinition => ({ ...definition, adminRoute: null }))
    return [...installed, ...comingSoon]
  }

  async list(): Promise<PaymentMethodListItem[]> {
    const [saved, markets, listed] = await Promise.all([
      this.paymentMethodRepository.allWithMarkets(),
      this.markets(),
      this.listedMethods(),
    ])
    const byCode = new Map<string, PaymentMethod>(saved.map((method) => [method.code, method]))
    const currencyById = new Map(markets.map((market) => [market.id, market.currencyCode]))
    return listed.map((definition) => {
      const method = byCode.get(definition.code)
      const offered = new Set(
        method?.markets
          .filter((row) => isOfferedIn(method, row, currencyById.get(row.marketId) ?? null))
          .map((row) => row.marketId) ?? []
      )
      const offeredMarkets = markets
        .filter((market) => offered.has(market.id))
        .map((market) => ({ id: market.id, name: market.name }))
      return {
        ...definition,
        isEnabled: offeredMarkets.length > 0,
        configured:
          definition.code === 'bank_transfer'
            ? Boolean(method?.markets.some((row) => isBankTransferConfig(row.config)))
            : isConfigured(method),
        mode: methodMode(method),
        markets: offeredMarkets,
      }
    })
  }

  async bankTransfer(): Promise<BankTransferSetup> {
    const [method, markets] = await Promise.all([
      this.paymentMethodRepository.findWithMarketsByCode('bank_transfer'),
      this.markets(),
    ])
    const byMarket = new Map(method?.markets.map((row) => [row.marketId, row]) ?? [])
    return {
      markets: markets.map((market) => {
        const row = byMarket.get(market.id)
        const config = row?.config ?? null
        return {
          marketId: market.id,
          marketName: market.name,
          countryCodes: market.countries.map((country) => country.countryCode),
          isEnabled: row?.isEnabled ?? false,
          config: isBankTransferConfig(config) ? config : null,
        }
      }),
    }
  }

  /**
   * The bank account customers in the market pay into. Used after an order
   * is placed, so it doesn't matter whether the method is still switched on.
   */
  async bankTransferForMarket(marketId: string | null): Promise<BankTransferConfig | null> {
    if (!marketId) return null
    const row = await this.paymentMethodRepository.findMarketRow('bank_transfer', marketId)
    const config = row?.config ?? null
    return isBankTransferConfig(config) ? config : null
  }

  /**
   * Puts the bank account of the order's market on `$extras.bank_transfer`
   * for bank transfer orders, so the order views show the account the
   * customer was asked to pay into.
   */
  async withBankTransfer<T extends Order>(order: T): Promise<T> {
    if (order.paymentMethod === 'bank_transfer') {
      order.$extras.bank_transfer = await this.bankTransferForMarket(order.marketId)
    }
    return order
  }

  async updateBankTransfer(marketId: string, input: BankTransferInput): Promise<BankTransferSetup> {
    await this.marketRepository.findActiveOrFail(marketId)
    const config: BankTransferConfig = {
      countryCode: input.countryCode,
      accountName: input.accountName,
      bankName: input.bankName,
      accountNumber: input.accountNumber,
      bsb: input.countryCode === 'AU' ? (input.bsb ?? null) : null,
      instructions: input.instructions || null,
    }
    await this.paymentMethodRepository.upsertMarketRow('bank_transfer', marketId, {
      isEnabled: input.isEnabled,
      config,
    })
    return this.bankTransfer()
  }

  async stripe(): Promise<StripeSetup> {
    const [method, markets] = await Promise.all([
      this.paymentMethodRepository.findWithMarketsByCode('stripe'),
      this.markets(),
    ])
    const config = method?.config ?? null
    if (!method || !isStripeConfig(config)) {
      return {
        isEnabled: false,
        mode: null,
        test: null,
        live: null,
        cancelUrl: null,
        marketIds: [],
      }
    }
    const enabled = new Set(
      method.markets.filter((row) => row.isEnabled).map((row) => row.marketId)
    )
    const marketIds = markets.filter((market) => enabled.has(market.id)).map((market) => market.id)
    return {
      isEnabled: marketIds.length > 0 && activeStripeKeys(config) !== null,
      mode: config.mode,
      test: keySetup(config.test),
      live: keySetup(config.live),
      cancelUrl: config.cancelUrl ?? null,
      marketIds,
    }
  }

  /**
   * Saves the sandbox and production keys, which of them takes payments,
   * and the markets Stripe is offered in. The chosen mode must have keys.
   */
  async updateStripe(input: StripeInput): Promise<StripeSetup> {
    const markets = await this.markets()
    const activeIds = new Set(markets.map((market) => market.id))
    if (input.marketIds.some((marketId) => !activeIds.has(marketId))) {
      fieldError('marketIds', 'Choose from the active markets')
    }

    const method = await this.paymentMethodRepository.findByCode('stripe')
    const stored = method?.config ?? null
    const existing = isStripeConfig(stored) ? stored : null

    const test = await this.stripeKeySet('test', input.test, existing?.test ?? null)
    const live = await this.stripeKeySet('live', input.live, existing?.live ?? null)
    if (!(input.mode === 'test' ? test : live)) {
      fieldError(
        `${input.mode}.publishableKey`,
        `Add your ${MODE_LABELS[input.mode]} keys before switching to ${MODE_LABELS[input.mode]}`
      )
    }

    const config: StripeConfig = {
      mode: input.mode,
      test,
      live,
      cancelUrl:
        input.cancelUrl === undefined ? (existing?.cancelUrl ?? null) : input.cancelUrl || null,
    }
    const { enabled, disabled } = await this.paymentMethodRepository.upsertWithMarkets(
      'stripe',
      config,
      input.marketIds
    )
    await Promise.all([
      this.auditLogService.recordBulkUpdate(PaymentMethodMarket, enabled, { isEnabled: true }),
      this.auditLogService.recordBulkUpdate(PaymentMethodMarket, disabled, { isEnabled: false }),
    ])
    return this.stripe()
  }

  /**
   * One mode's keys after the update. Keys must belong to that mode
   * (`pk_test_…` for sandbox, `pk_live_…` for production), and a new
   * secret key is checked against Stripe first.
   */
  protected async stripeKeySet(
    mode: StripeMode,
    input: StripeKeysInput | undefined,
    existing: StripeKeySet | null
  ): Promise<StripeKeySet | null> {
    if (!input) return existing
    const label = MODE_LABELS[mode]
    if (!input.publishableKey) {
      if (input.secretKey || input.webhookSecret) {
        fieldError(`${mode}.publishableKey`, `Enter your ${label} publishable key`)
      }
      return null
    }
    if (keyMode(input.publishableKey) !== mode) {
      fieldError(`${mode}.publishableKey`, `Use a ${label} key starting with pk_${mode}_`)
    }
    if (!input.secretKey && !existing) {
      fieldError(`${mode}.secretKey`, `Enter your ${label} secret key`)
    }

    let secretKeyEncrypted = existing?.secretKeyEncrypted ?? ''
    let secretKeyLastFour = existing?.secretKeyLastFour ?? ''
    if (input.secretKey) {
      if (keyMode(input.secretKey) !== mode) {
        fieldError(`${mode}.secretKey`, `Use a ${label} secret key (sk_${mode}_ or rk_${mode}_)`)
      }
      const check = await this.stripeGateway.verifySecretKey(input.secretKey)
      if (check === 'invalid') {
        fieldError(`${mode}.secretKey`, 'Stripe didn’t accept this secret key')
      }
      if (check === 'unreachable') {
        fieldError(`${mode}.secretKey`, 'We couldn’t reach Stripe to check this key. Try again.')
      }
      secretKeyEncrypted = this.stripeGateway.encrypt(input.secretKey)
      secretKeyLastFour = input.secretKey.slice(-4)
    }

    return {
      publishableKey: input.publishableKey,
      secretKeyEncrypted,
      secretKeyLastFour,
      webhookSecretEncrypted: input.webhookSecret
        ? this.stripeGateway.encrypt(input.webhookSecret)
        : (existing?.webhookSecretEncrypted ?? null),
    }
  }

  async poli(): Promise<PoliSetup> {
    const [method, markets] = await Promise.all([
      this.paymentMethodRepository.findWithMarketsByCode('poli'),
      this.markets(),
    ])
    const config = method?.config ?? null
    if (!method || !isPoliConfig(config)) {
      return { isEnabled: false, mode: null, test: null, live: null, marketIds: [] }
    }
    const enabled = new Set(
      method.markets.filter((row) => row.isEnabled).map((row) => row.marketId)
    )
    const marketIds = markets
      .filter((market) => enabled.has(market.id) && isPoliCurrency(market.currencyCode))
      .map((market) => market.id)
    return {
      isEnabled: marketIds.length > 0 && activePoliCredentials(config) !== null,
      mode: config.mode,
      test: poliCredentialSetup(config.test),
      live: poliCredentialSetup(config.live),
      marketIds,
    }
  }

  /**
   * Saves the sandbox and production credentials, which of them takes
   * payments, and the NZD/AUD markets POLi is offered in. The chosen mode
   * must have credentials. POLi has no endpoint to check credentials, so
   * they are first tried at checkout.
   */
  async updatePoli(input: PoliInput): Promise<PoliSetup> {
    const markets = await this.markets()
    const byId = new Map(markets.map((market) => [market.id, market]))
    for (const marketId of input.marketIds) {
      const market = byId.get(marketId)
      if (!market) fieldError('marketIds', 'Choose from the active markets')
      if (!isPoliCurrency(market.currencyCode)) {
        fieldError(
          'marketIds',
          `POLi only takes NZD or AUD; ${market.name} uses ${market.currencyCode}`
        )
      }
    }

    const method = await this.paymentMethodRepository.findByCode('poli')
    const stored = method?.config ?? null
    const existing = isPoliConfig(stored) ? stored : null

    const test = this.poliCredentialSet('test', input.test, existing?.test ?? null)
    const live = this.poliCredentialSet('live', input.live, existing?.live ?? null)
    if (!(input.mode === 'test' ? test : live)) {
      fieldError(
        `${input.mode}.merchantCode`,
        `Add your ${MODE_LABELS[input.mode]} credentials before switching to ${MODE_LABELS[input.mode]}`
      )
    }

    const config: PoliConfig = { gateway: 'poli', mode: input.mode, test, live }
    const { enabled, disabled } = await this.paymentMethodRepository.upsertWithMarkets(
      'poli',
      config,
      input.marketIds
    )
    await Promise.all([
      this.auditLogService.recordBulkUpdate(PaymentMethodMarket, enabled, { isEnabled: true }),
      this.auditLogService.recordBulkUpdate(PaymentMethodMarket, disabled, { isEnabled: false }),
    ])
    return this.poli()
  }

  protected poliCredentialSet(
    mode: PoliMode,
    input: PoliCredentialsInput | undefined,
    existing: PoliCredentialSet | null
  ): PoliCredentialSet | null {
    if (!input) return existing
    const label = MODE_LABELS[mode]
    if (!input.merchantCode) {
      if (input.authenticationCode) {
        fieldError(`${mode}.merchantCode`, `Enter your ${label} merchant code`)
      }
      return null
    }
    if (input.authenticationCode) {
      return {
        merchantCode: input.merchantCode,
        authCodeEncrypted: this.poliGateway.encrypt(input.authenticationCode),
        authCodeLastFour: input.authenticationCode.slice(-4),
      }
    }
    if (!existing)
      fieldError(`${mode}.authenticationCode`, `Enter your ${label} authentication code`)
    return { ...existing, merchantCode: input.merchantCode }
  }

  /**
   * Moves setups saved before payment methods were per market onto
   * markets: the bank account goes to the market covering its country (or
   * the primary market), and an enabled Stripe to every active market.
   * Methods that already have market rows are left alone, so it is safe to
   * re-run.
   */
  async assignLegacySetupsToMarkets(): Promise<void> {
    const [methods, markets] = await Promise.all([
      this.paymentMethodRepository.allWithMarkets(),
      this.markets(),
    ])
    if (markets.length === 0) return
    const unassigned = (code: PaymentMethodCode) =>
      methods.find((method) => method.code === code && method.markets.length === 0)

    const bank = unassigned('bank_transfer')
    if (bank && isBankTransferConfig(bank.config)) {
      const { countryCode } = bank.config
      const market =
        markets.find((entry) =>
          entry.countries.some((country) => country.countryCode === countryCode)
        ) ?? markets.find((entry) => entry.isPrimary)
      if (market) {
        await this.paymentMethodRepository.upsertMarketRow('bank_transfer', market.id, {
          isEnabled: bank.isEnabled,
          config: bank.config,
        })
      }
    }

    const stripe = unassigned('stripe')
    if (stripe?.isEnabled && isStripeConfig(stripe.config)) {
      await this.paymentMethodRepository.upsertWithMarkets(
        'stripe',
        stripe.config,
        markets.map((market) => market.id)
      )
    }
  }

  /** Methods shoppers in the market can pay with, in catalog order. */
  async enabledForCheckout(market: Market): Promise<CheckoutPaymentMethod[]> {
    const [enabled, catalog] = await Promise.all([
      this.paymentMethodRepository.listEnabledForMarket(market.id),
      this.installedCatalog(),
    ])
    const byCode = new Map(
      enabled.flatMap((method) => {
        const row = method.markets[0]
        return row && isOfferedIn(method, row, market.currencyCode)
          ? [[method.code, { method, row }] as const]
          : []
      })
    )
    return catalog.flatMap((definition) => {
      const offered = byCode.get(definition.code)
      if (!offered) return []
      return [
        {
          code: definition.code,
          name: CHECKOUT_NAMES[definition.code] ?? definition.name,
          bankTransfer: isBankTransferConfig(offered.row.config) ? offered.row.config : null,
        },
      ]
    })
  }

  async isEnabled(code: PaymentMethodCode, market: Market): Promise<boolean> {
    const methods = await this.enabledForCheckout(market)
    return methods.some((method) => method.code === code)
  }
}
