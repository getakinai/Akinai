import CustomerNoticeMail from '#mails/customer_notice_mail'
import { VERIFICATION_CODE_TTL_MINUTES } from '#constants/customer_verification'

export default class CustomerSignupCodeNotification extends CustomerNoticeMail {
  subject = 'Your sign-up code'
  readonly type = 'customer_signup_code'
  protected readonly redact = true

  constructor(
    to: string,
    readonly code: string
  ) {
    super(to)
  }

  protected notice() {
    return {
      title: 'Confirm your email',
      lines: [
        'Enter this code to finish creating your account.',
        `It expires in ${VERIFICATION_CODE_TTL_MINUTES} minutes.`,
      ],
      code: this.code,
      footer: "If you didn't try to sign up, you can ignore this email. No account was created.",
    }
  }
}
