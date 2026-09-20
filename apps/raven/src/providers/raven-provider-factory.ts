import type {
  AgentTrustStateProvider,
  ExternalTrustEvidenceProvider
} from '@m2oath/agent'

import {
  FetchM2OathTransport,
  RemoteAgentTrustStateProvider
} from '@m2oath/sdk'

import type {
  RavenProviderDescriptor
} from './provider-descriptor.js'

import {
  RemoteTrustedDomainEvidenceProvider
} from './remote-trusted-domain-evidence-provider.js'

export interface RavenProviderFactoryOptions {
  getAuthorizationHeader:
    (
      descriptor: RavenProviderDescriptor
    ) => string | Promise<string>

  timeoutDuration?: number

  fetch?: typeof globalThis.fetch
}

/**
 * Constructs Raven's remote adapters over authoritative M2Oath
 * services.
 *
 * The factory selects transport/adapters only. It does not redefine
 * trust semantics, calculate Agent trust, interpret domain evidence,
 * or grant protected execution.
 */
export class RavenProviderFactory {
  constructor(
    private readonly options:
      RavenProviderFactoryOptions
  ) {}

  createTrustProvider(
    descriptor: RavenProviderDescriptor
  ): AgentTrustStateProvider {
    requireProviderType(
      descriptor,
      'trust'
    )

    return new RemoteAgentTrustStateProvider(
      this.createTransport(descriptor)
    )
  }

  createTrustedDomainProvider<
    TEvidence = unknown
  >(
    descriptor: RavenProviderDescriptor
  ): ExternalTrustEvidenceProvider<TEvidence> {
    requireProviderType(
      descriptor,
      'trusted-domain'
    )

    return new RemoteTrustedDomainEvidenceProvider<
      TEvidence
    >(
      this.createTransport(descriptor)
    )
  }

  private createTransport(
    descriptor: RavenProviderDescriptor
  ): FetchM2OathTransport {
    return new FetchM2OathTransport({
      baseUrl:
        descriptor.endpoint,

      getAuthorizationHeader:
        () =>
          this.options
            .getAuthorizationHeader(
              descriptor
            ),

      ...(this.options.timeoutDuration ===
      undefined
        ? {}
        : {
            timeoutDuration:
              this.options.timeoutDuration
          }),

      ...(this.options.fetch === undefined
        ? {}
        : {
            fetch:
              this.options.fetch
          })
    })
  }
}

function requireProviderType(
  descriptor: RavenProviderDescriptor,
  expected:
    RavenProviderDescriptor['providerType']
): void {
  if (descriptor.providerType !== expected) {
    throw new Error(
      `Raven provider ${descriptor.providerId} is ${descriptor.providerType}, expected ${expected}.`
    )
  }
}
