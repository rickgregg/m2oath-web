import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it
} from 'vitest'

import {
  ConfiguredAgentLifecycleAuthorizationPolicy,
  StoredAgentIdentityResolver
} from '@m2oath/agent'

import {
  checkMysqlPersistenceConnection,
  createMysqlPersistencePool,
  MysqlAgentIdentityBindingStore,
  MysqlAgentIdentityStore,
  MysqlAgentRegistrationProvenanceStore,
  type Pool
} from '@m2oath/persistence-mysql'

import {
  M2OathAgentDirectory
} from '../src/agent-store.js'

import {
  DeveloperAccountGateway
} from '../src/developer/developer-account-gateway.js'

import {
  DeveloperAccountService
} from '../src/developer/developer-account-service.js'

import {
  DeveloperAgentRelationshipService
} from '../src/developer/developer-agent-relationship-service.js'

import {
  MysqlDeveloperAccountStore
} from '../src/developer/mysql-developer-account-store.js'

import {
  MysqlDeveloperAgentRelationshipStore
} from '../src/developer/mysql-developer-agent-relationship-store.js'

import {
  DeveloperOwnedAgentService
} from '../src/developer-owned-agent-service.js'

import {
  HostedAgentRegistrationService
} from '../src/hosted-agent-registration-service.js'

import {
  createDurableM2OathHostedComposition
} from '../src/m2oath-durable-composition.js'

import {
  M2OathAgentRegistrationGateway
} from '../src/m2oath-agent-registration-gateway.js'

import {
  M2OathAgentRegistrationRecoveryGateway
} from '../src/m2oath-agent-registration-recovery-gateway.js'

import {
  TEST_DEVELOPER_PRINCIPAL,
  TEST_DEVELOPER_TOKEN,
  TestDeveloperAuthenticationProvider
} from './test-developer-authentication.js'

describe(
  'Developer Agent ownership acceptance',
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

    it(
      'preserves Developer ownership of a registered Agent across hosted composition reconstruction',
      async () => {
        const authenticationProvider =
          new TestDeveloperAuthenticationProvider()

        /*
         * First hosted composition.
         *
         * This models the Developer signing in and creating an Agent
         * through the hosted control plane.
         */

        const firstM2Oath =
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

        const firstDeveloperAccountStore =
          new MysqlDeveloperAccountStore(
            pool
          )

        const firstDeveloperAccountService =
          new DeveloperAccountService(
            firstDeveloperAccountStore
          )

        const firstDeveloperAccountGateway =
          new DeveloperAccountGateway(
            authenticationProvider,
            firstDeveloperAccountService
          )

        const firstRelationshipStore =
          new MysqlDeveloperAgentRelationshipStore(
            pool
          )

        const firstRelationshipService =
          new DeveloperAgentRelationshipService({
            store:
              firstRelationshipStore
          })

        const firstRegistrationGateway =
          new M2OathAgentRegistrationGateway({
            sdk:
              firstM2Oath.sdk
          })

        const firstHostedRegistrationService =
          new HostedAgentRegistrationService({
            developerAccountGateway:
              firstDeveloperAccountGateway,

            registrationGateway:
              firstRegistrationGateway,

            relationshipService:
              firstRelationshipService
          })

        const authentication = {
          credential:
            TEST_DEVELOPER_TOKEN
        }

        const developer =
          await firstDeveloperAccountGateway.bootstrap({
            authentication,
            displayName:
              'Acceptance Developer'
          })

        expect(
          developer.status
        ).toBe(
          'active'
        )

        const registeredAgent =
          await firstHostedRegistrationService.registerAgent(
            {
              displayName:
                'Owned Acceptance Agent',

              identifier: {
                type:
                  'jwt',

                issuer:
                  'https://agent-issuer.example',

                value:
                  'owned-acceptance-agent'
              },

              cryptographicMaterial: {
                keyId:
                  'owned-acceptance-key',

                algorithm:
                  'RS256',

                publicKey:
                  'OWNED-ACCEPTANCE-PUBLIC-KEY'
              }
            },

            authentication
          )

        expect(
          registeredAgent.status
        ).toBe(
          'active'
        )

        /*
         * Simulate a hosted control-plane restart.
         *
         * Reconstruct every hosted service from durable MySQL state.
         * No first-composition Developer Account, relationship service,
         * Agent directory, or registration service is reused.
         */

        const restartedM2Oath =
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
            restartedM2Oath.identityDirectory
          )

        const restartedDeveloperAccountStore =
          new MysqlDeveloperAccountStore(
            pool
          )

        const restartedDeveloperAccountService =
          new DeveloperAccountService(
            restartedDeveloperAccountStore
          )

        const restartedDeveloperAccountGateway =
          new DeveloperAccountGateway(
            authenticationProvider,
            restartedDeveloperAccountService
          )

        const restartedRelationshipStore =
          new MysqlDeveloperAgentRelationshipStore(
            pool
          )

        const restartedRelationshipService =
          new DeveloperAgentRelationshipService({
            store:
              restartedRelationshipStore
          })

        const restartedOwnedAgentService =
          new DeveloperOwnedAgentService({
            directory:
              restartedDirectory,

            relationshipService:
              restartedRelationshipService
          })

        const restartedDeveloper =
          await restartedDeveloperAccountGateway.resolveAuthenticated(
            authentication
          )

        expect(
          restartedDeveloper.developerId
        ).toBe(
          developer.developerId
        )

        const ownedAgents =
          await restartedOwnedAgentService.listOwnedAgents(
            restartedDeveloper.developerId
          )

        expect(
          ownedAgents
        ).toEqual([
          registeredAgent
        ])

        const ownedAgent =
          await restartedOwnedAgentService.getOwnedAgent(
            restartedDeveloper.developerId,
            registeredAgent.agentId
          )

        expect(
          ownedAgent
        ).toEqual(
          registeredAgent
        )
      }
    )

    it(
      'repairs missing Developer ownership on registration retry without creating a second canonical Agent',
      async () => {
        const authenticationProvider =
          new TestDeveloperAuthenticationProvider()

        const authentication = {
          credential:
            TEST_DEVELOPER_TOKEN
        }

        const firstM2Oath =
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

        const developer =
          await developerAccountGateway.bootstrap({
            authentication,
            displayName:
              'Recovery Developer'
          })

        const relationshipStore =
          new MysqlDeveloperAgentRelationshipStore(
            pool
          )

        const relationshipService =
          new DeveloperAgentRelationshipService({
            store:
              relationshipStore
          })

        const registrationGateway =
          new M2OathAgentRegistrationGateway({
            sdk:
              firstM2Oath.sdk
          })

        /*
         * Deliberately fail only the hosted ownership step.
         *
         * Canonical M2Oath Agent enrollment has already committed when
         * assignOwner() is invoked.
         */
        const failingRelationshipService = {
          assignOwner:
            async () => {
              throw new Error(
                'simulated-ownership-write-failure'
              )
            }
        }

        const firstHostedRegistrationService =
          new HostedAgentRegistrationService({
            developerAccountGateway,
            registrationGateway,

            relationshipService:
              failingRelationshipService as never
          })

        const registrationRequest = {
          displayName:
            'Recoverable Acceptance Agent',

          identifier: {
            type:
              'jwt',

            issuer:
              'https://agent-issuer.example',

            value:
              'recoverable-acceptance-agent'
          },

          cryptographicMaterial: {
            keyId:
              'recoverable-acceptance-key',

            algorithm:
              'RS256',

            publicKey:
              'RECOVERABLE-ACCEPTANCE-PUBLIC-KEY'
          }
        }

        await expect(
          firstHostedRegistrationService.registerAgent(
            registrationRequest,
            authentication
          )
        ).rejects.toThrow(
          'simulated-ownership-write-failure'
        )

        const agentsAfterFailure =
          await new M2OathAgentDirectory(
            firstM2Oath.identityDirectory
          ).listAgents()

        expect(
          agentsAfterFailure
        ).toHaveLength(1)

        const canonicalAgent =
          agentsAfterFailure[0]

        expect(
          await relationshipService.isOwner(
            developer.developerId,
            canonicalAgent.agentId
          )
        ).toBe(false)

        /*
         * Reconstruct the hosted process and enable the real M2Oath
         * recovery adapter.
         */

        const restartedM2Oath =
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

        const restartedRegistrationGateway =
          new M2OathAgentRegistrationGateway({
            sdk:
              restartedM2Oath.sdk
          })

        const identityResolver =
          new StoredAgentIdentityResolver(
            new MysqlAgentIdentityBindingStore(
              pool
            ),

            new MysqlAgentIdentityStore(
              pool
            )
          )

        const recoveryGateway =
          new M2OathAgentRegistrationRecoveryGateway({
            authenticationProvider,
            identityResolver,

            provenanceStore:
              new MysqlAgentRegistrationProvenanceStore(
                pool
              )
          })

        const restartedHostedRegistrationService =
          new HostedAgentRegistrationService({
            developerAccountGateway,
            registrationGateway:
              restartedRegistrationGateway,
            recoveryGateway,
            relationshipService
          })

        const recoveredAgent =
          await restartedHostedRegistrationService.registerAgent(
            registrationRequest,
            authentication
          )

        expect(
          recoveredAgent
        ).toEqual(
          canonicalAgent
        )

        expect(
          await relationshipService.isOwner(
            developer.developerId,
            canonicalAgent.agentId
          )
        ).toBe(true)

        const agentsAfterRecovery =
          await new M2OathAgentDirectory(
            restartedM2Oath.identityDirectory
          ).listAgents()

        expect(
          agentsAfterRecovery
        ).toHaveLength(1)

        expect(
          agentsAfterRecovery[0]
        ).toEqual(
          canonicalAgent
        )
      }
    )
  }
)
