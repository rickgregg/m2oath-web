import {
  randomUUID
} from 'node:crypto'

import type {
  DeveloperAccount
} from './developer-account.js'

import type {
  DeveloperAccountStore
} from './developer-account-store.js'

export interface ResolveDeveloperAccountRequest {
  issuer: string
  subject: string
  displayName?: string
}

export interface DeveloperAccountIdGenerator {
  generate(): string
}

export class UuidDeveloperAccountIdGenerator
  implements DeveloperAccountIdGenerator {
  generate(): string {
    return `dev_${randomUUID()}`
  }
}

/**
 * Resolves an authenticated external Developer identity to the
 * canonical M2Oath Developer account.
 *
 * On first login, a new Developer account is created with the
 * least-privileged `developer` role.
 *
 * Administrative privilege is never derived from the external
 * identity provider and cannot be self-assigned through this flow.
 */
export class DeveloperAccountService {
  constructor(
    private readonly store:
      DeveloperAccountStore,

    private readonly idGenerator:
      DeveloperAccountIdGenerator =
        new UuidDeveloperAccountIdGenerator(),

    private readonly now:
      () => Date = () => new Date()
  ) {}

  async findByExternalIdentity(
    issuer: string,
    subject: string
  ): Promise<DeveloperAccount | undefined> {
    const normalizedIssuer =
      issuer.trim()

    const normalizedSubject =
      subject.trim()

    if (!normalizedIssuer) {
      throw new Error(
        'developer-identity-issuer-required'
      )
    }

    if (!normalizedSubject) {
      throw new Error(
        'developer-identity-subject-required'
      )
    }

    return this.store.findByExternalIdentity(
      normalizedIssuer,
      normalizedSubject
    )
  }

  async resolveOrCreate(
    request: ResolveDeveloperAccountRequest
  ): Promise<DeveloperAccount> {
    const issuer =
      request.issuer.trim()

    const subject =
      request.subject.trim()

    if (!issuer) {
      throw new Error(
        'developer-identity-issuer-required'
      )
    }

    if (!subject) {
      throw new Error(
        'developer-identity-subject-required'
      )
    }

    const existing =
      await this.store.findByExternalIdentity(
        issuer,
        subject
      )

    if (existing !== undefined) {
      return existing
    }

    const timestamp =
      this.now()

    const account: DeveloperAccount = {
      developerId:
        this.idGenerator.generate(),

      displayName:
        normalizeOptionalString(
          request.displayName
        ),

      status:
        'active',

      role:
        'developer',

      createdAt:
        timestamp,

      updatedAt:
        timestamp
    }

    await this.store.create(
      account,
      {
        developerId:
          account.developerId,

        issuer,
        subject,

        createdAt:
          timestamp
      }
    )

    return account
  }
}

function normalizeOptionalString(
  value: string | undefined
): string | undefined {
  const normalized =
    value?.trim()

  return normalized
    ? normalized
    : undefined
}
