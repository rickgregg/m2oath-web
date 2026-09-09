export type DeveloperAgentRelationshipType =
  | 'owner'

export interface DeveloperAgentRelationship {
  developerId: string
  agentId: string
  relationship: DeveloperAgentRelationshipType
  createdAt: Date
}

export interface DeveloperAgentRelationshipStore {
  create(
    relationship: DeveloperAgentRelationship
  ): Promise<void>

  findByDeveloperAndAgent(
    developerId: string,
    agentId: string
  ): Promise<DeveloperAgentRelationship | undefined>

  listByDeveloper(
    developerId: string
  ): Promise<DeveloperAgentRelationship[]>
}
