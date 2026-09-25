import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import {
  getValidControlPlaneAccessToken
} from '../server/auth/control-plane-credential'

describe(
  'Developer control-plane credential lifecycle',
  () => {
    beforeEach(() => {
      vi.clearAllMocks()

      vi.stubGlobal(
        'createError',
        vi.fn(
          (input: unknown) =>
            input
        )
      )

      vi.stubGlobal(
        'clearUserSession',
        vi.fn().mockResolvedValue(true)
      )

      vi.stubGlobal(
        'setUserSession',
        vi.fn().mockResolvedValue({})
      )

      vi.stubGlobal(
        'useRuntimeConfig',
        vi.fn().mockReturnValue({
          oauth: {
            auth0: {
              domain:
                'example.auth0.com',

              clientId:
                'developer-client',

              clientSecret:
                'developer-secret'
            }
          }
        })
      )
    })

    it(
      'returns a control-plane access token that is not near expiration',
      async () => {
        vi.stubGlobal(
          'requireUserSession',
          vi.fn().mockResolvedValue({
            user: {
              subject:
                'developer-subject'
            },

            secure: {
              controlPlaneAccessToken:
                'current-access-token',

              controlPlaneAccessTokenExpiresAt:
                Date.now() + 5 * 60_000
            }
          })
        )

        const fetchMock
          = vi.fn()

        vi.stubGlobal(
          '$fetch',
          fetchMock
        )

        const result
          = await getValidControlPlaneAccessToken(
            {}
          )

        expect(result).toBe(
          'current-access-token'
        )

        expect(
          fetchMock
        ).not.toHaveBeenCalled()
      }
    )

    it(
      'refreshes a control-plane access token that is near expiration',
      async () => {
        vi.stubGlobal(
          'requireUserSession',
          vi.fn().mockResolvedValue({
            user: {
              subject:
                'developer-subject'
            },

            secure: {
              controlPlaneAccessToken:
                'old-access-token',

              controlPlaneRefreshToken:
                'old-refresh-token',

              controlPlaneAccessTokenExpiresAt:
                Date.now() + 10_000
            }
          })
        )

        const fetchMock
          = vi.fn().mockResolvedValue({
            access_token:
              'new-access-token',

            refresh_token:
              'new-refresh-token',

            expires_in:
              3600
          })

        vi.stubGlobal(
          '$fetch',
          fetchMock
        )

        const before
          = Date.now()

        const result
          = await getValidControlPlaneAccessToken(
            {}
          )

        const after
          = Date.now()

        expect(result).toBe(
          'new-access-token'
        )

        expect(
          fetchMock
        ).toHaveBeenCalledWith(
          'https://example.auth0.com/oauth/token',
          {
            method: 'POST',

            headers: {
              'content-type':
                'application/json'
            },

            body: {
              grant_type:
                'refresh_token',

              client_id:
                'developer-client',

              client_secret:
                'developer-secret',

              refresh_token:
                'old-refresh-token'
            }
          }
        )

        expect(
          globalThis.setUserSession
        ).toHaveBeenCalledOnce()

        const sessionUpdate
          = vi.mocked(
            globalThis.setUserSession
          ).mock.calls[0]?.[1]

        expect(
          sessionUpdate?.secure
            ?.controlPlaneAccessToken
        ).toBe(
          'new-access-token'
        )

        expect(
          sessionUpdate?.secure
            ?.controlPlaneRefreshToken
        ).toBe(
          'new-refresh-token'
        )

        const expiresAt
          = sessionUpdate?.secure
            ?.controlPlaneAccessTokenExpiresAt

        expect(
          typeof expiresAt
        ).toBe('number')

        expect(expiresAt).toBeGreaterThanOrEqual(
          before + 3_600_000
        )

        expect(expiresAt).toBeLessThanOrEqual(
          after + 3_600_000
        )
      }
    )

    it(
      'retains the existing refresh token when Auth0 does not rotate it',
      async () => {
        vi.stubGlobal(
          'requireUserSession',
          vi.fn().mockResolvedValue({
            user: {
              subject:
                'developer-subject'
            },

            secure: {
              controlPlaneAccessToken:
                'expired-access-token',

              controlPlaneRefreshToken:
                'existing-refresh-token',

              controlPlaneAccessTokenExpiresAt:
                Date.now() - 1
            }
          })
        )

        vi.stubGlobal(
          '$fetch',
          vi.fn().mockResolvedValue({
            access_token:
              'new-access-token',

            expires_in:
              3600
          })
        )

        await getValidControlPlaneAccessToken(
          {}
        )

        expect(
          globalThis.setUserSession
        ).toHaveBeenCalledWith(
          {},
          {
            secure: {
              controlPlaneAccessToken:
                'new-access-token',

              controlPlaneRefreshToken:
                'existing-refresh-token',

              controlPlaneAccessTokenExpiresAt:
                expect.any(Number)
            }
          }
        )
      }
    )

    it(
      'clears the session when an expired credential cannot be refreshed',
      async () => {
        vi.stubGlobal(
          'requireUserSession',
          vi.fn().mockResolvedValue({
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
        )

        await expect(
          getValidControlPlaneAccessToken(
            {}
          )
        ).rejects.toMatchObject({
          statusCode: 401
        })

        expect(
          globalThis.clearUserSession
        ).toHaveBeenCalledWith(
          {}
        )
      }
    )

    it(
      'clears the session when Auth0 rejects the refresh',
      async () => {
        vi.stubGlobal(
          'requireUserSession',
          vi.fn().mockResolvedValue({
            user: {
              subject:
                'developer-subject'
            },

            secure: {
              controlPlaneAccessToken:
                'expired-access-token',

              controlPlaneRefreshToken:
                'refresh-token',

              controlPlaneAccessTokenExpiresAt:
                Date.now() - 1
            }
          })
        )

        vi.stubGlobal(
          '$fetch',
          vi.fn().mockRejectedValue(
            new Error(
              'refresh rejected'
            )
          )
        )

        await expect(
          getValidControlPlaneAccessToken(
            {}
          )
        ).rejects.toMatchObject({
          statusCode: 401
        })

        expect(
          globalThis.clearUserSession
        ).toHaveBeenCalledWith(
          {}
        )
      }
    )
  }
)
