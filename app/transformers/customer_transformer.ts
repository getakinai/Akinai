import { countryName } from '#constants/countries'
import type Customer from '#models/customer'
import CustomerAddressTransformer from '#transformers/customer_address_transformer'
import { BaseTransformer } from '@adonisjs/core/transformers'

function isoOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const date = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/**
 * `toObject` is the admin list row and reads the `account` and `tags`
 * preloads plus the `addresses_count`, `orders_count` and `last_order_at`
 * extras from CustomerRepository.paginate. `toDetail` expects `account`,
 * `tags` and `addresses` preloaded. `toProfile` is the storefront
 * `/account/me` shape and never includes staff-only fields.
 */
export default class CustomerTransformer extends BaseTransformer<Customer> {
  protected base() {
    return this.pick(this.resource, [
      'id',
      'fullName',
      'email',
      'phone',
      'acceptsMarketing',
      'createdAt',
      'updatedAt',
    ])
  }

  protected location() {
    const { countryCode, timezone } = this.resource
    return {
      countryCode,
      countryName: countryCode ? countryName(countryCode) : null,
      timezone,
    }
  }

  protected accountState() {
    return this.resource.account ? ('enabled' as const) : ('none' as const)
  }

  protected tagNames(): string[] {
    return (this.resource.tags ?? []).map((tag) => tag.name)
  }

  toObject() {
    const { addresses_count: addressesCount, orders_count: ordersCount } = this.resource.$extras

    return {
      ...this.base(),
      countryCode: this.resource.countryCode,
      isActive: this.resource.isActive,
      accountState: this.accountState(),
      tags: this.tagNames(),
      addressesCount: addressesCount === undefined ? null : Number(addressesCount),
      ordersCount: ordersCount === undefined || ordersCount === null ? 0 : Number(ordersCount),
      lastOrderAt: isoOrNull(this.resource.$extras.last_order_at),
    }
  }

  toDetail() {
    const { account } = this.resource

    return {
      ...this.base(),
      ...this.location(),
      isActive: this.resource.isActive,
      accountState: this.accountState(),
      marketingConsentAt: this.resource.marketingConsentAt?.toISO() ?? null,
      marketingConsentSource: this.resource.marketingConsentSource,
      note: this.resource.note,
      tags: this.tagNames(),
      account: account
        ? {
            email: account.email,
            lastLoginAt: account.lastLoginAt?.toISO() ?? null,
            createdAt: account.createdAt.toISO(),
          }
        : null,
      addresses: CustomerAddressTransformer.transform(this.resource.addresses),
    }
  }

  toProfile() {
    return { ...this.base(), ...this.location() }
  }
}
