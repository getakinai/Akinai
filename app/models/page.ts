import { DateTime } from 'luxon'
import { column } from '@adonisjs/lucid/orm'
import BaseAppModel from '#models/base/base_app_model'

export const PAGE_STATUSES = ['draft', 'active', 'archived'] as const

export type PageStatus = (typeof PAGE_STATUSES)[number]

/** Storefront order of the policy links. */
export const POLICY_TYPES = ['refund', 'shipping', 'privacy', 'terms'] as const

export type PolicyType = (typeof POLICY_TYPES)[number]

/**
 * A storefront content page at `/pages/:slug`. A page can hold one of the
 * store policy slots (`policyType`); each slot is held by at most one page.
 */
export default class Page extends BaseAppModel {
  @column()
  declare title: string

  @column()
  declare slug: string

  @column()
  declare body: string | null

  @column()
  declare seoTitle: string | null

  @column()
  declare seoDescription: string | null

  @column()
  declare status: PageStatus

  @column()
  declare policyType: PolicyType | null

  @column.dateTime()
  declare archivedAt: DateTime | null

  get isArchived() {
    return this.status === 'archived'
  }
}
