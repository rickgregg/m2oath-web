import {
  describe,
  expect,
  it,
  vi
} from 'vitest'

import {
  DeveloperAccountAgentLifecycleAuthorizationPolicy
} from '../src/developer/developer-account-agent-lifecycle-authorization-policy.js'

describe(
  'DeveloperAccountAgentLifecycleAuthorizationPolicy',
  () => {
    const assertion = {
      type:
        'jwt',

      subject:
        'developer-123',

      issuer:
        'https://developer.example',

      authenticatedAt:
        new Date(
          '2026-09-09T22:00:00Z'
        )
    }

    function createPolicy(
      account:
        | {
            developerId: string
            status: 'active' | 'disabled'
            role: 'developer'
            createdAt: Date
            updatedAt: Date
          }
        | undefined
    ) {
      const accountService = {
        findByExternalIdentity:
          vi.fn(async () => account)
      }

      const policy =
        new DeveloperAccountAgentLifecycleAuthorizationPolicy(
          accountService as never
        )

      return {
        policy,
        accountService
      }
    }

    const activeAccount = {
      developerId:
        'dev_123',

      status:
        'active' as const,

      role:
        'developer' as const,

      createdAt:
        new Date(
          '2026-09-09T21:00:00Z'
        ),

      updatedAt:
        new Date(
          '2026-09-09T21:00:00Z'
        )
    }

    it.each([
      'agent.create',
      'agent.rotate-key',
      'agent.disable'
    ] as const)(
      'allows %s for an active canonical Developer Account',
      async action => {
        const {
          policy,
          accountService
        } =
          createPolicy(
            activeAccount
          )

        await expect(
          policy.authorize({
            assertion,
            action
          })
        ).resolves.toEqual({
          allowed: true
        })

        expect(
          accountService
            .findByExternalIdentity
        ).toHaveBeenCalledWith(
          'https://developer.example',
          'developer-123'
        )
      }
    )

    it.each([
      'agent.configure',
      'agent.recover',
      'agent.delete'
    ] as const)(
      'denies unsupported lifecycle action %s',
      async action => {
        const {
          policy
        } =
          createPolicy(
            activeAccount
          )

        await expect(
          policy.authorize({
            assertion,
            action
          })
        ).resolves.toEqual({
          allowed: false,
          reason:
            'agent-lifecycle-action-not-authorized'
        })
      }
    )

    it(
      'denies a principal without a canonical Developer Account',
      async () => {
        const {
          policy
        } =
          createPolicy(
            undefined
          )

        await expect(
          policy.authorize({
            assertion,
            action:
              'agent.create'
          })
        ).resolves.toEqual({
          allowed: false,
          reason:
            'agent-lifecycle-action-not-authorized'
        })
      }
    )

    it(
      'denies a disabled Developer Account',
      async () => {
        const {
          policy
        } =
          createPolicy({
            ...activeAccount,
            status:
              'disabled'
          })

        await expect(
          policy.authorize({
            assertion,
            action:
              'agent.create'
          })
        ).resolves.toEqual({
          allowed: false,
          reason:
            'agent-lifecycle-action-not-authorized'
        })
      }
    )

    it(
      'denies an assertion without an issuer',
      async () => {
        const {
          policy,
          accountService
        } =
          createPolicy(
            activeAccount
          )

        await expect(
          policy.authorize({
            assertion: {
              ...assertion,
              issuer:
                undefined
            },
            action:
              'agent.create'
          })
        ).resolves.toEqual({
          allowed: false,
          reason:
            'agent-lifecycle-action-not-authorized'
        })

        expect(
          accountService
            .findByExternalIdentity
        ).not.toHaveBeenCalled()
      }
    )
  }
)
