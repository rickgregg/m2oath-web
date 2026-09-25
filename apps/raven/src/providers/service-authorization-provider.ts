export interface ServiceAuthorizationProvider {
  getAuthorizationHeader():
    string | Promise<string>
}

export interface StaticServiceAuthorizationProviderOptions {
  authorizationHeader: string
}

export class StaticServiceAuthorizationProvider
implements ServiceAuthorizationProvider {
  private readonly authorizationHeader:
    string

  constructor(
    options:
      StaticServiceAuthorizationProviderOptions
  ) {
    this.authorizationHeader =
      requireAuthorizationHeader(
        options.authorizationHeader
      )
  }

  getAuthorizationHeader(): string {
    return this.authorizationHeader
  }
}


export interface OAuthClientCredentialsServiceAuthorizationProviderOptions {
  tokenEndpoint: string
  clientId: string
  clientSecret: string
  audience: string
  refreshSafetyWindowSeconds?: number
  fetch?: typeof globalThis.fetch
  now?: () => number
}

interface OAuthClientCredentialsTokenResponse {
  access_token?: unknown
  token_type?: unknown
  expires_in?: unknown
}

export class OAuthClientCredentialsServiceAuthorizationProvider
implements ServiceAuthorizationProvider {
  private readonly tokenEndpoint: string
  private readonly clientId: string
  private readonly clientSecret: string
  private readonly audience: string
  private readonly refreshSafetyWindowSeconds: number
  private readonly fetchImplementation:
    typeof globalThis.fetch
  private readonly now: () => number

  private cachedAuthorizationHeader:
    string | undefined

  private cachedExpiresAt:
    number | undefined

  private tokenRequest:
    Promise<string> | undefined

  constructor(
    options:
      OAuthClientCredentialsServiceAuthorizationProviderOptions
  ) {
    this.tokenEndpoint =
      requireNonEmptyValue(
        options.tokenEndpoint,
        'OAuth token endpoint is required.'
      )

    this.clientId =
      requireNonEmptyValue(
        options.clientId,
        'OAuth client ID is required.'
      )

    this.clientSecret =
      requireNonEmptyValue(
        options.clientSecret,
        'OAuth client secret is required.'
      )

    this.audience =
      requireNonEmptyValue(
        options.audience,
        'OAuth audience is required.'
      )

    this.refreshSafetyWindowSeconds =
      options.refreshSafetyWindowSeconds ?? 60

    if (
      !Number.isFinite(
        this.refreshSafetyWindowSeconds
      ) ||
      this.refreshSafetyWindowSeconds < 0
    ) {
      throw new Error(
        'OAuth refresh safety window must be non-negative.'
      )
    }

    this.fetchImplementation =
      options.fetch ?? globalThis.fetch

    this.now =
      options.now ?? Date.now
  }

  async getAuthorizationHeader():
    Promise<string> {
    if (
      this.cachedAuthorizationHeader &&
      this.cachedExpiresAt !== undefined &&
      this.cachedExpiresAt >
        this.now() +
          this.refreshSafetyWindowSeconds * 1000
    ) {
      return this.cachedAuthorizationHeader
    }

    if (!this.tokenRequest) {
      this.tokenRequest =
        this.requestAuthorizationHeader()
          .finally(() => {
            this.tokenRequest =
              undefined
          })
    }

    return this.tokenRequest
  }

  private async requestAuthorizationHeader():
    Promise<string> {
    const response =
      await this.fetchImplementation(
        this.tokenEndpoint,
        {
          method: 'POST',
          headers: {
            'content-type':
              'application/json'
          },
          body:
            JSON.stringify({
              grant_type:
                'client_credentials',
              client_id:
                this.clientId,
              client_secret:
                this.clientSecret,
              audience:
                this.audience
            })
        }
      )

    if (!response.ok) {
      throw new Error(
        `OAuth client-credentials token request failed with HTTP ${response.status}.`
      )
    }

    const body =
      await response.json() as
        OAuthClientCredentialsTokenResponse

    const accessToken =
      typeof body.access_token === 'string'
        ? body.access_token.trim()
        : ''

    if (!accessToken) {
      throw new Error(
        'OAuth token response did not contain an access token.'
      )
    }

    const tokenType =
      typeof body.token_type === 'string'
        ? body.token_type.trim()
        : ''

    if (
      tokenType &&
      tokenType.toLowerCase() !== 'bearer'
    ) {
      throw new Error(
        `Unsupported OAuth token type: ${tokenType}.`
      )
    }

    const expiresIn =
      body.expires_in

    if (
      typeof expiresIn !== 'number' ||
      !Number.isFinite(expiresIn) ||
      expiresIn <= 0
    ) {
      throw new Error(
        'OAuth token response did not contain a valid expires_in value.'
      )
    }

    this.cachedAuthorizationHeader =
      `Bearer ${accessToken}`

    this.cachedExpiresAt =
      this.now() + expiresIn * 1000

    return this.cachedAuthorizationHeader
  }
}

function requireNonEmptyValue(
  value: string,
  message: string
): string {
  const normalized =
    value.trim()

  if (!normalized) {
    throw new Error(message)
  }

  return normalized
}

function requireAuthorizationHeader(
  value: string
): string {
  const authorizationHeader =
    value.trim()

  if (!authorizationHeader) {
    throw new Error(
      'Service authorization header is required.'
    )
  }

  return authorizationHeader
}
