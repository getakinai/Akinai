import { DateTime } from 'luxon'
import app from '@adonisjs/core/services/app'
import emitter from '@adonisjs/core/services/emitter'
import logger from '@adonisjs/core/services/logger'
import { Message, type Mailer } from '@adonisjs/mail'
import type {
  MailerMessenger,
  MessageBodyTemplates,
  NodeMailerMessage,
  Recipient,
} from '@adonisjs/mail/types'
import type EmailLogRepository from '#repositories/email_log_repository'
import { takeMailMeta } from '#mails/helpers/mail_meta'

type CompiledMail = { message: NodeMailerMessage; views: MessageBodyTemplates }

function addressOf(recipient: Recipient): string {
  return typeof recipient === 'string' ? recipient : recipient.address
}

function addresses(recipients: Recipient | Recipient[] | undefined): string[] {
  if (!recipients) return []
  return (Array.isArray(recipients) ? recipients : [recipients]).map(addressOf)
}

function bodyText(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

/**
 * Replaces the in-memory mail queue. Every `mail.sendLater` email is
 * rendered up front, written to `email_logs`, then sent in the background
 * and marked `sent` or `failed`. The stored body is exactly what was sent,
 * except for redacted emails (one-time codes), which keep no body.
 */
export class LoggingMessenger implements MailerMessenger {
  constructor(
    protected mailer: Mailer<any>,
    protected emailLogs: EmailLogRepository
  ) {}

  async queue(mail: CompiledMail, sendConfig?: unknown) {
    await Message.computeContentsFor({
      message: mail.message,
      views: mail.views,
      sharedState: this.mailer.config.globals ?? {},
    })
    const meta = takeMailMeta(mail.message)
    const logId = await this.#record(mail.message, meta)

    void this.#deliver(mail, sendConfig, logId)
  }

  async #record(message: NodeMailerMessage, meta: ReturnType<typeof takeMailMeta>) {
    const from = message.from ?? this.mailer.config.from
    try {
      const log = await this.emailLogs.create({
        type: meta.type,
        subject: message.subject ?? '',
        fromAddress: from ? addressOf(from) : null,
        toAddresses: addresses(message.to),
        ccAddresses: message.cc ? addresses(message.cc) : null,
        bccAddresses: message.bcc ? addresses(message.bcc) : null,
        html: meta.redact ? null : bodyText(message.html),
        text: meta.redact ? null : bodyText(message.text),
        redacted: meta.redact,
        orderId: meta.orderId,
        customerId: meta.customerId,
        resentFromId: meta.resentFromId,
        resentByUserId: meta.resentByUserId,
      })
      return log.id
    } catch (error) {
      // Delivery matters more than the log entry, so the email still goes out.
      logger.error({ err: error, event: 'email_log_write_failed' }, 'Could not log outgoing email')
      return null
    }
  }

  async #deliver(mail: CompiledMail, sendConfig: unknown, logId: string | null) {
    if (app.inTest) {
      if (logId) {
        await this.emailLogs
          .markSent(logId, DateTime.now(), null)
          .catch((markError: unknown) => this.#logWriteFailed(markError))
      }
      return
    }

    let response: unknown
    try {
      response = await this.mailer.sendCompiled(mail, sendConfig)
    } catch (error) {
      void emitter.emit('queued:mail:error', { error, mailerName: this.mailer.name })
      if (logId) {
        const message = error instanceof Error ? error.message : String(error)
        await this.emailLogs
          .markFailed(logId, message)
          .catch((markError: unknown) => this.#logWriteFailed(markError))
      }
      return
    }

    if (!logId) return
    const messageId = (response as { messageId?: unknown } | undefined)?.messageId
    await this.emailLogs
      .markSent(logId, DateTime.now(), typeof messageId === 'string' ? messageId : null)
      .catch((markError: unknown) => this.#logWriteFailed(markError))
  }

  #logWriteFailed(error: unknown) {
    logger.error({ err: error, event: 'email_log_write_failed' }, 'Could not update email log')
  }
}
