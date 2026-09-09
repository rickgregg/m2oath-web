import {
  describe,
  expect,
  it,
  vi
} from 'vitest'

import {
  DeveloperOwnedAgentService
} from '../src/developer-owned-agent-service.js'

describe(
  'DeveloperOwnedAgentService',
  () => {
    it(
      'lists only Agents related to the Developer',
      async () => {
        const relationshipService = {
          listOwnedAgentIds:
            vi.fn(async () => [
              'agt_owned_1',
              'agt_owned_2'
            ])
        }

        const directory = {
          listAgents:
            vi.fn(),

          getAgent:
            vi.fn(async (
              agentId: string
            ) => {
              if (
                agentId ===
                'agt_owned_1'
              ) {
                return {
                  agentId,
                  displayName:
                    'Owned Agent One',
                  status:
                    'active'
                }
              }

              if (
                agentId ===
                'agt_owned_2'
              ) {
                return {
                  agentId,
                  displayName:
                    'Owned Agent Two',
                  status:
                    'active'
                }
              }

              return undefined
            })
        }

        const service =
          new DeveloperOwnedAgentService({
            directory,
            relationshipService:
              relationshipService as never
          })

        const agents =
          await service.listOwnedAgents(
            'dev_123'
          )

        expect(
          relationshipService
            .listOwnedAgentIds
        ).toHaveBeenCalledWith(
          'dev_123'
        )

        expect(agents).toEqual([
          {
            agentId:
              'agt_owned_1',
            displayName:
              'Owned Agent One',
            status:
              'active'
          },
          {
            agentId:
              'agt_owned_2',
            displayName:
              'Owned Agent Two',
            status:
              'active'
          }
        ])
      }
    )

    it(
      'returns an owned Agent',
      async () => {
        const relationshipService = {
          isOwner:
            vi.fn(async () => true)
        }

        const directory = {
          listAgents:
            vi.fn(),

          getAgent:
            vi.fn(async () => ({
              agentId:
                'agt_owned',
              displayName:
                'Owned Agent',
              status:
                'active'
            }))
        }

        const service =
          new DeveloperOwnedAgentService({
            directory,
            relationshipService:
              relationshipService as never
          })

        const agent =
          await service.getOwnedAgent(
            'dev_123',
            'agt_owned'
          )

        expect(
          relationshipService
            .isOwner
        ).toHaveBeenCalledWith(
          'dev_123',
          'agt_owned'
        )

        expect(agent).toEqual({
          agentId:
            'agt_owned',
          displayName:
            'Owned Agent',
          status:
            'active'
        })
      }
    )

    it(
      'does not expose an Agent without an ownership relationship',
      async () => {
        const relationshipService = {
          isOwner:
            vi.fn(async () => false)
        }

        const directory = {
          listAgents:
            vi.fn(),

          getAgent:
            vi.fn()
        }

        const service =
          new DeveloperOwnedAgentService({
            directory,
            relationshipService:
              relationshipService as never
          })

        const agent =
          await service.getOwnedAgent(
            'dev_123',
            'agt_foreign'
          )

        expect(agent).toBeUndefined()

        expect(
          directory.getAgent
        ).not.toHaveBeenCalled()
      }
    )

    it(
      'omits relationship rows whose canonical Agent no longer resolves',
      async () => {
        const relationshipService = {
          listOwnedAgentIds:
            vi.fn(async () => [
              'agt_existing',
              'agt_missing'
            ])
        }

        const directory = {
          listAgents:
            vi.fn(),

          getAgent:
            vi.fn(async (
              agentId: string
            ) => {
              if (
                agentId ===
                'agt_existing'
              ) {
                return {
                  agentId,
                  displayName:
                    'Existing Agent',
                  status:
                    'active'
                }
              }

              return undefined
            })
        }

        const service =
          new DeveloperOwnedAgentService({
            directory,
            relationshipService:
              relationshipService as never
          })

        const agents =
          await service.listOwnedAgents(
            'dev_123'
          )

        expect(agents).toEqual([
          {
            agentId:
              'agt_existing',
            displayName:
              'Existing Agent',
            status:
              'active'
          }
        ])
      }
    )
  }
)
