import {
  describe,
  expect,
  it,
  vi
} from 'vitest'

import {
  TrustedDomainEvidenceService
} from '../src/trusted-domain-evidence-service.js'

describe(
  'TrustedDomainEvidenceService',
  () => {
    it(
      'obtains evidence from the authoritative provider for the requested domain',
      async () => {
        const getEvidence =
          vi.fn().mockResolvedValue({
            confidence: 0.93
          })

        const getTrustedDomainProviderByDomain =
          vi.fn().mockReturnValue({
            getEvidence
          })

        const service =
          new TrustedDomainEvidenceService({
            getTrustedDomainProviderByDomain
          } as never)

        const evaluation = {
          context: {
            agentId: 'agent-123',
            requestId: 'request-456'
          },
          operation: {
            type: 'tool',
            name: 'weather.read'
          },
          input: {
            location: 'Omaha'
          }
        }

        const evidence =
          await service.getEvidence<{
            confidence: number
          }>({
            domain: 'weather',
            evaluation
          })

        expect(
          getTrustedDomainProviderByDomain
        ).toHaveBeenCalledWith(
          'weather'
        )

        expect(getEvidence)
          .toHaveBeenCalledWith(
            evaluation
          )

        expect(evidence).toEqual({
          confidence: 0.93
        })
      }
    )

    it(
      'rejects an empty Trusted Domain',
      async () => {
        const service =
          new TrustedDomainEvidenceService({
            getTrustedDomainProviderByDomain:
              vi.fn()
          } as never)

        await expect(
          service.getEvidence({
            domain: '   ',
            evaluation: {
              context: {
                agentId: 'agent-123'
              },
              operation: {
                type: 'tool',
                name: 'weather.read'
              },
              input: {}
            }
          })
        ).rejects.toThrow(
          'Trusted Domain evidence request requires a non-empty domain.'
        )
      }
    )
  }
)
