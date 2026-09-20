import type {
  DeveloperAgentRelationship,
  DeveloperAgentRelationshipStore
} from './developer-agent-relationship.js'

export interface DeveloperAgentRelationshipServiceOptions {
  store: DeveloperAgentRelationshipStore
  now?: () => Date
}

/**
 * Hosted application service for Developer-to-Agent relationships.
 *
 * This service owns relationship semantics. The persistence store only
 * records durable facts and does not make authorization decisions.
 */
export class DeveloperAgentRelationshipService {
  private readonly now: () => Date

  constructor(
    private readonly options:
      DeveloperAgentRelationshipServiceOptions
  ) {
    this.now =
      options.now ?? (() => new Date())
  }

  async assignOwner(
    developerId: string,
    agentId: string
  ): Promise<DeveloperAgentRelationship> {
    const normalizedDeveloperId =
      developerId.trim()

    const normalizedAgentId =
      agentId.trim()

    if (!normalizedDeveloperId) {
      throw new Error(
        'developer-id-required'
      )
    }

    if (!normalizedAgentId) {
      throw new Error(
        'agent-id-required'
      )
    }

    const existing =
      await this.options.store
        .findByDeveloperAndAgent(
          normalizedDeveloperId,
          normalizedAgentId
        )

    if (existing) {
      if (existing.relationship !== 'owner') {
        throw new Error(
          'developer-agent-relationship-conflict'
        )
      }

      return existing
    }

    const relationship:
      DeveloperAgentRelationship = {
        developerId:
          normalizedDeveloperId,

        agentId:
          normalizedAgentId,

        relationship:
          'owner',

        createdAt:
          this.now()
      }

    await this.options.store.create(
      relationship
    )

    return relationship
  }

  async isOwner(
    developerId: string,
    agentId: string
  ): Promise<boolean> {
    const relationship =
      await this.options.store
        .findByDeveloperAndAgent(
          developerId,
          agentId
        )

    return (
      relationship?.relationship ===
      'owner'
    )
  }

  async listOwnedAgentIds(
    developerId: string
  ): Promise<string[]> {
    const relationships =
      await this.options.store
        .listByDeveloper(
          developerId
        )

    return relationships
      .filter(
        relationship =>
          relationship.relationship ===
          'owner'
      )
      .map(
        relationship =>
          relationship.agentId
      )
  }
}
