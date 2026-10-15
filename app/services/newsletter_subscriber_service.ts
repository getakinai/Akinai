import { inject } from '@adonisjs/core'
import NewsletterSubscriber from '#models/newsletter_subscriber'
import type { NewsletterSource } from '#constants/newsletter'
import NewsletterSubscriberRepository, {
  type PaginateNewsletterSubscribersData,
} from '#repositories/newsletter_subscriber_repository'
import CustomerRepository from '#repositories/customer_repository'
import AuditLogService from '#services/audit_log_service'
import { bulkResult, type BulkResult } from '#transformers/bulk_result_transformer'

export type ListNewsletterSubscribersFilters = Partial<PaginateNewsletterSubscribersData>

@inject()
export default class NewsletterSubscriberService {
  constructor(
    protected newsletterSubscriberRepository: NewsletterSubscriberRepository,
    protected customerRepository: CustomerRepository,
    protected auditLogService: AuditLogService
  ) {}

  async paginate(filters: ListNewsletterSubscribersFilters = {}) {
    return this.newsletterSubscriberRepository.paginate({
      q: filters.q || undefined,
      status: filters.status,
      source: filters.source,
      sort: filters.sort ?? 'subscribedAt',
      direction: filters.direction ?? 'desc',
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 25,
    })
  }

  /**
   * Adds `email` to the newsletter list and opts in the matching customer
   * profile, if any. Never creates a customer.
   */
  async subscribe(email: string, source: NewsletterSource): Promise<void> {
    const normalized = email.toLowerCase()
    await this.newsletterSubscriberRepository.subscribe(normalized, source)
    await this.customerRepository.optInMarketingByEmail(normalized, 'newsletter')
  }

  async bulkSetSubscribed(ids: string[], subscribed: boolean): Promise<BulkResult> {
    const changed = await this.newsletterSubscriberRepository.setSubscribedMany(ids, subscribed)
    await this.auditLogService.recordBulkUpdate(NewsletterSubscriber, changed, {
      isSubscribed: subscribed,
    })
    return bulkResult(ids, changed)
  }
}
