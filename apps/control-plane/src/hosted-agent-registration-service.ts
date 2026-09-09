import type {
  AgentSummary,
  RegisterAgentRequest
} from '@m2oath/control-plane-client'

import type {
  AuthenticationRequest
} from '@m2oath/agent'

import type {
  AgentRegistrationGateway
} from './agent-store.js'

import {
  DeveloperAccountGateway
} from './developer/developer-account-gateway.js'

import {
  DeveloperAgentRelationshipService
} from './developer/developer-agent-relationship-service.js'

export interface HostedAgentRegistrationServiceOptions {
  developerAccountGateway:
    DeveloperAccountGateway

  registrationGateway:
    AgentRegistrationGateway

  relationshipService:
    DeveloperAgentRelationshipService
}

/**
 * Hosted orchestration for Developer-initiated Agent registration.
 *
 * Canonical Developer identity is resolved from the verified JWT.
 * Canonical Agent identity remains owned by the reusable M2Oath
 * Agent lifecycle.
 *
 * This service only establishes the hosted relationship between the
 * two identities after authoritative Agent registration succeeds.
 */
export class HostedAgentRegistrationService {
  constructor(
    private readonly options:
      HostedAgentRegistrationServiceOptions
  ) {}

  async registerAgent(
    request: RegisterAgentRequest,
    authentication: AuthenticationRequest
  ): Promise<AgentSummary> {
    const developer =
      await this.options
        .developerAccountGateway
        .resolveAuthenticated(
          authentication
        )

    const agent =
      await this.options
        .registrationGateway
        .registerAgent(
          request,
          authentication
        )

    await this.options
      .relationshipService
      .assignOwner(
        developer.developerId,
        agent.agentId
      )

    return agent
  }
}
