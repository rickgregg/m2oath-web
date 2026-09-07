import {
  HttpControlPlaneClient
} from '@m2oath/control-plane-client'

interface RegisterAgentBody {
  displayName?: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const body = await readBody<RegisterAgentBody>(event)

  const displayName = body.displayName?.trim()

  const client = new HttpControlPlaneClient({
    baseUrl: config.controlPlaneBaseUrl
  })

  try {
    return await client.registerAgent({
      ...(displayName ? { displayName } : {})
    })
  } catch (error) {
    console.error('Agent registration failed', error)

    throw createError({
      statusCode: 502,
      statusMessage: 'Control plane registration failed'
    })
  }
})
