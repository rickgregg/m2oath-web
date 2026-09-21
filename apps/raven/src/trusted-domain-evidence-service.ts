import type {
  TrustEvaluationRequest
} from '@m2oath/agent'

import type {
  RavenProviderRuntime
} from './providers/raven-provider-runtime.js'

export interface GetTrustedDomainEvidenceRequest {
  domain: string
  evaluation: TrustEvaluationRequest
}

/**
 * Raven application service for obtaining evidence from an
 * authoritative Trusted Domain.
 *
 * Raven selects and invokes the authority. The Trusted Domain remains
 * authoritative for the evidence itself, and this service does not
 * interpret the evidence, evaluate policy, or authorize protected
 * execution.
 */
export class TrustedDomainEvidenceService {
  constructor(
    private readonly providerRuntime:
      RavenProviderRuntime
  ) {}

  async getEvidence<TEvidence = unknown>(
    request: GetTrustedDomainEvidenceRequest
  ): Promise<TEvidence> {
    const domain = request.domain.trim()

    if (!domain) {
      throw new Error(
        'Trusted Domain evidence request requires a non-empty domain.'
      )
    }

    const provider =
      this.providerRuntime
        .getTrustedDomainProviderByDomain<TEvidence>(
          domain
        )

    return provider.getEvidence(
      request.evaluation
    )
  }
}
