import type {
  AgentSummary,
  RegisterAgentRequest
} from '@m2oath/control-plane-client'

import type {
  AgentIdentity,
  AgentIdentityDirectory,
  AuthenticationRequest
} from '@m2oath/agent'

export interface AgentRegistrationGateway {
  registerAgent(
    request: RegisterAgentRequest,
    authentication: AuthenticationRequest
  ): Promise<AgentSummary>
}

export interface AgentDirectory {
  getAgent(
    agentId: string
  ): Promise<AgentSummary | undefined>

  listAgents(): Promise<AgentSummary[]>
}

/**
 * Hosted read adapter over the authoritative M2Oath Agent identity
 * directory.
 *
 * This adapter does not persist, cache, manufacture, or mutate Agent
 * identity state. It only maps the domain-neutral M2Oath identity model
 * into the hosted control-plane API representation.
 */
export class M2OathAgentDirectory
  implements AgentDirectory
{
  constructor(
    private readonly identityDirectory:
      AgentIdentityDirectory
  ) {}

  async getAgent(
    agentId: string
  ): Promise<AgentSummary | undefined> {
    const identity =
      await this.identityDirectory.findById(
        agentId
      )

    return identity === undefined
      ? undefined
      : mapAgentIdentity(identity)
  }

  async listAgents(): Promise<AgentSummary[]> {
    const identities =
      await this.identityDirectory.list()

    return identities.map(
      identity => mapAgentIdentity(identity)
    )
  }
}

/**
 * Lightweight process-local Agent directory for isolated tests.
 *
 * This class is not used by the production hosted composition and has no
 * authority to issue canonical Agent IDs.
 */
export class InMemoryAgentDirectory
  implements AgentDirectory
{
  private readonly agents =
    new Map<string, AgentSummary>()

  saveAgentForTest(
    agent: AgentSummary
  ): void {
    this.agents.set(agent.agentId, {
      ...agent
    })
  }

  async getAgent(
    agentId: string
  ): Promise<AgentSummary | undefined> {
    const agent =
      this.agents.get(agentId)

    return agent === undefined
      ? undefined
      : { ...agent }
  }

  async listAgents(): Promise<AgentSummary[]> {
    return [...this.agents.values()].map(
      agent => ({
        ...agent
      })
    )
  }
}

function mapAgentIdentity(
  identity: AgentIdentity
): AgentSummary {
  return {
    agentId: identity.id,
    status: identity.status,

    ...(identity.displayName
      ? {
          displayName:
            identity.displayName
        }
      : {})
  }
}
