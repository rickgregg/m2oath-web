import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

const auth0LinkHandler
  = vi.fn()

describe(
  'Developer Auth0 link route',
  () => {
    beforeEach(() => {
      vi.resetModules()
      vi.clearAllMocks()

      vi.stubGlobal(
        'defineOAuthAuth0EventHandler',
        vi.fn().mockReturnValue(
          auth0LinkHandler
        )
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
        'sendRedirect',
        vi.fn(
          (
            _event: unknown,
            location: string
          ) => location
        )
      )
    })

    it(
      'starts Auth0 linking for an authenticated Developer without inspecting control-plane credential state',
      async () => {
        vi.stubGlobal(
          'getUserSession',
          vi.fn().mockResolvedValue({
            user: {
              subject:
                'developer-subject',

              developerId:
                'dev-123'
            },

            secure: undefined
          })
        )

        auth0LinkHandler
          .mockResolvedValueOnce(
            'auth0-link-started'
          )

        const {
          default: handler
        } = await import(
          '../server/routes/auth/link.get'
        )

        const event = {}

        const result
          = await handler(event)

        expect(
          auth0LinkHandler
        ).toHaveBeenCalledOnce()

        expect(
          auth0LinkHandler
        ).toHaveBeenCalledWith(
          event
        )

        expect(
          globalThis.sendRedirect
        ).not.toHaveBeenCalled()

        expect(result).toBe(
          'auth0-link-started'
        )
      }
    )

    it(
      'redirects to the home page without starting Auth0 when there is no Developer session',
      async () => {
        vi.stubGlobal(
          'getUserSession',
          vi.fn().mockResolvedValue({
            user: undefined,
            secure: undefined
          })
        )

        const {
          default: handler
        } = await import(
          '../server/routes/auth/link.get'
        )

        const event = {}

        const result
          = await handler(event)

        expect(
          globalThis.sendRedirect
        ).toHaveBeenCalledWith(
          event,
          '/'
        )

        expect(
          auth0LinkHandler
        ).not.toHaveBeenCalled()

        expect(result).toBe('/')
      }
    )
  }
)
