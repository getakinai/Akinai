/*
|--------------------------------------------------------------------------
| Mail messenger
|--------------------------------------------------------------------------
|
| Every queued email (`mail.sendLater`) is written to `email_logs` before it
| is sent, so staff can see it in the back-office email monitor.
|
*/

import mail from '@adonisjs/mail/services/main'
import EmailLogRepository from '#repositories/email_log_repository'
import { LoggingMessenger } from '#mails/helpers/logging_messenger'

const emailLogs = new EmailLogRepository()

mail.setMessenger((mailer) => new LoggingMessenger(mailer, emailLogs))
