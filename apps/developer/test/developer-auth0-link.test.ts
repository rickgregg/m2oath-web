import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import {
  ControlPlaneHttpError
} from '@m2oath/control-plane-client'

import {
  handleDeveloperAuth0LinkSuccess
} from '../server/auth/developer-auth0'

const linkDeveloperExternalIdentity
  = vi.fn()

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
      linkDeveloperExternalIdentity
        = linkDeveloperExternalIdentity
    }

    return {
      ControlPlaneHttpError,
      HttpControlPlaneClient
    }
  }
)

describe(
  'Developer Auth0 identity linking',
  () => {
    beforeEach(() => {
      vi.clearAllMocks()

      vi.stubGlobal(
        'requireUserSession',
        vi.fn().mockResolvedValue({
          user: {
            subject:
              'primary-subject',

            developerId:
              'dev-primary'
          },

          secure: {
            controlPlaneAccessToken:
              'primary-access-token'
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
        'sendRedirect',
        vi.fn(
          (
            _event: unknown,
            location: string
          ) => location
        )
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
      'redirects to the link failure state when the external identity already belongs to another Developer',
      async () => {
        linkDeveloperExternalIdentity
          .mockRejectedValueOnce(
            new ControlPlaneHttpError(
              409,
              'Conflict'
            )
          )

        const result
          = await handleDeveloperAuth0LinkSuccess(
            {},
            {
              tokens: {
                access_token:
                  'secondary-access-token'
              }
            }
          )

        expect(
          linkDeveloperExternalIdentity
        ).toHaveBeenCalledWith({
          credential:
            'secondary-access-token'
        })

        expect(
          globalThis.sendRedirect
        ).toHaveBeenCalledWith(
          {},
          '/dashboard?identity=link-failed'
        )

        expect(result).toBe(
          '/dashboard?identity=link-failed'
        )
      }
    )
  }
)
