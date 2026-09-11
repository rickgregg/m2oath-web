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
        authenticatedSubject?: string
        authenticatedIssuer?: string
        resolved?: boolean
        provenanceSubject?: string
        provenanceIssuer?: string
      }
    ) {
      const authenticationProvider = {
        authenticate:
          vi.fn(async () => ({
            authenticated:
              true as const,

            assertion: {
              type:
                'oauth-subject',

              subject:
                options?.authenticatedSubject ??
                'developer-123',

              issuer:
                options?.authenticatedIssuer ??
                'https://developer.example',

              authenticatedAt:
                new Date(
                  '2026-09-09T21:00:00Z'
                )
            }
          }))
      }

      const identityResolver = {
        resolve:
          vi.fn(async () =>
            options?.resolved === false
              ? {
                  resolved:
                    false as const,

                  reason:
                    'identity-not-found' as const
                }
              : {
                  resolved:
                    true as const,

                  identity
                }
          )
      }

      const provenanceStore = {
        create:
          vi.fn(),

        findByAgentId:
          vi.fn(async () => ({
            agentId:
              'agt_existing',

            createdBy: {
              type:
                'oauth-subject',

              subject:
                options?.provenanceSubject ??
                'developer-123',

              issuer:
                options?.provenanceIssuer ??
                'https://developer.example'
            },

            createdAt:
              new Date(
                '2026-09-09T21:00:00Z'
              )
          }))
      }

      const gateway =
        new M2OathAgentRegistrationRecoveryGateway({
          authenticationProvider,
          identityResolver,
          provenanceStore,
          now:
            () =>
              new Date(
                '2026-09-09T21:30:00Z'
              )
        })

      return {
        gateway,
        authenticationProvider,
        identityResolver,
        provenanceStore
      }
    }

    it(
      'recovers an existing Agent registered by the authenticated principal',
      async () => {
        const {
          gateway,
          identityResolver,
          provenanceStore
        } =
          createGateway()

        const result =
          await gateway.findRecoverableAgent(
            request,
            authentication
          )

        expect(result).toEqual({
          agentId:
            'agt_existing',

          displayName:
            'Weather Agent',

          status:
            'active'
        })

        expect(
          identityResolver.resolve
        ).toHaveBeenCalledWith({
          type:
            'oauth-client',

          subject:
            'weather-agent-client',

          issuer:
            'https://agent-issuer.example',

          authenticatedAt:
            new Date(
              '2026-09-09T21:30:00Z'
            )
        })

        expect(
          provenanceStore
            .findByAgentId
        ).toHaveBeenCalledWith(
          'agt_existing'
        )
      }
    )

    it(
      'does not recover when the external identifier does not resolve',
      async () => {
        const {
          gateway,
          provenanceStore
        } =
          createGateway({
            resolved:
              false
          })

        const result =
          await gateway.findRecoverableAgent(
            request,
            authentication
          )

        expect(result).toBeUndefined()

        expect(
          provenanceStore
            .findByAgentId
        ).not.toHaveBeenCalled()
      }
    )

    it(
      'does not recover an Agent registered by another principal',
      async () => {
        const {
          gateway
        } =
          createGateway({
            provenanceSubject:
              'another-developer'
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
      'requires registration provenance issuer to match the authenticated principal',
      async () => {
        const {
          gateway
        } =
          createGateway({
            provenanceIssuer:
              'https://other-developer.example'
          })

        const result =
          await gateway.findRecoverableAgent(
            request,
            authentication
          )

        expect(result).toBeUndefined()
      }
    )
  }
)
