import {
  describe,
  expect,
  it,
  vi
} from 'vitest'

import type {
  AgentSummary
} from '@m2oath/control-plane-client'

import type {
  AuthenticationRequest
} from '@m2oath/agent'

import {
  HostedAgentRegistrationService
} from '../src/hosted-agent-registration-service.js'

describe(
  'HostedAgentRegistrationService',
  () => {
    const authentication:
      AuthenticationRequest = {
        credential: 'developer-jwt'
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
          'https://issuer.example'
      }
    }

    it(
      'resolves Developer before registering Agent and assigns ownership',
      async () => {
        const callOrder: string[] = []

        const developerAccountGateway = {
          resolveAuthenticated:
            vi.fn(async () => {
              callOrder.push(
                'developer'
              )

              return {
                developerId:
                  'dev_123',

                status:
                  'active',

                role:
                  'developer',

                createdAt:
                  new Date(
                    '2026-09-08T21:00:00Z'
                  ),

                updatedAt:
                  new Date(
                    '2026-09-08T21:00:00Z'
                  )
              }
            })
        }

        const agent:
          AgentSummary = {
            agentId:
              'agt_123',

            displayName:
              'Weather Agent',

            status:
              'active'
          }

        const registrationGateway = {
          registerAgent:
            vi.fn(async () => {
              callOrder.push(
                'agent'
              )

              return agent
            })
        }

        const relationshipService = {
          assignOwner:
            vi.fn(
              async (
                developerId: string,
                agentId: string
              ) => {
                callOrder.push(
                  'relationship'
                )

                return {
                  developerId,
                  agentId,
                  relationship:
                    'owner' as const,

                  createdAt:
                    new Date(
                      '2026-09-08T21:00:00Z'
                    )
                }
              }
            )
        }

        const service =
          new HostedAgentRegistrationService({
            developerAccountGateway:
              developerAccountGateway as never,

            registrationGateway,

            relationshipService:
              relationshipService as never
          })

        const result =
          await service.registerAgent(
            request,
            authentication
          )

        expect(result).toEqual(
          agent
        )

        expect(callOrder).toEqual([
          'developer',
          'agent',
          'relationship'
        ])

        expect(
          developerAccountGateway
            .resolveAuthenticated
        ).toHaveBeenCalledWith(
          authentication
        )

        expect(
          registrationGateway
            .registerAgent
        ).toHaveBeenCalledWith(
          request,
          authentication
        )

        expect(
          relationshipService
            .assignOwner
        ).toHaveBeenCalledWith(
          'dev_123',
          'agt_123'
        )
      }
    )

    it(
      'recovers an existing canonical Agent and assigns ownership without registering again',
      async () => {
        const developerAccountGateway = {
          resolveAuthenticated:
            vi.fn(async () => ({
              developerId:
                'dev_123',

              status:
                'active',

              role:
                'developer',

              createdAt:
                new Date(
                  '2026-09-08T21:00:00Z'
                ),

              updatedAt:
                new Date(
                  '2026-09-08T21:00:00Z'
                )
            }))
        }

        const recoveredAgent:
          AgentSummary = {
            agentId:
              'agt_existing',

            displayName:
              'Weather Agent',

            status:
              'active'
          }

        const recoveryGateway = {
          findRecoverableAgent:
            vi.fn(
              async () =>
                recoveredAgent
            )
        }

        const registrationGateway = {
          registerAgent:
            vi.fn()
        }

        const relationshipService = {
          assignOwner:
            vi.fn(
              async (
                developerId: string,
                agentId: string
              ) => ({
                developerId,
                agentId,
                relationship:
                  'owner' as const,

                createdAt:
                  new Date(
                    '2026-09-08T21:00:00Z'
                  )
              })
            )
        }

        const service =
          new HostedAgentRegistrationService({
            developerAccountGateway:
              developerAccountGateway as never,

            registrationGateway,

            recoveryGateway,

            relationshipService:
              relationshipService as never
          })

        const result =
          await service.registerAgent(
            request,
            authentication
          )

        expect(result).toEqual(
          recoveredAgent
        )

        expect(
          recoveryGateway
            .findRecoverableAgent
        ).toHaveBeenCalledOnce()

        expect(
          recoveryGateway
            .findRecoverableAgent
        ).toHaveBeenCalledWith(
          request,
          authentication
        )

        expect(
          registrationGateway
            .registerAgent
        ).not.toHaveBeenCalled()

        expect(
          relationshipService
            .assignOwner
        ).toHaveBeenCalledWith(
          'dev_123',
          'agt_existing'
        )
      }
    )

    it(
      'recovers an Agent after registration fails and then assigns ownership',
      async () => {
        const developerAccountGateway = {
          resolveAuthenticated:
            vi.fn(async () => ({
              developerId:
                'dev_123',

              status:
                'active',

              role:
                'developer',

              createdAt:
                new Date(
                  '2026-09-08T21:00:00Z'
                ),

              updatedAt:
                new Date(
                  '2026-09-08T21:00:00Z'
                )
            }))
        }

        const recoveredAgent:
          AgentSummary = {
            agentId:
              'agt_raced',

            displayName:
              'Weather Agent',

            status:
              'active'
          }

        const recoveryGateway = {
          findRecoverableAgent:
            vi.fn()
              .mockResolvedValueOnce(
                undefined
              )
              .mockResolvedValueOnce(
                recoveredAgent
              )
        }

        const registrationGateway = {
          registerAgent:
            vi.fn(async () => {
              throw new Error(
                'registration-failed'
              )
            })
        }

        const relationshipService = {
          assignOwner:
            vi.fn(
              async (
                developerId: string,
                agentId: string
              ) => ({
                developerId,
                agentId,
                relationship:
                  'owner' as const,

                createdAt:
                  new Date(
                    '2026-09-08T21:00:00Z'
                  )
              })
            )
        }

        const service =
          new HostedAgentRegistrationService({
            developerAccountGateway:
              developerAccountGateway as never,

            registrationGateway,

            recoveryGateway,

            relationshipService:
              relationshipService as never
          })

        const result =
          await service.registerAgent(
            request,
            authentication
          )

        expect(result).toEqual(
          recoveredAgent
        )

        expect(
          recoveryGateway
            .findRecoverableAgent
        ).toHaveBeenCalledTimes(2)

        expect(
          registrationGateway
            .registerAgent
        ).toHaveBeenCalledOnce()

        expect(
          relationshipService
            .assignOwner
        ).toHaveBeenCalledWith(
          'dev_123',
          'agt_raced'
        )
      }
    )

    it(
      'preserves the original registration failure when safe recovery is unavailable',
      async () => {
        const developerAccountGateway = {
          resolveAuthenticated:
            vi.fn(async () => ({
              developerId:
                'dev_123',

              status:
                'active',

              role:
                'developer',

              createdAt:
                new Date(
                  '2026-09-08T21:00:00Z'
                ),

              updatedAt:
                new Date(
                  '2026-09-08T21:00:00Z'
                )
            }))
        }

        const recoveryGateway = {
          findRecoverableAgent:
            vi.fn(
              async () =>
                undefined
            )
        }

        const registrationGateway = {
          registerAgent:
            vi.fn(async () => {
              throw new Error(
                'registration-failed'
              )
            })
        }

        const relationshipService = {
          assignOwner:
            vi.fn()
        }

        const service =
          new HostedAgentRegistrationService({
            developerAccountGateway:
              developerAccountGateway as never,

            registrationGateway,

            recoveryGateway,

            relationshipService:
              relationshipService as never
          })

        await expect(
          service.registerAgent(
            request,
            authentication
          )
        ).rejects.toThrow(
          'registration-failed'
        )

        expect(
          recoveryGateway
            .findRecoverableAgent
        ).toHaveBeenCalledTimes(2)

        expect(
          relationshipService
            .assignOwner
        ).not.toHaveBeenCalled()
      }
    )

    it(
      'does not register an Agent when Developer resolution fails',
      async () => {
        const developerAccountGateway = {
          resolveAuthenticated:
            vi.fn(async () => {
              throw new Error(
                'developer-account-not-found'
              )
            })
        }

        const registrationGateway = {
          registerAgent:
            vi.fn()
        }

        const relationshipService = {
          assignOwner:
            vi.fn()
        }

        const service =
          new HostedAgentRegistrationService({
            developerAccountGateway:
              developerAccountGateway as never,

            registrationGateway,

            relationshipService:
              relationshipService as never
          })

        await expect(
          service.registerAgent(
            request,
            authentication
          )
        ).rejects.toThrow(
          'developer-account-not-found'
        )

        expect(
          registrationGateway
            .registerAgent
        ).not.toHaveBeenCalled()

        expect(
          relationshipService
            .assignOwner
        ).not.toHaveBeenCalled()
      }
    )

    it(
      'does not assign ownership when Agent registration fails',
      async () => {
        const developerAccountGateway = {
          resolveAuthenticated:
            vi.fn(async () => ({
              developerId:
                'dev_123',

              status:
                'active',

              role:
                'developer',

              createdAt:
                new Date(
                  '2026-09-08T21:00:00Z'
                ),

              updatedAt:
                new Date(
                  '2026-09-08T21:00:00Z'
                )
            }))
        }

        const registrationGateway = {
          registerAgent:
            vi.fn(async () => {
              throw new Error(
                'registration-failed'
              )
            })
        }

        const relationshipService = {
          assignOwner:
            vi.fn()
        }

        const service =
          new HostedAgentRegistrationService({
            developerAccountGateway:
              developerAccountGateway as never,

            registrationGateway,

            relationshipService:
              relationshipService as never
          })

        await expect(
          service.registerAgent(
            request,
            authentication
          )
        ).rejects.toThrow(
          'registration-failed'
        )

        expect(
          relationshipService
            .assignOwner
        ).not.toHaveBeenCalled()
      }
    )
  }
)
