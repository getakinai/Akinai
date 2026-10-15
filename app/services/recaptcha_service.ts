import {
  isRecaptchaEnabled,
  verifyRecaptchaV3,
  type RecaptchaAction,
} from '#utils/verify_recaptcha'

/**
 * Bot check for public forms. Swap it in tests with
 * `app.container.swap(RecaptchaService, ...)`.
 */
export default class RecaptchaService {
  isEnabled(): boolean {
    return isRecaptchaEnabled()
  }

  verify(token: string, action: RecaptchaAction, remoteIp?: string): Promise<boolean> {
    return verifyRecaptchaV3(token, { action, remoteIp })
  }
}
