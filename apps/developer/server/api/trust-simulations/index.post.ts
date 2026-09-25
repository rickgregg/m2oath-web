import {
  ControlPlaneHttpError,
  HttpControlPlaneClient
} from '@m2oath/control-plane-client'

import type {
  RunTrustPolicyWorkbenchSimulationRequest
} from '@m2oath/control-plane-client'

import {
  getValidControlPlaneAccessToken
} from '../../auth/control-plane-credential'

interface TrustSimulationBody {
  scenarioId?: unknown
  modelConfigurationId?: unknown
}

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

  const body =
    await readBody<TrustSimulationBody>(event)

  if (
    typeof body.scenarioId !== 'string'
    || !body.scenarioId.trim()
  ) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Trust simulation scenario ID is required'
    })
  }

  if (
    typeof body.modelConfigurationId !== 'string'
    || !body.modelConfigurationId.trim()
  ) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Trust simulation model configuration ID is required'
    })
  }

  const config = useRuntimeConfig(event)

  const client =
    new HttpControlPlaneClient({
      baseUrl:
        config.controlPlaneBaseUrl,

      bearerToken:
        controlPlaneAccessToken
    })

  const request = {
    scenarioId:
      body.scenarioId.trim(),
    modelConfigurationId:
      body.modelConfigurationId.trim()
  } as RunTrustPolicyWorkbenchSimulationRequest

  try {
    return await client.runTrustSimulation(
      request
    )
  } catch (error) {
    if (error instanceof ControlPlaneHttpError) {
      if (error.status === 400) {
        throw createError({
          statusCode: 400,
          statusMessage:
            'Invalid trust simulation request'
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
      'Trust simulation failed',
      error
    )

    throw createError({
      statusCode: 502,
      statusMessage:
        'Control plane trust simulation failed'
    })
  }
})
