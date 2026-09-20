import {
  describe,
  expect,
  it,
  vi
} from 'vitest'

import type {
  AgentIdentity,
  AuthenticationRequest
} from '@m2oath/agent'

import {
  M2OathAgentRegistrationRecoveryGateway
} from '../src/m2oath-agent-registration-recovery-gateway.js'

describe(
  'M2OathAgentRegistrationRecoveryGateway',
  () => {
    const authentication:
      AuthenticationRequest = {
        credential:
          'developer-jwt'
      }

    const request = {
      displayName:
        'Weather Agent',

      identifier: {
        type:
          'oauth-client',

        value:
          'weather-agent-client',

        issuer:
          'https://agent-issuer.example'
      }
    }

    const identity:
      AgentIdentity = {
        id:
          'agt_existing',

        displayName:
          'Weather Agent',

        status:
          'active',

        externalIdentifiers:
          [],

        createdAt:
          new Date(
            '2026-09-09T21:00:00Z'
          ),

        updatedAt:
          new Date(
            '2026-09-09T21:00:00Z'
          )
      }

    function createGateway(
      options?: {
        authenticated?: boolean
        recovered?: boolean
      }
    ) {
      const assertion = {
        type:
          'oauth-subject',

        subject:
          'developer-123',

        issuer:
          'https://developer.example',

        authenticatedAt:
          new Date(
            '2026-09-09T21:00:00Z'
          )
      } as const

      const authenticationProvider = {
        authenticate:
          vi.fn(async () =>
            options?.authenticated === false
              ? {
                  authenticated:
                    false as const,

                  reason:
                    'invalid-developer-credential'
                }
              : {
                  authenticated:
                    true as const,

                  assertion
                }
          )
      }

      const recoveryClient = {
        findRecoverableAgent:
          vi.fn(async () =>
            options?.recovered === false
              ? undefined
              : identity
          )
      }

      const gateway =
        new M2OathAgentRegistrationRecoveryGateway({
          authenticationProvider,
          recoveryClient
        })

      return {
        gateway,
        authenticationProvider,
        recoveryClient,
        assertion
      }
    }

    it(
      'forwards the authenticated principal and Agent identifier to M2Oath Trust',
      async () => {
        const {
          gateway,
          recoveryClient,
          assertion
        } =
          createGateway()

        const result =
          await gateway.findRecoverableAgent(
            request,
            authentication
          )

        expect(
          recoveryClient.findRecoverableAgent
        ).toHaveBeenCalledWith({
          identifier: {
            type:
              'oauth-client',

            value:
              'weather-agent-client',

            issuer:
              'https://agent-issuer.example'
          },

          principal:
            assertion
        })

        expect(result).toEqual({
          agentId:
            'agt_existing',

          displayName:
            'Weather Agent',

          status:
            'active'
        })
      }
    )

    it(
      'returns undefined when M2Oath Trust finds no recoverable Agent',
      async () => {
        const {
          gateway
        } =
          createGateway({
            recovered:
              false
          })

        const result =
          await gateway.findRecoverableAgent(
            request,
            authentication
          )

        expect(result).toBeUndefined()
      }
    )

    it(
      'does not call M2Oath Trust when human authentication fails',
      async () => {
        const {
          gateway,
          recoveryClient
        } =
          createGateway({
            authenticated:
              false
          })

        const result =
          await gateway.findRecoverableAgent(
            request,
            authentication
          )

        expect(result).toBeUndefined()

        expect(
          recoveryClient.findRecoverableAgent
        ).not.toHaveBeenCalled()
      }
    )

    it(
      'maps the canonical Trust identity to the Raven Agent summary',
      async () => {
        const {
          gateway
        } =
          createGateway()

        const result =
          await gateway.findRecoverableAgent(
            request,
            authentication
          )

        expect(result).toEqual({
          agentId:
            identity.id,

          displayName:
            identity.displayName,

          status:
            identity.status
        })
      }
    )
  }
)
