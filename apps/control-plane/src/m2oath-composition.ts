import type {
  AgentIdentity,
  AgentIdentityDirectory,
  AgentIdentityReader,
  AuthenticationProvider,
  ExternalIdentityAssertion
} from '@m2oath/agent'

import {
  M2OathSdk
} from '@m2oath/sdk'

import {
  TestM2OathLifecycleClient
} from './testing/test-m2oath-lifecycle-client.js'

export interface M2OathHostedComposition {
  sdk: M2OathSdk
  identityDirectory: AgentIdentityDirectory
}

export interface M2OathHostedCompositionOptions {
  authenticationProvider?:
    AuthenticationProvider

  developerPrincipals?: ReadonlyArray<
    Pick<
      ExternalIdentityAssertion,
      'type' | 'subject' | 'issuer'
    >
  >
}

class TestAgentIdentityDirectory
  implements AgentIdentityDirectory, AgentIdentityReader
{
  constructor(
    private readonly lifecycleClient:
      TestM2OathLifecycleClient
  ) {}

  async findById(
    agentId: string
  ): Promise<AgentIdentity | undefined> {
    return this.lifecycleClient.findById(
      agentId
    )
  }

  async list(): Promise<AgentIdentity[]> {
    return this.lifecycleClient.list()
  }
}

/**
 * Test-only hosted composition.
 *
 * Raven no longer composes the authoritative M2Oath Trust
 * implementation in-process. Production lifecycle operations cross
 * the M2Oath Trust service boundary through M2OathLifecycleClient.
 *
 * This composition provides deterministic in-memory collaborators
 * that emulate the remote Trust authentication/lifecycle boundary
 * for Raven tests without restoring an in-process Trust dependency.
 */
export function createM2OathHostedComposition(
  options:
    M2OathHostedCompositionOptions = {}
): M2OathHostedComposition {
  const lifecycleClient =
    new TestM2OathLifecycleClient(
      options
    )

  return {
    sdk: new M2OathSdk({
      lifecycleClient
    }),

    identityDirectory:
      new TestAgentIdentityDirectory(
        lifecycleClient
      )
  }
}
