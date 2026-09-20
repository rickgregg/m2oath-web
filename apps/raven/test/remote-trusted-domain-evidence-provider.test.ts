import {
  describe,
  expect,
  it,
  vi
} from 'vitest'

import type {
  M2OathTransport
} from '@m2oath/sdk'

import {
  RemoteTrustedDomainEvidenceProvider
} from '../src/providers/remote-trusted-domain-evidence-provider.js'

describe(
  'RemoteTrustedDomainEvidenceProvider',
  () => {
    it(
      'reduces the trust evaluation request before crossing the domain boundary',
      async () => {
        const send =
          vi.fn().mockResolvedValue({
            status: 200,
            headers: {},
            body: {
              confidence: 0.91
            }
          })

        const transport = {
          send
        } as M2OathTransport

        const provider =
          new RemoteTrustedDomainEvidenceProvider<{
            confidence: number
          }>(
            transport
          )

        const evidence =
          await provider.getEvidence({
            context: {
              agentId: 'agent-123',
              requestId: 'request-456',
              credentialId: 'credential-789',
              authenticatedAt:
                new Date(
                  '2026-09-20T12:00:00.000Z'
                )
            },
            operation: {
              type: 'tool',
              name: 'weather.read'
            },
            input: {
              location: 'Omaha'
            }
          })

        expect(send).toHaveBeenCalledOnce()

        expect(send).toHaveBeenCalledWith({
          method: 'POST',
          path: '/v1/evidence',
          body: {
            agentId: 'agent-123',
            operation: {
              type: 'tool',
              name: 'weather.read'
            },
            input: {
              location: 'Omaha'
            }
          }
        })

        expect(evidence).toEqual({
          confidence: 0.91
        })
      }
    )

    it(
      'fails closed when the remote authority rejects the request',
      async () => {
        const transport = {
          send:
            vi.fn().mockResolvedValue({
              status: 503,
              headers: {},
              body: undefined
            })
        } as M2OathTransport

        const provider =
          new RemoteTrustedDomainEvidenceProvider(
            transport
          )

        await expect(
          provider.getEvidence({
            context: {
              agentId: 'agent-123',
              requestId: 'request-456'
            },
            operation: {
              type: 'tool',
              name: 'weather.read'
            },
            input: {}
          })
        ).rejects.toThrow(
          'Unable to obtain Trusted Domain evidence. HTTP 503.'
        )
      }
    )
  }
)
