import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const smtpUser = env.get('SMTP_USERNAME')
const smtpPassword = env.get('SMTP_PASSWORD')?.release()

const mailConfig = defineConfig({
  default: env.get('MAIL_MAILER'),

  from: {
    address: env.get('MAIL_FROM_ADDRESS'),
    name: env.get('MAIL_FROM_NAME'),
  },

  /**
   * Shared with every mail template.
   */
  globals: {
    brandName: env.get('APP_NAME') ?? 'Storefront',
    appUrl: env.get('APP_URL'),
  },

  mailers: {
    smtp: transports.smtp({
      host: env.get('SMTP_HOST'),
      port: env.get('SMTP_PORT'),
      secure: env.get('SMTP_SECURE') ?? false,
      ...(smtpUser && smtpPassword
        ? { auth: { type: 'login' as const, user: smtpUser, pass: smtpPassword } }
        : {}),
    }),
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}
