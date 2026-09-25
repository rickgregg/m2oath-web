import {
  RemoteTrustPolicyWorkbenchSimulationClient,
  RemoteTrustPopulationWorkbenchSimulationClient
} from '@m2oath/trust-simulation-client'

import type {
  RunTrustPolicyWorkbenchSimulationRequest,
  TrustPolicyWorkbenchResult,
  TrustPopulationWorkbenchResult
} from '@m2oath/trust-simulation-client'

export interface M2OathTrustSimulationGatewayOptions {
  client:
    RemoteTrustPolicyWorkbenchSimulationClient

  populationClient:
    RemoteTrustPopulationWorkbenchSimulationClient
}

/**
 * Raven gateway to the authoritative M2Oath Trust simulation service.
 *
 * Raven orchestrates the request across the service boundary but does
 * not calculate trust, reinterpret evidence diagnostics, or make the
 * resulting policy decision.
 *
 * Authentication of Raven to the authoritative Trust service belongs
 * to the transport supplied to the remote client.
 *
 * Simulation results are observability artifacts only. Passing them
 * through Raven grants Raven no trust-policy or protected-operation
 * execution authority.
 */
export class M2OathTrustSimulationGateway {
  constructor(
    private readonly options:
      M2OathTrustSimulationGatewayOptions
  ) {}

  async run(
    request:
      RunTrustPolicyWorkbenchSimulationRequest
  ): Promise<TrustPolicyWorkbenchResult> {
    return this.options.client.run(request)
  }

  async runPopulation():
    Promise<TrustPopulationWorkbenchResult> {
    return this.options.populationClient.run()
  }
}
