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
  AgentDirectoryWriter,
  AgentRegistrationGateway
} from './agent-store.js'

export interface M2OathAgentRegistrationGatewayOptions {
  sdk: M2OathSdk
  directory: AgentDirectoryWriter
  authentication: AuthenticationRequest
}

/**
 * Hosted adapter from the control-plane registration contract to the
 * authoritative M2Oath lifecycle SDK.
 *
 * This class never manufactures a canonical Agent ID.
 */
export class M2OathAgentRegistrationGateway
  implements AgentRegistrationGateway
{
  constructor(
    private readonly options:
      M2OathAgentRegistrationGatewayOptions
  ) {}

  async registerAgent(
    request: RegisterAgentRequest
  ): Promise<AgentSummary> {
    const result =
      await this.options.sdk.registerAgent({
        authentication:
          this.options.authentication,

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
      throw new Error(
        `agent-registration-${result.stage}-failed:${result.reason}`
      )
    }

    const identity = result.enrollment.identity

    const agent: AgentSummary = {
      agentId: identity.id,
      status: identity.status,
      ...(identity.displayName
        ? { displayName: identity.displayName }
        : {})
    }

    this.options.directory.saveAgent(agent)

    return agent
  }
}
