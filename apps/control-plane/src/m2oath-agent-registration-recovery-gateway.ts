import type {
  AgentSummary,
  RegisterAgentRequest
} from '@m2oath/control-plane-client'

import type {
  AgentIdentityResolver,
  AgentRegistrationProvenanceStore,
  AuthenticationProvider,
  AuthenticationRequest,
  ExternalIdentityAssertion
} from '@m2oath/agent'

import type {
  AgentRegistrationRecoveryGateway
} from './agent-store.js'

export interface M2OathAgentRegistrationRecoveryGatewayOptions {
  authenticationProvider:
    AuthenticationProvider

  identityResolver:
    AgentIdentityResolver

  provenanceStore:
    AgentRegistrationProvenanceStore

  now?: () => Date
}

/**
 * Recovers a previously registered canonical Agent when authoritative
 * M2Oath identity and registration provenance prove that the currently
 * authenticated principal originally registered that Agent.
 *
 * This adapter does not create Agent identities, mutate registration
 * provenance, or grant Developer ownership. It only answers whether an
 * existing canonical Agent is safe to recover for this registration
 * attempt.
 */
export class M2OathAgentRegistrationRecoveryGateway
  implements AgentRegistrationRecoveryGateway {
  private readonly now: () => Date

  constructor(
    private readonly options:
      M2OathAgentRegistrationRecoveryGatewayOptions
  ) {
    this.now =
      options.now ?? (() => new Date())
  }

  async findRecoverableAgent(
    request: RegisterAgentRequest,
    authentication: AuthenticationRequest
  ): Promise<AgentSummary | undefined> {
    const authenticationResult =
      await this.options
        .authenticationProvider
        .authenticate(
          authentication
        )

    if (!authenticationResult.authenticated) {
      return undefined
    }

    const identifierAssertion:
      ExternalIdentityAssertion = {
        type:
          request.identifier.type,

        subject:
          request.identifier.value,

        ...(request.identifier.issuer
          ? {
              issuer:
                request.identifier.issuer
            }
          : {}),

        authenticatedAt:
          this.now()
      }

    const resolution =
      await this.options
        .identityResolver
        .resolve(
          identifierAssertion
        )

    if (!resolution.resolved) {
      return undefined
    }

    const provenance =
      await this.options
        .provenanceStore
        .findByAgentId(
          resolution.identity.id
        )

    if (!provenance) {
      return undefined
    }

    if (
      !samePrincipal(
        authenticationResult.assertion,
        provenance.createdBy
      )
    ) {
      return undefined
    }

    return {
      agentId:
        resolution.identity.id,

      status:
        resolution.identity.status,

      ...(resolution.identity.displayName
        ? {
            displayName:
              resolution.identity.displayName
          }
        : {})
    }
  }
}

function samePrincipal(
  authenticated:
    ExternalIdentityAssertion,

  registeredBy: {
    type: string
    subject: string
    issuer?: string
  }
): boolean {
  return (
    authenticated.type.trim() ===
      registeredBy.type.trim() &&
    authenticated.subject.trim() ===
      registeredBy.subject.trim() &&
    normalizeIssuer(
      authenticated.issuer
    ) ===
      normalizeIssuer(
        registeredBy.issuer
      )
  )
}

function normalizeIssuer(
  issuer: string | undefined
): string | undefined {
  const normalized =
    issuer?.trim()

  return normalized
    ? normalized
    : undefined
}
