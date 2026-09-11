import type {
  AgentSummary,
  BootstrapDeveloperSessionRequest,
  BootstrapDeveloperSessionResponse,
  LinkDeveloperExternalIdentityRequest,
  LinkDeveloperExternalIdentityResponse,
  RegisterAgentRequest,
  RegisterAgentResponse
} from './types.js'

export interface ControlPlaneClient {
  bootstrapDeveloperSession(
    request?: BootstrapDeveloperSessionRequest
  ): Promise<BootstrapDeveloperSessionResponse>

  linkDeveloperExternalIdentity(
    request: LinkDeveloperExternalIdentityRequest
  ): Promise<LinkDeveloperExternalIdentityResponse>

  registerAgent(
    request: RegisterAgentRequest
  ): Promise<RegisterAgentResponse>

  getAgent(agentId: string): Promise<AgentSummary>

  listAgents(): Promise<AgentSummary[]>

  getMyAgent(agentId: string): Promise<AgentSummary>

  listMyAgents(): Promise<AgentSummary[]>
}
