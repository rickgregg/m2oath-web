import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import type { RegisterAgentRequest } from '@m2oath/control-plane-client'
import type { AgentStore } from './agent-store.js'

export interface CreateControlPlaneServerOptions {
  store: AgentStore
}

export function createControlPlaneServer(
  options: CreateControlPlaneServerOptions
) {
  return createServer(async (request, response) => {
    try {
      await handleRequest(options.store, request, response)
    } catch (error) {
      console.error(error)

      sendJson(response, 500, {
        error: 'internal-server-error'
      })
    }
  })
}

async function handleRequest(
  store: AgentStore,
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
    const body = await readJsonBody<RegisterAgentRequest>(request)

    const agent = store.registerAgent(body)

    sendJson(response, 201, {
      agent
    })
    return
  }

  if (method === 'GET' && url.pathname === '/v1/agents') {
    sendJson(response, 200, store.listAgents())
    return
  }

  if (method === 'GET' && url.pathname.startsWith('/v1/agents/')) {
    const encodedAgentId = url.pathname.slice('/v1/agents/'.length)
    const agentId = decodeURIComponent(encodedAgentId)

    const agent = store.getAgent(agentId)

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

async function readJsonBody<T>(
  request: IncomingMessage
): Promise<T> {
  const chunks: Buffer[] = []

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  const body = Buffer.concat(chunks).toString('utf8')

  return JSON.parse(body || '{}') as T
}

function sendJson(
  response: ServerResponse,
  status: number,
  body: unknown
): void {
  response.statusCode = status
  response.setHeader('content-type', 'application/json')
  response.end(JSON.stringify(body))
}
