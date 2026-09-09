import type {
  AgentSummary,
  BootstrapDeveloperSessionRequest,
  BootstrapDeveloperSessionResponse,
  RegisterAgentRequest,
  RegisterAgentResponse
} from './types.js'

export interface ControlPlaneClient {
  bootstrapDeveloperSession(
    request?: BootstrapDeveloperSessionRequest
  ): Promise<BootstrapDeveloperSessionResponse>

  registerAgent(
    request: RegisterAgentRequest
  ): Promise<RegisterAgentResponse>

  getAgent(agentId: string): Promise<AgentSummary>

  listAgents(): Promise<AgentSummary[]>

  getMyAgent(agentId: string): Promise<AgentSummary>

  listMyAgents(): Promise<AgentSummary[]>
}
