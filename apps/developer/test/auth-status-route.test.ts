import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

describe(
  'Developer auth status route',
  () => {
    beforeEach(() => {
      vi.resetModules()
      vi.clearAllMocks()

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
    })

    async function runWithSession(
      session: unknown
    ) {
      vi.stubGlobal(
        'getUserSession',
        vi.fn().mockResolvedValue(
          session
        )
      )

      const {
        default: handler
      } = await import(
        '../server/api/auth/status.get'
      )

      return handler({})
    }

    it(
      'reports an unavailable control-plane credential when no token exists',
      async () => {
        const result
          = await runWithSession({
            user: {
              subject:
                'developer-subject'
            },

            secure: {}
          })

        expect(result).toEqual({
          loggedIn: true,

          subject:
            'developer-subject',

          hasControlPlaneAccessToken:
            false,

          controlPlaneCredentialStatus:
            'unavailable',

          controlPlaneAccessTokenExpiresAt:
            null
        })
      }
    )

    it(
      'reports legacy credential lifecycle state as unknown',
      async () => {
        const result
          = await runWithSession({
            user: {
              subject:
                'developer-subject'
            },

            secure: {
              controlPlaneAccessToken:
                'legacy-access-token'
            }
          })

        expect(
          result.controlPlaneCredentialStatus
        ).toBe('unknown')
      }
    )

    it(
      'reports a credential with sufficient lifetime as current',
      async () => {
        const expiresAt
          = Date.now() + 5 * 60_000

        const result
          = await runWithSession({
            user: {
              subject:
                'developer-subject'
            },

            secure: {
              controlPlaneAccessToken:
                'current-access-token',

              controlPlaneAccessTokenExpiresAt:
                expiresAt
            }
          })

        expect(
          result.controlPlaneCredentialStatus
        ).toBe('current')

        expect(
          result.controlPlaneAccessTokenExpiresAt
        ).toBe(expiresAt)
      }
    )

    it(
      'reports a credential inside the refresh safety window as expiring',
      async () => {
        const result
          = await runWithSession({
            user: {
              subject:
                'developer-subject'
            },

            secure: {
              controlPlaneAccessToken:
                'expiring-access-token',

              controlPlaneAccessTokenExpiresAt:
                Date.now() + 30_000
            }
          })

        expect(
          result.controlPlaneCredentialStatus
        ).toBe('expiring')
      }
    )

    it(
      'reports a credential past expiration as expired',
      async () => {
        const result
          = await runWithSession({
            user: {
              subject:
                'developer-subject'
            },

            secure: {
              controlPlaneAccessToken:
                'expired-access-token',

              controlPlaneAccessTokenExpiresAt:
                Date.now() - 1
            }
          })

        expect(
          result.controlPlaneCredentialStatus
        ).toBe('expired')
      }
    )
  }
)
