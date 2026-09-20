export type DeveloperRole =
  | 'developer'
  | 'admin'

export type DeveloperAccountStatus =
  | 'active'
  | 'disabled'

export interface DeveloperAccount {
  developerId: string
  displayName?: string
  status: DeveloperAccountStatus
  role: DeveloperRole
  createdAt: Date
  updatedAt: Date
}

export interface DeveloperIdentityBinding {
  developerId: string
  issuer: string
  subject: string
  createdAt: Date
}
