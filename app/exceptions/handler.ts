import app from '@adonisjs/core/services/app'
import { errors as bouncerErrors } from '@adonisjs/bouncer'
import { errors as shieldErrors } from '@adonisjs/shield'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import type { StatusPageRange, StatusPageRenderer } from '@adonisjs/core/types/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces. Only local development and tests opt
   * in, so a staging box with an unexpected NODE_ENV never leaks stacks.
   */
  protected debug = app.inDev || app.inTest

  /**
   * Status pages are used to display a custom HTML pages for certain error
   * codes. You might want to enable them in production only, but feel
   * free to enable them in development as well.
   */
  protected renderStatusPages = app.inProduction

  /**
   * Status pages is a collection of error code range and a callback
   * to return the HTML contents to send as a response.
   */
  protected statusPages: Record<StatusPageRange, StatusPageRenderer> = {
    '404': (_, { inertia }) => inertia.render('errors/not_found', {}),
    '500..599': (_, { inertia }) => inertia.render('errors/server_error', {}),
  }

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    /**
     * Shield redirects back on CSRF failures, which `fetch` would follow
     * and parse as HTML. JSON clients get a 403 the `http()` helper can read.
     */
    if (
      error instanceof shieldErrors.E_BAD_CSRF_TOKEN &&
      ctx.request.accepts(['html', 'json']) === 'json'
    ) {
      return ctx.response.status(error.status).send({
        errors: [{ message: 'Your session has expired. Please refresh the page and try again.' }],
      })
    }

    if (
      error instanceof bouncerErrors.E_AUTHORIZATION_FAILURE &&
      (error.response.status ?? 403) === 403
    ) {
      await this.recordAccessDenied(ctx)
    }

    if (
      error instanceof bouncerErrors.E_AUTHORIZATION_FAILURE &&
      ctx.request.method() === 'GET' &&
      ctx.request.accepts(['html', 'json']) === 'html'
    ) {
      const page = await ctx.inertia.render('errors/forbidden', {})
      return ctx.response.status(error.response.status ?? 403).send(page)
    }

    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the a third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }

  /**
   * Audits a staff User being refused by a permission check. Business-rule
   * denials (422, e.g. a locked role) are not access attempts and are
   * skipped. Never lets a logging failure change the response.
   */
  protected async recordAccessDenied(ctx: HttpContext) {
    const user = ctx.auth?.use('web').user
    if (!user) return
    try {
      const { default: AuditLogService } = await import('#services/audit_log_service')
      const auditLogService = await app.container.make(AuditLogService)
      await auditLogService.recordSecurityEvent('access_denied', user, {
        ipAddress: ctx.request.ip(),
        details: {
          method: ctx.request.method(),
          route: ctx.route?.name ?? ctx.request.url(),
        },
      })
    } catch (error) {
      ctx.logger.error({ err: error }, 'Could not record access_denied audit event')
    }
  }
}
