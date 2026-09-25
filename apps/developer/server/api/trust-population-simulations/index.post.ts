import {
  ControlPlaneHttpError,
  HttpControlPlaneClient
} from '@m2oath/control-plane-client'

import {
  getValidControlPlaneAccessToken
} from '../../auth/control-plane-credential'

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
    = await getValidControlPlaneAccessToken(
      event
    )

  const config = useRuntimeConfig(event)

  const client =
    new HttpControlPlaneClient({
      baseUrl:
        config.controlPlaneBaseUrl,

      bearerToken:
        controlPlaneAccessToken
    })

  try {
    return await client.runTrustPopulationSimulation()
  } catch (error) {
    if (error instanceof ControlPlaneHttpError) {
      if (error.status === 400) {
        throw createError({
          statusCode: 400,
          statusMessage:
            'Invalid trust population simulation request'
        })
      }

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
            'Developer is not authorized to run trust simulations'
        })
      }

      if (error.status === 502) {
        throw createError({
          statusCode: 502,
          statusMessage:
            'Trust simulation service failed'
        })
      }
    }

    console.error(
      'Trust population simulation failed',
      error
    )

    throw createError({
      statusCode: 502,
      statusMessage:
        'Control plane trust population simulation failed'
    })
  }
})
