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
  DeveloperAccountAgentLifecycleAuthorizationPolicy
} from '../src/developer/developer-account-agent-lifecycle-authorization-policy.js'

import {
  DeveloperAccountGateway
} from '../src/developer/developer-account-gateway.js'

import {
  DeveloperAccountService
} from '../src/developer/developer-account-service.js'

import {
  MysqlDeveloperAccountStore
} from '../src/developer/mysql-developer-account-store.js'

import {
  createDurableM2OathHostedComposition
} from '../src/m2oath-durable-composition.js'

import {
  M2OathAgentRegistrationGateway
} from '../src/m2oath-agent-registration-gateway.js'

import {
  TEST_DEVELOPER_TOKEN,
  TEST_UNAUTHORIZED_DEVELOPER_TOKEN,
  TestDeveloperAuthenticationProvider
} from './test-developer-authentication.js'

describe(
  'Developer Account lifecycle authorization integration',
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

      await pool.query(
        'DELETE FROM agent_lifecycle_audit_events'
      )

      await pool.query(
        'DELETE FROM agent_registration_provenance'
      )

      await pool.query(
        'DELETE FROM agent_cryptographic_bindings'
      )

      await pool.query(
        'DELETE FROM agent_identity_bindings'
      )

      await pool.query(
        'DELETE FROM agent_identities'
      )
    })

    afterAll(async () => {
      await pool.end()
    })

    function createHostedServices() {
      const authenticationProvider =
        new TestDeveloperAuthenticationProvider()

      const developerAccountStore =
        new MysqlDeveloperAccountStore(
          pool
        )

      const developerAccountService =
        new DeveloperAccountService(
          developerAccountStore
        )

      const developerAccountGateway =
        new DeveloperAccountGateway(
          authenticationProvider,
          developerAccountService
        )

      const lifecycleAuthorizationPolicy =
        new DeveloperAccountAgentLifecycleAuthorizationPolicy(
          developerAccountService
        )

      const m2oath =
        createDurableM2OathHostedComposition({
          authenticationProvider,
          lifecycleAuthorizationPolicy,
          pool
        })

      const registrationGateway =
        new M2OathAgentRegistrationGateway({
          sdk:
            m2oath.sdk
        })

      return {
        developerAccountGateway,
        developerAccountStore,
        registrationGateway
      }
    }

    it(
      'allows an active durable Developer Account to register an Agent',
      async () => {
        const {
          developerAccountGateway,
          registrationGateway
        } =
          createHostedServices()

        await developerAccountGateway.bootstrap({
          authentication: {
            credential:
              TEST_DEVELOPER_TOKEN
          },

          displayName:
            'Authorized Developer'
        })

        const registeredAgent =
          await registrationGateway.registerAgent(
            {
              displayName:
                'Authorized Lifecycle Agent',

              identifier: {
                type:
                  'jwt',

                issuer:
                  'https://agent.test.m2oath.local',

                value:
                  'authorized-lifecycle-agent'
              },

              cryptographicMaterial: {
                keyId:
                  'authorized-lifecycle-key',

                algorithm:
                  'RS256',

                publicKey:
                  'AUTHORIZED-LIFECYCLE-PUBLIC-KEY'
              }
            },

            {
              credential:
                TEST_DEVELOPER_TOKEN
            }
          )

        expect(
          registeredAgent.status
        ).toBe(
          'active'
        )
      }
    )

    it(
      'denies an authenticated principal without a canonical Developer Account',
      async () => {
        const {
          registrationGateway
        } =
          createHostedServices()

        await expect(
          registrationGateway.registerAgent(
            {
              displayName:
                'Unauthorized Lifecycle Agent',

              identifier: {
                type:
                  'jwt',

                issuer:
                  'https://agent.test.m2oath.local',

                value:
                  'unauthorized-lifecycle-agent'
              },

              cryptographicMaterial: {
                keyId:
                  'unauthorized-lifecycle-key',

                algorithm:
                  'RS256',

                publicKey:
                  'UNAUTHORIZED-LIFECYCLE-PUBLIC-KEY'
              }
            },

            {
              credential:
                TEST_UNAUTHORIZED_DEVELOPER_TOKEN
            }
          )
        ).rejects.toThrow(
          /agent-lifecycle-action-not-authorized/
        )
      }
    )

    it(
      'denies a Developer whose durable account is disabled',
      async () => {
        const {
          developerAccountGateway,
          developerAccountStore,
          registrationGateway
        } =
          createHostedServices()

        const developer =
          await developerAccountGateway.bootstrap({
            authentication: {
              credential:
                TEST_DEVELOPER_TOKEN
            },

            displayName:
              'Disabled Developer'
          })

        await pool.query(
          `
            UPDATE developer_accounts
            SET status = 'disabled'
            WHERE developer_id = ?
          `,
          [
            developer.developerId
          ]
        )

        const disabledDeveloper =
          await developerAccountStore.findById(
            developer.developerId
          )

        expect(
          disabledDeveloper?.status
        ).toBe(
          'disabled'
        )

        await expect(
          registrationGateway.registerAgent(
            {
              displayName:
                'Disabled Developer Agent',

              identifier: {
                type:
                  'jwt',

                issuer:
                  'https://agent.test.m2oath.local',

                value:
                  'disabled-developer-agent'
              },

              cryptographicMaterial: {
                keyId:
                  'disabled-developer-key',

                algorithm:
                  'RS256',

                publicKey:
                  'DISABLED-DEVELOPER-PUBLIC-KEY'
              }
            },

            {
              credential:
                TEST_DEVELOPER_TOKEN
            }
          )
        ).rejects.toThrow(
          /agent-lifecycle-action-not-authorized/
        )
      }
    )
  }
)
