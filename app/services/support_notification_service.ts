import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import mail from '@adonisjs/mail/services/main'
import type { EmailType } from '#constants/email_logs'
import StaffSupportTicketCreatedMail from '#mails/staff_support_ticket_created_mail'
import StaffSupportTicketRepliedMail from '#mails/staff_support_ticket_replied_mail'
import SupportTicketReceivedMail from '#mails/support_ticket_received_mail'
import SupportTicketRepliedMail from '#mails/support_ticket_replied_mail'
import type SupportTicket from '#models/support_ticket'
import AdminEventService from '#services/admin_event_service'
import StoreSettingService from '#services/store_setting_service'
import { absoluteUrl } from '#utils/app_url'

const CUSTOMER_FOOTER =
  'You’re getting this email because you contacted us from our website. Keep this link to yourself: anyone who has it can read and reply to this conversation.'

const STAFF_FOOTER =
  'You get this email because your address is listed under Settings → Store details → Notifications.'

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? ''
}

function greeting(ticket: SupportTicket) {
  const first = firstName(ticket.fullName)
  return first ? `Hi ${first}, ` : 'Hi, '
}

function staffTicketUrl(ticket: SupportTicket) {
  return absoluteUrl(`/admin/support/tickets/show/${ticket.id}`)
}

/**
 * Emails and live staff alerts about support tickets. Runs after the
 * change has committed; a failure is logged and never undoes the message.
 */
@inject()
export default class SupportNotificationService {
  constructor(
    protected storeSettingService: StoreSettingService,
    protected adminEventService: AdminEventService
  ) {}

  async ticketOpened(ticket: SupportTicket, concern: string, threadUrl: string) {
    await this.safely(ticket, 'support_ticket_received', () =>
      mail.sendLater(
        new SupportTicketReceivedMail({
          to: ticket.email,
          subject: `We got your message (${ticket.reference})`,
          customerId: ticket.customerId,
          redact: true,
          notice: {
            title: 'We got your message',
            lines: [
              `${greeting(ticket)}thanks for getting in touch. Your reference is ${ticket.reference}.`,
              'Our team will reply by email, usually within one business day. You can also follow the conversation and reply from the link below.',
              'Your message:',
              concern,
            ],
            actionUrl: threadUrl,
            actionLabel: 'View your conversation',
            footer: CUSTOMER_FOOTER,
          },
        })
      )
    )

    await this.safely(ticket, 'staff_support_ticket_created', async () => {
      const recipients = await this.storeSettingService.staffRecipients()
      if (recipients.length === 0) return
      await mail.sendLater(
        new StaffSupportTicketCreatedMail({
          to: recipients,
          subject: `New support request ${ticket.reference} from ${ticket.fullName}`,
          customerId: ticket.customerId,
          redact: false,
          notice: {
            title: `New support request ${ticket.reference}`,
            lines: [
              `${ticket.fullName} (${ticket.email}, ${ticket.mobile}) wrote:`,
              concern,
              'The help chat couldn’t answer this from the help guides.',
            ],
            actionUrl: staffTicketUrl(ticket),
            actionLabel: 'Open in the inbox',
            footer: STAFF_FOOTER,
          },
        })
      )
    })

    await this.safely(ticket, 'other', () =>
      this.adminEventService.recordSupportEvent(ticket, 'support.ticket_created')
    )
  }

  async customerReplied(ticket: SupportTicket, body: string) {
    await this.safely(ticket, 'staff_support_ticket_replied', async () => {
      const recipients = await this.storeSettingService.staffRecipients()
      if (recipients.length === 0) return
      await mail.sendLater(
        new StaffSupportTicketRepliedMail({
          to: recipients,
          subject: `New reply on ${ticket.reference} from ${ticket.fullName}`,
          customerId: ticket.customerId,
          redact: false,
          notice: {
            title: `New reply on ${ticket.reference}`,
            lines: [`${ticket.fullName} replied:`, body],
            actionUrl: staffTicketUrl(ticket),
            actionLabel: 'Open in the inbox',
            footer: STAFF_FOOTER,
          },
        })
      )
    })

    await this.safely(ticket, 'other', () =>
      this.adminEventService.recordSupportEvent(ticket, 'support.ticket_replied')
    )
  }

  async staffReplied(ticket: SupportTicket, body: string, threadUrl: string) {
    await this.safely(ticket, 'support_ticket_replied', () =>
      mail.sendLater(
        new SupportTicketRepliedMail({
          to: ticket.email,
          subject: `Re: your message (${ticket.reference})`,
          customerId: ticket.customerId,
          redact: true,
          notice: {
            title: `New reply to ${ticket.reference}`,
            lines: [
              `${greeting(ticket)}we replied to your message:`,
              body,
              'To reply, open the conversation from the link below.',
            ],
            actionUrl: threadUrl,
            actionLabel: 'View and reply',
            footer: CUSTOMER_FOOTER,
          },
        })
      )
    )
  }

  protected async safely(
    ticket: SupportTicket,
    notification: EmailType,
    run: () => Promise<unknown>
  ) {
    try {
      await run()
    } catch (error) {
      logger.warn(
        { err: error, event: 'support_notification_failed', ticketId: ticket.id, notification },
        'Could not send a support notification'
      )
    }
  }
}
