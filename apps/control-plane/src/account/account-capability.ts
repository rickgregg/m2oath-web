import type {
  M2OathAccountRole
} from './m2oath-account.js'

/**
 * Broad application capabilities derived from Account roles.
 *
 * These capabilities do not replace resource-specific authorization
 * and do not themselves execute authoritative Agent lifecycle changes.
 */
export type M2OathAccountCapability =
  | 'account.read'
  | 'account.manage'
  | 'agent.read'
  | 'agent.create'
  | 'agent.rotate-key'
  | 'agent.disable'
  | 'developer.access'
  | 'administration.access'

const ROLE_CAPABILITIES:
  Readonly<Record<
    M2OathAccountRole,
    readonly M2OathAccountCapability[]
  >> = {
    user: [
      'account.read',
      'agent.read'
    ],

    developer: [
      'account.read',
      'agent.read',
      'agent.create',
      'agent.rotate-key',
      'agent.disable',
      'developer.access'
    ],

    admin: [
      'account.read',
      'account.manage',
      'agent.read',
      'administration.access'
    ]
  }

export function accountRoleHasCapability(
  role: M2OathAccountRole,
  capability: M2OathAccountCapability
): boolean {
  return ROLE_CAPABILITIES[role].includes(
    capability
  )
}
