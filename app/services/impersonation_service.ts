import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import type Customer from '#models/customer'
import type CustomerAccount from '#models/customer_account'
import type User from '#models/user'
import CustomerAccountRepository from '#repositories/customer_account_repository'
import CustomerRepository from '#repositories/customer_repository'
import AuditLogService from '#services/audit_log_service'
import {
  CUSTOMER_SESSION_VERSION_KEY,
  IMPERSONATION_SESSION_KEY,
  activeImpersonation,
  loginCustomer,
  readImpersonation,
  type ImpersonationSession,
} from '#utils/customer_session'

type SessionContext = Pick<HttpContext, 'auth' | 'session' | 'request'>

/**
 * Staff Users signing in to the storefront as a customer. The staff User
 * stays signed in on the `web` guard; the `customer` guard holds the
 * customer's account, and the session remembers who started it and why.
 */
@inject()
export default class ImpersonationService {
  constructor(
    protected customerRepository: CustomerRepository,
    protected customerAccountRepository: CustomerAccountRepository,
    protected auditLogService: AuditLogService
  ) {}

  async findAccount(customerId: string): Promise<CustomerAccount | null> {
    return this.customerAccountRepository.findByCustomerId(customerId)
  }

  /**
   * Signs the customer guard in as `account`. Doesn't touch the account's
   * `lastLoginAt`, so the customer's own sign-in history stays accurate.
   */
  async start(
    ctx: SessionContext,
    staff: User,
    customer: Customer,
    account: CustomerAccount,
    reason: string
  ): Promise<void> {
    await loginCustomer(ctx, account)
    const impersonation: ImpersonationSession = {
      userId: staff.id,
      customerId: customer.id,
      accountId: account.id,
      reason,
      startedAt: DateTime.now().toISO()!,
    }
    ctx.session.put(IMPERSONATION_SESSION_KEY, impersonation)
    await this.auditLogService.recordImpersonation('impersonation_started', staff, customer, {
      ipAddress: ctx.request.ip(),
      reason,
    })
  }

  /**
   * Signs the customer guard out and forgets the impersonation. Returns the
   * customer id, or null when nothing was being impersonated.
   */
  async stop(ctx: SessionContext): Promise<string | null> {
    const impersonation = readImpersonation(ctx)
    if (!impersonation) return null

    await ctx.auth.use('customer').logout()
    ctx.session.forget(CUSTOMER_SESSION_VERSION_KEY)
    ctx.session.forget(IMPERSONATION_SESSION_KEY)
    ctx.session.regenerate()

    const customer = await this.customerRepository.findOrFail(impersonation.customerId)
    await this.auditLogService.recordImpersonation(
      'impersonation_stopped',
      { id: impersonation.userId },
      customer,
      { ipAddress: ctx.request.ip() }
    )
    return impersonation.customerId
  }

  /** Who is being impersonated on this request, for the storefront banner. */
  async current(ctx: Pick<HttpContext, 'auth' | 'session'>) {
    const impersonation = activeImpersonation(ctx)
    const account = ctx.auth.use('customer').user
    if (!impersonation || !account) return null

    const customer = await this.customerAccountRepository.loadCustomer(account)
    return { customerName: customer.fullName || customer.email }
  }
}
