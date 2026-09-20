import type {
  AgentSummary,
  RegisterAgentRequest
} from '@m2oath/control-plane-client'

import type {
  ExternalIdentityAssertion
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
 * Hosted adapter from Raven's authenticated registration flow to the
 * authoritative M2Oath lifecycle SDK.
 *
 * The supplied principal has already been authenticated by Raven.
 * The remote M2Oath transport separately authenticates Raven itself
 * to the authoritative Trust service.
 *
 * This class never manufactures a canonical Agent ID and never writes
 * a second hosted copy of Agent identity state.
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
    principal: ExternalIdentityAssertion
  ): Promise<AgentSummary> {
    const result =
      await this.options.sdk.registerAgent({
        principal,

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
