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

export type DeveloperRole =
  | 'developer'
  | 'admin'

export type DeveloperAccountStatus =
  | 'active'
  | 'disabled'

export interface DeveloperAccountSummary {
  developerId: string
  displayName?: string
  status: DeveloperAccountStatus
  role: DeveloperRole
}

export interface BootstrapDeveloperSessionRequest {
  displayName?: string
}

export interface BootstrapDeveloperSessionResponse {
  developer: DeveloperAccountSummary
}


export interface LinkDeveloperExternalIdentityRequest {
  credential: string
}

export interface LinkDeveloperExternalIdentityResponse {
  developer: DeveloperAccountSummary
}
