import type {
  RavenProviderDescriptor
} from './provider-descriptor.js'

export class RavenProviderRegistry {
  readonly #providers =
    new Map<string, RavenProviderDescriptor>()

  register(
    descriptor: RavenProviderDescriptor
  ): void {
    const normalized =
      normalizeDescriptor(descriptor)

    if (this.#providers.has(normalized.providerId)) {
      throw new Error(
        `Raven provider already registered: ${normalized.providerId}`
      )
    }

    this.#providers.set(
      normalized.providerId,
      normalized
    )
  }

  find(
    providerId: string
  ): RavenProviderDescriptor | undefined {
    return this.#providers.get(
      providerId.trim()
    )
  }

  require(
    providerId: string
  ): RavenProviderDescriptor {
    const provider =
      this.find(providerId)

    if (!provider) {
      throw new Error(
        `Raven provider not registered: ${providerId.trim()}`
      )
    }

    return provider
  }

  list(): RavenProviderDescriptor[] {
    return Array.from(
      this.#providers.values()
    )
  }
}

function normalizeDescriptor(
  descriptor: RavenProviderDescriptor
): RavenProviderDescriptor {
  const providerId =
    descriptor.providerId.trim()

  const endpoint =
    descriptor.endpoint.trim()

  const domain =
    descriptor.domain?.trim()

  if (!providerId) {
    throw new Error(
      'Raven provider must declare a non-empty providerId.'
    )
  }

  if (!endpoint) {
    throw new Error(
      'Raven provider must declare a non-empty endpoint.'
    )
  }

  if (
    descriptor.providerType === 'trusted-domain' &&
    !domain
  ) {
    throw new Error(
      'Raven Trusted Domain provider must declare a domain.'
    )
  }

  if (
    descriptor.providerType === 'trust' &&
    domain
  ) {
    throw new Error(
      'Raven Trust provider must not declare a Trusted Domain.'
    )
  }

  return {
    providerId,
    providerType:
      descriptor.providerType,
    endpoint,
    ...(domain
      ? { domain }
      : {})
  }
}
