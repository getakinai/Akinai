import { Exception } from '@adonisjs/core/exceptions'

/**
 * A Google/Microsoft sign-in that can't complete. The OAuth callback
 * catches it and flashes the message on the login page.
 */
export default class SocialAuthException extends Exception {
  constructor(message: string) {
    super(message, { status: 400, code: 'E_SOCIAL_AUTH' })
  }

  static unverifiedEmail() {
    return new SocialAuthException(
      'We could not confirm the email on that account. Try another sign-in option.'
    )
  }

  static disabled() {
    return new SocialAuthException('This account has been disabled')
  }

  static noAccount() {
    return new SocialAuthException(
      'No account uses that email yet. Create an account first, then sign in.'
    )
  }

  static failed() {
    return new SocialAuthException('Sign-in was cancelled or failed. Please try again.')
  }
}
