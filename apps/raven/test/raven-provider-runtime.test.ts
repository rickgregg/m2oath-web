import {
  describe,
  expect,
  it,
  vi
} from 'vitest'

import {
  RavenProviderFactory
} from '../src/providers/raven-provider-factory.js'

import {
  RavenProviderRegistry
} from '../src/providers/provider-registry.js'

import {
  RavenProviderRuntime
} from '../src/providers/raven-provider-runtime.js'

function createRuntime(
  fetch: typeof globalThis.fetch
): {
  registry: RavenProviderRegistry
  runtime: RavenProviderRuntime
} {
  const registry =
    new RavenProviderRegistry()

  const factory =
    new RavenProviderFactory({
      getAuthorizationHeader:
        () => 'Bearer raven-service',
      fetch
    })

  return {
    registry,
    runtime:
      new RavenProviderRuntime(
        registry,
        factory
      )
  }
}

describe(
  'RavenProviderRuntime',
  () => {
    it(
      'resolves a registered Trust provider',
      async () => {
        const fetch =
          vi.fn().mockResolvedValue(
            new Response(
              JSON.stringify({
                agentId: 'agent-123',
                score: 0.8,
                evidenceCount: 5,
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

        const {
          registry,
          runtime
        } = createRuntime(fetch)

        registry.register({
          providerId: 'm2oath-trust',
          providerType: 'trust',
          endpoint:
            'https://trust.example.test'
        })

        const provider =
          runtime.getTrustProvider(
            'm2oath-trust'
          )

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

        expect(result.score).toBe(0.8)
      }
    )

    it(
      'resolves a Trusted Domain provider by domain',
      async () => {
        const fetch =
          vi.fn().mockResolvedValue(
            new Response(
              JSON.stringify({
                confidence: 0.94
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

        const {
          registry,
          runtime
        } = createRuntime(fetch)

        registry.register({
          providerId:
            'm2oath-weather',
          providerType:
            'trusted-domain',
          domain: 'weather',
          endpoint:
            'https://weather.example.test'
        })

        const provider =
          runtime
            .getTrustedDomainProviderByDomain<{
              confidence: number
            }>('weather')

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
          confidence: 0.94
        })
      }
    )

    it(
      'routes Weather evidence through its authority with reduced request context',
      async () => {
        const fetch =
          vi.fn().mockResolvedValue(
            new Response(
              JSON.stringify({
                confidence: 0.96
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

        const registry =
          new RavenProviderRegistry()

        const factory =
          new RavenProviderFactory({
            getAuthorizationHeader:
              descriptor => {
                if (
                  descriptor.providerId ===
                  'm2oath-weather'
                ) {
                  return 'Bearer weather-service'
                }

                throw new Error(
                  `Unexpected provider: ${descriptor.providerId}`
                )
              },
            fetch
          })

        const runtime =
          new RavenProviderRuntime(
            registry,
            factory
          )

        registry.register({
          providerId: 'm2oath-weather',
          providerType: 'trusted-domain',
          domain: 'weather',
          endpoint:
            'https://weather.example.test'
        })

        const provider =
          runtime
            .getTrustedDomainProviderByDomain<{
              confidence: number
            }>('weather')

        const result =
          await provider.getEvidence({
            context: {
              agentId: 'agent-123',
              requestId: 'request-456',
              credentialId: 'credential-789',
              authenticatedAt:
                new Date(
                  '2026-09-20T12:00:00.000Z'
                )
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
          confidence: 0.96
        })

        expect(fetch)
          .toHaveBeenCalledOnce()

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
          'Bearer weather-service'
        )

        expect(
          JSON.parse(
            String(init?.body)
          )
        ).toEqual({
          agentId: 'agent-123',
          operation: {
            type: 'tool',
            name: 'weather.read'
          },
          input: {
            location: 'Omaha'
          }
        })
      }
    )

    it(
      'rejects an unknown Trusted Domain',
      () => {
        const {
          runtime
        } = createRuntime(
          vi.fn() as unknown as
            typeof globalThis.fetch
        )

        expect(
          () =>
            runtime
              .getTrustedDomainProviderByDomain(
                'weather'
              )
        ).toThrow(
          'Raven Trusted Domain provider not registered: weather'
        )
      }
    )

    it(
      'rejects ambiguous Trusted Domain authority',
      () => {
        const {
          registry,
          runtime
        } = createRuntime(
          vi.fn() as unknown as
            typeof globalThis.fetch
        )

        registry.register({
          providerId: 'weather-a',
          providerType:
            'trusted-domain',
          domain: 'weather',
          endpoint:
            'https://weather-a.example.test'
        })

        registry.register({
          providerId: 'weather-b',
          providerType:
            'trusted-domain',
          domain: 'weather',
          endpoint:
            'https://weather-b.example.test'
        })

        expect(
          () =>
            runtime
              .getTrustedDomainProviderByDomain(
                'weather'
              )
        ).toThrow(
          'Multiple Raven Trusted Domain providers registered for domain: weather'
        )
      }
    )
  }
)
