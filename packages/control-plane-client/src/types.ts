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

export type TrustSimulationScenarioId =
  | 'normal-trust-growth'
  | 'repetition-farming'
  | 'failure-laundering'
  | 'cold-start'
  | 'fake-diversity'
  | 'cross-operation-farming'
  | 'authority-concentration'
  | 'stale-reputation'
  | 'replay-attack'
  | 'combined-farming-attack'
  | 'trusted-domain-composition'

export interface RunTrustPolicyWorkbenchSimulationRequest {
  scenarioId: TrustSimulationScenarioId
}

export interface TrustSimulationOperation {
  operationType: string
  operationName: string
  serverName?: string
}

export interface TrustSimulationTrustState {
  agentId: string
  score: number
  evidenceCount: number
  evidenceWeight?: number
  evidenceDiversityCount?: number
  evaluatedAt: string
}

export interface TrustSimulationEvidenceDiagnostic {
  evidenceIdentity: string
  source:
    | 'usage'
    | 'behavioral-verification'
  operation: TrustSimulationOperation
  occurredAt: string
  evidenceWeight: number
  decayWeight: number
  operationDiminishingReturnsWeight: number
  authorityDiminishingReturnsWeight: number
  effectiveWeight: number
  scoreDelta: number
  scoreBefore: number
  scoreAfter: number
  included: boolean
  exclusionReason?:
    | 'expired-by-decay'
    | 'zero-evidence-weight'
}

export interface TrustSimulationPolicyDecision {
  allowed: boolean
  reason?: string
}

export interface TrustPolicyWorkbenchSource {
  state: TrustSimulationTrustState
  evidence: TrustSimulationEvidenceDiagnostic[]
}

export interface TrustPolicyWorkbenchTimelinePoint {
  sequence: number
  label?: string
  time: string
  agentId: string
  operation: TrustSimulationOperation

  trust: {
    usage: TrustPolicyWorkbenchSource
    behavioralVerification: TrustPolicyWorkbenchSource
    composite: TrustSimulationTrustState
  }

  decision: TrustSimulationPolicyDecision
}

export interface TrustPolicyWorkbenchResult {
  scenario: {
    id: string
    name: string
    startedAt: string
    completedAt: string
  }

  model: {
    modelId: string
    modelVersion: string
    configurationHash: string
  }

  timeline: TrustPolicyWorkbenchTimelinePoint[]
}

