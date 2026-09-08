import {
  AgentCryptographicBindingRotationService,
  AgentEnrollmentService,
  AgentIdentityLifecycleService,
  AgentRegistrationService,
  AuthorizedAgentCryptographicBindingRotationService,
  AuthorizedAgentDisableService,
  AuthorizedAgentEnrollmentService,
  ConfiguredAgentLifecycleAuthorizationPolicy,
  type AuthenticationProvider
} from '@m2oath/agent'

import {
  InMemoryAgentCryptographicBindingStore,
  InMemoryAgentIdentityBindingStore,
  InMemoryAgentIdentityStore,
  InMemoryAgentRegistrationProvenanceStore,
  UuidAgentIdGenerator
} from '@m2oath/persistence'

import {
  M2OathSdk
} from '@m2oath/sdk'

export interface M2OathHostedDeveloperPrincipal {
  type: string
  subject: string
  issuer?: string
}

export interface CreateM2OathHostedCompositionOptions {
  /**
   * Authentication authority for hosted lifecycle operations.
   *
   * Production will supply @m2oath/auth-jwt here.
   */
  authenticationProvider: AuthenticationProvider

  /**
   * Exact authenticated Developer principals authorized by M2Oath.
   *
   * JWT scopes are intentionally not used as lifecycle authority.
   */
  developerPrincipals: M2OathHostedDeveloperPrincipal[]
}

export interface M2OathHostedComposition {
  sdk: M2OathSdk
}

export function createM2OathHostedComposition(
  options: CreateM2OathHostedCompositionOptions
): M2OathHostedComposition {
  const identityStore =
    new InMemoryAgentIdentityStore()

  const identityBindingStore =
    new InMemoryAgentIdentityBindingStore()

  const cryptographicBindingStore =
    new InMemoryAgentCryptographicBindingStore()

  const provenanceStore =
    new InMemoryAgentRegistrationProvenanceStore()

  const idGenerator =
    new UuidAgentIdGenerator()

  const registrationService =
    new AgentRegistrationService(
      idGenerator,
      identityStore
    )

  const enrollmentService =
    new AgentEnrollmentService(
      registrationService,
      identityBindingStore,
      () => new Date(),
      cryptographicBindingStore
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

  const authorizedEnrollmentService =
    new AuthorizedAgentEnrollmentService(
      options.authenticationProvider,
      lifecycleAuthorizationPolicy,
      enrollmentService,
      undefined,
      () => new Date(),
      provenanceStore
    )

  const rotationService =
    new AgentCryptographicBindingRotationService(
      cryptographicBindingStore
    )

  const authorizedRotationService =
    new AuthorizedAgentCryptographicBindingRotationService(
      options.authenticationProvider,
      lifecycleAuthorizationPolicy,
      rotationService
    )

  const lifecycleService =
    new AgentIdentityLifecycleService(
      identityStore
    )

  const authorizedDisableService =
    new AuthorizedAgentDisableService(
      options.authenticationProvider,
      lifecycleAuthorizationPolicy,
      lifecycleService
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
    sdk
  }
}
