export interface AgentSummary {
  agentId: string
  displayName?: string
  status: 'active' | 'disabled' | 'revoked'
}

export interface RegisterAgentRequest {
  displayName?: string
}

export interface RegisterAgentResponse {
  agent: AgentSummary
}
