import {
  describe,
  expect,
  it,
  vi
} from 'vitest'

import type {
  RunTrustPolicyWorkbenchSimulationRequest,
  TrustPolicyWorkbenchResult,
  TrustPopulationWorkbenchResult
} from '@m2oath/trust-simulation-client'

import {
  M2OathTrustSimulationGateway
} from '../src/m2oath-trust-simulation-gateway.js'

describe(
  'M2OathTrustSimulationGateway',
  () => {
    it(
      'delegates the simulation request to the remote client',
      async () => {
        const request:
          RunTrustPolicyWorkbenchSimulationRequest = {
            scenarioId:
              'normal-trust-growth'
          }

        const result:
          TrustPolicyWorkbenchResult = {
            scenario: {
              id:
                'normal-trust-growth',
              name:
                'Normal Trust Growth',
              startedAt:
                '2026-01-01T00:00:00.000Z',
              completedAt:
                '2026-01-01T00:30:00.000Z'
            },

            model: {
              modelId:
                'm2oath-workbench',
              modelVersion:
                '1',
              configurationHash:
                'canonical-day-10'
            },

            timeline: []
          }

        const run =
          vi.fn()
            .mockResolvedValue(result)

        const gateway =
          new M2OathTrustSimulationGateway({
            client: {
              run
            },
            populationClient: {
              run: vi.fn()
            }
          })

        await expect(
          gateway.run(request)
        ).resolves.toBe(result)

        expect(run).toHaveBeenCalledTimes(1)

        expect(run).toHaveBeenCalledWith(
          request
        )
      }
    )

    it(
      'delegates the population simulation to the remote client',
      async () => {
        const result:
          TrustPopulationWorkbenchResult = {
            population: {
              id: 'population-001',
              name: 'Population 001',
              description:
                'Deterministic ten-Agent population isolation baseline.'
            },

            model: {
              modelId:
                'm2oath-workbench',
              modelVersion:
                '3',
              configurationHash:
                'farming-resistance-v1'
            },

            summary: {
              agentCount: 10,
              checkpointCount: 10,
              allowedCount: 5,
              deniedCount: 5,
              compositeScore: {
                minimum: 50,
                maximum: 60,
                average: 55
              }
            },

            agents: []
          }

        const run =
          vi.fn()
            .mockResolvedValue(result)

        const gateway =
          new M2OathTrustSimulationGateway({
            client: {
              run: vi.fn()
            },
            populationClient: {
              run
            }
          })

        await expect(
          gateway.runPopulation()
        ).resolves.toBe(result)

        expect(run).toHaveBeenCalledTimes(1)
        expect(run).toHaveBeenCalledWith()
      }
    )

    it(
      'propagates remote simulation failures',
      async () => {
        const failure =
          new Error(
            'Unable to run M2Oath trust simulation. HTTP 403.'
          )

        const run =
          vi.fn()
            .mockRejectedValue(failure)

        const gateway =
          new M2OathTrustSimulationGateway({
            client: {
              run
            },
            populationClient: {
              run: vi.fn()
            }
          })

        await expect(
          gateway.run({
            scenarioId:
              'repetition-farming'
          })
        ).rejects.toBe(failure)
      }
    )
  }
)
