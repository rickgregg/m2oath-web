import type { ControlPlaneClient } from './control-plane-client.js'
import type {
  AgentSummary,
  BootstrapDeveloperSessionRequest,
  BootstrapDeveloperSessionResponse,
  LinkDeveloperExternalIdentityRequest,
  LinkDeveloperExternalIdentityResponse,
  RegisterAgentRequest,
  RegisterAgentResponse
} from './types.js'

export interface HttpControlPlaneClientOptions {
  baseUrl: string
  fetch?: typeof globalThis.fetch

  /**
   * Optional caller credential transported through the HTTP
   * Authorization header.
   *
   * Credentials are transport/security context. They are never added
   * to Agent enrollment payloads.
   */
  bearerToken?: string
}

export class HttpControlPlaneClient implements ControlPlaneClient {
  private readonly baseUrl: string
  private readonly fetch: typeof globalThis.fetch
  private readonly bearerToken?: string

  constructor(options: HttpControlPlaneClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '')
    this.fetch = options.fetch ?? globalThis.fetch

    const bearerToken =
      options.bearerToken?.trim()

    this.bearerToken =
      bearerToken
        ? bearerToken
        : undefined
  }

  async bootstrapDeveloperSession(
    request: BootstrapDeveloperSessionRequest = {}
  ): Promise<BootstrapDeveloperSessionResponse> {
    return this.request<BootstrapDeveloperSessionResponse>(
      '/v1/developers/session',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(request)
      }
    )
  }

  async linkDeveloperExternalIdentity(
    request: LinkDeveloperExternalIdentityRequest
  ): Promise<LinkDeveloperExternalIdentityResponse> {
    return this.request<LinkDeveloperExternalIdentityResponse>(
      '/v1/developers/me/identity-bindings',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(request)
      }
    )
  }

  async registerAgent(
    request: RegisterAgentRequest
  ): Promise<RegisterAgentResponse> {
    return this.request<RegisterAgentResponse>('/v1/agents', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(request)
    })
  }

  async getAgent(agentId: string): Promise<AgentSummary> {
    return this.request<AgentSummary>(
      `/v1/agents/${encodeURIComponent(agentId)}`
    )
  }

  async listAgents(): Promise<AgentSummary[]> {
    return this.request<AgentSummary[]>('/v1/agents')
  }

  async getMyAgent(
    agentId: string
  ): Promise<AgentSummary> {
    return this.request<AgentSummary>(
      `/v1/developers/me/agents/${encodeURIComponent(agentId)}`
    )
  }

  async listMyAgents(): Promise<AgentSummary[]> {
    return this.request<AgentSummary[]>(
      '/v1/developers/me/agents'
    )
  }

  private async request<T>(
    path: string,
    init?: RequestInit
  ): Promise<T> {
    const headers =
      new Headers(init?.headers)

    if (this.bearerToken) {
      headers.set(
        'authorization',
        `Bearer ${this.bearerToken}`
      )
    }

    const requestInit: RequestInit | undefined =
      init === undefined && !this.bearerToken
        ? undefined
        : {
            ...init,
            headers
          }

    const response =
      await this.fetch(
        `${this.baseUrl}${path}`,
        requestInit
      )

    if (!response.ok) {
      throw new ControlPlaneHttpError(
        response.status,
        response.statusText
      )
    }

    return await response.json() as T
  }
}

export class ControlPlaneHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string
  ) {
    super(
      `M2Oath control-plane request failed: ${status} ${statusText}`
    )
    this.name = 'ControlPlaneHttpError'
  }
}
