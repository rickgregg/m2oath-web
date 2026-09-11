import type {
  AgentSummary,
  RegisterAgentRequest
} from '@m2oath/control-plane-client'

import type {
  AuthenticationRequest
} from '@m2oath/agent'

import type {
  AgentRegistrationGateway,
  AgentRegistrationRecoveryGateway
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

  recoveryGateway?:
    AgentRegistrationRecoveryGateway
}

/**
 * Hosted orchestration for Developer-initiated Agent registration.
 *
 * Canonical Developer identity is resolved from the verified JWT.
 * Canonical Agent identity remains owned by the reusable M2Oath
 * Agent lifecycle.
 *
 * This service establishes the hosted relationship between the two
 * identities after authoritative Agent registration succeeds.
 *
 * When a recovery gateway is configured, retries may safely recover an
 * already-created canonical Agent before attempting another enrollment.
 * Recovery is permitted only when the recovery gateway can prove that
 * the existing Agent belongs to the authenticated registration
 * principal through authoritative M2Oath identity and provenance facts.
 *
 * Ownership assignment itself is idempotent.
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

    const recoveredBeforeRegistration =
      await this.tryRecover(
        request,
        authentication
      )

    if (recoveredBeforeRegistration) {
      await this.assignOwner(
        developer.developerId,
        recoveredBeforeRegistration
      )

      return recoveredBeforeRegistration
    }

    let agent: AgentSummary

    try {
      agent =
        await this.options
          .registrationGateway
          .registerAgent(
            request,
            authentication
          )
    } catch (error) {
      const recoveredAfterFailure =
        await this.tryRecover(
          request,
          authentication
        )

      if (!recoveredAfterFailure) {
        throw error
      }

      await this.assignOwner(
        developer.developerId,
        recoveredAfterFailure
      )

      return recoveredAfterFailure
    }

    await this.assignOwner(
      developer.developerId,
      agent
    )

    return agent
  }

  private async tryRecover(
    request: RegisterAgentRequest,
    authentication: AuthenticationRequest
  ): Promise<AgentSummary | undefined> {
    if (!this.options.recoveryGateway) {
      return undefined
    }

    return this.options
      .recoveryGateway
      .findRecoverableAgent(
        request,
        authentication
      )
  }

  private async assignOwner(
    developerId: string,
    agent: AgentSummary
  ): Promise<void> {
    await this.options
      .relationshipService
      .assignOwner(
        developerId,
        agent.agentId
      )
  }
}
