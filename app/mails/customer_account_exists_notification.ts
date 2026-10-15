import env from '#start/env'
import CustomerNoticeMail from '#mails/customer_notice_mail'

export default class CustomerAccountExistsNotification extends CustomerNoticeMail {
  subject = 'You already have an account'
  readonly type = 'customer_account_exists'

  protected notice() {
    const appUrl = env.get('APP_URL')
    return {
      title: 'You already have an account',
      lines: [
        'Someone tried to sign up with this email, but it already has an account.',
        'If that was you, log in instead. If you forgot your password, you can reset it.',
      ],
      actionUrl: `${appUrl}/forgot-password`,
      actionLabel: 'Reset password',
      footer: "If you didn't try to sign up, you can ignore this email. Your account is unchanged.",
    }
  }
}
