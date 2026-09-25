import {
  describe,
  expect,
  it
} from 'vitest'

import {
  OAuthClientCredentialsServiceAuthorizationProvider,
  StaticServiceAuthorizationProvider
} from '../src/providers/service-authorization-provider.js'

describe(
  'Service authorization providers',
  () => {
    it(
      'returns a configured static authorization header',
      () => {
        const provider =
          new StaticServiceAuthorizationProvider({
            authorizationHeader:
              'Bearer static-credential'
          })

        expect(
          provider.getAuthorizationHeader()
        ).toBe(
          'Bearer static-credential'
        )
      }
    )

    it(
      'caches an OAuth client-credentials access token until near expiry',
      async () => {
        let now =
          1_000_000

        const requests:
          Array<{
            url: string
            init?: RequestInit
          }> = []

        const fetchImplementation:
          typeof globalThis.fetch =
          async (
            input,
            init
          ) => {
            requests.push({
              url:
                String(input),
              init
            })

            return new Response(
              JSON.stringify({
                access_token:
                  'access-token-one',
                token_type:
                  'Bearer',
                expires_in:
                  3600
              }),
              {
                status: 200,
                headers: {
                  'content-type':
                    'application/json'
                }
              }
            )
          }

        const provider =
          new OAuthClientCredentialsServiceAuthorizationProvider({
            tokenEndpoint:
              'https://identity.example/oauth/token',
            clientId:
              'raven-client',
            clientSecret:
              'raven-secret',
            audience:
              'https://control-plane.example',
            fetch:
              fetchImplementation,
            now:
              () => now
          })

        await expect(
          provider.getAuthorizationHeader()
        ).resolves.toBe(
          'Bearer access-token-one'
        )

        now += 1_000

        await expect(
          provider.getAuthorizationHeader()
        ).resolves.toBe(
          'Bearer access-token-one'
        )

        expect(requests).toHaveLength(1)

        expect(
          JSON.parse(
            String(
              requests[0]?.init?.body
            )
          )
        ).toEqual({
          grant_type:
            'client_credentials',
          client_id:
            'raven-client',
          client_secret:
            'raven-secret',
          audience:
            'https://control-plane.example'
        })
      }
    )

    it(
      'obtains a new OAuth access token when the cached token is near expiry',
      async () => {
        let now =
          1_000_000

        let requestCount =
          0

        const fetchImplementation:
          typeof globalThis.fetch =
          async () => {
            requestCount += 1

            return new Response(
              JSON.stringify({
                access_token:
                  `access-token-${requestCount}`,
                token_type:
                  'Bearer',
                expires_in:
                  120
              }),
              {
                status: 200,
                headers: {
                  'content-type':
                    'application/json'
                }
              }
            )
          }

        const provider =
          new OAuthClientCredentialsServiceAuthorizationProvider({
            tokenEndpoint:
              'https://identity.example/oauth/token',
            clientId:
              'raven-client',
            clientSecret:
              'raven-secret',
            audience:
              'https://control-plane.example',
            refreshSafetyWindowSeconds:
              60,
            fetch:
              fetchImplementation,
            now:
              () => now
          })

        await expect(
          provider.getAuthorizationHeader()
        ).resolves.toBe(
          'Bearer access-token-1'
        )

        now += 61_000

        await expect(
          provider.getAuthorizationHeader()
        ).resolves.toBe(
          'Bearer access-token-2'
        )

        expect(requestCount).toBe(2)
      }
    )

    it(
      'shares one in-flight OAuth token request across concurrent callers',
      async () => {
        let requestCount =
          0

        let releaseRequest:
          (() => void) | undefined

        const requestGate =
          new Promise<void>(
            resolve => {
              releaseRequest =
                resolve
            }
          )

        const fetchImplementation:
          typeof globalThis.fetch =
          async () => {
            requestCount += 1

            await requestGate

            return new Response(
              JSON.stringify({
                access_token:
                  'shared-access-token',
                token_type:
                  'Bearer',
                expires_in:
                  3600
              }),
              {
                status: 200,
                headers: {
                  'content-type':
                    'application/json'
                }
              }
            )
          }

        const provider =
          new OAuthClientCredentialsServiceAuthorizationProvider({
            tokenEndpoint:
              'https://identity.example/oauth/token',
            clientId:
              'raven-client',
            clientSecret:
              'raven-secret',
            audience:
              'https://control-plane.example',
            fetch:
              fetchImplementation
          })

        const first =
          provider.getAuthorizationHeader()

        const second =
          provider.getAuthorizationHeader()

        const third =
          provider.getAuthorizationHeader()

        expect(requestCount).toBe(1)

        releaseRequest?.()

        await expect(
          Promise.all([
            first,
            second,
            third
          ])
        ).resolves.toEqual([
          'Bearer shared-access-token',
          'Bearer shared-access-token',
          'Bearer shared-access-token'
        ])

        expect(requestCount).toBe(1)
      }
    )

    it(
      'rejects a failed OAuth client-credentials request',
      async () => {
        const provider =
          new OAuthClientCredentialsServiceAuthorizationProvider({
            tokenEndpoint:
              'https://identity.example/oauth/token',
            clientId:
              'raven-client',
            clientSecret:
              'raven-secret',
            audience:
              'https://control-plane.example',
            fetch:
              async () =>
                new Response(
                  'unauthorized',
                  {
                    status: 401
                  }
                )
          })

        await expect(
          provider.getAuthorizationHeader()
        ).rejects.toThrow(
          'OAuth client-credentials token request failed with HTTP 401.'
        )
      }
    )

    it(
      'rejects empty static authorization configuration',
      () => {
        expect(
          () =>
            new StaticServiceAuthorizationProvider({
              authorizationHeader:
                '   '
            })
        ).toThrow(
          'Service authorization header is required.'
        )
      }
    )
  }
)
