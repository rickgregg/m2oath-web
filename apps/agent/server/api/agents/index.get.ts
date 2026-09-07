import {
  HttpControlPlaneClient
} from '@m2oath/control-plane-client'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  const client = new HttpControlPlaneClient({
    baseUrl: config.controlPlaneBaseUrl
  })

  try {
    return await client.listAgents()
  } catch (error) {
    console.error('Agent list retrieval failed', error)

    throw createError({
      statusCode: 502,
      statusMessage: 'Control plane agent retrieval failed'
    })
  }
})
