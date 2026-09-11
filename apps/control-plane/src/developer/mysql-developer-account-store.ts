import type {
  Pool
} from '@m2oath/persistence-mysql'

import type {
  DeveloperAccount,
  DeveloperAccountStatus,
  DeveloperIdentityBinding,
  DeveloperRole
} from './developer-account.js'

import type {
  DeveloperAccountStore
} from './developer-account-store.js'

interface DeveloperAccountRow {
  developer_id: string
  display_name: string | null
  status: DeveloperAccountStatus
  role: DeveloperRole
  created_at: Date
  updated_at: Date
}

/**
 * Hosted MySQL persistence for M2Oath Developer accounts.
 *
 * Developer accounts are a hosted-product concept and deliberately
 * remain outside the reusable @m2oath/agent framework.
 *
 * The database stores durable account facts. Authentication and
 * authorization decisions remain application/control-plane concerns.
 */
export class MysqlDeveloperAccountStore
  implements DeveloperAccountStore {
  constructor(
    private readonly pool: Pool
  ) {}

  async findById(
    developerId: string
  ): Promise<DeveloperAccount | undefined> {
    const [result] =
      await this.pool.query(
        `
          SELECT
            developer_id,
            display_name,
            status,
            role,
            created_at,
            updated_at
          FROM developer_accounts
          WHERE developer_id = ?
          LIMIT 1
        `,
        [
          developerId
        ]
      )

    const rows =
      result as unknown as DeveloperAccountRow[]

    const row = rows[0]

    return row === undefined
      ? undefined
      : this.mapRow(row)
  }

  async findByExternalIdentity(
    issuer: string,
    subject: string
  ): Promise<DeveloperAccount | undefined> {
    const [result] =
      await this.pool.query(
        `
          SELECT
            accounts.developer_id,
            accounts.display_name,
            accounts.status,
            accounts.role,
            accounts.created_at,
            accounts.updated_at
          FROM developer_accounts AS accounts
          INNER JOIN developer_identity_bindings AS bindings
            ON bindings.developer_id =
              accounts.developer_id
          WHERE
            bindings.issuer = ?
            AND bindings.subject = ?
          LIMIT 1
        `,
        [
          issuer,
          subject
        ]
      )

    const rows =
      result as unknown as DeveloperAccountRow[]

    const row = rows[0]

    return row === undefined
      ? undefined
      : this.mapRow(row)
  }

  async create(
    account: DeveloperAccount,
    binding: DeveloperIdentityBinding
  ): Promise<void> {
    if (
      binding.developerId !==
      account.developerId
    ) {
      throw new Error(
        'developer-account-binding-id-mismatch'
      )
    }

    const connection =
      await this.pool.getConnection()

    try {
      await connection.beginTransaction()

      await connection.execute(
        `
          INSERT INTO developer_accounts (
            developer_id,
            display_name,
            status,
            role,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          account.developerId,
          account.displayName ?? null,
          account.status,
          account.role,
          account.createdAt,
          account.updatedAt
        ]
      )

      await connection.execute(
        `
          INSERT INTO developer_identity_bindings (
            developer_id,
            issuer,
            subject,
            created_at
          )
          VALUES (?, ?, ?, ?)
        `,
        [
          binding.developerId,
          binding.issuer,
          binding.subject,
          binding.createdAt
        ]
      )

      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  async addExternalIdentityBinding(
    binding: DeveloperIdentityBinding
  ): Promise<void> {
    await this.pool.execute(
      `
        INSERT INTO developer_identity_bindings (
          developer_id,
          issuer,
          subject,
          created_at
        )
        VALUES (?, ?, ?, ?)
      `,
      [
        binding.developerId,
        binding.issuer,
        binding.subject,
        binding.createdAt
      ]
    )
  }

  private mapRow(
    row: DeveloperAccountRow
  ): DeveloperAccount {
    return {
      developerId:
        row.developer_id,

      displayName:
        row.display_name ?? undefined,

      status:
        row.status,

      role:
        row.role,

      createdAt:
        new Date(row.created_at),

      updatedAt:
        new Date(row.updated_at)
    }
  }
}
