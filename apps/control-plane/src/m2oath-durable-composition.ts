import {
  AgentCryptographicBindingRotationService,
  AgentIdentityLifecycleService,
  AuthorizedAgentCryptographicBindingRotationService,
  AuthorizedAgentDisableService,
  AuthorizedAgentEnrollmentService,
  ConfiguredAgentLifecycleAuthorizationPolicy,
  type AgentIdentityDirectory,
  type AuthenticationProvider
} from '@m2oath/agent'

import {
  UuidAgentIdGenerator
} from '@m2oath/persistence'

import {
  MysqlAgentCryptographicBindingStore,
  MysqlAgentEnrollmentUnitOfWork,
  MysqlAgentIdentityStore,
  MysqlAgentLifecycleAuditRecorder,
  MysqlAuthorizedAgentEnrollmentOperation,
  type Pool
} from '@m2oath/persistence-mysql'

import {
  M2OathSdk
} from '@m2oath/sdk'

export interface DurableM2OathHostedDeveloperPrincipal {
  type: string
  subject: string
  issuer?: string
}

export interface CreateDurableM2OathHostedCompositionOptions {
  authenticationProvider: AuthenticationProvider

  developerPrincipals:
    DurableM2OathHostedDeveloperPrincipal[]

  pool: Pool
}

export interface DurableM2OathHostedComposition {
  sdk: M2OathSdk

  /**
   * Durable canonical Agent identity read boundary.
   *
   * Consumers read Agent state through the domain contract rather than
   * querying MySQL directly.
   */
  identityDirectory: AgentIdentityDirectory
}

/**
 * Production hosted composition backed by durable MySQL persistence.
 *
 * MySQL owns durable facts and transaction mechanics only.
 *
 * Authentication, lifecycle authorization, canonical identity creation,
 * lifecycle decisions, and protected execution authority remain in
 * M2Oath services.
 */
export function createDurableM2OathHostedComposition(
  options: CreateDurableM2OathHostedCompositionOptions
): DurableM2OathHostedComposition {
  const identityStore =
    new MysqlAgentIdentityStore(
      options.pool
    )

  const cryptographicBindingStore =
    new MysqlAgentCryptographicBindingStore(
      options.pool
    )

  const lifecycleAuditRecorder =
    new MysqlAgentLifecycleAuditRecorder(
      options.pool
    )

  const lifecycleAuthorizationPolicy =
    new ConfiguredAgentLifecycleAuthorizationPolicy({
      grants:
        options.developerPrincipals.map(
          principal => ({
            principal: {
              ...principal
            },

            actions: [
              'agent.create',
              'agent.rotate-key',
              'agent.disable'
            ]
          })
        )
    })

  const idGenerator =
    new UuidAgentIdGenerator()

  const enrollmentUnitOfWork =
    new MysqlAgentEnrollmentUnitOfWork(
      options.pool
    )

  const enrollmentOperation =
    new MysqlAuthorizedAgentEnrollmentOperation(
      enrollmentUnitOfWork,
      idGenerator
    )

  const authorizedEnrollmentService =
    AuthorizedAgentEnrollmentService.fromOperation(
      options.authenticationProvider,
      lifecycleAuthorizationPolicy,
      enrollmentOperation,
      lifecycleAuditRecorder
    )

  const rotationService =
    new AgentCryptographicBindingRotationService(
      cryptographicBindingStore
    )

  const authorizedRotationService =
    new AuthorizedAgentCryptographicBindingRotationService(
      options.authenticationProvider,
      lifecycleAuthorizationPolicy,
      rotationService,
      lifecycleAuditRecorder
    )

  const lifecycleService =
    new AgentIdentityLifecycleService(
      identityStore
    )

  const authorizedDisableService =
    new AuthorizedAgentDisableService(
      options.authenticationProvider,
      lifecycleAuthorizationPolicy,
      lifecycleService,
      lifecycleAuditRecorder
    )

  const sdk =
    new M2OathSdk({
      enrollmentService:
        authorizedEnrollmentService,

      rotationService:
        authorizedRotationService,

      disableService:
        authorizedDisableService
    })

  return {
    sdk,
    identityDirectory:
      identityStore
  }
}
