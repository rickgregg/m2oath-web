import type {
  AgentSummary
} from '@m2oath/control-plane-client'

import type {
  AgentDirectory
} from './agent-store.js'

import {
  DeveloperAgentRelationshipService
} from './developer/developer-agent-relationship-service.js'

export interface DeveloperOwnedAgentServiceOptions {
  directory: AgentDirectory
  relationshipService:
    DeveloperAgentRelationshipService
}

/**
 * Hosted read service for Developer-owned Agents.
 *
 * Developer ownership is determined by hosted relationship state.
 * Canonical Agent identity continues to come from the authoritative
 * M2Oath Agent directory.
 */
export class DeveloperOwnedAgentService {
  constructor(
    private readonly options:
      DeveloperOwnedAgentServiceOptions
  ) {}

  async listOwnedAgents(
    developerId: string
  ): Promise<AgentSummary[]> {
    const agentIds =
      await this.options
        .relationshipService
        .listOwnedAgentIds(
          developerId
        )

    const agents =
      await Promise.all(
        agentIds.map(
          agentId =>
            this.options.directory.getAgent(
              agentId
            )
        )
      )

    return agents.filter(
      (
        agent
      ): agent is AgentSummary =>
        agent !== undefined
    )
  }

  async getOwnedAgent(
    developerId: string,
    agentId: string
  ): Promise<AgentSummary | undefined> {
    const isOwner =
      await this.options
        .relationshipService
        .isOwner(
          developerId,
          agentId
        )

    if (!isOwner) {
      return undefined
    }

    return this.options.directory.getAgent(
      agentId
    )
  }
}
