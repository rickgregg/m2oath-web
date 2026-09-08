export interface AgentSummary {
  agentId: string
  displayName?: string
  status: 'active' | 'disabled' | 'revoked'
}

export interface RegisterAgentIdentifier {
  type: string
  value: string
  issuer?: string
}

export interface RegisterAgentCryptographicMaterial {
  keyId: string
  algorithm: string
  publicKey: string
}

export interface RegisterAgentRequest {
  displayName?: string
  identifier: RegisterAgentIdentifier
  cryptographicMaterial?: RegisterAgentCryptographicMaterial
}

export interface RegisterAgentResponse {
  agent: AgentSummary
}
