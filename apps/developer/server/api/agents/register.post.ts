import {
  ControlPlaneHttpError,
  HttpControlPlaneClient
} from '@m2oath/control-plane-client'

interface RegisterAgentBody {
  displayName?: string

  identifier?: {
    type?: string
    value?: string
    issuer?: string
  }

  cryptographicMaterial?: {
    keyId?: string
    algorithm?: string
    publicKey?: string
  }
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

  const config = useRuntimeConfig(event)
  const body = await readBody<RegisterAgentBody>(event)

  const displayName
    = body.displayName?.trim()

  const identifierType
    = body.identifier?.type?.trim()

  const identifierValue
    = body.identifier?.value?.trim()

  const identifierIssuer
    = body.identifier?.issuer?.trim()

  if (!identifierType || !identifierValue) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Agent identifier type and value are required'
    })
  }

  const keyId
    = body.cryptographicMaterial?.keyId?.trim()

  const algorithm
    = body.cryptographicMaterial?.algorithm?.trim()

  const publicKey
    = body.cryptographicMaterial?.publicKey?.trim()

  const hasAnyCryptographicMaterial
    = Boolean(keyId || algorithm || publicKey)

  const hasCompleteCryptographicMaterial
    = Boolean(keyId && algorithm && publicKey)

  if (
    hasAnyCryptographicMaterial
    && !hasCompleteCryptographicMaterial
  ) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Cryptographic material requires keyId, algorithm, and publicKey'
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

  const client
    = new HttpControlPlaneClient({
      baseUrl:
        config.controlPlaneBaseUrl,

      bearerToken:
        controlPlaneAccessToken
    })

  try {
    return await client.registerAgent({
      ...(displayName
        ? {
            displayName
          }
        : {}),

      identifier: {
        type:
          identifierType,

        value:
          identifierValue,

        ...(identifierIssuer
          ? {
              issuer:
                identifierIssuer
            }
          : {})
      },

      ...(hasCompleteCryptographicMaterial
        ? {
            cryptographicMaterial: {
              keyId:
                keyId as string,

              algorithm:
                algorithm as string,

              publicKey:
                publicKey as string
            }
          }
        : {})
    })
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
            'Developer is not authorized to register agents'
        })
      }
    }

    console.error(
      'Agent registration failed',
      error
    )

    throw createError({
      statusCode: 502,
      statusMessage:
        'Control plane registration failed'
    })
  }
})
