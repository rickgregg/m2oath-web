/**
 * Relationship between a canonical M2Oath User and a canonical Agent.
 *
 * Agent IDs originate from the authoritative M2Oath Trust service.
 * This relationship records hosted-product authority over that Agent;
 * it does not create or redefine Agent identity.
 */
export type M2OathAgentRelationshipType =
  | 'owner'

export interface M2OathAgentRelationship {
  userId: string
  agentId: string
  relationship: M2OathAgentRelationshipType
  createdAt: Date
}

export interface M2OathAgentRelationshipStore {
  create(
    relationship: M2OathAgentRelationship
  ): Promise<void>

  findByUserAndAgent(
    userId: string,
    agentId: string
  ): Promise<M2OathAgentRelationship | undefined>

  listByUser(
    userId: string
  ): Promise<M2OathAgentRelationship[]>
}
