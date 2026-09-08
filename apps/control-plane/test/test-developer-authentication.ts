import type {
  AuthenticationProvider,
  AuthenticationRequest,
  AuthenticationResult
} from '@m2oath/agent'

export const TEST_DEVELOPER_TOKEN =
  'phase-6a-development-token'

export const TEST_UNAUTHORIZED_DEVELOPER_TOKEN =
  'phase-6b-unauthorized-development-token'

export const TEST_DEVELOPER_PRINCIPAL = {
  type: 'oauth-subject',
  subject: 'test-developer',
  issuer: 'https://developer.test.m2oath.local'
} as const

const TEST_UNAUTHORIZED_DEVELOPER_PRINCIPAL = {
  type: 'oauth-subject',
  subject: 'unauthorized-developer',
  issuer: 'https://developer.test.m2oath.local'
} as const

export class TestDeveloperAuthenticationProvider
  implements AuthenticationProvider {
  async authenticate(
    request: AuthenticationRequest
  ): Promise<AuthenticationResult> {
    if (
      request.credential === TEST_DEVELOPER_TOKEN
    ) {
      return {
        authenticated: true,
        assertion: {
          ...TEST_DEVELOPER_PRINCIPAL,
          authenticatedAt: new Date(
            '2026-09-08T00:00:00.000Z'
          )
        }
      }
    }

    if (
      request.credential ===
        TEST_UNAUTHORIZED_DEVELOPER_TOKEN
    ) {
      return {
        authenticated: true,
        assertion: {
          ...TEST_UNAUTHORIZED_DEVELOPER_PRINCIPAL,
          authenticatedAt: new Date(
            '2026-09-08T00:00:00.000Z'
          )
        }
      }
    }

    return {
      authenticated: false,
      reason: 'test-developer-authentication-failed'
    }
  }
}

export function createTestM2OathAuthenticationOptions() {
  return {
    authenticationProvider:
      new TestDeveloperAuthenticationProvider(),

    developerPrincipals: [
      TEST_DEVELOPER_PRINCIPAL
    ]
  }
}
