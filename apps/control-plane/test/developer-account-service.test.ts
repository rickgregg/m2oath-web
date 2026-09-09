import {
  describe,
  expect,
  it
} from 'vitest'

import type {
  DeveloperAccount,
  DeveloperIdentityBinding
} from '../src/developer/developer-account.js'

import type {
  DeveloperAccountStore
} from '../src/developer/developer-account-store.js'

import {
  DeveloperAccountService,
  type DeveloperAccountIdGenerator
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
}

class FixedDeveloperAccountIdGenerator
  implements DeveloperAccountIdGenerator {
  generate(): string {
    return 'dev_test-account'
  }
}

describe('DeveloperAccountService', () => {
  it('creates a least-privileged Developer account on first login', async () => {
    const store =
      new TestDeveloperAccountStore()

    const service =
      new DeveloperAccountService(
        store,
        new FixedDeveloperAccountIdGenerator(),
        () =>
          new Date(
            '2026-09-08T22:00:00.000Z'
          )
      )

    const account =
      await service.resolveOrCreate({
        issuer:
          'https://issuer.example/',
        subject:
          'external-user-123',
        displayName:
          'Developer One'
      })

    expect(account).toEqual({
      developerId:
        'dev_test-account',
      displayName:
        'Developer One',
      status:
        'active',
      role:
        'developer',
      createdAt:
        new Date(
          '2026-09-08T22:00:00.000Z'
        ),
      updatedAt:
        new Date(
          '2026-09-08T22:00:00.000Z'
        )
    })

    expect(store.bindings).toEqual([
      {
        developerId:
          'dev_test-account',
        issuer:
          'https://issuer.example/',
        subject:
          'external-user-123',
        createdAt:
          new Date(
            '2026-09-08T22:00:00.000Z'
          )
      }
    ])
  })

  it('returns the existing canonical Developer account on later logins', async () => {
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
          '2026-09-08T20:00:00.000Z'
        ),
      updatedAt:
        new Date(
          '2026-09-08T20:00:00.000Z'
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
          'external-user-123',
        createdAt:
          existing.createdAt
      }
    )

    const service =
      new DeveloperAccountService(
        store,
        {
          generate() {
            throw new Error(
              'id-generator-should-not-run'
            )
          }
        }
      )

    const account =
      await service.resolveOrCreate({
        issuer:
          'https://issuer.example/',
        subject:
          'external-user-123'
      })

    expect(account).toBe(existing)
  })

  it('never self-assigns the admin role during account creation', async () => {
    const store =
      new TestDeveloperAccountStore()

    const service =
      new DeveloperAccountService(
        store,
        new FixedDeveloperAccountIdGenerator()
      )

    const account =
      await service.resolveOrCreate({
        issuer:
          'https://issuer.example/',
        subject:
          'external-admin-looking-user'
      })

    expect(account.role).toBe(
      'developer'
    )
  })
})
