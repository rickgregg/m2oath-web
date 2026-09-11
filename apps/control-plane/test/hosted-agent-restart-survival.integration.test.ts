import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it
} from 'vitest'

import {
  ConfiguredAgentLifecycleAuthorizationPolicy
} from '@m2oath/agent'

import {
  checkMysqlPersistenceConnection,
  createMysqlPersistencePool,
  type Pool
} from '@m2oath/persistence-mysql'

import {
  M2OathAgentDirectory
} from '../src/agent-store.js'

import {
  createDurableM2OathHostedComposition
} from '../src/m2oath-durable-composition.js'

import {
  M2OathAgentRegistrationGateway
} from '../src/m2oath-agent-registration-gateway.js'

import {
  TEST_DEVELOPER_PRINCIPAL,
  TEST_DEVELOPER_TOKEN,
  TestDeveloperAuthenticationProvider
} from './test-developer-authentication.js'

describe(
  'hosted M2Oath Agent restart survival',
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

    it(
      'reconstructs hosted Agent list and detail from durable state after composition restart',
      async () => {
        const authenticationProvider =
          new TestDeveloperAuthenticationProvider()

        const firstComposition =
          createDurableM2OathHostedComposition({
            authenticationProvider,

            lifecycleAuthorizationPolicy:
              new ConfiguredAgentLifecycleAuthorizationPolicy({
                grants: [
                  {
                    principal:
                      TEST_DEVELOPER_PRINCIPAL,

                    actions: [
                      'agent.create',
                      'agent.rotate-key',
                      'agent.disable'
                    ]
                  }
                ]
              }),

            pool
          })

        const registrationGateway =
          new M2OathAgentRegistrationGateway({
            sdk:
              firstComposition.sdk
          })

        const registeredAgent =
          await registrationGateway.registerAgent(
            {
              displayName:
                'Hosted Restart Agent',

              identifier: {
                type:
                  'jwt',

                issuer:
                  'https://agent-issuer.example',

                value:
                  'hosted-restart-agent'
              },

              cryptographicMaterial: {
                keyId:
                  'hosted-restart-key',

                algorithm:
                  'RS256',

                publicKey:
                  'HOSTED-RESTART-PUBLIC-KEY'
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

        /*
         * Simulate hosted control-plane restart.
         *
         * Do not reuse the first hosted composition or its
         * identityDirectory. A completely fresh hosted composition
         * must reconstruct the Agent through durable MySQL state.
         */

        const restartedComposition =
          createDurableM2OathHostedComposition({
            authenticationProvider,

            lifecycleAuthorizationPolicy:
              new ConfiguredAgentLifecycleAuthorizationPolicy({
                grants: [
                  {
                    principal:
                      TEST_DEVELOPER_PRINCIPAL,

                    actions: [
                      'agent.create',
                      'agent.rotate-key',
                      'agent.disable'
                    ]
                  }
                ]
              }),

            pool
          })

        const restartedDirectory =
          new M2OathAgentDirectory(
            restartedComposition.identityDirectory
          )

        const restartedAgent =
          await restartedDirectory.getAgent(
            registeredAgent.agentId
          )

        expect(
          restartedAgent
        ).toEqual(
          registeredAgent
        )

        const restartedAgents =
          await restartedDirectory.listAgents()

        expect(
          restartedAgents
        ).toContainEqual(
          registeredAgent
        )
      }
    )
  }
)
