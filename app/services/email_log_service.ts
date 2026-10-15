import { inject } from '@adonisjs/core'
import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon'
import type { EmailLogStatus } from '#models/email_log'
import EmailLogRepository, { type EmailLogSortKey } from '#repositories/email_log_repository'
import AuditLogService from '#services/audit_log_service'
import ResentEmailMail from '#mails/resent_email_mail'
import BusinessRuleException from '#exceptions/business_rule_exception'
import { EMAIL_LOG_RETENTION_DAYS } from '#constants/email_logs'

export type EmailLogListFilters = {
  q?: string
  status?: EmailLogStatus
  type?: string
  orderId?: string
  customerId?: string
  sort?: EmailLogSortKey
  direction?: 'asc' | 'desc'
  page?: number
  perPage?: number
}

@inject()
export default class EmailLogService {
  constructor(
    protected emailLogRepository: EmailLogRepository,
    protected auditLogService: AuditLogService
  ) {}

  async paginate({ sort, direction, page, perPage, ...filters }: EmailLogListFilters) {
    return this.emailLogRepository.paginate({
      ...filters,
      sort: sort ?? 'createdAt',
      direction: direction ?? 'desc',
      page: page ?? 1,
      perPage: perPage ?? 25,
    })
  }

  async find(id: string) {
    return this.emailLogRepository.findOrFail(id)
  }

  /**
   * Sends a stored email again to its original recipients. The copy is
   * logged as a new row pointing at the original.
   */
  async resend(id: string, userId: string) {
    const original = await this.emailLogRepository.findOrFail(id)
    if (original.redacted) {
      throw new BusinessRuleException("This email contains a one-time code and can't be resent")
    }
    if (!original.html && !original.text) {
      throw new BusinessRuleException('This email has no stored content to resend')
    }
    if (original.toAddresses.length === 0) {
      throw new BusinessRuleException('This email has no recipients')
    }

    await mail.sendLater(new ResentEmailMail(original, userId))
    await this.auditLogService.recordStaffEvent(
      { type: 'EmailLog', id: original.id, label: original.subject },
      'resent',
      { type: original.type, recipients: original.toAddresses.length }
    )
  }

  /** Deletes logs past the retention period. Returns the number removed. */
  async prune() {
    return this.emailLogRepository.deleteOlderThan(
      DateTime.now().minus({ days: EMAIL_LOG_RETENTION_DAYS })
    )
  }
}
