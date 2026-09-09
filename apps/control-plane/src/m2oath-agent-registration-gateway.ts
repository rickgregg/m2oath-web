import type {
  AgentSummary,
  RegisterAgentRequest
} from '@m2oath/control-plane-client'

import type {
  AuthenticationRequest
} from '@m2oath/agent'

import {
  M2OathSdk
} from '@m2oath/sdk'

import type {
  AgentRegistrationGateway
} from './agent-store.js'

import {
  AgentRegistrationError
} from './agent-registration-error.js'

export interface M2OathAgentRegistrationGatewayOptions {
  sdk: M2OathSdk
}

/**
 * Hosted adapter from the control-plane registration contract to the
 * authoritative M2Oath lifecycle SDK.
 *
 * Authentication is request-scoped. The gateway never owns or caches
 * caller credentials.
 *
 * This class never manufactures a canonical Agent ID and never writes a
 * second hosted copy of Agent identity state.
 */
export class M2OathAgentRegistrationGateway
  implements AgentRegistrationGateway
{
  constructor(
    private readonly options:
      M2OathAgentRegistrationGatewayOptions
  ) {}

  async registerAgent(
    request: RegisterAgentRequest,
    authentication: AuthenticationRequest
  ): Promise<AgentSummary> {
    const result =
      await this.options.sdk.registerAgent({
        authentication,

        enrollment: {
          displayName:
            request.displayName,

          identifier: {
            ...request.identifier
          },

          ...(request.cryptographicMaterial
            ? {
                cryptographicMaterial: {
                  ...request.cryptographicMaterial
                }
              }
            : {})
        }
      })

    if (!result.ok) {
      throw new AgentRegistrationError(
        result.stage,
        result.reason
      )
    }

    const identity =
      result.enrollment.identity

    return {
      agentId: identity.id,
      status: identity.status,

      ...(identity.displayName
        ? {
            displayName:
              identity.displayName
          }
        : {})
    }
  }
}
