import type {
  AgentSummary,
  RegisterAgentRequest
} from '@m2oath/control-plane-client'

import type {
  AuthenticationProvider,
  AuthenticationRequest
} from '@m2oath/agent'

import type {
  M2OathAgentRegistrationRecoveryClient
} from '@m2oath/sdk'

import type {
  AgentRegistrationRecoveryGateway
} from './agent-store.js'

export interface M2OathAgentRegistrationRecoveryGatewayOptions {
  authenticationProvider:
    AuthenticationProvider

  recoveryClient:
    M2OathAgentRegistrationRecoveryClient
}

/**
 * Raven adapter for authoritative M2Oath Agent registration recovery.
 *
 * Raven authenticates the human caller and forwards the established
 * principal plus requested external Agent identifier to M2Oath Trust.
 *
 * M2Oath Trust remains authoritative for canonical Agent identity,
 * registration provenance, and whether recovery is permitted.
 */
export class M2OathAgentRegistrationRecoveryGateway
  implements AgentRegistrationRecoveryGateway
{
  constructor(
    private readonly options:
      M2OathAgentRegistrationRecoveryGatewayOptions
  ) {}

  async findRecoverableAgent(
    request: RegisterAgentRequest,
    authentication: AuthenticationRequest
  ): Promise<AgentSummary | undefined> {
    const authenticationResult =
      await this.options
        .authenticationProvider
        .authenticate(
          authentication
        )

    if (!authenticationResult.authenticated) {
      return undefined
    }

    const identity =
      await this.options
        .recoveryClient
        .findRecoverableAgent({
          identifier: {
            type:
              request.identifier.type,

            value:
              request.identifier.value,

            ...(request.identifier.issuer
              ? {
                  issuer:
                    request.identifier.issuer
                }
              : {})
          },

          principal:
            authenticationResult.assertion
        })

    if (!identity) {
      return undefined
    }

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
