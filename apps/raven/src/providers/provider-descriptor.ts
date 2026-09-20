export type RavenProviderType =
  | 'trust'
  | 'trusted-domain'

export interface RavenProviderDescriptor {
  providerId: string
  providerType: RavenProviderType
  endpoint: string
  domain?: string
}
