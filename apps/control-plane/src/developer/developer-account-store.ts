import type {
  DeveloperAccount,
  DeveloperIdentityBinding
} from './developer-account.js'

export interface DeveloperAccountStore {
  findById(
    developerId: string
  ): Promise<DeveloperAccount | undefined>

  findByExternalIdentity(
    issuer: string,
    subject: string
  ): Promise<DeveloperAccount | undefined>

  create(
    account: DeveloperAccount,
    binding: DeveloperIdentityBinding
  ): Promise<void>

  addExternalIdentityBinding(
    binding: DeveloperIdentityBinding
  ): Promise<void>
}
