import { inject } from '@adonisjs/core'
import { Secret } from '@adonisjs/core/helpers'
import app from '@adonisjs/core/services/app'
import encryption from '@adonisjs/core/services/encryption'
import logger from '@adonisjs/core/services/logger'
import { Checkout, Shopkeeper } from '@foadonis/shopkeeper'
import Stripe from 'stripe'
import type Order from '#models/order'
import type {
  PaymentMethodConfig,
  StripeConfig,
  StripeKeySet,
  StripeMode,
} from '#models/payment_method'
import PaymentMethodRepository from '#repositories/payment_method_repository'

const ENCRYPTION_PURPOSE = 'stripe-credentials'

export type StripeCredentials = {
  mode: StripeMode
  publishableKey: string
  secretKey: string
  webhookSecret: string | null
  cancelUrl: string | null
}

export type StripeCheckoutUrls = {
  successUrl: string
  /** Used when no cancel URL is set on the Stripe setup. */
  cancelUrl: string
}

/** What the shopper sees on the Stripe page and staff see in the Stripe dashboard. */
export type StripeCheckoutDetails = {
  /** e.g. `Your Akinai order`. */
  title: string
  /** Items and totals, shown under the title. */
  description: string | null
  metadata: Record<string, string>
}

export type StripeCheckoutSession = {
  id: string
  url: string
}

export type StripeSessionResult = {
  orderId: string | null
  paid: boolean
  /** Amount charged in the currency's minor unit (cents). */
  amountTotal: number | null
  currency: string | null
}

export type StripeKeyCheck = 'valid' | 'invalid' | 'unreachable'

export type StripeRefundStatus = 'pending' | 'succeeded' | 'failed'

export type StripeRefundResult = {
  id: string
  status: StripeRefundStatus
  /** Amount in the currency's minor unit (cents). */
  amount: number
  currency: string
  failureReason: string | null
  /** Our refund id, from the metadata set when it was created. */
  refundId: string | null
}

export type StripeWebhookEvent =
  | ({ kind: 'checkout' } & StripeSessionResult & { sessionId: string })
  | ({ kind: 'refund' } & StripeRefundResult)

/** Amount in the minor unit Stripe charges in. */
export function toStripeAmount(amount: number): number {
  return Math.round(amount * 100)
}

/** Order total in the minor unit Stripe charges in. */
export function stripeAmount(order: Order): number {
  return toStripeAmount(order.total)
}

/** Whether Stripe charged exactly the order's total in the order's currency. */
export function chargeMatchesOrder(result: StripeSessionResult, order: Order): boolean {
  return (
    result.amountTotal === stripeAmount(order) &&
    result.currency?.toLowerCase() === order.currencyCode.toLowerCase()
  )
}

export function isStripeConfig(config: PaymentMethodConfig | null): config is StripeConfig {
  return config !== null && 'test' in config && 'live' in config && !('gateway' in config)
}

/** The key set for the mode Stripe is switched to, or null when that mode has no keys. */
export function activeStripeKeys(config: StripeConfig): StripeKeySet | null {
  return config[config.mode]
}

/** Secret key the current `Shopkeeper.$instance` was built with. */
let activeSecretKey: string | null = null

/**
 * Takes card payments through Stripe Checkout using Shopkeeper. Keys live
 * encrypted in `payment_methods`, so Shopkeeper's client is rebuilt
 * whenever the stored secret key changes.
 */
@inject()
export default class StripeGatewayService {
  constructor(protected paymentMethodRepository: PaymentMethodRepository) {}

  encrypt(value: string): string {
    return String(encryption.encrypt(value, { purpose: ENCRYPTION_PURPOSE }))
  }

  decrypt(value: string): string | null {
    return encryption.decrypt<string>(value, ENCRYPTION_PURPOSE)
  }

  /**
   * Decrypted keys for the active mode (sandbox or production), or null
   * when Stripe isn't set up, the active mode has no keys, or the app key
   * changed since the keys were saved.
   */
  async credentials(): Promise<StripeCredentials | null> {
    const method = await this.paymentMethodRepository.findByCode('stripe')
    const config = method?.config ?? null
    if (!isStripeConfig(config)) return null
    const keys = activeStripeKeys(config)
    if (!keys) return null

    const secretKey = this.decrypt(keys.secretKeyEncrypted)
    if (!secretKey) return null
    const webhookSecret = keys.webhookSecretEncrypted
      ? this.decrypt(keys.webhookSecretEncrypted)
      : null

    return {
      mode: config.mode,
      publishableKey: keys.publishableKey,
      secretKey,
      webhookSecret,
      cancelUrl: config.cancelUrl ?? null,
    }
  }

  /**
   * Checks the secret key against Stripe before it is saved. A rejected
   * key is `invalid`; a network or Stripe outage is `unreachable`, so staff
   * aren't told a good key is wrong.
   */
  async verifySecretKey(secretKey: string): Promise<StripeKeyCheck> {
    try {
      await new Stripe(secretKey).balance.retrieve()
      return 'valid'
    } catch (error) {
      if (
        error instanceof Stripe.errors.StripeAuthenticationError ||
        error instanceof Stripe.errors.StripePermissionError ||
        error instanceof Stripe.errors.StripeInvalidRequestError
      ) {
        return 'invalid'
      }
      logger.warn({ err: error }, 'Could not reach Stripe to verify the secret key')
      return 'unreachable'
    }
  }

  /**
   * Charges the order total as one line, so discounts, shipping and tax
   * always add up to exactly what the order says; the items and totals go
   * in the line's description instead.
   */
  async createCheckoutSession(
    order: Order,
    details: StripeCheckoutDetails,
    urls: StripeCheckoutUrls
  ): Promise<StripeCheckoutSession> {
    const credentials = await this.requireCredentials()
    await this.shopkeeper(credentials)
    const metadata = { ...details.metadata, order_id: order.id }
    const checkout = await Checkout.guest()
      .addRawLineItem({
        price_data: {
          currency: order.currencyCode.toLowerCase(),
          product_data: {
            name: details.title,
            ...(details.description ? { description: details.description } : {}),
          },
          unit_amount: stripeAmount(order),
        },
        quantity: 1,
      })
      .sessionParams({
        success_url: urls.successUrl,
        cancel_url: credentials.cancelUrl ?? urls.cancelUrl,
        customer_email: order.email ?? undefined,
        client_reference_id: order.id,
        metadata,
        payment_intent_data: { description: details.title, metadata },
      })
      .create()

    const session = checkout.asStripeSession()
    if (!session.url) throw new Error('Stripe did not return a checkout URL')
    return { id: session.id, url: session.url }
  }

  async retrieveSession(sessionId: string): Promise<StripeSessionResult> {
    const shopkeeper = await this.shopkeeper()
    const session = await shopkeeper.stripe.checkout.sessions.retrieve(sessionId)
    return sessionResult(session)
  }

  /**
   * Refunds part or all of the session's payment. `idempotencyKey` is our
   * refund id, so a retried call never refunds twice.
   */
  async refund(
    sessionId: string,
    amount: number,
    { idempotencyKey, orderId }: { idempotencyKey: string; orderId: string }
  ): Promise<StripeRefundResult> {
    const shopkeeper = await this.shopkeeper()
    const session = await shopkeeper.stripe.checkout.sessions.retrieve(sessionId)
    const paymentIntent =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent?.id ?? null)
    if (!paymentIntent) throw new Error('This payment has no Stripe payment to refund')

    const refund = await shopkeeper.stripe.refunds.create(
      {
        payment_intent: paymentIntent,
        amount: toStripeAmount(amount),
        metadata: { order_id: orderId, refund_id: idempotencyKey },
      },
      { idempotencyKey: `refund-${idempotencyKey}` }
    )
    return refundResult(refund)
  }

  /**
   * Closes the session so it can no longer be paid. Sessions that are
   * already complete or expired are left alone.
   */
  async expireSession(sessionId: string): Promise<boolean> {
    const shopkeeper = await this.shopkeeper()
    const session = await shopkeeper.stripe.checkout.sessions.retrieve(sessionId)
    if (session.status !== 'open') return false
    await shopkeeper.stripe.checkout.sessions.expire(sessionId)
    return true
  }

  /**
   * Verifies the signature with the active mode's webhook secret. Returns
   * null for events that don't settle a checkout payment or update a refund,
   * and for events from the other mode (a sandbox payment never pays a
   * live order).
   */
  async parseWebhook(payload: string, signature: string): Promise<StripeWebhookEvent | null> {
    const credentials = await this.requireCredentials()
    if (!credentials.webhookSecret) throw new Error('Stripe webhook secret is not set')
    const shopkeeper = await this.shopkeeper()
    const event = shopkeeper.stripe.webhooks.constructEvent(
      payload,
      signature,
      credentials.webhookSecret,
      shopkeeper.config.webhook.tolerance
    )
    if (event.livemode !== (credentials.mode === 'live')) {
      logger.warn(
        { event: 'security.stripe_mode_mismatch', type: event.type, livemode: event.livemode },
        'Ignored a Stripe event from the inactive mode'
      )
      return null
    }
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        return {
          kind: 'checkout',
          ...sessionResult(event.data.object),
          sessionId: event.data.object.id,
        }
      case 'refund.updated':
      case 'refund.failed':
      case 'charge.refund.updated':
        return { kind: 'refund', ...refundResult(event.data.object) }
      default:
        return null
    }
  }

  protected async requireCredentials(): Promise<StripeCredentials> {
    const credentials = await this.credentials()
    if (!credentials) throw new Error('Stripe is not set up')
    return credentials
  }

  protected async shopkeeper(known?: StripeCredentials): Promise<Shopkeeper> {
    const credentials = known ?? (await this.requireCredentials())
    const booted = await app.container.make(Shopkeeper)
    if (activeSecretKey !== credentials.secretKey) {
      const [router, emitter] = await Promise.all([
        app.container.make('router'),
        app.container.make('emitter'),
      ])
      new Shopkeeper(
        {
          ...booted.config,
          key: new Secret(credentials.publishableKey),
          secret: new Secret(credentials.secretKey),
        },
        router,
        emitter
      )
      activeSecretKey = credentials.secretKey
    }
    return Shopkeeper.$instance
  }
}

function refundResult(refund: Stripe.Refund): StripeRefundResult {
  const status: StripeRefundStatus =
    refund.status === 'succeeded'
      ? 'succeeded'
      : refund.status === 'failed' || refund.status === 'canceled'
        ? 'failed'
        : 'pending'
  return {
    id: refund.id,
    status,
    amount: refund.amount,
    currency: refund.currency,
    failureReason: refund.failure_reason ?? null,
    refundId: refund.metadata?.refund_id ?? null,
  }
}

function sessionResult(session: Stripe.Checkout.Session): StripeSessionResult {
  return {
    orderId: session.metadata?.order_id ?? session.client_reference_id ?? null,
    paid: session.payment_status === 'paid',
    amountTotal: session.amount_total ?? null,
    currency: session.currency ?? null,
  }
}
