import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

const runTrustSimulation
  = vi.fn()

const httpControlPlaneClientConstructor
  = vi.fn()

const getValidControlPlaneAccessToken
  = vi.fn()

vi.mock(
  '../server/auth/control-plane-credential',
  () => ({
    getValidControlPlaneAccessToken
  })
)

vi.mock(
  '@m2oath/control-plane-client',
  () => {
    class ControlPlaneHttpError
      extends Error {
      constructor(
        public readonly status: number,
        public readonly statusText: string
      ) {
        super(
          `M2Oath control-plane request failed: ${status} ${statusText}`
        )

        this.name
          = 'ControlPlaneHttpError'
      }
    }

    class HttpControlPlaneClient {
      constructor(options: unknown) {
        httpControlPlaneClientConstructor(
          options
        )
      }

      runTrustSimulation
        = runTrustSimulation
    }

    return {
      ControlPlaneHttpError,
      HttpControlPlaneClient
    }
  }
)

describe(
  'Developer trust simulation route',
  () => {
    beforeEach(() => {
      vi.resetModules()
      vi.clearAllMocks()

      getValidControlPlaneAccessToken
        .mockResolvedValue(
          'developer-access-token'
        )

      vi.stubGlobal(
        'defineEventHandler',
        vi.fn(
          (
            handler: (
              event: unknown
            ) => unknown
          ) => handler
        )
      )

      vi.stubGlobal(
        'requireUserSession',
        vi.fn().mockResolvedValue({
          user: {
            subject:
              'developer-subject',

            developerId:
              'dev-123'
          },

          secure: {
            controlPlaneAccessToken:
              'developer-access-token'
          }
        })
      )

      vi.stubGlobal(
        'useRuntimeConfig',
        vi.fn().mockReturnValue({
          controlPlaneBaseUrl:
            'http://localhost:4000'
        })
      )

      vi.stubGlobal(
        'readBody',
        vi.fn().mockResolvedValue({
          scenarioId:
            'normal-trust-growth'
        })
      )

      vi.stubGlobal(
        'createError',
        vi.fn(
          (input: unknown) =>
            input
        )
      )
    })

    it(
      'runs the requested simulation through the authenticated control-plane client',
      async () => {
        const simulationResult = {
          scenario: {
            id:
              'normal-trust-growth',

            name:
              'Normal trust growth',

            startedAt:
              '2026-09-21T12:00:00.000Z',

            completedAt:
              '2026-09-21T12:05:00.000Z'
          },

          model: {
            id:
              'm2oath-trust',

            version:
              '1'
          },

          timeline: []
        }

        runTrustSimulation
          .mockResolvedValueOnce(
            simulationResult
          )

        const {
          default: handler
        } = await import(
          '../server/api/trust-simulations/index.post'
        )

        const result =
          await handler({})

        expect(
          httpControlPlaneClientConstructor
        ).toHaveBeenCalledWith({
          baseUrl:
            'http://localhost:4000',

          bearerToken:
            'developer-access-token'
        })

        expect(
          runTrustSimulation
        ).toHaveBeenCalledOnce()

        expect(
          runTrustSimulation
        ).toHaveBeenCalledWith({
          scenarioId:
            'normal-trust-growth'
        })

        expect(
          runTrustSimulation.mock.calls[0]?.[0]
        ).not.toHaveProperty(
          'credential'
        )

        expect(
          JSON.stringify(
            runTrustSimulation.mock.calls[0]?.[0]
          )
        ).not.toContain(
          'developer-access-token'
        )

        expect(result).toEqual(
          simulationResult
        )
      }
    )

    it.each([
      {
        upstreamStatus: 400,
        upstreamStatusText: 'Bad Request',
        expectedStatus: 400,
        expectedStatusMessage:
          'Invalid trust simulation request'
      },
      {
        upstreamStatus: 401,
        upstreamStatusText: 'Unauthorized',
        expectedStatus: 401,
        expectedStatusMessage:
          'Developer authentication failed'
      },
      {
        upstreamStatus: 403,
        upstreamStatusText: 'Forbidden',
        expectedStatus: 403,
        expectedStatusMessage:
          'Developer is not authorized to run trust simulations'
      },
      {
        upstreamStatus: 502,
        upstreamStatusText: 'Bad Gateway',
        expectedStatus: 502,
        expectedStatusMessage:
          'Trust simulation service failed'
      }
    ])(
      'translates control-plane trust simulation failures: $upstreamStatus',
      async ({
        upstreamStatus,
        upstreamStatusText,
        expectedStatus,
        expectedStatusMessage
      }) => {
        const {
          ControlPlaneHttpError
        } = await import(
          '@m2oath/control-plane-client'
        )

        runTrustSimulation
          .mockRejectedValueOnce(
            new ControlPlaneHttpError(
              upstreamStatus,
              upstreamStatusText
            )
          )

        const {
          default: handler
        } = await import(
          '../server/api/trust-simulations/index.post'
        )

        await expect(
          handler({})
        ).rejects.toEqual({
          statusCode:
            expectedStatus,

          statusMessage:
            expectedStatusMessage
        })
      }
    )

  }
)
