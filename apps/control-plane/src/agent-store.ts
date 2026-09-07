import type {
  AgentSummary,
  RegisterAgentRequest
} from '@m2oath/control-plane-client'

export interface AgentStore {
  registerAgent(request: RegisterAgentRequest): AgentSummary
  getAgent(agentId: string): AgentSummary | undefined
  listAgents(): AgentSummary[]
}

export class InMemoryAgentStore implements AgentStore {
  private readonly agents = new Map<string, AgentSummary>()
  private nextId = 1

  registerAgent(request: RegisterAgentRequest): AgentSummary {
    const agentId = `agt_${String(this.nextId).padStart(6, '0')}`
    this.nextId += 1

    const agent: AgentSummary = {
      agentId,
      status: 'active',
      ...(request.displayName
        ? { displayName: request.displayName }
        : {})
    }

    this.agents.set(agentId, agent)

    return agent
  }

  getAgent(agentId: string): AgentSummary | undefined {
    return this.agents.get(agentId)
  }

  listAgents(): AgentSummary[] {
    return [...this.agents.values()]
  }
}
