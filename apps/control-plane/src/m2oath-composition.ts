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

/**
 * Temporary development principal for Phase 5.
 *
 * This is NOT production developer authentication.
 *
 * The future hosted HTTP authentication layer will verify a real
 * Developer JWT and pass the authenticated security context into
 * M2Oath. Keeping this provider explicit prevents the temporary
 * development behavior from being confused with production security.
 */
const developmentPrincipal = {
  type: 'developer-development',
  subject: 'local-developer',
  issuer: 'm2oath-control-plane-development'
} as const

const authenticationProvider: AuthenticationProvider = {
  async authenticate() {
    return {
      authenticated: true,
      assertion: {
        ...developmentPrincipal,
        authenticatedAt: new Date()
      }
    }
  }
}

export interface M2OathHostedComposition {
  sdk: M2OathSdk
}

export function createM2OathHostedComposition():
  M2OathHostedComposition
{
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
      grants: [
        {
          principal: {
            ...developmentPrincipal
          },
          actions: [
            'agent.create',
            'agent.rotate-key',
            'agent.disable'
          ]
        }
      ]
    })

  const authorizedEnrollmentService =
    new AuthorizedAgentEnrollmentService(
      authenticationProvider,
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
      authenticationProvider,
      lifecycleAuthorizationPolicy,
      rotationService
    )

  const lifecycleService =
    new AgentIdentityLifecycleService(
      identityStore
    )

  const authorizedDisableService =
    new AuthorizedAgentDisableService(
      authenticationProvider,
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
