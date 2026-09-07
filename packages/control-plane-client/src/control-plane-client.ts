import type {
  AgentSummary,
  RegisterAgentRequest,
  RegisterAgentResponse
} from './types.js'

export interface ControlPlaneClient {
  registerAgent(
    request: RegisterAgentRequest
  ): Promise<RegisterAgentResponse>

  getAgent(agentId: string): Promise<AgentSummary>

  listAgents(): Promise<AgentSummary[]>
}
