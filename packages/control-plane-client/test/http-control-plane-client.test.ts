import { describe, expect, it, vi } from 'vitest'
import {
  ControlPlaneHttpError,
  HttpControlPlaneClient
} from '../src/index.js'

describe('HttpControlPlaneClient', () => {
  it('registers an agent and returns the canonical agent id supplied by the server', async () => {
    const fetch = vi.fn(async () => new Response(
      JSON.stringify({
        agent: {
          agentId: 'agt_server_123',
          displayName: 'Weather Agent',
          status: 'active'
        }
      }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json'
        }
      }
    ))

    const client = new HttpControlPlaneClient({
      baseUrl: 'https://control.m2oath.example/',
      bearerToken: 'developer-token',
      fetch
    })

    const result = await client.registerAgent({
      displayName: 'Weather Agent',
      identifier: {
        type: 'runtime-jwt',
        value: 'weather-agent-runtime',
        issuer: 'https://issuer.example'
      },
      cryptographicMaterial: {
        keyId: 'weather-key-1',
        algorithm: 'RS256',
        publicKey: 'weather-public-key'
      }
    })

    expect(result.agent.agentId).toBe('agt_server_123')

    expect(fetch).toHaveBeenCalledOnce()

    const [url, init] =
      fetch.mock.calls[0]!

    expect(url).toBe(
      'https://control.m2oath.example/v1/agents'
    )

    expect(init?.method).toBe('POST')

    const headers =
      new Headers(init?.headers)

    expect(
      headers.get('content-type')
    ).toBe('application/json')

    expect(
      headers.get('authorization')
    ).toBe('Bearer developer-token')

    expect(init?.body).toBe(JSON.stringify({
      displayName: 'Weather Agent',
      identifier: {
        type: 'runtime-jwt',
        value: 'weather-agent-runtime',
        issuer: 'https://issuer.example'
      },
      cryptographicMaterial: {
        keyId: 'weather-key-1',
        algorithm: 'RS256',
        publicKey: 'weather-public-key'
      }
    }))
  })

  it('keeps authentication out of the registration payload', async () => {
    const fetch = vi.fn(async () => new Response(
      JSON.stringify({
        agent: {
          agentId: 'agt_server_123',
          status: 'active'
        }
      }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json'
        }
      }
    ))

    const client = new HttpControlPlaneClient({
      baseUrl: 'https://control.m2oath.example',
      bearerToken: 'secret-developer-token',
      fetch
    })

    await client.registerAgent({
      identifier: {
        type: 'runtime-jwt',
        value: 'runtime-agent'
      }
    })

    const [, init] =
      fetch.mock.calls[0]!

    expect(
      JSON.parse(String(init?.body))
    ).toEqual({
      identifier: {
        type: 'runtime-jwt',
        value: 'runtime-agent'
      }
    })

    expect(
      String(init?.body)
    ).not.toContain('secret-developer-token')
  })

  it('gets an agent and safely encodes the route identifier', async () => {
    const fetch = vi.fn(async () => new Response(
      JSON.stringify({
        agentId: 'agt/123',
        status: 'active'
      }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json'
        }
      }
    ))

    const client = new HttpControlPlaneClient({
      baseUrl: 'https://control.m2oath.example',
      fetch
    })

    const result = await client.getAgent('agt/123')

    expect(result.agentId).toBe('agt/123')

    expect(fetch).toHaveBeenCalledWith(
      'https://control.m2oath.example/v1/agents/agt%2F123',
      undefined
    )
  })

  it('lists agents', async () => {
    const fetch = vi.fn(async () => new Response(
      JSON.stringify([
        {
          agentId: 'agt_1',
          status: 'active'
        },
        {
          agentId: 'agt_2',
          status: 'disabled'
        }
      ]),
      {
        status: 200,
        headers: {
          'content-type': 'application/json'
        }
      }
    ))

    const client = new HttpControlPlaneClient({
      baseUrl: 'https://control.m2oath.example',
      fetch
    })

    const agents = await client.listAgents()

    expect(agents).toHaveLength(2)
    expect(agents[0]?.agentId).toBe('agt_1')
    expect(agents[1]?.agentId).toBe('agt_2')
  })

  it('throws ControlPlaneHttpError for a non-success response', async () => {
    const fetch = vi.fn(async () => new Response(
      JSON.stringify({
        error: 'not-found'
      }),
      {
        status: 404,
        statusText: 'Not Found',
        headers: {
          'content-type': 'application/json'
        }
      }
    ))

    const client = new HttpControlPlaneClient({
      baseUrl: 'https://control.m2oath.example',
      fetch
    })

    await expect(
      client.getAgent('agt_missing')
    ).rejects.toEqual(
      expect.objectContaining({
        name: 'ControlPlaneHttpError',
        status: 404,
        statusText: 'Not Found'
      })
    )

    await expect(
      client.getAgent('agt_missing')
    ).rejects.toBeInstanceOf(
      ControlPlaneHttpError
    )
  })

  it('links a freshly authenticated external identity to the current Developer account', async () => {
    const fetch = vi.fn(async () => new Response(
      JSON.stringify({
        developer: {
          developerId: 'dev_123',
          displayName: 'Developer',
          status: 'active',
          role: 'developer'
        }
      }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json'
        }
      }
    ))

    const client = new HttpControlPlaneClient({
      baseUrl: 'https://control.m2oath.example/',
      bearerToken: 'current-developer-token',
      fetch
    })

    const result =
      await client.linkDeveloperExternalIdentity({
        credential: 'fresh-external-identity-token'
      })

    expect(result).toEqual({
      developer: {
        developerId: 'dev_123',
        displayName: 'Developer',
        status: 'active',
        role: 'developer'
      }
    })

    expect(fetch).toHaveBeenCalledOnce()

    const [url, init] =
      fetch.mock.calls[0]!

    expect(url).toBe(
      'https://control.m2oath.example/v1/developers/me/identity-bindings'
    )

    expect(init?.method).toBe('POST')

    const headers =
      new Headers(init?.headers)

    expect(
      headers.get('authorization')
    ).toBe(
      'Bearer current-developer-token'
    )

    expect(
      headers.get('content-type')
    ).toBe('application/json')

    expect(
      JSON.parse(String(init?.body))
    ).toEqual({
      credential:
        'fresh-external-identity-token'
    })

    expect(
      String(init?.body)
    ).not.toContain(
      'current-developer-token'
    )
  })

})
