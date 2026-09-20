/**
 * Canonical human identity within the hosted M2Oath product.
 *
 * External identity providers authenticate a human. They do not define
 * the canonical M2Oath User or determine M2Oath authorization.
 */
export type M2OathUserStatus =
  | 'active'
  | 'disabled'

export interface M2OathUser {
  userId: string
  displayName?: string
  status: M2OathUserStatus
  createdAt: Date
  updatedAt: Date
}

/**
 * Binds an externally authenticated identity to a canonical M2Oath User.
 *
 * A single User may have multiple external identity bindings.
 */
export interface M2OathUserIdentityBinding {
  userId: string
  issuer: string
  subject: string
  createdAt: Date
}
