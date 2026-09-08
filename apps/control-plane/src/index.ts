import {
  createRemoteJwtAuthenticationProvider
} from '@m2oath/auth-jwt'
import {
  InMemoryAgentDirectory
} from './agent-store.js'
import {
  createM2OathHostedComposition
} from './m2oath-composition.js'
import {
  M2OathAgentRegistrationGateway
} from './m2oath-agent-registration-gateway.js'
import {
  createControlPlaneServer
} from './server.js'

const port = Number(
  process.env.M2OATH_CONTROL_PLANE_PORT ?? 4000
)

const developerJwtIssuer =
  requireEnvironmentVariable(
    'M2OATH_DEVELOPER_JWT_ISSUER'
  )

const developerJwtAudience =
  requireEnvironmentVariable(
    'M2OATH_DEVELOPER_JWT_AUDIENCE'
  )

const developerJwtJwksUri =
  requireEnvironmentVariable(
    'M2OATH_DEVELOPER_JWT_JWKS_URI'
  )

const authorizedDeveloperSubject =
  requireEnvironmentVariable(
    'M2OATH_DEVELOPER_JWT_SUBJECT'
  )

const authenticationProvider =
  createRemoteJwtAuthenticationProvider({
    issuer: developerJwtIssuer,
    audience: developerJwtAudience,
    jwksUri: developerJwtJwksUri
  })

const directory =
  new InMemoryAgentDirectory()

const m2oath =
  createM2OathHostedComposition({
    authenticationProvider,

    developerPrincipals: [
      {
        type: 'oauth-subject',
        subject: authorizedDeveloperSubject,
        issuer: developerJwtIssuer
      }
    ]
  })

const registrationGateway =
  new M2OathAgentRegistrationGateway({
    sdk: m2oath.sdk,
    directory
  })

const server =
  createControlPlaneServer({
    registrationGateway,
    directory
  })

server.listen(port, () => {
  console.log(
    `M2Oath control plane listening on port ${port}`
  )
})

function requireEnvironmentVariable(
  name: string
): string {
  const value =
    process.env[name]?.trim()

  if (!value) {
    throw new Error(
      `Required environment variable is not configured: ${name}`
    )
  }

  return value
}
