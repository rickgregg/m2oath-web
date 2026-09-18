import {
  describe,
  expect,
  it
} from 'vitest'

import {
  RavenProviderRegistry
} from '../src/providers/provider-registry.js'

describe('RavenProviderRegistry', () => {
  it('registers a Trust provider', () => {
    const registry =
      new RavenProviderRegistry()

    registry.register({
      providerId: 'm2oath-trust',
      providerType: 'trust',
      endpoint: 'https://trust.example.test'
    })

    expect(
      registry.require('m2oath-trust')
    ).toEqual({
      providerId: 'm2oath-trust',
      providerType: 'trust',
      endpoint: 'https://trust.example.test'
    })
  })

  it('registers a Trusted Domain provider', () => {
    const registry =
      new RavenProviderRegistry()

    registry.register({
      providerId: 'm2oath-weather',
      providerType: 'trusted-domain',
      domain: 'weather',
      endpoint: 'https://weather.example.test'
    })

    expect(
      registry.require('m2oath-weather')
    ).toEqual({
      providerId: 'm2oath-weather',
      providerType: 'trusted-domain',
      domain: 'weather',
      endpoint: 'https://weather.example.test'
    })
  })

  it('rejects duplicate provider IDs', () => {
    const registry =
      new RavenProviderRegistry()

    registry.register({
      providerId: 'm2oath-trust',
      providerType: 'trust',
      endpoint: 'https://trust.example.test'
    })

    expect(() =>
      registry.register({
        providerId: 'm2oath-trust',
        providerType: 'trust',
        endpoint: 'https://other.example.test'
      })
    ).toThrow(
      'Raven provider already registered: m2oath-trust'
    )
  })

  it('requires a domain for Trusted Domain providers', () => {
    const registry =
      new RavenProviderRegistry()

    expect(() =>
      registry.register({
        providerId: 'weather',
        providerType: 'trusted-domain',
        endpoint: 'https://weather.example.test'
      })
    ).toThrow(
      'Raven Trusted Domain provider must declare a domain.'
    )
  })

  it('rejects a domain on Trust providers', () => {
    const registry =
      new RavenProviderRegistry()

    expect(() =>
      registry.register({
        providerId: 'm2oath-trust',
        providerType: 'trust',
        domain: 'weather',
        endpoint: 'https://trust.example.test'
      })
    ).toThrow(
      'Raven Trust provider must not declare a Trusted Domain.'
    )
  })
})
