/**
 * Broad hosted-product authorization roles.
 *
 * Roles establish broad capabilities within an Account context.
 * Resource-specific authorization remains a separate concern.
 */
export type M2OathAccountRole =
  | 'user'
  | 'developer'
  | 'admin'

export type M2OathAccountStatus =
  | 'active'
  | 'disabled'

export interface M2OathAccount {
  accountId: string
  status: M2OathAccountStatus
  role: M2OathAccountRole
  createdAt: Date
  updatedAt: Date
}

/**
 * Associates a canonical M2Oath User with an Account.
 *
 * Human identity and Account authorization remain distinct.
 */
export interface M2OathAccountMembership {
  accountId: string
  userId: string
  createdAt: Date
}
