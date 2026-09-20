import {
  describe,
  expect,
  it,
  vi
} from 'vitest'

import {
  RavenProviderFactory
} from '../src/providers/raven-provider-factory.js'

describe(
  'RavenProviderFactory',
  () => {
    it(
      'constructs the public Agent trust provider over authenticated transport',
      async () => {
        const fetch =
          vi.fn().mockResolvedValue(
            new Response(
              JSON.stringify({
                agentId: 'agent-123',
                score: 0.75,
                evidenceCount: 4,
                evaluatedAt:
                  '2026-09-20T12:00:00.000Z'
              }),
              {
                status: 200,
                headers: {
                  'Content-Type':
                    'application/json'
                }
              }
            )
          )

        const factory =
          new RavenProviderFactory({
            getAuthorizationHeader:
              () => 'Bearer raven-service',
            fetch
          })

        const provider =
          factory.createTrustProvider({
            providerId: 'm2oath-trust',
            providerType: 'trust',
            endpoint:
              'https://trust.example.test'
          })

        const result =
          await provider.getTrustState({
            context: {
              agentId: 'agent-123'
            },
            operation: {
              type: 'tool',
              name: 'weather.read'
            }
          })

        expect(result.agentId)
          .toBe('agent-123')

        expect(fetch)
          .toHaveBeenCalledOnce()

        const [
          ,
          init
        ] = fetch.mock.calls[0]!

        expect(
          new Headers(init?.headers)
            .get('Authorization')
        ).toBe(
          'Bearer raven-service'
        )
      }
    )

    it(
      'constructs a Trusted Domain evidence provider',
      async () => {
        const fetch =
          vi.fn().mockResolvedValue(
            new Response(
              JSON.stringify({
                confidence: 0.92
              }),
              {
                status: 200,
                headers: {
                  'Content-Type':
                    'application/json'
                }
              }
            )
          )

        const factory =
          new RavenProviderFactory({
            getAuthorizationHeader:
              () => 'Bearer raven-service',
            fetch
          })

        const provider =
          factory.createTrustedDomainProvider<{
            confidence: number
          }>({
            providerId: 'm2oath-weather',
            providerType:
              'trusted-domain',
            domain: 'weather',
            endpoint:
              'https://weather.example.test'
          })

        const result =
          await provider.getEvidence({
            context: {
              agentId: 'agent-123',
              requestId: 'request-456'
            },
            operation: {
              type: 'tool',
              name: 'weather.read'
            },
            input: {
              location: 'Omaha'
            }
          })

        expect(result).toEqual({
          confidence: 0.92
        })

        const [
          url,
          init
        ] = fetch.mock.calls[0]!

        expect(String(url)).toBe(
          'https://weather.example.test/v1/evidence'
        )

        expect(
          new Headers(init?.headers)
            .get('Authorization')
        ).toBe(
          'Bearer raven-service'
        )
      }
    )

    it(
      'rejects use of the wrong provider type',
      () => {
        const factory =
          new RavenProviderFactory({
            getAuthorizationHeader:
              () => 'Bearer raven-service'
          })

        expect(
          () =>
            factory.createTrustProvider({
              providerId:
                'm2oath-weather',
              providerType:
                'trusted-domain',
              domain: 'weather',
              endpoint:
                'https://weather.example.test'
            })
        ).toThrow(
          'Raven provider m2oath-weather is trusted-domain, expected trust.'
        )
      }
    )
  }
)
