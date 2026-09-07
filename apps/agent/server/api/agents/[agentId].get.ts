import {
  ControlPlaneHttpError,
  HttpControlPlaneClient
} from '@m2oath/control-plane-client'

export default defineEventHandler(async (event) => {
  const agentId = getRouterParam(event, 'agentId')

  if (!agentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Agent ID is required'
    })
  }

  const config = useRuntimeConfig(event)

  const client = new HttpControlPlaneClient({
    baseUrl: config.controlPlaneBaseUrl
  })

  try {
    return await client.getAgent(agentId)
  } catch (error) {
    if (
      error instanceof ControlPlaneHttpError
      && error.status === 404
    ) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Agent not found'
      })
    }

    console.error('Agent retrieval failed', error)

    throw createError({
      statusCode: 502,
      statusMessage: 'Control plane agent retrieval failed'
    })
  }
})
