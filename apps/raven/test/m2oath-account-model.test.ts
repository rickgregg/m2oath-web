import {
  describe,
  expect,
  it
} from 'vitest'

import {
  accountRoleHasCapability
} from '../src/account/index.js'

import type {
  DeveloperProfile,
  M2OathAccount,
  M2OathAccountMembership,
  M2OathUser,
  M2OathUserIdentityBinding
} from '../src/account/index.js'

describe('M2Oath hosted account model', () => {
  it('keeps canonical User identity separate from external identities', () => {
    const user: M2OathUser = {
      userId: 'user-123',
      displayName: 'Rick',
      status: 'active',
      createdAt: new Date('2026-09-17T00:00:00Z'),
      updatedAt: new Date('2026-09-17T00:00:00Z')
    }

    const github: M2OathUserIdentityBinding = {
      userId: user.userId,
      issuer: 'https://github.com',
      subject: 'github-123',
      createdAt: new Date('2026-09-17T00:00:00Z')
    }

    const google: M2OathUserIdentityBinding = {
      userId: user.userId,
      issuer: 'https://accounts.google.com',
      subject: 'google-456',
      createdAt: new Date('2026-09-17T00:00:00Z')
    }

    expect(github.userId).toBe(user.userId)
    expect(google.userId).toBe(user.userId)
    expect(github.subject).not.toBe(google.subject)
  })

  it('keeps Account authorization separate from User identity', () => {
    const account: M2OathAccount = {
      accountId: 'account-123',
      status: 'active',
      role: 'user',
      createdAt: new Date('2026-09-17T00:00:00Z'),
      updatedAt: new Date('2026-09-17T00:00:00Z')
    }

    const membership: M2OathAccountMembership = {
      accountId: account.accountId,
      userId: 'user-123',
      createdAt: new Date('2026-09-17T00:00:00Z')
    }

    expect(membership.accountId).toBe(account.accountId)
    expect(account.role).toBe('user')
  })

  it('gives developer all three Agent lifecycle capabilities', () => {
    expect(
      accountRoleHasCapability(
        'developer',
        'agent.create'
      )
    ).toBe(true)

    expect(
      accountRoleHasCapability(
        'developer',
        'agent.rotate-key'
      )
    ).toBe(true)

    expect(
      accountRoleHasCapability(
        'developer',
        'agent.disable'
      )
    ).toBe(true)
  })

  it('does not implicitly give ordinary users lifecycle capabilities', () => {
    expect(
      accountRoleHasCapability(
        'user',
        'agent.create'
      )
    ).toBe(false)

    expect(
      accountRoleHasCapability(
        'user',
        'agent.rotate-key'
      )
    ).toBe(false)

    expect(
      accountRoleHasCapability(
        'user',
        'agent.disable'
      )
    ).toBe(false)
  })

  it('does not implicitly make admin a developer', () => {
    expect(
      accountRoleHasCapability(
        'admin',
        'administration.access'
      )
    ).toBe(true)

    expect(
      accountRoleHasCapability(
        'admin',
        'agent.create'
      )
    ).toBe(false)
  })

  it('models DeveloperProfile as an optional extension of User', () => {
    const profile: DeveloperProfile = {
      userId: 'user-123',
      createdAt: new Date('2026-09-17T00:00:00Z'),
      updatedAt: new Date('2026-09-17T00:00:00Z')
    }

    expect(profile.userId).toBe(
      'user-123'
    )
  })
})
