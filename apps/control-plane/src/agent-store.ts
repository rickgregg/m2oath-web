import type {
  AgentSummary,
  RegisterAgentRequest
} from '@m2oath/control-plane-client'
import type {
  AuthenticationRequest
} from '@m2oath/agent'

export interface AgentRegistrationGateway {
  registerAgent(
    request: RegisterAgentRequest,
    authentication: AuthenticationRequest
  ): Promise<AgentSummary>
}

export interface AgentDirectory {
  getAgent(agentId: string): AgentSummary | undefined
  listAgents(): AgentSummary[]
}

export interface AgentDirectoryWriter {
  saveAgent(agent: AgentSummary): void
}

/**
 * Temporary hosted read model.
 *
 * This class no longer has any authority to issue canonical Agent IDs.
 * Canonical identity issuance belongs to M2Oath.
 */
export class InMemoryAgentDirectory
  implements AgentDirectory, AgentDirectoryWriter
{
  private readonly agents = new Map<string, AgentSummary>()

  saveAgent(agent: AgentSummary): void {
    this.agents.set(agent.agentId, {
      ...agent
    })
  }

  getAgent(agentId: string): AgentSummary | undefined {
    const agent = this.agents.get(agentId)

    return agent === undefined
      ? undefined
      : { ...agent }
  }

  listAgents(): AgentSummary[] {
    return [...this.agents.values()].map(agent => ({
      ...agent
    }))
  }
}
