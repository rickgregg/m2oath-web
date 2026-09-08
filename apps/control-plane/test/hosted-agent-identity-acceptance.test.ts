import { afterEach, describe, expect, it } from 'vitest'
import type { AddressInfo } from 'node:net'
import {
  HttpControlPlaneClient
} from '@m2oath/control-plane-client'
import {
  InMemoryAgentDirectory
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

async function startControlPlane() {
  const server = (() => {
    const directory =
      new InMemoryAgentDirectory()

    const m2oath =
      createM2OathHostedComposition()

    const registrationGateway =
      new M2OathAgentRegistrationGateway({
        sdk: m2oath.sdk,
        directory,
        authentication: {}
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

describe('hosted Developer -> Control Plane -> Agent identity acceptance', () => {
  it('retrieves through the Agent side the same canonical identity registered through the Developer side', async () => {
    const { baseUrl } = await startControlPlane()

    /*
     * These are intentionally separate client instances.
     *
     * The Developer and Agent applications are separate hosted
     * applications. They must not share process-local identity state.
     *
     * Their common authority is the shared control plane.
     */
    const developerClient = new HttpControlPlaneClient({
      baseUrl
    })

    const agentClient = new HttpControlPlaneClient({
      baseUrl
    })

    /*
     * Developer registration requests an Agent.
     *
     * The caller supplies only descriptive input. It does not supply
     * or manufacture the canonical Agent ID.
     */
    const registration = await developerClient.registerAgent({
      displayName: 'Weather Agent',
      identifier: {
        type: 'runtime-jwt',
        value: 'weather-agent-runtime',
        issuer: 'https://issuer.example'
      }
    })

    expect(registration.agent).toEqual({
      agentId: expect.stringMatching(
        /^agt_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      ),
      displayName: 'Weather Agent',
      status: 'active'
    })

    /*
     * The independently constructed Agent-side client now resolves
     * the server-issued canonical Agent ID through the same shared
     * authority boundary.
     */
    const agent = await agentClient.getAgent(
      registration.agent.agentId
    )

    expect(agent).toEqual({
      agentId: registration.agent.agentId,
      displayName: 'Weather Agent',
      status: 'active'
    })

    /*
     * This is the architectural invariant being protected:
     *
     * Developer registration and Agent retrieval converge on the
     * exact same server-issued canonical identity.
     */
    expect(agent.agentId).toBe(registration.agent.agentId)
  })

  it('makes the registered agent visible through the Agent-side list', async () => {
    const { baseUrl } = await startControlPlane()

    const developerClient = new HttpControlPlaneClient({
      baseUrl
    })

    const agentClient = new HttpControlPlaneClient({
      baseUrl
    })

    const registration = await developerClient.registerAgent({
      displayName: 'Weather Agent',
      identifier: {
        type: 'runtime-jwt',
        value: 'weather-agent-runtime',
        issuer: 'https://issuer.example'
      }
    })

    const agents = await agentClient.listAgents()

    expect(agents).toContainEqual({
      agentId: registration.agent.agentId,
      displayName: 'Weather Agent',
      status: 'active'
    })
  })
})
