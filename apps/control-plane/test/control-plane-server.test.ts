import { afterEach, describe, expect, it } from 'vitest'
import type { AddressInfo } from 'node:net'
import {
  M2OathAgentDirectory
} from '../src/agent-store.js'
import {
  M2OathAgentRegistrationGateway
} from '../src/m2oath-agent-registration-gateway.js'
import {
  createM2OathHostedComposition
} from '../src/m2oath-composition.js'
import {
  createControlPlaneServer
} from '../src/server.js'
import {
  createTestM2OathAuthenticationOptions,
  TEST_DEVELOPER_TOKEN,
  TEST_UNAUTHORIZED_DEVELOPER_TOKEN
} from './test-developer-authentication.js'

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
  const server = (() => {
    const m2oath =
      createM2OathHostedComposition(
        createTestM2OathAuthenticationOptions()
      )

    const directory =
      new M2OathAgentDirectory(
        m2oath.identityDirectory
      )

    const registrationGateway =
      new M2OathAgentRegistrationGateway({
        sdk: m2oath.sdk
      })

    return createControlPlaneServer({
      registrationGateway,
      directory
    })
  })()

  servers.push(server)

  await new Promise<void>(resolve => {
    server.listen(0, '127.0.0.1', resolve)
  })

  const address = server.address() as AddressInfo

  return {
    baseUrl: `http://127.0.0.1:${address.port}`
  }
}

function registrationHeaders() {
  return {
    'content-type': 'application/json',
    authorization: `Bearer ${TEST_DEVELOPER_TOKEN}`
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

  it('fails closed when developer authentication is missing', async () => {
    const { baseUrl } = await startServer()

    const response = await fetch(`${baseUrl}/v1/agents`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        displayName: 'Weather Agent',
        identifier: {
          type: 'runtime-jwt',
          value: 'weather-agent-runtime',
          issuer: 'https://issuer.example'
        }
      })
    })

    expect(response.status).toBe(401)

    expect(await response.json()).toEqual({
      error: 'developer-authentication-required'
    })
  })

  it('returns 401 when the presented Developer credential fails authentication', async () => {
    const { baseUrl } = await startServer()

    const response = await fetch(`${baseUrl}/v1/agents`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer invalid-development-token'
      },
      body: JSON.stringify({
        displayName: 'Rejected Agent',
        identifier: {
          type: 'runtime-jwt',
          value: 'rejected-runtime'
        }
      })
    })

    expect(response.status).toBe(401)

    expect(await response.json()).toEqual({
      error: 'developer-authentication-failed'
    })
  })

  it('returns 403 when the authenticated Developer lacks agent.create authority', async () => {
    const { baseUrl } = await startServer()

    const response = await fetch(`${baseUrl}/v1/agents`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization:
          `Bearer ${TEST_UNAUTHORIZED_DEVELOPER_TOKEN}`
      },
      body: JSON.stringify({
        displayName: 'Unauthorized Agent',
        identifier: {
          type: 'runtime-jwt',
          value: 'unauthorized-runtime'
        }
      })
    })

    expect(response.status).toBe(403)

    expect(await response.json()).toEqual({
      error: 'developer-not-authorized'
    })
  })

  it('registers an agent and issues the canonical agent id server-side', async () => {
    const { baseUrl } = await startServer()

    const response = await fetch(`${baseUrl}/v1/agents`, {
      method: 'POST',
      headers: registrationHeaders(),
      body: JSON.stringify({
        displayName: 'Weather Agent',
        identifier: {
          type: 'runtime-jwt',
          value: 'weather-agent-runtime',
          issuer: 'https://issuer.example'
        }
      })
    })

    expect(response.status).toBe(201)

    const body = await response.json()

    expect(body).toEqual({
      agent: {
        agentId: expect.stringMatching(
          /^agt_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        ),
        displayName: 'Weather Agent',
        status: 'active'
      }
    })
  })

  it('lists agents registered through the same authoritative store', async () => {
    const { baseUrl } = await startServer()

    await fetch(`${baseUrl}/v1/agents`, {
      method: 'POST',
      headers: registrationHeaders(),
      body: JSON.stringify({
        displayName: 'Agent One',
        identifier: {
          type: 'runtime-jwt',
          value: 'agent-one-runtime',
          issuer: 'https://issuer.example'
        }
      })
    })

    await fetch(`${baseUrl}/v1/agents`, {
      method: 'POST',
      headers: registrationHeaders(),
      body: JSON.stringify({
        displayName: 'Agent Two',
        identifier: {
          type: 'runtime-jwt',
          value: 'agent-two-runtime',
          issuer: 'https://issuer.example'
        }
      })
    })

    const response = await fetch(`${baseUrl}/v1/agents`)

    expect(response.status).toBe(200)

    const agents = await response.json()

    expect(agents).toHaveLength(2)

    expect(agents[0]).toEqual({
      agentId: expect.stringMatching(
        /^agt_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      ),
      displayName: 'Agent One',
      status: 'active'
    })

    expect(agents[1]).toEqual({
      agentId: expect.stringMatching(
        /^agt_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      ),
      displayName: 'Agent Two',
      status: 'active'
    })

    expect(agents[0].agentId).not.toBe(agents[1].agentId)
  })

  it('retrieves an agent by canonical agent id', async () => {
    const { baseUrl } = await startServer()

    const registrationResponse =
      await fetch(`${baseUrl}/v1/agents`, {
        method: 'POST',
        headers: registrationHeaders(),
        body: JSON.stringify({
          displayName: 'Weather Agent',
          identifier: {
            type: 'runtime-jwt',
            value: 'weather-agent-runtime',
            issuer: 'https://issuer.example'
          }
        })
      })

    const registration =
      await registrationResponse.json()

    const response = await fetch(
      `${baseUrl}/v1/agents/${encodeURIComponent(
        registration.agent.agentId
      )}`
    )

    expect(response.status).toBe(200)

    expect(await response.json()).toEqual({
      agentId: registration.agent.agentId,
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
