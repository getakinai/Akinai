import { randomBytes } from 'node:crypto'
import { inject } from '@adonisjs/core'
import hash from '@adonisjs/core/services/hash'
import type { AllyUserContract } from '@adonisjs/ally/types'
import type CustomerAccount from '#models/customer_account'
import CustomerAccountRepository from '#repositories/customer_account_repository'
import CustomerRepository, { marketingConsent } from '#repositories/customer_repository'
import CustomerSocialIdentityRepository from '#repositories/customer_social_identity_repository'
import SocialAuthException from '#exceptions/social_auth_exception'
import type { SocialProvider } from '#constants/social_providers'

export type SocialProfile = Pick<
  AllyUserContract<never>,
  'id' | 'email' | 'name' | 'emailVerificationState'
>

@inject()
export default class CustomerSocialAuthService {
  constructor(
    protected customerRepository: CustomerRepository,
    protected customerAccountRepository: CustomerAccountRepository,
    protected socialIdentityRepository: CustomerSocialIdentityRepository
  ) {}

  /**
   * Finds the customer account for a Google/Microsoft profile, or creates
   * one when `allowSignup` is set (sign-in started on the Create account
   * page). The provider has verified the email, so an existing account
   * with the same email is linked and a new one skips the emailed-code
   * step.
   *
   * Throws `SocialAuthException` when the email is unverified, the
   * customer is disabled, or there is no account and signup isn't allowed.
   */
  async resolve(
    provider: SocialProvider,
    profile: SocialProfile,
    { allowSignup = false }: { allowSignup?: boolean } = {}
  ): Promise<CustomerAccount> {
    if (!profile.id || !profile.email || profile.emailVerificationState !== 'verified') {
      throw SocialAuthException.unverifiedEmail()
    }

    const email = profile.email.toLowerCase()
    const identity = { provider, providerUserId: String(profile.id), email }

    const linked = await this.socialIdentityRepository.findAccountByProvider(
      provider,
      identity.providerUserId
    )
    if (linked) {
      await this.ensureActive(linked)
      return linked
    }

    const existingAccount = await this.customerAccountRepository.findByEmail(email)
    if (existingAccount) {
      await this.ensureActive(existingAccount)
      await this.socialIdentityRepository.linkToAccount(existingAccount, identity)
      return existingAccount
    }

    const existingCustomer = await this.customerRepository.findByEmail(email)
    if (existingCustomer && !existingCustomer.isActive) {
      throw SocialAuthException.disabled()
    }
    if (!allowSignup) throw SocialAuthException.noAccount()

    return this.socialIdentityRepository.createWithAccount(
      existingCustomer,
      {
        email,
        fullName: profile.name?.trim() || null,
        phone: null,
        passwordHash: await this.unusablePasswordHash(),
        // New profiles start subscribed, as with email signup (the page says so).
        ...(existingCustomer ? {} : marketingConsent(true, 'signup')),
      },
      identity
    )
  }

  private async ensureActive(account: CustomerAccount): Promise<void> {
    const customer = await this.customerAccountRepository.loadCustomer(account)
    if (!customer.isActive) throw SocialAuthException.disabled()
  }

  /**
   * Social-only accounts still need a password hash. Nobody knows this
   * one; the customer can set a real password through "Forgot password".
   */
  private async unusablePasswordHash(): Promise<string> {
    return hash.make(randomBytes(32).toString('base64url'))
  }
}
