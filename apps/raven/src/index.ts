import {
  createRemoteJwtAuthenticationProvider
} from '@m2oath/auth-jwt'

import {
  checkM2OathWebDatabaseConnection,
  createM2OathWebDatabasePool
} from './database.js'

import {
  M2OathAgentDirectory
} from './agent-store.js'

import {
  FetchM2OathTransport,
  M2OathSdk,
  RemoteAgentIdentityDirectory,
  RemoteM2OathAgentRegistrationRecoveryClient,
  RemoteM2OathLifecycleClient
} from '@m2oath/sdk'

import {
  OAuthClientCredentialsServiceAuthorizationProvider,
  RavenProviderFactory,
  RavenProviderRegistry,
  RavenProviderRuntime,
  StaticServiceAuthorizationProvider
} from './providers/index.js'

import {
  M2OathAgentRegistrationGateway
} from './m2oath-agent-registration-gateway.js'

import {
  RemoteTrustPolicyWorkbenchSimulationClient,
  RemoteTrustPopulationWorkbenchSimulationClient
} from '@m2oath/trust-simulation-client'

import {
  M2OathTrustSimulationGateway
} from './m2oath-trust-simulation-gateway.js'

import {
  M2OathAgentRegistrationRecoveryGateway
} from './m2oath-agent-registration-recovery-gateway.js'

import {
  HostedAgentRegistrationService
} from './hosted-agent-registration-service.js'

import {
  DeveloperOwnedAgentService
} from './developer-owned-agent-service.js'

import {
  createControlPlaneServer
} from './server.js'

import {
  DeveloperAccountService
} from './developer/developer-account-service.js'

import {
  DeveloperAccountGateway
} from './developer/developer-account-gateway.js'

import {
  MysqlDeveloperAccountStore
} from './developer/mysql-developer-account-store.js'

import {
  DeveloperAgentRelationshipService
} from './developer/developer-agent-relationship-service.js'

import {
  MysqlDeveloperAgentRelationshipStore
} from './developer/mysql-developer-agent-relationship-store.js'

const port = Number(
  process.env.M2OATH_RAVEN_PORT ?? 4000
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

const trustServiceBaseUrl =
  requireEnvironmentVariable(
    'M2OATH_TRUST_SERVICE_BASE_URL'
  )

const trustServiceOAuthTokenEndpoint =
  process.env[
    'M2OATH_TRUST_SERVICE_OAUTH_TOKEN_ENDPOINT'
  ]?.trim()

const trustServiceAuthorizationProvider =
  trustServiceOAuthTokenEndpoint
    ? new OAuthClientCredentialsServiceAuthorizationProvider({
        tokenEndpoint:
          trustServiceOAuthTokenEndpoint,

        clientId:
          requireEnvironmentVariable(
            'M2OATH_TRUST_SERVICE_OAUTH_CLIENT_ID'
          ),

        clientSecret:
          requireEnvironmentVariable(
            'M2OATH_TRUST_SERVICE_OAUTH_CLIENT_SECRET'
          ),

        audience:
          requireEnvironmentVariable(
            'M2OATH_TRUST_SERVICE_OAUTH_AUDIENCE'
          )
      })
    : new StaticServiceAuthorizationProvider({
        authorizationHeader:
          requireEnvironmentVariable(
            'M2OATH_TRUST_SERVICE_AUTHORIZATION'
          )
      })

const weatherServiceBaseUrl =
  requireEnvironmentVariable(
    'M2OATH_WEATHER_SERVICE_BASE_URL'
  )

const weatherServiceAuthorization =
  requireEnvironmentVariable(
    'M2OATH_WEATHER_SERVICE_AUTHORIZATION'
  )

const mysqlHost =
  requireEnvironmentVariable(
    'M2OATH_MYSQL_HOST'
  )

const mysqlPort =
  Number(
    requireEnvironmentVariable(
      'M2OATH_MYSQL_PORT'
    )
  )

const mysqlDatabase =
  requireEnvironmentVariable(
    'M2OATH_MYSQL_DATABASE'
  )

const mysqlUser =
  requireEnvironmentVariable(
    'M2OATH_MYSQL_USER'
  )

const mysqlPassword =
  requireEnvironmentVariable(
    'M2OATH_MYSQL_PASSWORD'
  )

if (
  !Number.isInteger(mysqlPort) ||
  mysqlPort <= 0
) {
  throw new Error(
    'M2OATH_MYSQL_PORT must be a positive integer'
  )
}

const authenticationProvider =
  createRemoteJwtAuthenticationProvider({
    issuer: developerJwtIssuer,
    audience: developerJwtAudience,
    jwksUri: developerJwtJwksUri
  })

const pool =
  createM2OathWebDatabasePool({
    host: mysqlHost,
    port: mysqlPort,
    database: mysqlDatabase,
    user: mysqlUser,
    password: mysqlPassword
  })

await checkM2OathWebDatabaseConnection(
  pool
)

const developerAccountStore =
  new MysqlDeveloperAccountStore(
    pool
  )

const developerAccountService =
  new DeveloperAccountService(
    developerAccountStore
  )

const trustTransport =
  new FetchM2OathTransport({
    baseUrl:
      trustServiceBaseUrl,

    getAuthorizationHeader:
      () =>
        trustServiceAuthorizationProvider
          .getAuthorizationHeader()
  })


const trustSimulationClient =
  new RemoteTrustPolicyWorkbenchSimulationClient(
    trustTransport
  )

const trustPopulationSimulationClient =
  new RemoteTrustPopulationWorkbenchSimulationClient(
    trustTransport
  )

const trustSimulationGateway =
  new M2OathTrustSimulationGateway({
    client:
      trustSimulationClient,
    populationClient:
      trustPopulationSimulationClient
  })

const providerRegistry =
  new RavenProviderRegistry()

providerRegistry.register({
  providerId: 'm2oath-trust',
  providerType: 'trust',
  endpoint: trustServiceBaseUrl
})

providerRegistry.register({
  providerId: 'm2oath-weather',
  providerType: 'trusted-domain',
  endpoint: weatherServiceBaseUrl,
  domain: 'weather'
})

const providerFactory =
  new RavenProviderFactory({
    getAuthorizationHeader:
      descriptor => {
        switch (descriptor.providerId) {
          case 'm2oath-trust':
            return trustServiceAuthorizationProvider
              .getAuthorizationHeader()

          case 'm2oath-weather':
            return weatherServiceAuthorization

          default:
            throw new Error(
              `No Raven service credential configured for provider: ${descriptor.providerId}`
            )
        }
      }
  })

const providerRuntime =
  new RavenProviderRuntime(
    providerRegistry,
    providerFactory
  )

const trustStateProvider =
  providerRuntime.getTrustProvider(
    'm2oath-trust'
  )

const lifecycleClient =
  new RemoteM2OathLifecycleClient(
    trustTransport
  )

const m2oathSdk =
  new M2OathSdk({
    lifecycleClient
  })

const agentIdentityDirectory =
  new RemoteAgentIdentityDirectory(
    trustTransport
  )

const directory =
  new M2OathAgentDirectory(
    agentIdentityDirectory
  )

const developerAccountGateway =
  new DeveloperAccountGateway(
    authenticationProvider,
    developerAccountService
  )

const developerAgentRelationshipStore =
  new MysqlDeveloperAgentRelationshipStore(
    pool
  )

const developerAgentRelationshipService =
  new DeveloperAgentRelationshipService({
    store:
      developerAgentRelationshipStore
  })

const registrationGateway =
  new M2OathAgentRegistrationGateway({
    sdk: m2oathSdk
  })

const registrationRecoveryClient =
  new RemoteM2OathAgentRegistrationRecoveryClient(
    trustTransport
  )

const registrationRecoveryGateway =
  new M2OathAgentRegistrationRecoveryGateway({
    authenticationProvider,
    recoveryClient:
      registrationRecoveryClient
  })

const hostedRegistrationService =
  new HostedAgentRegistrationService({
    developerAccountGateway,
    registrationGateway,
    recoveryGateway:
      registrationRecoveryGateway,
    relationshipService:
      developerAgentRelationshipService
  })

const developerOwnedAgentService =
  new DeveloperOwnedAgentService({
    directory,
    relationshipService:
      developerAgentRelationshipService
  })

const server =
  createControlPlaneServer({
    registrationGateway,
    directory,
    developerAccountGateway,
    hostedRegistrationService,
    developerOwnedAgentService,
    trustSimulationGateway
  })

server.listen(port, () => {
  console.log(
    `M2Oath Raven listening on port ${port}`
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
