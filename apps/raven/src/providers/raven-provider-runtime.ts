import type {
  AgentTrustStateProvider,
  ExternalTrustEvidenceProvider
} from '@m2oath/agent'

import {
  RavenProviderFactory
} from './raven-provider-factory.js'

import {
  RavenProviderRegistry
} from './provider-registry.js'

/**
 * Resolves Raven provider metadata into usable public M2Oath
 * provider contracts.
 *
 * Raven remains an orchestrator here. The returned providers retain
 * their existing M2Oath semantics and the remote services remain
 * authoritative for their respective trust/evidence domains.
 */
export class RavenProviderRuntime {
  constructor(
    private readonly registry:
      RavenProviderRegistry,

    private readonly factory:
      RavenProviderFactory
  ) {}

  getTrustProvider(
    providerId: string
  ): AgentTrustStateProvider {
    const descriptor =
      this.registry.require(providerId)

    return this.factory.createTrustProvider(
      descriptor
    )
  }

  getTrustedDomainProvider<
    TEvidence = unknown
  >(
    providerId: string
  ): ExternalTrustEvidenceProvider<TEvidence> {
    const descriptor =
      this.registry.require(providerId)

    return this.factory
      .createTrustedDomainProvider<TEvidence>(
        descriptor
      )
  }

  getTrustedDomainProviderByDomain<
    TEvidence = unknown
  >(
    domain: string
  ): ExternalTrustEvidenceProvider<TEvidence> {
    const normalizedDomain =
      domain.trim()

    if (!normalizedDomain) {
      throw new Error(
        'Raven Trusted Domain lookup requires a non-empty domain.'
      )
    }

    const matches =
      this.registry
        .list()
        .filter(
          descriptor =>
            descriptor.providerType ===
              'trusted-domain' &&
            descriptor.domain ===
              normalizedDomain
        )

    if (matches.length === 0) {
      throw new Error(
        `Raven Trusted Domain provider not registered: ${normalizedDomain}`
      )
    }

    if (matches.length > 1) {
      throw new Error(
        `Multiple Raven Trusted Domain providers registered for domain: ${normalizedDomain}`
      )
    }

    return this.factory
      .createTrustedDomainProvider<TEvidence>(
        matches[0]!
      )
  }
}
