import {
  ControlPlaneHttpError,
  HttpControlPlaneClient
} from '@m2oath/control-plane-client'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  if (!session.user?.subject) {
    throw createError({
      statusCode: 401,
      statusMessage:
        'Developer authentication is required'
    })
  }

  const controlPlaneAccessToken
    = session.secure?.controlPlaneAccessToken?.trim()

  if (!controlPlaneAccessToken) {
    throw createError({
      statusCode: 401,
      statusMessage:
        'Developer control-plane credential is unavailable'
    })
  }

  const config = useRuntimeConfig(event)

  const client
    = new HttpControlPlaneClient({
      baseUrl:
        config.controlPlaneBaseUrl,

      bearerToken:
        controlPlaneAccessToken
    })

  try {
    return await client.listMyAgents()
  } catch (error) {
    if (error instanceof ControlPlaneHttpError) {
      if (error.status === 401) {
        throw createError({
          statusCode: 401,
          statusMessage:
            'Developer authentication failed'
        })
      }

      if (error.status === 403) {
        throw createError({
          statusCode: 403,
          statusMessage:
            'Developer is not authorized to view agents'
        })
      }
    }

    console.error(
      'Agent list lookup failed',
      error
    )

    throw createError({
      statusCode: 502,
      statusMessage:
        'Control plane agent list lookup failed'
    })
  }
})
