import {
  createServer,
  type IncomingMessage,
  type ServerResponse
} from 'node:http'
import type {
  RegisterAgentRequest
} from '@m2oath/control-plane-client'
import type {
  AuthenticationRequest
} from '@m2oath/agent'
import type {
  AgentDirectory,
  AgentRegistrationGateway
} from './agent-store.js'
import {
  AgentRegistrationError
} from './agent-registration-error.js'

export interface CreateControlPlaneServerOptions {
  registrationGateway: AgentRegistrationGateway
  directory: AgentDirectory
}

export function createControlPlaneServer(
  options: CreateControlPlaneServerOptions
) {
  return createServer(async (request, response) => {
    try {
      await handleRequest(options, request, response)
    } catch (error) {
      console.error(error)

      sendJson(response, 500, {
        error: 'internal-server-error'
      })
    }
  })
}

async function handleRequest(
  options: CreateControlPlaneServerOptions,
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const method = request.method ?? 'GET'
  const url = new URL(
    request.url ?? '/',
    'http://localhost'
  )

  if (method === 'GET' && url.pathname === '/health') {
    sendJson(response, 200, {
      status: 'ok'
    })
    return
  }

  if (method === 'POST' && url.pathname === '/v1/agents') {
    const authentication =
      getBearerAuthenticationRequest(request)

    if (!authentication) {
      sendJson(response, 401, {
        error: 'developer-authentication-required'
      })
      return
    }

    const body =
      await readJsonBody<RegisterAgentRequest>(request)

    try {
      const agent =
        await options.registrationGateway.registerAgent(
          body,
          authentication
        )

      sendJson(response, 201, {
        agent
      })
    } catch (error) {
      if (
        error instanceof AgentRegistrationError
      ) {
        if (error.stage === 'authentication') {
          sendJson(response, 401, {
            error: 'developer-authentication-failed'
          })
          return
        }

        if (error.stage === 'authorization') {
          sendJson(response, 403, {
            error: 'developer-not-authorized'
          })
          return
        }
      }

      throw error
    }

    return
  }

  if (method === 'GET' && url.pathname === '/v1/agents') {
    sendJson(response, 200, options.directory.listAgents())
    return
  }

  if (
    method === 'GET' &&
    url.pathname.startsWith('/v1/agents/')
  ) {
    const encodedAgentId =
      url.pathname.slice('/v1/agents/'.length)

    const agentId =
      decodeURIComponent(encodedAgentId)

    const agent =
      options.directory.getAgent(agentId)

    if (!agent) {
      sendJson(response, 404, {
        error: 'agent-not-found'
      })
      return
    }

    sendJson(response, 200, agent)
    return
  }

  sendJson(response, 404, {
    error: 'not-found'
  })
}

function getBearerAuthenticationRequest(
  request: IncomingMessage
): AuthenticationRequest | undefined {
  const authorization =
    request.headers.authorization?.trim()

  if (!authorization) {
    return undefined
  }

  const match =
    /^Bearer\s+(.+)$/i.exec(authorization)

  if (!match) {
    return undefined
  }

  const credential =
    match[1]?.trim()

  if (!credential) {
    return undefined
  }

  return {
    credential
  }
}

async function readJsonBody<T>(
  request: IncomingMessage
): Promise<T> {
  const chunks: Buffer[] = []

  for await (const chunk of request) {
    chunks.push(
      Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk)
    )
  }

  const body =
    Buffer.concat(chunks).toString('utf8')

  return JSON.parse(body || '{}') as T
}

function sendJson(
  response: ServerResponse,
  status: number,
  body: unknown
): void {
  response.statusCode = status
  response.setHeader(
    'content-type',
    'application/json'
  )
  response.end(JSON.stringify(body))
}
