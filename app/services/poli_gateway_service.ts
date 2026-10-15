import { inject } from '@adonisjs/core'
import encryption from '@adonisjs/core/services/encryption'
import { POLI_API_BASE_URLS, type PoliMode } from '#constants/payment_methods'
import type Order from '#models/order'
import type { PaymentMethodConfig, PoliConfig, PoliCredentialSet } from '#models/payment_method'
import PaymentMethodRepository from '#repositories/payment_method_repository'

const ENCRYPTION_PURPOSE = 'poli-credentials'

const REQUEST_TIMEOUT_MS = 15_000

export type PoliCredentials = {
  mode: PoliMode
  merchantCode: string
  authenticationCode: string
}

export type PoliInitiateUrls = {
  homepageUrl: string
  successUrl: string
  failureUrl: string
  cancellationUrl: string
  notificationUrl: string
}

export type PoliTransaction = {
  token: string
  /** POLi's `NavigateURL`, where the shopper picks their bank. */
  navigateUrl: string
}

/**
 * POLi's `TransactionStatusCode`, e.g. `Initiated`, `Completed`,
 * `ReceiptUnverified`, `Failed`, `Cancelled`, `TimedOut`.
 */
export type PoliTransactionResult = {
  status: string
  /** Only `Completed` means the bank confirmed the payment. */
  paid: boolean
  /** Our order id, sent as `MerchantReference` when the transaction started. */
  merchantReference: string | null
  /** Amount paid in the currency's minor unit (cents). */
  amountPaid: number | null
  currency: string | null
}

export type PoliResponse = {
  status: number
  body: unknown
}

export class PoliError extends Error {}

export function isPoliConfig(config: PaymentMethodConfig | null): config is PoliConfig {
  return config !== null && 'gateway' in config && config.gateway === 'poli'
}

/** The credentials for the mode POLi is switched to, or null when that mode has none. */
export function activePoliCredentials(config: PoliConfig): PoliCredentialSet | null {
  return config[config.mode]
}

/** Order total in cents, the unit POLi amounts are compared in. */
export function poliAmount(order: Order): number {
  return Math.round(order.total * 100)
}

/** Whether POLi was paid exactly the order's total in the order's currency. */
export function poliPaymentMatchesOrder(result: PoliTransactionResult, order: Order): boolean {
  return (
    result.amountPaid === poliAmount(order) &&
    result.currency?.toUpperCase() === order.currencyCode.toUpperCase()
  )
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function toCents(value: unknown): number | null {
  const amount =
    typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
  return Number.isFinite(amount) ? Math.round(amount * 100) : null
}

/** POLi's transaction token is the `Token` query parameter of the `NavigateURL`. */
export function tokenFromNavigateUrl(navigateUrl: string): string | null {
  try {
    const url = new URL(navigateUrl)
    return text(url.searchParams.get('Token') ?? url.searchParams.get('token'))
  } catch {
    return null
  }
}

/**
 * Online bank payments through POLi's REST API (v2). Credentials live
 * encrypted in `payment_methods`; requests use HTTP Basic auth with the
 * merchant code and authentication code. Failures throw `PoliError`, so
 * callers fail closed.
 */
@inject()
export default class PoliGatewayService {
  constructor(protected paymentMethodRepository: PaymentMethodRepository) {}

  encrypt(value: string): string {
    return String(encryption.encrypt(value, { purpose: ENCRYPTION_PURPOSE }))
  }

  decrypt(value: string): string | null {
    return encryption.decrypt<string>(value, ENCRYPTION_PURPOSE)
  }

  /**
   * Decrypted credentials for the active mode (sandbox or production), or
   * null when POLi isn't set up, the active mode has no credentials, or the
   * app key changed since they were saved.
   */
  async credentials(): Promise<PoliCredentials | null> {
    const method = await this.paymentMethodRepository.findByCode('poli')
    const config = method?.config ?? null
    if (!isPoliConfig(config)) return null
    const set = activePoliCredentials(config)
    if (!set) return null
    const authenticationCode = this.decrypt(set.authCodeEncrypted)
    if (!authenticationCode) return null
    return { mode: config.mode, merchantCode: set.merchantCode, authenticationCode }
  }

  /** Starts a transaction for the order total and returns where to send the shopper. */
  async initiate(order: Order, urls: PoliInitiateUrls): Promise<PoliTransaction> {
    const credentials = await this.requireCredentials()
    const response = await this.request(credentials, 'POST', 'Transaction/Initiate', {
      Amount: poliAmount(order) / 100,
      CurrencyCode: order.currencyCode.toUpperCase(),
      MerchantReference: order.id,
      MerchantHomepageURL: urls.homepageUrl,
      SuccessURL: urls.successUrl,
      FailureURL: urls.failureUrl,
      CancellationURL: urls.cancellationUrl,
      NotificationURL: urls.notificationUrl,
    })
    const body = record(response.body)
    const success = body.Success === true || String(body.Success).toLowerCase() === 'true'
    if (response.status < 200 || response.status >= 300 || !success) {
      throw new PoliError(
        `POLi did not start the transaction (${response.status}, error ${String(body.ErrorCode ?? 'none')})`
      )
    }
    const navigateUrl = text(body.NavigateURL)
    const token = navigateUrl ? tokenFromNavigateUrl(navigateUrl) : null
    if (!navigateUrl || !token) throw new PoliError('POLi did not return a payment URL')
    return { token, navigateUrl }
  }

  /** Looks the transaction up with POLi. Redirects and nudges are never trusted on their own. */
  async getTransaction(token: string): Promise<PoliTransactionResult> {
    const credentials = await this.requireCredentials()
    const response = await this.request(
      credentials,
      'GET',
      `Transaction/GetTransaction?token=${encodeURIComponent(token)}`
    )
    const body = record(response.body)
    const status = text(body.TransactionStatusCode)
    if (response.status < 200 || response.status >= 300 || !status) {
      throw new PoliError(
        `POLi transaction lookup failed (${response.status}, error ${String(body.ErrorCode ?? 'none')})`
      )
    }
    return {
      status,
      paid: status === 'Completed',
      merchantReference: text(body.MerchantReference),
      amountPaid: toCents(body.AmountPaid),
      currency: text(body.CurrencyCode),
    }
  }

  protected async requireCredentials(): Promise<PoliCredentials> {
    const credentials = await this.credentials()
    if (!credentials) throw new PoliError('POLi is not set up')
    return credentials
  }

  /** One JSON request to POLi. Network errors and timeouts throw `PoliError`. */
  protected async request(
    credentials: PoliCredentials,
    method: 'GET' | 'POST',
    path: string,
    body?: Record<string, unknown>
  ): Promise<PoliResponse> {
    const auth = Buffer.from(
      `${credentials.merchantCode}:${credentials.authenticationCode}`,
      'utf8'
    ).toString('base64')
    let response: Response
    try {
      response = await fetch(`${POLI_API_BASE_URLS[credentials.mode]}/${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          Authorization: `Basic ${auth}`,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch (error) {
      throw new PoliError('Could not reach POLi', { cause: error })
    }
    const raw = await response.text()
    let parsed: unknown = null
    if (raw.trim()) {
      try {
        parsed = JSON.parse(raw)
      } catch {
        throw new PoliError(`POLi returned an unreadable response (${response.status})`)
      }
    }
    return { status: response.status, body: parsed }
  }
}
