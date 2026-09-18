import type {
  AgentIdentity,
  AuthorizedAgentCryptographicBindingRotationResult,
  AuthorizedAgentDisableResult,
  AuthorizedAgentEnrollmentResult,
  ExternalIdentityAssertion
} from '@m2oath/agent'

import type {
  M2OathAgentDisableRequest,
  M2OathAgentKeyRotationRequest,
  M2OathAgentRegistrationRequest,
  M2OathLifecycleClient
} from '@m2oath/sdk'

export interface TestM2OathLifecycleClientOptions {
  developerPrincipals?: ReadonlyArray<
    Pick<
      ExternalIdentityAssertion,
      'type' | 'subject' | 'issuer'
    >
  >
}

function samePrincipal(
  left: Pick<
    ExternalIdentityAssertion,
    'type' | 'subject' | 'issuer'
  >,
  right: Pick<
    ExternalIdentityAssertion,
    'type' | 'subject' | 'issuer'
  >
): boolean {
  return (
    left.type === right.type &&
    left.subject === right.subject &&
    left.issuer === right.issuer
  )
}

export class TestM2OathLifecycleClient
  implements M2OathLifecycleClient
{
  private readonly identities =
    new Map<string, AgentIdentity>()

  private nextAgentNumber = 1

  constructor(
    private readonly options:
      TestM2OathLifecycleClientOptions = {}
  ) {}

  async registerAgent(
    request: M2OathAgentRegistrationRequest
  ): Promise<AuthorizedAgentEnrollmentResult> {
    if (
      this.options.developerPrincipals
    ) {
      const allowed =
        this.options.developerPrincipals
          .some(principal =>
            samePrincipal(
              principal,
              request.principal
            )
          )

      if (!allowed) {
        return {
          ok: false,
          stage: 'authorization',
          reason:
            'test-developer-not-authorized'
        }
      }
    }

    const agentId =
      `agt_00000000-0000-4000-8000-${String(
        this.nextAgentNumber++
      ).padStart(12, '0')}`

    const now =
      new Date(
        '2026-09-18T00:00:00.000Z'
      )

    const identity: AgentIdentity = {
      id: agentId,
      status: 'active',
      createdAt: now,
      updatedAt: now,

      ...(request.enrollment.displayName
        ? {
            displayName:
              request.enrollment.displayName
          }
        : {})
    }

    this.identities.set(
      agentId,
      identity
    )

    return {
      ok: true,

      enrollment: {
        identity,

        binding: {
          agentId,
          identifier: {
            ...request.enrollment.identifier
          },
          status: 'active',
          createdAt: now,
          updatedAt: now
        }
      }
    }
  }

  async rotateAgentKey(
    _request:
      M2OathAgentKeyRotationRequest
  ): Promise<AuthorizedAgentCryptographicBindingRotationResult> {
    throw new Error(
      'TestM2OathLifecycleClient.rotateAgentKey is not implemented.'
    )
  }

  async disableAgent(
    _request:
      M2OathAgentDisableRequest
  ): Promise<AuthorizedAgentDisableResult> {
    throw new Error(
      'TestM2OathLifecycleClient.disableAgent is not implemented.'
    )
  }

  async findById(
    agentId: string
  ): Promise<AgentIdentity | undefined> {
    return this.identities.get(
      agentId
    )
  }

  async list(): Promise<AgentIdentity[]> {
    return [
      ...this.identities.values()
    ]
  }
}
