import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/shield'
import { imageUrl } from '#utils/image_url'
import { isRecaptchaEnabled } from '#utils/verify_recaptcha'

/**
 * Vite runs in middleware mode during development: assets are served from
 * the app origin, but the HMR WebSocket listens on its own port.
 */
const viteHmrPort = process.env.VITE_HMR_PORT || '24678'
const devConnectSrc = app.inProduction
  ? []
  : [`ws://localhost:${viteHmrPort}`, `ws://127.0.0.1:${viteHmrPort}`]

/**
 * Product photos are served from the CDN or S3 when Drive is not local.
 */
const uploadOrigin = new URL(imageUrl('_'), 'http://localhost').origin
const uploadImgSrc = imageUrl('_').startsWith('http') ? [uploadOrigin] : []

/**
 * Google reCAPTCHA v3 loads its script from google.com/gstatic.com and
 * runs inside a hidden iframe on public forms (login, signup, checkout).
 */
const recaptcha = isRecaptchaEnabled()
const recaptchaScriptSrc = recaptcha
  ? ['https://www.google.com/recaptcha/', 'https://www.gstatic.com/recaptcha/']
  : []
const recaptchaFrameSrc = recaptcha
  ? ['https://www.google.com/recaptcha/', 'https://recaptcha.google.com/recaptcha/']
  : []
const recaptchaConnectSrc = recaptcha ? ['https://www.google.com/recaptcha/'] : []

const shieldConfig = defineConfig({
  /**
   * Configure CSP policies for your app. Refer documentation
   * to learn more.
   */
  csp: {
    /**
     * Enable the Content-Security-Policy header.
     */
    enabled: true,

    /**
     * Per-resource CSP directives. The per-request nonce is exposed through
     * `<meta property="csp-nonce">` in `inertia_layout.edge`, which Vite (dev
     * CSS injection) and Inertia (progress bar styles) read for their
     * runtime-injected tags.
     */
    directives: {
      defaultSrc: [`'self'`, '@viteUrl'],
      scriptSrc: [`'self'`, '@nonce', '@viteUrl', ...recaptchaScriptSrc],
      scriptSrcAttr: [`'none'`],
      styleSrc: [`'self'`, '@nonce', '@viteUrl'],
      /**
       * React `style={}` props and toast libraries (Sonner) set properties on
       * `element.style`. Nonced `<style>` tags stay on styleSrc above.
       */
      styleSrcAttr: [`'unsafe-inline'`],
      fontSrc: [`'self'`, 'data:', '@viteUrl'],
      imgSrc: [`'self'`, 'data:', 'blob:', '@viteUrl', ...uploadImgSrc],
      connectSrc: [`'self'`, ...devConnectSrc, ...recaptchaConnectSrc],
      ...(recaptcha ? { frameSrc: recaptchaFrameSrc } : {}),
      objectSrc: [`'none'`],
      baseUri: [`'self'`],
      formAction: [`'self'`],
      frameAncestors: [`'none'`],
      ...(app.inProduction ? { upgradeInsecureRequests: [] } : {}),
    },

    /**
     * Report violations without blocking resources.
     */
    reportOnly: false,
  },

  /**
   * Configure CSRF protection options. Refer documentation
   * to learn more.
   */
  csrf: {
    /**
     * Enable CSRF token verification for state-changing requests.
     */
    enabled: true,

    /**
     * Route patterns to exclude from CSRF checks.
     * Useful for external webhooks or API endpoints.
     */
    exceptRoutes: ['/stripe/webhook', '/poli/nudge'],

    /**
     * Expose an encrypted XSRF-TOKEN cookie for frontend HTTP clients.
     * Required by `inertia/lib/http.ts`, which sends it as `X-XSRF-TOKEN`.
     */
    enableXsrfCookie: true,

    /**
     * HTTP methods protected by CSRF validation.
     */
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],

    /**
     * The XSRF-TOKEN cookie must stay readable by JavaScript (Shield forces
     * `httpOnly: false`), so lock it to same-site HTTPS requests instead.
     */
    cookieOptions: {
      path: '/',
      sameSite: 'strict',
      secure: app.inProduction,
    },
  },

  /**
   * Control how your website should be embedded inside
   * iframes.
   */
  xFrame: {
    /**
     * Enable the X-Frame-Options header.
     */
    enabled: true,

    /**
     * Block all framing attempts. Default value is DENY.
     */
    action: 'DENY',
  },

  /**
   * Force browser to always use HTTPS.
   */
  hsts: {
    /**
     * Enable the Strict-Transport-Security header. Production only, since
     * local development runs over plain HTTP.
     */
    enabled: app.inProduction,

    /**
     * HSTS policy duration remembered by browsers.
     */
    maxAge: '180 days',

    /**
     * Every subdomain must serve HTTPS. Set HSTS_INCLUDE_SUBDOMAINS=false
     * while any of them still needs plain HTTP.
     */
    includeSubDomains: env.get('HSTS_INCLUDE_SUBDOMAINS', true),
  },

  /**
   * Disable browsers from sniffing content types and rely only
   * on the response content-type header.
   */
  contentTypeSniffing: {
    /**
     * Enable X-Content-Type-Options: nosniff.
     */
    enabled: true,
  },
})

export default shieldConfig
