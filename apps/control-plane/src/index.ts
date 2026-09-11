import {
  createRemoteJwtAuthenticationProvider
} from '@m2oath/auth-jwt'

import {
  StoredAgentIdentityResolver
} from '@m2oath/agent'

import {
  checkMysqlPersistenceConnection,
  createMysqlPersistencePool,
  MysqlAgentIdentityBindingStore,
  MysqlAgentIdentityStore,
  MysqlAgentRegistrationProvenanceStore
} from '@m2oath/persistence-mysql'

import {
  M2OathAgentDirectory
} from './agent-store.js'

import {
  createDurableM2OathHostedComposition
} from './m2oath-durable-composition.js'

import {
  M2OathAgentRegistrationGateway
} from './m2oath-agent-registration-gateway.js'

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
  DeveloperAccountAgentLifecycleAuthorizationPolicy
} from './developer/developer-account-agent-lifecycle-authorization-policy.js'

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
  createMysqlPersistencePool({
    host: mysqlHost,
    port: mysqlPort,
    database: mysqlDatabase,
    user: mysqlUser,
    password: mysqlPassword
  })

await checkMysqlPersistenceConnection(
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

const lifecycleAuthorizationPolicy =
  new DeveloperAccountAgentLifecycleAuthorizationPolicy(
    developerAccountService
  )

const m2oath =
  createDurableM2OathHostedComposition({
    authenticationProvider,
    lifecycleAuthorizationPolicy,
    pool
  })

const directory =
  new M2OathAgentDirectory(
    m2oath.identityDirectory
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
    sdk: m2oath.sdk
  })

const agentIdentityBindingStore =
  new MysqlAgentIdentityBindingStore(
    pool
  )

const agentIdentityStore =
  new MysqlAgentIdentityStore(
    pool
  )

const registrationProvenanceStore =
  new MysqlAgentRegistrationProvenanceStore(
    pool
  )

const agentIdentityResolver =
  new StoredAgentIdentityResolver(
    agentIdentityBindingStore,
    agentIdentityStore
  )

const registrationRecoveryGateway =
  new M2OathAgentRegistrationRecoveryGateway({
    authenticationProvider,
    identityResolver:
      agentIdentityResolver,
    provenanceStore:
      registrationProvenanceStore
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
    developerOwnedAgentService
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
