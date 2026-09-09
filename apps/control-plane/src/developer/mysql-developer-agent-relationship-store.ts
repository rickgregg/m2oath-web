import type {
  Pool
} from '@m2oath/persistence-mysql'

import type {
  DeveloperAgentRelationship,
  DeveloperAgentRelationshipStore,
  DeveloperAgentRelationshipType
} from './developer-agent-relationship.js'

interface DeveloperAgentRelationshipRow {
  developer_id: string
  agent_id: string
  relationship: DeveloperAgentRelationshipType
  created_at: Date
}

/**
 * Hosted MySQL persistence for Developer-to-Agent relationships.
 *
 * Developer-Agent relationships are a hosted-product concept and
 * deliberately remain outside the reusable @m2oath/agent framework.
 *
 * The database stores durable relationship facts. Authorization
 * decisions remain application/control-plane concerns.
 */
export class MysqlDeveloperAgentRelationshipStore
  implements DeveloperAgentRelationshipStore {
  constructor(
    private readonly pool: Pool
  ) {}

  async create(
    relationship: DeveloperAgentRelationship
  ): Promise<void> {
    await this.pool.execute(
      `
        INSERT INTO developer_agent_relationships (
          developer_id,
          agent_id,
          relationship,
          created_at
        )
        VALUES (?, ?, ?, ?)
      `,
      [
        relationship.developerId,
        relationship.agentId,
        relationship.relationship,
        relationship.createdAt
      ]
    )
  }

  async findByDeveloperAndAgent(
    developerId: string,
    agentId: string
  ): Promise<DeveloperAgentRelationship | undefined> {
    const [result] =
      await this.pool.query(
        `
          SELECT
            developer_id,
            agent_id,
            relationship,
            created_at
          FROM developer_agent_relationships
          WHERE developer_id = ?
            AND agent_id = ?
          ORDER BY created_at ASC
          LIMIT 1
        `,
        [
          developerId,
          agentId
        ]
      )

    const rows =
      result as unknown as DeveloperAgentRelationshipRow[]

    const row = rows[0]

    return row === undefined
      ? undefined
      : this.mapRow(row)
  }

  async listByDeveloper(
    developerId: string
  ): Promise<DeveloperAgentRelationship[]> {
    const [result] =
      await this.pool.query(
        `
          SELECT
            developer_id,
            agent_id,
            relationship,
            created_at
          FROM developer_agent_relationships
          WHERE developer_id = ?
          ORDER BY created_at ASC, agent_id ASC
        `,
        [
          developerId
        ]
      )

    const rows =
      result as unknown as DeveloperAgentRelationshipRow[]

    return rows.map(
      row => this.mapRow(row)
    )
  }

  private mapRow(
    row: DeveloperAgentRelationshipRow
  ): DeveloperAgentRelationship {
    return {
      developerId:
        row.developer_id,

      agentId:
        row.agent_id,

      relationship:
        row.relationship,

      createdAt:
        new Date(row.created_at)
    }
  }
}
