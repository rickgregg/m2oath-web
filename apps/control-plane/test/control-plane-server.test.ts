import { afterEach, describe, expect, it } from 'vitest'
import type { AddressInfo } from 'node:net'
import {
  InMemoryAgentStore
} from '../src/agent-store.js'
import {
  createControlPlaneServer
} from '../src/server.js'

const servers: ReturnType<typeof createControlPlaneServer>[] = []

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(server =>
      new Promise<void>((resolve, reject) => {
        server.close(error => {
          if (error) {
            reject(error)
            return
          }

          resolve()
        })
      })
    )
  )
})

async function startServer() {
  const server = createControlPlaneServer({
    store: new InMemoryAgentStore()
  })

  servers.push(server)

  await new Promise<void>(resolve => {
    server.listen(0, '127.0.0.1', resolve)
  })

  const address = server.address() as AddressInfo

  return {
    baseUrl: `http://127.0.0.1:${address.port}`
  }
}

describe('M2Oath control-plane API', () => {
  it('reports health', async () => {
    const { baseUrl } = await startServer()

    const response = await fetch(`${baseUrl}/health`)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      status: 'ok'
    })
  })

  it('registers an agent and issues the canonical agent id server-side', async () => {
    const { baseUrl } = await startServer()

    const response = await fetch(`${baseUrl}/v1/agents`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        displayName: 'Weather Agent'
      })
    })

    expect(response.status).toBe(201)

    expect(await response.json()).toEqual({
      agent: {
        agentId: 'agt_000001',
        displayName: 'Weather Agent',
        status: 'active'
      }
    })
  })

  it('lists agents registered through the same authoritative store', async () => {
    const { baseUrl } = await startServer()

    await fetch(`${baseUrl}/v1/agents`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        displayName: 'Agent One'
      })
    })

    await fetch(`${baseUrl}/v1/agents`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        displayName: 'Agent Two'
      })
    })

    const response = await fetch(`${baseUrl}/v1/agents`)

    expect(response.status).toBe(200)

    expect(await response.json()).toEqual([
      {
        agentId: 'agt_000001',
        displayName: 'Agent One',
        status: 'active'
      },
      {
        agentId: 'agt_000002',
        displayName: 'Agent Two',
        status: 'active'
      }
    ])
  })

  it('retrieves an agent by canonical agent id', async () => {
    const { baseUrl } = await startServer()

    await fetch(`${baseUrl}/v1/agents`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        displayName: 'Weather Agent'
      })
    })

    const response = await fetch(
      `${baseUrl}/v1/agents/agt_000001`
    )

    expect(response.status).toBe(200)

    expect(await response.json()).toEqual({
      agentId: 'agt_000001',
      displayName: 'Weather Agent',
      status: 'active'
    })
  })

  it('returns 404 for an unknown agent id', async () => {
    const { baseUrl } = await startServer()

    const response = await fetch(
      `${baseUrl}/v1/agents/agt_missing`
    )

    expect(response.status).toBe(404)

    expect(await response.json()).toEqual({
      error: 'agent-not-found'
    })
  })
})
