import type {
  AuthenticationProvider,
  AuthenticationRequest
} from '@m2oath/agent'

import type {
  DeveloperAccount
} from './developer-account.js'

import {
  DeveloperAccountService
} from './developer-account-service.js'

import {
  DeveloperSessionError
} from './developer-session-error.js'

export interface BootstrapDeveloperAccountRequest {
  authentication: AuthenticationRequest
  displayName?: string
}

/**
 * Authenticates presented Developer credentials and resolves verified
 * external identities to canonical hosted Developer accounts.
 *
 * issuer + subject are derived only from authenticated assertions.
 * They are never accepted from browser request bodies.
 */
export class DeveloperAccountGateway {
  constructor(
    private readonly authenticationProvider:
      AuthenticationProvider,

    private readonly accountService:
      DeveloperAccountService
  ) {}

  /**
   * Login/signup boundary.
   *
   * A first successful authentication may create the canonical
   * Developer account.
   */
  async bootstrap(
    request: BootstrapDeveloperAccountRequest
  ): Promise<DeveloperAccount> {
    const identity =
      await this.authenticateIdentity(
        request.authentication
      )

    return this.accountService.resolveOrCreate({
      issuer:
        identity.issuer,

      subject:
        identity.subject,

      displayName:
        request.displayName
    })
  }

  /**
   * Protected REST API boundary.
   *
   * Ordinary API access must resolve an existing Developer account and
   * must never create one as a side effect of authorization.
   */
  async resolveAuthenticated(
    authentication: AuthenticationRequest
  ): Promise<DeveloperAccount> {
    const identity =
      await this.authenticateIdentity(
        authentication
      )

    const account =
      await this.accountService.findByExternalIdentity(
        identity.issuer,
        identity.subject
      )

    if (!account) {
      throw new DeveloperSessionError(
        'identity',
        'developer-account-not-found'
      )
    }

    if (account.status !== 'active') {
      throw new DeveloperSessionError(
        'identity',
        'developer-account-disabled'
      )
    }

    return account
  }

  private async authenticateIdentity(
    authentication: AuthenticationRequest
  ): Promise<{
    issuer: string
    subject: string
  }> {
    const result =
      await this.authenticationProvider.authenticate(
        authentication
      )

    if (!result.authenticated) {
      throw new DeveloperSessionError(
        'authentication',
        'developer-authentication-failed'
      )
    }

    const issuer =
      result.assertion.issuer?.trim()

    const subject =
      result.assertion.subject?.trim()

    if (!issuer || !subject) {
      throw new DeveloperSessionError(
        'identity',
        'developer-authenticated-identity-incomplete'
      )
    }

    return {
      issuer,
      subject
    }
  }
}
