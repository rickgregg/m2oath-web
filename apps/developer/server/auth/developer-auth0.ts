import {
  ControlPlaneHttpError,
  HttpControlPlaneClient
} from '@m2oath/control-plane-client'
import type { H3Event } from 'h3'

interface DeveloperAuth0User {
  sub: string
  email?: string
  name?: string
}

interface DeveloperAuth0Tokens {
  access_token?: string
}

interface DeveloperAuth0Result {
  user: DeveloperAuth0User
  tokens: DeveloperAuth0Tokens
}

export const developerAuth0Config = {
  emailRequired: true,

  audience:
    'https://control-plane.m2oath.com',

  scope: [
    'openid',
    'profile',
    'email',
    'agent:create'
  ]
}

export async function handleDeveloperAuth0Success(
  event: H3Event,
  {
    user,
    tokens
  }: DeveloperAuth0Result
) {
  if (!tokens.access_token) {
    throw createError({
      statusCode: 502,
      statusMessage:
        'Auth0 did not return an access token'
    })
  }

  const config
    = useRuntimeConfig(event)

  const client
    = new HttpControlPlaneClient({
      baseUrl:
        config.controlPlaneBaseUrl,

      bearerToken:
        tokens.access_token
    })

  const { developer }
    = await client.bootstrapDeveloperSession({
      displayName:
        user.name
    })

  if (developer.status !== 'active') {
    throw createError({
      statusCode: 403,
      statusMessage:
        'Developer account is disabled'
    })
  }

  await setUserSession(event, {
    user: {
      developerId:
        developer.developerId,

      role:
        developer.role,

      subject:
        user.sub,

      email:
        user.email,

      name:
        user.name
    },

    secure: {
      controlPlaneAccessToken:
        tokens.access_token
    }
  })

  return sendRedirect(
    event,
    '/dashboard'
  )
}

export function handleDeveloperAuth0Error(
  event: H3Event,
  error: unknown
) {
  console.error(
    'Developer Auth0 login failed',
    error
  )

  return sendRedirect(
    event,
    '/?auth=failed'
  )
}

export async function handleDeveloperAuth0LinkSuccess(
  event: H3Event,
  {
    tokens
  }: DeveloperAuth0Result
) {
  const session
    = await requireUserSession(event)

  if (
    !session.user?.subject
    || !session.user?.developerId
  ) {
    throw createError({
      statusCode: 401,
      statusMessage:
        'Developer authentication is required'
    })
  }

  const controlPlaneAccessToken
    = session.secure
      ?.controlPlaneAccessToken
      ?.trim()

  if (!controlPlaneAccessToken) {
    throw createError({
      statusCode: 401,
      statusMessage:
        'Developer control-plane credential is unavailable'
    })
  }

  const externalIdentityCredential
    = tokens.access_token?.trim()

  if (!externalIdentityCredential) {
    throw createError({
      statusCode: 502,
      statusMessage:
        'Auth0 did not return an access token for the identity being linked'
    })
  }

  const config
    = useRuntimeConfig(event)

  const client
    = new HttpControlPlaneClient({
      baseUrl:
        config.controlPlaneBaseUrl,

      bearerToken:
        controlPlaneAccessToken
    })

  let developer

  try {
    const response
      = await client.linkDeveloperExternalIdentity({
        credential:
          externalIdentityCredential
      })

    developer = response.developer
  } catch (error) {
    if (
      error instanceof ControlPlaneHttpError
      && error.status === 409
    ) {
      return sendRedirect(
        event,
        '/dashboard?identity=link-failed'
      )
    }

    throw error
  }

  if (
    developer.developerId
    !== session.user.developerId
  ) {
    throw createError({
      statusCode: 409,
      statusMessage:
        'Linked identity resolved to a different Developer account'
    })
  }

  return sendRedirect(
    event,
    '/dashboard?identity=linked'
  )
}

export function handleDeveloperAuth0LinkError(
  event: H3Event,
  error: unknown
) {
  console.error(
    'Developer Auth0 identity linking failed',
    error
  )

  return sendRedirect(
    event,
    '/dashboard?identity=link-failed'
  )
}
