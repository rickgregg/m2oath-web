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
  RemoteTrustPolicyWorkbenchSimulationError
} from '@m2oath/trust-simulation-client'

import type {
  M2OathTrustSimulationGateway
} from '../src/m2oath-trust-simulation-gateway.js'

import type {
  AuthenticationProvider,
  AuthenticationRequest,
  AuthenticationResult
} from '@m2oath/agent'

import type {
  DeveloperAccount,
  DeveloperIdentityBinding
} from '../src/developer/developer-account.js'

import type {
  DeveloperAccountStore
} from '../src/developer/developer-account-store.js'

import {
  DeveloperAccountGateway
} from '../src/developer/developer-account-gateway.js'

import {
  DeveloperAccountService
} from '../src/developer/developer-account-service.js'

import {
  HostedAgentRegistrationService
} from '../src/hosted-agent-registration-service.js'

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

async function startServer(
  trustSimulationGateway?:
    M2OathTrustSimulationGateway
) {
  const authenticationOptions =
    createTestM2OathAuthenticationOptions()

  const m2oath =
    createM2OathHostedComposition(
      authenticationOptions
    )

  const directory =
    new M2OathAgentDirectory(
      m2oath.identityDirectory
    )

  const registrationGateway =
    new M2OathAgentRegistrationGateway({
      sdk: m2oath.sdk
    })

  const store =
    new TestDeveloperAccountStore()

  const now =
    new Date(
      '2026-09-08T00:00:00.000Z'
    )

  await store.create(
    {
      developerId:
        'dev_test-developer',

      status:
        'active',

      role:
        'developer',

      createdAt:
        now,

      updatedAt:
        now
    },
    {
      developerId:
        'dev_test-developer',

      issuer:
        'https://developer.test.m2oath.local',

      subject:
        'test-developer',

      createdAt:
        now
    }
  )

  await store.create(
    {
      developerId:
        'dev_unauthorized-developer',

      status:
        'active',

      role:
        'developer',

      createdAt:
        now,

      updatedAt:
        now
    },
    {
      developerId:
        'dev_unauthorized-developer',

      issuer:
        'https://developer.test.m2oath.local',

      subject:
        'unauthorized-developer',

      createdAt:
        now
    }
  )

  const developerAccountGateway =
    new DeveloperAccountGateway(
      authenticationOptions.authenticationProvider,
      new DeveloperAccountService(
        store
      )
    )

  const relationshipService = {
    assignOwner:
      async (
        developerId: string,
        agentId: string
      ) => ({
        developerId,
        agentId,
        relationship:
          'owner' as const,

        createdAt:
          now
      })
  }

  const hostedRegistrationService =
    new HostedAgentRegistrationService({
      developerAccountGateway,
      registrationGateway,

      relationshipService:
        relationshipService as never
    })

  const server =
    createControlPlaneServer({
      registrationGateway,
      directory,
      developerAccountGateway,
      hostedRegistrationService,
      trustSimulationGateway
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

function registrationHeaders() {
  return {
    'content-type': 'application/json',
    authorization: `Bearer ${TEST_DEVELOPER_TOKEN}`
  }
}


class TestDeveloperAccountStore
  implements DeveloperAccountStore {
  accounts =
    new Map<string, DeveloperAccount>()

  bindings: DeveloperIdentityBinding[] = []

  async findById(
    developerId: string
  ): Promise<DeveloperAccount | undefined> {
    return this.accounts.get(developerId)
  }

  async findByExternalIdentity(
    issuer: string,
    subject: string
  ): Promise<DeveloperAccount | undefined> {
    const binding =
      this.bindings.find(candidate =>
        candidate.issuer === issuer &&
        candidate.subject === subject
      )

    if (!binding) {
      return undefined
    }

    return this.accounts.get(
      binding.developerId
    )
  }

  async create(
    account: DeveloperAccount,
    binding: DeveloperIdentityBinding
  ): Promise<void> {
    this.accounts.set(
      account.developerId,
      account
    )

    this.bindings.push(binding)
  }

  async addExternalIdentityBinding(
    binding: DeveloperIdentityBinding
  ): Promise<void> {
    this.bindings.push(binding)
  }
}

class TestIdentityLinkAuthenticationProvider
  implements AuthenticationProvider {
  async authenticate(
    request: AuthenticationRequest
  ): Promise<AuthenticationResult> {
    if (
      request.credential ===
      'primary-link-token'
    ) {
      return {
        authenticated: true,

        assertion: {
          type:
            'oauth-subject',

          issuer:
            'https://issuer.example/',

          subject:
            'primary-link-user',

          authenticatedAt:
            new Date(
              '2026-09-09T22:00:00.000Z'
            )
        }
      }
    }

    if (
      request.credential ===
      'secondary-link-token'
    ) {
      return {
        authenticated: true,

        assertion: {
          type:
            'oauth-subject',

          issuer:
            'https://issuer.example/',

          subject:
            'secondary-link-user',

          authenticatedAt:
            new Date(
              '2026-09-09T22:00:00.000Z'
            )
        }
      }
    }

    return {
      authenticated: false,
      reason:
        'test-link-authentication-failed'
    }
  }
}

async function startDeveloperIdentityServer() {
  const store =
    new TestDeveloperAccountStore()

  const developer: DeveloperAccount = {
    developerId:
      'dev_link-test',

    displayName:
      'Link Test Developer',

    status:
      'active',

    role:
      'developer',

    createdAt:
      new Date(
        '2026-09-09T21:00:00.000Z'
      ),

    updatedAt:
      new Date(
        '2026-09-09T21:00:00.000Z'
      )
  }

  await store.create(
    developer,
    {
      developerId:
        developer.developerId,

      issuer:
        'https://issuer.example/',

      subject:
        'primary-link-user',

      createdAt:
        developer.createdAt
    }
  )

  const developerAccountGateway =
    new DeveloperAccountGateway(
      new TestIdentityLinkAuthenticationProvider(),
      new DeveloperAccountService(
        store
      )
    )

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
      sdk:
        m2oath.sdk
    })

  const server =
    createControlPlaneServer({
      registrationGateway,
      directory,
      developerAccountGateway
    })

  servers.push(server)

  await new Promise<void>(resolve => {
    server.listen(
      0,
      '127.0.0.1',
      resolve
    )
  })

  const address =
    server.address() as AddressInfo

  return {
    baseUrl:
      `http://127.0.0.1:${address.port}`,

    store,
    developer
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

  it(
    'links a second authenticated identity to the current Developer account',
    async () => {
      const {
        baseUrl,
        store,
        developer
      } =
        await startDeveloperIdentityServer()

      const response =
        await fetch(
          `${baseUrl}/v1/developers/me/identity-bindings`,
          {
            method:
              'POST',

            headers: {
              'content-type':
                'application/json',

              authorization:
                'Bearer primary-link-token'
            },

            body:
              JSON.stringify({
                credential:
                  'secondary-link-token'
              })
          }
        )

      expect(
        response.status
      ).toBe(
        200
      )

      expect(
        await response.json()
      ).toEqual({
        developer: {
          developerId:
            developer.developerId,

          displayName:
            developer.displayName,

          status:
            'active',

          role:
            'developer'
        }
      })

      expect(
        store.bindings
      ).toContainEqual({
        developerId:
          developer.developerId,

        issuer:
          'https://issuer.example/',

        subject:
          'secondary-link-user',

        createdAt:
          expect.any(Date)
      })
    }
  )


  it(
    'rejects Developer identity linking when the external identity credential is missing',
    async () => {
      const {
        baseUrl
      } =
        await startDeveloperIdentityServer()

      const response =
        await fetch(
          `${baseUrl}/v1/developers/me/identity-bindings`,
          {
            method:
              'POST',

            headers: {
              'content-type':
                'application/json',

              authorization:
                'Bearer primary-link-token'
            },

            body:
              JSON.stringify({})
          }
        )

      expect(
        response.status
      ).toBe(
        400
      )

      expect(
        await response.json()
      ).toEqual({
        error:
          'developer-external-identity-credential-required'
      })
    }
  )

  it(
    'rejects Developer identity linking when the external identity credential is blank',
    async () => {
      const {
        baseUrl
      } =
        await startDeveloperIdentityServer()

      const response =
        await fetch(
          `${baseUrl}/v1/developers/me/identity-bindings`,
          {
            method:
              'POST',

            headers: {
              'content-type':
                'application/json',

              authorization:
                'Bearer primary-link-token'
            },

            body:
              JSON.stringify({
                credential:
                  '   '
              })
          }
        )

      expect(
        response.status
      ).toBe(
        400
      )

      expect(
        await response.json()
      ).toEqual({
        error:
          'developer-external-identity-credential-required'
      })
    }
  )

  it(
    'rejects Developer identity linking when the current Developer is not authenticated',
    async () => {
      const {
        baseUrl
      } =
        await startDeveloperIdentityServer()

      const response =
        await fetch(
          `${baseUrl}/v1/developers/me/identity-bindings`,
          {
            method:
              'POST',

            headers: {
              'content-type':
                'application/json'
            },

            body:
              JSON.stringify({
                credential:
                  'secondary-link-token'
              })
          }
        )

      expect(
        response.status
      ).toBe(
        401
      )

      expect(
        await response.json()
      ).toEqual({
        error:
          'developer-authentication-required'
      })
    }
  )


  it(
    'runs the Trust population simulation for an authenticated Developer',
    async () => {
      const result = {
        population: {
          id: 'population-001',
          name: 'Population 001',
          description:
            'Deterministic ten-Agent population isolation baseline.'
        },

        model: {
          modelId: 'm2oath-workbench',
          modelVersion: '3',
          configurationHash:
            'farming-resistance-v1'
        },

        summary: {
          agentCount: 10,
          checkpointCount: 10,
          allowedCount: 5,
          deniedCount: 5,
          compositeScore: {
            minimum: 50,
            maximum: 60,
            average: 55
          }
        },

        agents: []
      }

      let populationRuns = 0

      const trustSimulationGateway = {
        runPopulation:
          async () => {
            populationRuns += 1
            return result
          }
      } as M2OathTrustSimulationGateway

      const {
        baseUrl
      } =
        await startServer(
          trustSimulationGateway
        )

      const response =
        await fetch(
          `${baseUrl}/v1/developers/me/trust-population-simulations`,
          {
            method: 'POST',

            headers: {
              authorization:
                `Bearer ${TEST_DEVELOPER_TOKEN}`
            }
          }
        )

      expect(response.status).toBe(200)

      expect(
        await response.json()
      ).toEqual(result)

      expect(populationRuns).toBe(1)
    }
  )

  it(
    'requires Developer authentication for Trust population simulation',
    async () => {
      const trustSimulationGateway = {
        runPopulation:
          async () => {
            throw new Error(
              'Population simulation gateway must not be called'
            )
          }
      } as M2OathTrustSimulationGateway

      const {
        baseUrl
      } =
        await startServer(
          trustSimulationGateway
        )

      const response =
        await fetch(
          `${baseUrl}/v1/developers/me/trust-population-simulations`,
          {
            method: 'POST'
          }
        )

      expect(response.status).toBe(401)

      expect(
        await response.json()
      ).toEqual({
        error:
          'developer-authentication-required'
      })
    }
  )

  it(
    'translates authoritative Trust population simulation failures',
    async () => {
      const trustSimulationGateway = {
        runPopulation:
          async () => {
            throw new RemoteTrustPolicyWorkbenchSimulationError(
              401,
              {
                error:
                  'authentication-failed'
              }
            )
          }
      } as M2OathTrustSimulationGateway

      const {
        baseUrl
      } =
        await startServer(
          trustSimulationGateway
        )

      const response =
        await fetch(
          `${baseUrl}/v1/developers/me/trust-population-simulations`,
          {
            method: 'POST',

            headers: {
              authorization:
                `Bearer ${TEST_DEVELOPER_TOKEN}`
            }
          }
        )

      expect(response.status).toBe(502)

      expect(
        await response.json()
      ).toEqual({
        error:
          'trust-simulation-service-authentication-failed'
      })
    }
  )

  it(
    'runs a Trust simulation for an authenticated Developer',
    async () => {
      const result = {
        scenario: {
          id:
            'normal-trust-growth',
          name:
            'Normal Trust Growth',
          startedAt:
            '2026-01-01T00:00:00.000Z',
          completedAt:
            '2026-01-01T00:30:00.000Z'
        },

        model: {
          modelId:
            'm2oath-workbench',
          modelVersion:
            '1',
          configurationHash:
            'canonical-day-10'
        },

        timeline: []
      }

      const requests: unknown[] = []

      const trustSimulationGateway = {
        run:
          async (request: unknown) => {
            requests.push(request)
            return result
          }
      } as M2OathTrustSimulationGateway

      const {
        baseUrl
      } =
        await startServer(
          trustSimulationGateway
        )

      const response =
        await fetch(
          `${baseUrl}/v1/developers/me/trust-simulations`,
          {
            method: 'POST',

            headers: {
              'content-type':
                'application/json',

              authorization:
                `Bearer ${TEST_DEVELOPER_TOKEN}`
            },

            body:
              JSON.stringify({
                scenarioId:
                  'normal-trust-growth',
                modelConfigurationId:
                  'farming-resistance-v1'
              })
          }
        )

      expect(response.status).toBe(200)

      expect(
        await response.json()
      ).toEqual(result)

      expect(requests).toEqual([
        {
          scenarioId:
            'normal-trust-growth',
          modelConfigurationId:
            'farming-resistance-v1'
        }
      ])
    }
  )

  it(
    'requires Developer authentication for Trust simulation',
    async () => {
      const trustSimulationGateway = {
        run:
          async () => {
            throw new Error(
              'Simulation gateway must not be called'
            )
          }
      } as M2OathTrustSimulationGateway

      const {
        baseUrl
      } =
        await startServer(
          trustSimulationGateway
        )

      const response =
        await fetch(
          `${baseUrl}/v1/developers/me/trust-simulations`,
          {
            method: 'POST',

            headers: {
              'content-type':
                'application/json'
            },

            body:
              JSON.stringify({
                scenarioId:
                  'normal-trust-growth'
              })
          }
        )

      expect(response.status).toBe(401)

      expect(
        await response.json()
      ).toEqual({
        error:
          'developer-authentication-required'
      })
    }
  )

  it(
    'reports Trust simulation unavailable when Raven has no simulation gateway',
    async () => {
      const {
        baseUrl
      } =
        await startServer()

      const response =
        await fetch(
          `${baseUrl}/v1/developers/me/trust-simulations`,
          {
            method: 'POST',

            headers: {
              'content-type':
                'application/json',

              authorization:
                `Bearer ${TEST_DEVELOPER_TOKEN}`
            },

            body:
              JSON.stringify({
                scenarioId:
                  'normal-trust-growth'
              })
          }
        )

      expect(response.status).toBe(503)

      expect(
        await response.json()
      ).toEqual({
        error:
          'trust-simulation-service-unavailable'
      })
    }
  )


  it.each([
    {
      upstreamStatus: 400,
      expectedStatus: 400,
      expectedError:
        'invalid-trust-simulation-request'
    },
    {
      upstreamStatus: 403,
      expectedStatus: 403,
      expectedError:
        'trust-simulation-not-authorized'
    },
    {
      upstreamStatus: 401,
      expectedStatus: 502,
      expectedError:
        'trust-simulation-service-authentication-failed'
    },
    {
      upstreamStatus: 503,
      expectedStatus: 502,
      expectedError:
        'trust-simulation-service-failed'
    }
  ])(
    'translates authoritative Trust simulation failures: HTTP $upstreamStatus',
    async ({
      upstreamStatus,
      expectedStatus,
      expectedError
    }) => {
      const trustSimulationGateway = {
        run:
          async () => {
            throw new RemoteTrustPolicyWorkbenchSimulationError(
              upstreamStatus,
              {
                error:
                  'authoritative-upstream-error'
              }
            )
          }
      } as M2OathTrustSimulationGateway

      const {
        baseUrl
      } =
        await startServer(
          trustSimulationGateway
        )

      const response =
        await fetch(
          `${baseUrl}/v1/developers/me/trust-simulations`,
          {
            method: 'POST',

            headers: {
              'content-type':
                'application/json',

              authorization:
                `Bearer ${TEST_DEVELOPER_TOKEN}`
            },

            body:
              JSON.stringify({
                scenarioId:
                  'normal-trust-growth'
              })
          }
        )

      expect(response.status).toBe(
        expectedStatus
      )

      expect(
        await response.json()
      ).toEqual({
        error:
          expectedError
      })
    }
  )

})
