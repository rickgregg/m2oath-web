import type {
  AgentLifecycleAction,
  AgentLifecycleAuthorizationPolicy,
  AgentLifecycleAuthorizationRequest,
  AgentLifecycleAuthorizationResult
} from '@m2oath/agent'

import {
  DeveloperAccountService
} from './developer-account-service.js'

const DEVELOPER_LIFECYCLE_ACTIONS:
  readonly AgentLifecycleAction[] = [
    'agent.create',
    'agent.rotate-key',
    'agent.disable'
  ]

/**
 * Authorizes hosted Agent lifecycle operations from durable canonical
 * Developer Account state.
 *
 * Authentication remains the responsibility of the M2Oath lifecycle
 * service. This policy consumes only the verified assertion supplied
 * to the authorization boundary.
 *
 * Authorization never creates a Developer Account as a side effect.
 */
export class DeveloperAccountAgentLifecycleAuthorizationPolicy
  implements AgentLifecycleAuthorizationPolicy {
  constructor(
    private readonly accountService:
      DeveloperAccountService
  ) {}

  async authorize(
    request: AgentLifecycleAuthorizationRequest
  ): Promise<AgentLifecycleAuthorizationResult> {
    const issuer =
      request.assertion.issuer?.trim()

    const subject =
      request.assertion.subject.trim()

    if (!issuer || !subject) {
      return denied()
    }

    if (
      !DEVELOPER_LIFECYCLE_ACTIONS.includes(
        request.action
      )
    ) {
      return denied()
    }

    const account =
      await this.accountService.findByExternalIdentity(
        issuer,
        subject
      )

    if (
      !account ||
      account.status !== 'active'
    ) {
      return denied()
    }

    return {
      allowed: true
    }
  }
}

function denied(): AgentLifecycleAuthorizationResult {
  return {
    allowed: false,
    reason:
      'agent-lifecycle-action-not-authorized'
  }
}
