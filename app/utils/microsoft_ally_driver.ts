import type { HttpContext } from '@adonisjs/core/http'
import { Oauth2Driver } from '@adonisjs/ally'
import type {
  AllyDriverContract,
  ApiRequestContract,
  LiteralStringUnion,
  Oauth2DriverConfig,
  RedirectRequestContract,
} from '@adonisjs/ally/types'

export type MicrosoftScopes = 'openid' | 'email' | 'profile' | 'offline_access' | 'User.Read'

export type MicrosoftToken = {
  token: string
  type: 'bearer'
  idToken?: string
  expiresIn?: number
}

export type MicrosoftDriverConfig = Oauth2DriverConfig & {
  /**
   * `consumers` only accepts personal Microsoft accounts (outlook.com,
   * hotmail.com, live.com). Work/school tenants let admins set any email
   * on a user, so their email claim can't be trusted for account linking.
   */
  tenant?: 'consumers'
  scopes?: LiteralStringUnion<MicrosoftScopes>[]
}

type GraphMe = {
  id: string
  displayName?: string | null
  mail?: string | null
  userPrincipalName?: string | null
}

/**
 * Microsoft identity platform (v2) OAuth2 driver. Ally has no built-in
 * Microsoft driver.
 */
export class MicrosoftDriver
  extends Oauth2Driver<MicrosoftToken, MicrosoftScopes>
  implements AllyDriverContract<MicrosoftToken, MicrosoftScopes>
{
  protected authorizeUrl: string
  protected accessTokenUrl: string
  protected userInfoUrl = 'https://graph.microsoft.com/v1.0/me'
  protected codeParamName = 'code'
  protected errorParamName = 'error'
  protected stateCookieName = 'microsoft_oauth_state'
  protected stateParamName = 'state'
  protected scopeParamName = 'scope'
  protected scopesSeparator = ' '

  constructor(
    ctx: HttpContext,
    public config: MicrosoftDriverConfig
  ) {
    super(ctx, config)
    const tenant = config.tenant ?? 'consumers'
    this.authorizeUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`
    this.accessTokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`
    this.loadState()
  }

  protected configureRedirectRequest(request: RedirectRequestContract<MicrosoftScopes>) {
    request.scopes(this.config.scopes ?? ['openid', 'email', 'profile', 'User.Read'])
    request.param('response_type', 'code')
    request.param('response_mode', 'query')
    request.param('prompt', 'select_account')
  }

  accessDenied() {
    const error = this.getError()
    return error === 'access_denied' || error === 'consent_required'
  }

  async accessToken(callback?: (request: ApiRequestContract) => void): Promise<MicrosoftToken> {
    const token = await super.accessToken(callback)
    return { ...token, type: 'bearer', idToken: (token as { id_token?: string }).id_token }
  }

  protected async getUserInfo(token: string, callback?: (request: ApiRequestContract) => void) {
    const request = this.httpClient(this.userInfoUrl)
    request.header('Authorization', `Bearer ${token}`)
    request.header('Accept', 'application/json')
    request.parseAs('json')
    if (typeof callback === 'function') callback(request)

    const body = (await request.get()) as GraphMe
    const email = body.mail ?? body.userPrincipalName ?? null

    return {
      id: body.id,
      nickName: body.displayName ?? '',
      name: body.displayName ?? '',
      email,
      avatarUrl: null,
      emailVerificationState: email ? ('verified' as const) : ('unsupported' as const),
      original: body,
    }
  }

  async user(callback?: (request: ApiRequestContract) => void) {
    const token = await this.accessToken(callback)
    const user = await this.getUserInfo(token.token, callback)
    return { ...user, token }
  }

  async userFromToken(token: string, callback?: (request: ApiRequestContract) => void) {
    const user = await this.getUserInfo(token, callback)
    return { ...user, token: { token, type: 'bearer' as const } }
  }
}

export function microsoftService(config: MicrosoftDriverConfig) {
  return (ctx: HttpContext) => new MicrosoftDriver(ctx, config)
}
