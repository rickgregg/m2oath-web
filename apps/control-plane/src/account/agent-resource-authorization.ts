import type {
  M2OathAccountRole
} from './m2oath-account.js'

import {
  accountRoleHasCapability
} from './account-capability.js'

import type {
  M2OathAgentRelationship
} from './agent-relationship.js'

export type M2OathAgentLifecycleCapability =
  | 'agent.create'
  | 'agent.rotate-key'
  | 'agent.disable'

export interface AgentResourceAuthorizationRequest {
  role: M2OathAccountRole
  capability: M2OathAgentLifecycleCapability
  relationship?: M2OathAgentRelationship
}

/**
 * Evaluates hosted-product authorization for Agent lifecycle requests.
 *
 * Creation requires lifecycle capability but cannot require an Agent
 * relationship because the canonical Agent does not exist yet.
 *
 * Operations against an existing Agent require both lifecycle capability
 * and an ownership relationship.
 *
 * This is application/resource authorization only. M2Oath Trust remains
 * authoritative for canonical Agent lifecycle changes.
 */
export function authorizeAgentResource(
  request: AgentResourceAuthorizationRequest
): boolean {
  if (
    !accountRoleHasCapability(
      request.role,
      request.capability
    )
  ) {
    return false
  }

  if (request.capability === 'agent.create') {
    return true
  }

  return request.relationship?.relationship === 'owner'
}
