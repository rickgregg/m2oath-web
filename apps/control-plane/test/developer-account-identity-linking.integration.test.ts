import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it
} from 'vitest'

import {
  checkMysqlPersistenceConnection,
  createMysqlPersistencePool,
  type Pool
} from '@m2oath/persistence-mysql'

import {
  DeveloperAccountService
} from '../src/developer/developer-account-service.js'

import {
  MysqlDeveloperAccountStore
} from '../src/developer/mysql-developer-account-store.js'

describe(
  'Developer Account identity linking integration',
  () => {
    let pool: Pool

    beforeAll(async () => {
      pool =
        createMysqlPersistencePool({
          host: '127.0.0.1',
          port: 33077,
          database: 'm2oath_test',
          user: 'm2oath_test',
          password:
            'm2oath_test_password'
        })

      await checkMysqlPersistenceConnection(
        pool
      )
    })

    beforeEach(async () => {
      await pool.query(
        'DELETE FROM developer_agent_relationships'
      )

      await pool.query(
        'DELETE FROM developer_identity_bindings'
      )

      await pool.query(
        'DELETE FROM developer_accounts'
      )
    })

    afterAll(async () => {
      await pool.end()
    })

    function createService() {
      const store =
        new MysqlDeveloperAccountStore(
          pool
        )

      return new DeveloperAccountService(
        store
      )
    }

    it(
      'allows one canonical Developer Account to have multiple external identities',
      async () => {
        const service =
          createService()

        const developer =
          await service.resolveOrCreate({
            issuer:
              'https://issuer.example/',
            subject:
              'primary-identity',
            displayName:
              'Linked Developer'
          })

        await service.linkExternalIdentity(
          developer.developerId,
          {
            issuer:
              'https://issuer.example/',
            subject:
              'secondary-identity'
          }
        )

        const resolved =
          await service.findByExternalIdentity(
            'https://issuer.example/',
            'secondary-identity'
          )

        expect(
          resolved?.developerId
        ).toBe(
          developer.developerId
        )

        const [result] =
          await pool.query(
            `
              SELECT COUNT(*) AS binding_count
              FROM developer_identity_bindings
              WHERE developer_id = ?
            `,
            [
              developer.developerId
            ]
          )

        const rows =
          result as unknown as Array<{
            binding_count: number
          }>

        expect(
          Number(
            rows[0]?.binding_count
          )
        ).toBe(
          2
        )
      }
    )

    it(
      'rejects linking an external identity already owned by another Developer Account',
      async () => {
        const service =
          createService()

        const first =
          await service.resolveOrCreate({
            issuer:
              'https://issuer.example/',
            subject:
              'first-primary'
          })

        const second =
          await service.resolveOrCreate({
            issuer:
              'https://issuer.example/',
            subject:
              'second-primary'
          })

        await expect(
          service.linkExternalIdentity(
            first.developerId,
            {
              issuer:
                'https://issuer.example/',
              subject:
                'second-primary'
            }
          )
        ).rejects.toThrow(
          'developer-external-identity-already-bound'
        )

        const resolved =
          await service.findByExternalIdentity(
            'https://issuer.example/',
            'second-primary'
          )

        expect(
          resolved?.developerId
        ).toBe(
          second.developerId
        )
      }
    )
  }
)
