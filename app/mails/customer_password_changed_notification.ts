import env from '#start/env'
import CustomerNoticeMail from '#mails/customer_notice_mail'

export default class CustomerPasswordChangedNotification extends CustomerNoticeMail {
  subject = 'Your password was changed'
  readonly type = 'customer_password_changed'

  protected notice() {
    return {
      title: 'Your password was changed',
      lines: [
        'The password for your account was just changed, and you were signed out on every other device.',
        "If this wasn't you, reset your password right away.",
      ],
      actionUrl: `${env.get('APP_URL')}/forgot-password`,
      actionLabel: 'Reset password',
      footer: 'You are getting this email because it is linked to your account.',
    }
  }
}
