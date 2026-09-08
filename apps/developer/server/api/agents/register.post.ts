import {
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
  const config = useRuntimeConfig(event)
  const body = await readBody<RegisterAgentBody>(event)

  const displayName =
    body.displayName?.trim()

  const identifierType =
    body.identifier?.type?.trim()

  const identifierValue =
    body.identifier?.value?.trim()

  const identifierIssuer =
    body.identifier?.issuer?.trim()

  if (!identifierType || !identifierValue) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Agent identifier type and value are required'
    })
  }

  const keyId =
    body.cryptographicMaterial?.keyId?.trim()

  const algorithm =
    body.cryptographicMaterial?.algorithm?.trim()

  const publicKey =
    body.cryptographicMaterial?.publicKey?.trim()

  const hasAnyCryptographicMaterial =
    Boolean(keyId || algorithm || publicKey)

  const hasCompleteCryptographicMaterial =
    Boolean(keyId && algorithm && publicKey)

  if (
    hasAnyCryptographicMaterial &&
    !hasCompleteCryptographicMaterial
  ) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Cryptographic material requires keyId, algorithm, and publicKey'
    })
  }

  const client =
    new HttpControlPlaneClient({
      baseUrl:
        config.controlPlaneBaseUrl
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
