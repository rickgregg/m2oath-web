import type { H3Event } from 'h3'

const EXPIRATION_SAFETY_WINDOW_MS
  = 60_000

interface Auth0RefreshResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
}

function authenticationRequired() {
  return createError({
    statusCode: 401,
    statusMessage:
      'Developer authentication is required'
  })
}

export async function getValidControlPlaneAccessToken(
  event: H3Event
): Promise<string> {
  const session
    = await requireUserSession(event)

  const accessToken
    = session.secure
      ?.controlPlaneAccessToken
      ?.trim()

  if (!accessToken) {
    throw authenticationRequired()
  }

  const expiresAt
    = session.secure
      ?.controlPlaneAccessTokenExpiresAt

  if (
    typeof expiresAt !== 'number'
    || expiresAt
      > Date.now()
        + EXPIRATION_SAFETY_WINDOW_MS
  ) {
    return accessToken
  }

  const refreshToken
    = session.secure
      ?.controlPlaneRefreshToken
      ?.trim()

  if (!refreshToken) {
    await clearUserSession(event)

    throw authenticationRequired()
  }

  const config
    = useRuntimeConfig(event)

  const domain
    = config.oauth.auth0.domain
      ?.trim()

  const clientId
    = config.oauth.auth0.clientId
      ?.trim()

  const clientSecret
    = config.oauth.auth0.clientSecret
      ?.trim()

  if (
    !domain
    || !clientId
    || !clientSecret
  ) {
    await clearUserSession(event)

    throw authenticationRequired()
  }

  const tokenEndpoint
    = `https://${domain}/oauth/token`

  let refreshed: Auth0RefreshResponse

  try {
    refreshed
      = await $fetch<Auth0RefreshResponse>(
        tokenEndpoint,
        {
          method: 'POST',

          headers: {
            'content-type':
              'application/json'
          },

          body: {
            grant_type:
              'refresh_token',

            client_id:
              clientId,

            client_secret:
              clientSecret,

            refresh_token:
              refreshToken
          }
        }
      )
  } catch {
    await clearUserSession(event)

    throw authenticationRequired()
  }

  const refreshedAccessToken
    = refreshed.access_token
      ?.trim()

  if (!refreshedAccessToken) {
    await clearUserSession(event)

    throw authenticationRequired()
  }

  const refreshedRefreshToken
    = refreshed.refresh_token
      ?.trim()
      || refreshToken

  const refreshedExpiresAt
    = typeof refreshed.expires_in
        === 'number'
      ? Date.now()
        + refreshed.expires_in * 1000
      : undefined

  await setUserSession(event, {
    secure: {
      controlPlaneAccessToken:
        refreshedAccessToken,

      controlPlaneRefreshToken:
        refreshedRefreshToken,

      controlPlaneAccessTokenExpiresAt:
        refreshedExpiresAt
    }
  })

  return refreshedAccessToken
}
