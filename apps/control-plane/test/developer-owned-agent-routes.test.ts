import {
  afterEach,
  describe,
  expect,
  it
} from 'vitest'

import type {
  AddressInfo
} from 'node:net'

import type {
  DeveloperAccount
} from '../src/developer/developer-account.js'

import {
  createControlPlaneServer
} from '../src/server.js'

const servers:
  ReturnType<typeof createControlPlaneServer>[] = []

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      server =>
        new Promise<void>(
          (resolve, reject) => {
            server.close(error => {
              if (error) {
                reject(error)
                return
              }

              resolve()
            })
          }
        )
    )
  )
})

const developer:
  DeveloperAccount = {
    developerId:
      'dev_123',

    displayName:
      'Developer',

    status:
      'active',

    role:
      'developer',

    createdAt:
      new Date(
        '2026-09-08T21:00:00Z'
      ),

    updatedAt:
      new Date(
        '2026-09-08T21:00:00Z'
      )
  }

async function startServer() {
  const registrationGateway = {
    registerAgent:
      async () => {
        throw new Error(
          'not-used'
        )
      }
  }

  const directory = {
    listAgents:
      async () => [],

    getAgent:
      async () => undefined
  }

  const developerAccountGateway = {
    resolveAuthenticated:
      async () => developer
  }

  const developerOwnedAgentService = {
    listOwnedAgents:
      async (
        developerId: string
      ) => {
        expect(
          developerId
        ).toBe(
          'dev_123'
        )

        return [
          {
            agentId:
              'agt_owned',

            displayName:
              'Owned Agent',

            status:
              'active'
          }
        ]
      },

    getOwnedAgent:
      async (
        developerId: string,
        agentId: string
      ) => {
        expect(
          developerId
        ).toBe(
          'dev_123'
        )

        if (
          agentId ===
          'agt_owned'
        ) {
          return {
            agentId:
              'agt_owned',

            displayName:
              'Owned Agent',

            status:
              'active'
          }
        }

        return undefined
      }
  }

  const server =
    createControlPlaneServer({
      registrationGateway,
      directory,
      developerAccountGateway:
        developerAccountGateway as never,

      developerOwnedAgentService:
        developerOwnedAgentService as never
    })

  servers.push(server)

  await new Promise<void>(
    resolve => {
      server.listen(
        0,
        '127.0.0.1',
        resolve
      )
    }
  )

  const address =
    server.address() as AddressInfo

  return {
    baseUrl:
      `http://127.0.0.1:${address.port}`
  }
}

function developerHeaders() {
  return {
    authorization:
      'Bearer developer-jwt'
  }
}

describe(
  'Developer-owned Agent routes',
  () => {
    it(
      'requires Developer authentication to list owned Agents',
      async () => {
        const { baseUrl } =
          await startServer()

        const response =
          await fetch(
            `${baseUrl}/v1/developers/me/agents`
          )

        expect(
          response.status
        ).toBe(401)

        expect(
          await response.json()
        ).toEqual({
          error:
            'developer-authentication-required'
        })
      }
    )

    it(
      'lists only Agents owned by the authenticated Developer',
      async () => {
        const { baseUrl } =
          await startServer()

        const response =
          await fetch(
            `${baseUrl}/v1/developers/me/agents`,
            {
              headers:
                developerHeaders()
            }
          )

        expect(
          response.status
        ).toBe(200)

        expect(
          await response.json()
        ).toEqual([
          {
            agentId:
              'agt_owned',

            displayName:
              'Owned Agent',

            status:
              'active'
          }
        ])
      }
    )

    it(
      'returns an Agent owned by the authenticated Developer',
      async () => {
        const { baseUrl } =
          await startServer()

        const response =
          await fetch(
            `${baseUrl}/v1/developers/me/agents/agt_owned`,
            {
              headers:
                developerHeaders()
            }
          )

        expect(
          response.status
        ).toBe(200)

        expect(
          await response.json()
        ).toEqual({
          agentId:
            'agt_owned',

          displayName:
            'Owned Agent',

          status:
            'active'
        })
      }
    )

    it(
      'does not expose an Agent without an ownership relationship',
      async () => {
        const { baseUrl } =
          await startServer()

        const response =
          await fetch(
            `${baseUrl}/v1/developers/me/agents/agt_foreign`,
            {
              headers:
                developerHeaders()
            }
          )

        expect(
          response.status
        ).toBe(404)

        expect(
          await response.json()
        ).toEqual({
          error:
            'agent-not-found'
        })
      }
    )
  }
)
