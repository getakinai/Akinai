import env from '#start/env'
import CustomerNoticeMail from '#mails/customer_notice_mail'

/**
 * Sent to the previous address when a customer changes their email, so a
 * hijacked account can't quietly move its login to another inbox.
 */
export default class CustomerEmailChangedNotification extends CustomerNoticeMail {
  subject = 'Your email address was changed'
  readonly type = 'customer_email_changed'

  protected notice() {
    return {
      title: 'Your email address was changed',
      lines: [
        'The email address you use to sign in was just changed. This address will no longer receive messages about your account.',
        "If this wasn't you, contact us right away.",
      ],
      actionUrl: `${env.get('APP_URL')}/login`,
      actionLabel: 'Sign in',
      footer: 'You are getting this email because it was linked to your account.',
    }
  }
}
