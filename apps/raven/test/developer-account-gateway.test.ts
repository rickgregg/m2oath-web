import {
  describe,
  expect,
  it
} from 'vitest'

import type {
  AuthenticationProvider,
  AuthenticationRequest,
  AuthenticationResult
} from '@m2oath/agent'

import type {
  DeveloperAccount,
  DeveloperIdentityBinding
} from '../src/developer/developer-account.js'

import type {
  DeveloperAccountStore
} from '../src/developer/developer-account-store.js'

import {
  DeveloperAccountGateway
} from '../src/developer/developer-account-gateway.js'

import {
  DeveloperAccountService
} from '../src/developer/developer-account-service.js'

class TestDeveloperAccountStore
  implements DeveloperAccountStore {
  accounts =
    new Map<string, DeveloperAccount>()

  bindings: DeveloperIdentityBinding[] = []

  async findById(
    developerId: string
  ): Promise<DeveloperAccount | undefined> {
    return this.accounts.get(developerId)
  }

  async findByExternalIdentity(
    issuer: string,
    subject: string
  ): Promise<DeveloperAccount | undefined> {
    const binding =
      this.bindings.find(candidate =>
        candidate.issuer === issuer &&
        candidate.subject === subject
      )

    if (!binding) {
      return undefined
    }

    return this.accounts.get(
      binding.developerId
    )
  }

  async create(
    account: DeveloperAccount,
    binding: DeveloperIdentityBinding
  ): Promise<void> {
    this.accounts.set(
      account.developerId,
      account
    )

    this.bindings.push(binding)
  }

  async addExternalIdentityBinding(
    binding: DeveloperIdentityBinding
  ): Promise<void> {
    this.bindings.push(binding)
  }
}

class TestAuthenticationProvider
  implements AuthenticationProvider {
  async authenticate(
    request: AuthenticationRequest
  ): Promise<AuthenticationResult> {
    if (
      request.credential ===
      'primary-token'
    ) {
      return {
        authenticated: true,

        assertion: {
          type:
            'oauth-subject',

          issuer:
            'https://issuer.example/',

          subject:
            'primary-user',

          authenticatedAt:
            new Date(
              '2026-09-09T20:00:00.000Z'
            )
        }
      }
    }

    if (
      request.credential ===
      'secondary-token'
    ) {
      return {
        authenticated: true,

        assertion: {
          type:
            'oauth-subject',

          issuer:
            'https://issuer.example/',

          subject:
            'secondary-user',

          authenticatedAt:
            new Date(
              '2026-09-09T20:00:00.000Z'
            )
        }
      }
    }

    return {
      authenticated: false,
      reason:
        'test-authentication-failed'
    }
  }
}

describe(
  'DeveloperAccountGateway',
  () => {
    it(
      'links a freshly authenticated external identity to the already authenticated canonical Developer',
      async () => {
        const store =
          new TestDeveloperAccountStore()

        const existing: DeveloperAccount = {
          developerId:
            'dev_existing',

          displayName:
            'Existing Developer',

          status:
            'active',

          role:
            'developer',

          createdAt:
            new Date(
              '2026-09-09T19:00:00.000Z'
            ),

          updatedAt:
            new Date(
              '2026-09-09T19:00:00.000Z'
            )
        }

        await store.create(
          existing,
          {
            developerId:
              existing.developerId,

            issuer:
              'https://issuer.example/',

            subject:
              'primary-user',

            createdAt:
              existing.createdAt
          }
        )

        const service =
          new DeveloperAccountService(
            store,
            undefined,
            () =>
              new Date(
                '2026-09-09T21:00:00.000Z'
              )
          )

        const gateway =
          new DeveloperAccountGateway(
            new TestAuthenticationProvider(),
            service
          )

        const developer =
          await gateway.linkExternalIdentity(
            {
              credential:
                'primary-token'
            },

            {
              credential:
                'secondary-token'
            }
          )

        expect(
          developer.developerId
        ).toBe(
          existing.developerId
        )

        expect(
          store.bindings
        ).toContainEqual({
          developerId:
            existing.developerId,

          issuer:
            'https://issuer.example/',

          subject:
            'secondary-user',

          createdAt:
            new Date(
              '2026-09-09T21:00:00.000Z'
            )
        })
      }
    )

    it(
      'rejects linking when the second identity cannot be authenticated',
      async () => {
        const store =
          new TestDeveloperAccountStore()

        const existing: DeveloperAccount = {
          developerId:
            'dev_existing',

          status:
            'active',

          role:
            'developer',

          createdAt:
            new Date(
              '2026-09-09T19:00:00.000Z'
            ),

          updatedAt:
            new Date(
              '2026-09-09T19:00:00.000Z'
            )
        }

        await store.create(
          existing,
          {
            developerId:
              existing.developerId,

            issuer:
              'https://issuer.example/',

            subject:
              'primary-user',

            createdAt:
              existing.createdAt
          }
        )

        const gateway =
          new DeveloperAccountGateway(
            new TestAuthenticationProvider(),
            new DeveloperAccountService(
              store
            )
          )

        await expect(
          gateway.linkExternalIdentity(
            {
              credential:
                'primary-token'
            },

            {
              credential:
                'invalid-secondary-token'
            }
          )
        ).rejects.toThrow(
          'developer-authentication-failed'
        )

        expect(
          store.bindings
        ).toHaveLength(
          1
        )
      }
    )
  }
)
