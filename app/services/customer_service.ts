import { inject } from '@adonisjs/core'
import hash from '@adonisjs/core/services/hash'
import mail from '@adonisjs/mail/services/main'
import { errors } from '@vinejs/vine'
import type { AuditValue } from '#models/audit_log'
import Customer from '#models/customer'
import type CustomerAccount from '#models/customer_account'
import type CustomerVerificationCode from '#models/customer_verification_code'
import type Market from '#models/market'
import CustomerAccountRepository, {
  type VerifiedAccountData,
} from '#repositories/customer_account_repository'
import CustomerRepository, {
  marketingConsent,
  type CustomerFilterOptions,
  type CustomerProfileData,
  type PaginateCustomersData,
} from '#repositories/customer_repository'
import MarketRepository from '#repositories/market_repository'
import { countryName } from '#constants/countries'
import { TIMEZONES, timezonesForCountry } from '#constants/store_settings'
import AuditLogService from '#services/audit_log_service'
import CustomerVerificationCodeService from '#services/customer_verification_code_service'
import VerificationCodeException from '#exceptions/verification_code_exception'
import CustomerAccountExistsNotification from '#mails/customer_account_exists_notification'
import CustomerEmailChangedNotification from '#mails/customer_email_changed_notification'
import CustomerPasswordChangedNotification from '#mails/customer_password_changed_notification'
import CustomerPasswordResetCodeNotification from '#mails/customer_password_reset_code_notification'
import CustomerSignupCodeNotification from '#mails/customer_signup_code_notification'
import type { VerificationPurpose } from '#constants/customer_verification'
import { bulkResult, type BulkResult } from '#transformers/bulk_result_transformer'

export type ListCustomersFilters = Partial<PaginateCustomersData>

export type RegisterCustomerData = Pick<CustomerProfileData, 'fullName' | 'email' | 'phone'> & {
  password: string
  acceptsMarketing: boolean
}

export type CustomerLocationInput = { countryCode: string; timezone: string }

export type CustomerProfileInput = Omit<CustomerProfileData, 'marketId'>

export type CustomerLocationOptions = {
  countries: { code: string; name: string; timezones: string[] }[]
  timezones: string[]
}

/**
 * The saved profile, plus the market it was moved to when its country
 * changed (null otherwise).
 */
export type CustomerProfileResult = { customer: Customer; market: Market | null }

@inject()
export default class CustomerService {
  constructor(
    protected customerRepository: CustomerRepository,
    protected customerAccountRepository: CustomerAccountRepository,
    protected auditLogService: AuditLogService,
    protected verificationCodeService: CustomerVerificationCodeService,
    protected marketRepository: MarketRepository
  ) {}

  /**
   * Countries a customer can pick (those covered by an active market,
   * sorted by name) with the timezones used in each, plus every IANA
   * timezone for a country outside that list.
   */
  async locationOptions(): Promise<CustomerLocationOptions> {
    const codes = await this.marketRepository.listActiveCountryCodes()
    const countries = [...new Set(codes)]
      .map((code) => ({ code, name: countryName(code), timezones: timezonesForCountry(code) }))
      .sort((a, b) => a.name.localeCompare(b.name))
    return { countries, timezones: [...TIMEZONES] }
  }

  /**
   * Saves the signed-in customer's country and timezone and moves them to
   * the active market that covers the country.
   */
  async updateLocation(
    account: CustomerAccount,
    input: CustomerLocationInput
  ): Promise<CustomerProfileResult> {
    const customer = await this.customerAccountRepository.loadCustomer(account)
    const market = await this.marketRepository.findActiveForCountry(input.countryCode)
    const updated = await this.customerRepository.setLocation(customer, {
      ...input,
      marketId: market?.id ?? customer.marketId,
    })
    return { customer: updated, market }
  }

  /**
   * Profile data with only the location keys that were sent, plus the
   * market covering the country when the country changes.
   */
  protected async withLocation(
    customer: Customer | null,
    input: CustomerProfileInput
  ): Promise<{ data: CustomerProfileData; market: Market | null }> {
    const { countryCode, timezone, ...profile } = input
    const data: CustomerProfileData = { ...profile }
    if (timezone !== undefined) data.timezone = timezone
    if (countryCode === undefined) return { data, market: null }

    data.countryCode = countryCode
    if (!countryCode || countryCode === customer?.countryCode) return { data, market: null }

    const market = await this.marketRepository.findActiveForCountry(countryCode)
    if (market) data.marketId = market.id
    return { data, market }
  }

  /**
   * Throws `E_INVALID_CREDENTIALS` when the email/password pair is wrong.
   */
  async authenticate(
    email: string,
    password: string
  ): Promise<{ account: CustomerAccount; customer: Customer }> {
    const account = await this.customerAccountRepository.verifyCredentials(
      email.toLowerCase(),
      password
    )
    const customer = await this.customerAccountRepository.loadCustomer(account)
    return { account, customer }
  }

  async recordLogin(
    account: CustomerAccount,
    ipAddress: string | null = null
  ): Promise<CustomerAccount> {
    const updated = await this.customerAccountRepository.touchLastLogin(account)
    const customer = await this.customerAccountRepository.loadCustomer(account)
    await this.auditLogService.recordSecurityEvent('logged_in', this.securitySubject(customer), {
      ipAddress,
    })
    return updated
  }

  /**
   * Audits a failed or blocked storefront sign-in against the customer with
   * that email, or only logs it when no account exists.
   */
  async recordLoginFailure(
    action: 'login_failed' | 'login_blocked',
    email: string,
    ipAddress: string | null
  ): Promise<void> {
    const account = await this.customerAccountRepository.findByEmail(email.toLowerCase())
    if (!account) {
      this.auditLogService.logUnknownSubjectEvent(action, {
        ipAddress,
        details: { guard: 'customer' },
      })
      return
    }
    const customer = await this.customerAccountRepository.loadCustomer(account)
    await this.auditLogService.recordSecurityEvent(action, this.securitySubject(customer), {
      ipAddress,
    })
  }

  protected securitySubject(customer: Customer) {
    return {
      type: 'Customer' as const,
      id: customer.id,
      email: customer.email,
      fullName: customer.fullName,
    }
  }

  async profileFor(account: CustomerAccount): Promise<Customer> {
    return this.customerAccountRepository.loadCustomer(account)
  }

  /**
   * The signed-in customer editing their own details. Changing the email
   * changes the login, so it needs the current password. Changing the
   * country moves the customer to the market that covers it.
   */
  async updateOwnProfile(
    account: CustomerAccount,
    input: CustomerProfileInput,
    currentPassword?: string
  ): Promise<CustomerProfileResult> {
    const customer = await this.customerAccountRepository.loadCustomer(account)
    const { data, market } = await this.withLocation(customer, input)
    const email = data.email.toLowerCase()
    const previousEmail = customer.email

    if (email !== previousEmail) {
      const valid = currentPassword ? await hash.verify(account.password, currentPassword) : false
      if (!valid) {
        throw new errors.E_VALIDATION_ERROR([
          {
            field: 'currentPassword',
            message: currentPassword
              ? 'That password is incorrect'
              : 'Enter your password to change your email',
            rule: 'password',
          },
        ])
      }
    }

    const updated = await this.customerRepository.update(customer, { ...data, email })
    if (email !== previousEmail) {
      await mail.sendLater(new CustomerEmailChangedNotification(previousEmail))
    }
    return { customer: updated, market }
  }

  /**
   * First signup step. Nothing is created yet: the details wait in a
   * verification row until the customer enters the code emailed to them.
   *
   * The response must not reveal whether the email already has an account,
   * so that case does the same work (hash, store a code row) but emails an
   * "you already have an account" notice instead of a code. Its row has no
   * payload and its code is never sent, so it can't complete a signup.
   */
  async startSignup(data: RegisterCustomerData): Promise<CustomerVerificationCode> {
    const email = data.email.toLowerCase()
    const passwordHash = await hash.make(data.password)
    const existingAccount = await this.customerAccountRepository.findByEmail(email)

    if (existingAccount) {
      const { record } = await this.verificationCodeService.issue(email, 'signup')
      await mail.sendLater(new CustomerAccountExistsNotification(email))
      return record
    }

    const { record, code } = await this.verificationCodeService.issue(email, 'signup', {
      fullName: data.fullName,
      phone: data.phone,
      passwordHash,
      acceptsMarketing: data.acceptsMarketing,
    })
    await mail.sendLater(new CustomerSignupCodeNotification(email, code))
    return record
  }

  async resendSignupCode(verificationId: string | undefined): Promise<CustomerVerificationCode> {
    const { record, code } = await this.verificationCodeService.resend(verificationId, 'signup')
    await mail.sendLater(
      record.payload
        ? new CustomerSignupCodeNotification(record.email, code)
        : new CustomerAccountExistsNotification(record.email)
    )
    return record
  }

  /**
   * Second signup step: the code proves the customer owns the inbox, so
   * only now is the account created. A profile with no login yet (added by
   * staff or created at a guest checkout) is claimed instead of creating a
   * second one.
   */
  async completeSignup(verificationId: string | undefined, code: string): Promise<CustomerAccount> {
    const record = await this.verificationCodeService.consume(verificationId, 'signup', code)
    if (!record.payload) throw VerificationCodeException.invalid()
    if (await this.customerAccountRepository.findByEmail(record.email)) {
      throw VerificationCodeException.expired()
    }

    const { acceptsMarketing } = record.payload
    return this.createVerifiedAccount({
      email: record.email,
      fullName: record.payload.fullName,
      phone: record.payload.phone,
      passwordHash: record.payload.passwordHash,
      ...(acceptsMarketing === undefined ? {} : marketingConsent(acceptsMarketing, 'signup')),
    })
  }

  /**
   * Creates the login for an email that has already been verified. Only
   * `completeSignup` (and test helpers) should call this.
   */
  async createVerifiedAccount(data: VerifiedAccountData): Promise<CustomerAccount> {
    const email = data.email.toLowerCase()
    const existing = await this.customerRepository.findByEmail(email)

    if (!existing) {
      return this.customerAccountRepository.createWithCustomer({ ...data, email })
    }
    if (!existing.isActive) {
      throw new errors.E_VALIDATION_ERROR([
        { field: 'email', message: 'This email cannot be used to sign up', rule: 'archived' },
      ])
    }
    return this.customerAccountRepository.createForCustomer(existing, { ...data, email })
  }

  /**
   * Emails a reset code when the email has an account. Returns the code row
   * either way (a decoy with no code sent when there is no account), so the
   * response is the same for every email.
   */
  async startPasswordReset(email: string): Promise<CustomerVerificationCode> {
    const normalized = email.toLowerCase()
    const account = await this.customerAccountRepository.findByEmail(normalized)
    const { record, code } = await this.verificationCodeService.issue(normalized, 'password_reset')
    if (account) {
      await mail.sendLater(new CustomerPasswordResetCodeNotification(normalized, code))
    }
    return record
  }

  async resendPasswordResetCode(
    verificationId: string | undefined
  ): Promise<CustomerVerificationCode> {
    const { record, code } = await this.verificationCodeService.resend(
      verificationId,
      'password_reset'
    )
    if (await this.customerAccountRepository.findByEmail(record.email)) {
      await mail.sendLater(new CustomerPasswordResetCodeNotification(record.email, code))
    }
    return record
  }

  /**
   * Sets the new password once the code checks out. Every other session for
   * the account is signed out (`sessionVersion` is bumped).
   */
  async completePasswordReset(
    verificationId: string | undefined,
    code: string,
    password: string,
    ipAddress: string | null = null
  ): Promise<CustomerAccount> {
    const record = await this.verificationCodeService.consume(
      verificationId,
      'password_reset',
      code
    )
    const account = await this.customerAccountRepository.findByEmail(record.email)
    if (!account) throw VerificationCodeException.invalid()

    const customer = await this.customerAccountRepository.loadCustomer(account)
    if (!customer.isActive) {
      throw new errors.E_VALIDATION_ERROR([
        { field: 'code', message: 'This account has been disabled', rule: 'archived' },
      ])
    }

    const updated = await this.customerAccountRepository.changePassword(account, password)
    await this.auditLogService.recordSecurityEvent(
      'password_reset',
      this.securitySubject(customer),
      {
        ipAddress,
      }
    )
    await mail.sendLater(new CustomerPasswordChangedNotification(updated.email))
    return updated
  }

  /**
   * The email a pending verification was sent to, for the "we sent a code
   * to ..." line on the verify page. The address was typed by the same
   * browser, so showing it back reveals nothing.
   */
  async pendingVerificationEmail(
    verificationId: string | undefined,
    purpose: VerificationPurpose
  ): Promise<string | null> {
    const record = await this.verificationCodeService.findActive(verificationId, purpose)
    return record?.email ?? null
  }

  async paginate(filters: ListCustomersFilters = {}) {
    return this.customerRepository.paginate({
      ...filters,
      q: filters.q || undefined,
      sort: filters.sort ?? 'createdAt',
      direction: filters.direction ?? 'desc',
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 15,
    })
  }

  async filterOptions(): Promise<CustomerFilterOptions> {
    return this.customerRepository.filterOptions()
  }

  /** The signed-in customer turning marketing emails on or off. */
  async updateOwnMarketing(account: CustomerAccount, acceptsMarketing: boolean): Promise<Customer> {
    const customer = await this.customerAccountRepository.loadCustomer(account)
    return this.customerRepository.setMarketing(customer, acceptsMarketing, 'account')
  }

  /** Staff recording a customer's marketing choice (by phone, in person). */
  async setMarketing(customer: Customer, acceptsMarketing: boolean): Promise<Customer> {
    await this.customerRepository.setMarketing(customer, acceptsMarketing, 'admin')
    return this.customerRepository.findDetailOrFail(customer.id)
  }

  /**
   * Replaces the staff tags and note, logging both in one audit entry
   * (tag rows are written with set-based queries that skip model hooks).
   */
  async updateTagsAndNote(customer: Customer, tags: string[], note: string | null) {
    const beforeTags = await this.customerRepository.tagNames(customer.id)
    const beforeNote = customer.note
    const afterTags = [...new Set(tags)].sort()

    customer.$skipAudit = true
    await this.customerRepository.setTagsAndNote(customer, afterTags, note)

    const before: Record<string, AuditValue> = {}
    const after: Record<string, AuditValue> = {}
    if (beforeNote !== note) {
      before.note = beforeNote
      after.note = note
    }
    if (beforeTags.join('\n') !== afterTags.join('\n')) {
      before.tags = beforeTags
      after.tags = afterTags
    }
    if (Object.keys(after).length > 0) {
      await this.auditLogService.record(customer, 'updated', { before, after })
    }
    return this.customerRepository.findDetailOrFail(customer.id)
  }

  async findOrFail(id: string): Promise<Customer> {
    return this.customerRepository.findOrFail(id)
  }

  async findDetail(id: string): Promise<Customer> {
    return this.customerRepository.findDetailOrFail(id)
  }

  async create(input: CustomerProfileInput): Promise<Customer> {
    const { data } = await this.withLocation(null, input)
    return this.customerRepository.create({ ...data, email: data.email.toLowerCase() })
  }

  async update(customer: Customer, input: CustomerProfileInput): Promise<Customer> {
    const { data } = await this.withLocation(customer, input)
    return this.customerRepository.update(customer, { ...data, email: data.email.toLowerCase() })
  }

  async archive(customer: Customer): Promise<Customer> {
    return this.customerRepository.setActive(customer, false)
  }

  async unarchive(customer: Customer): Promise<Customer> {
    return this.customerRepository.setActive(customer, true)
  }

  /**
   * Archives or unarchives many records at once. Records already in that
   * state, or not eligible, are skipped.
   */
  async bulkSetArchived(ids: string[], archived: boolean): Promise<BulkResult> {
    const changed = await this.customerRepository.setActiveMany(ids, !archived)
    await this.auditLogService.recordBulkUpdate(Customer, changed, { isActive: !archived })
    return bulkResult(ids, changed)
  }
}
