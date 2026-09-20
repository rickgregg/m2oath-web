import type {
  ExternalTrustEvidenceProvider,
  TrustEvaluationRequest,
  TrustedDomainEvidenceQuery
} from '@m2oath/agent'

import type {
  M2OathTransport
} from '@m2oath/sdk'

export interface RemoteTrustedDomainEvidenceProviderOptions {
  path?: string
}

/**
 * Raven adapter from the public M2Oath external-evidence contract
 * to an authenticated remote Trusted Domain authority.
 *
 * The adapter deliberately reduces TrustEvaluationRequest to
 * TrustedDomainEvidenceQuery before crossing the domain boundary.
 *
 * Execution-authentication context remains inside the M2Oath
 * enforcement runtime and is never synthesized or forwarded to
 * the Trusted Domain.
 *
 * The remote domain supplies evidence only. It does not calculate
 * accumulated Agent trust and cannot authorize protected execution.
 */
export class RemoteTrustedDomainEvidenceProvider<
  TEvidence = unknown
> implements ExternalTrustEvidenceProvider<TEvidence> {
  readonly #path: string

  constructor(
    private readonly transport: M2OathTransport,
    options:
      RemoteTrustedDomainEvidenceProviderOptions = {}
  ) {
    this.#path =
      options.path ??
      '/v1/evidence'
  }

  async getEvidence(
    request: TrustEvaluationRequest
  ): Promise<TEvidence> {
    const query:
      TrustedDomainEvidenceQuery<
        TrustEvaluationRequest['input']
      > = {
        agentId:
          request.context.agentId,

        operation:
          request.operation,

        input:
          request.input
      }

    const response =
      await this.transport.send({
        method: 'POST',
        path: this.#path,
        body: query
      })

    if (
      response.status < 200 ||
      response.status >= 300
    ) {
      throw new Error(
        `Unable to obtain Trusted Domain evidence. HTTP ${response.status}.`
      )
    }

    return response.body as TEvidence
  }
}
