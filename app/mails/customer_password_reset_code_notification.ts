import CustomerNoticeMail from '#mails/customer_notice_mail'
import { VERIFICATION_CODE_TTL_MINUTES } from '#constants/customer_verification'

export default class CustomerPasswordResetCodeNotification extends CustomerNoticeMail {
  subject = 'Your password reset code'
  readonly type = 'customer_password_reset_code'
  protected readonly redact = true

  constructor(
    to: string,
    readonly code: string
  ) {
    super(to)
  }

  protected notice() {
    return {
      title: 'Reset your password',
      lines: [
        'Enter this code to choose a new password.',
        `It expires in ${VERIFICATION_CODE_TTL_MINUTES} minutes.`,
      ],
      code: this.code,
      footer:
        "If you didn't ask to reset your password, you can ignore this email. Your password is unchanged.",
    }
  }
}
