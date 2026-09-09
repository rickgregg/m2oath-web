import { describe, expect, it } from 'vitest'
import {
  generateKeyPair,
  SignJWT
} from 'jose'
import {
  JwtAuthenticationProvider
} from '@m2oath/auth-jwt'
import {
  M2OathAgentDirectory
} from '../src/agent-store.js'
import {
  M2OathAgentRegistrationGateway
} from '../src/m2oath-agent-registration-gateway.js'
import {
  createM2OathHostedComposition
} from '../src/m2oath-composition.js'

const issuer =
  'https://developer.test.m2oath.local'

const audience =
  'm2oath-control-plane'

const subject =
  'developer-123'

async function createSignedDeveloperToken() {
  const { privateKey, publicKey } =
    await generateKeyPair('RS256')

  const token =
    await new SignJWT({})
      .setProtectedHeader({
        alg: 'RS256'
      })
      .setIssuer(issuer)
      .setAudience(audience)
      .setSubject(subject)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey)

  return {
    token,
    publicKey
  }
}

describe('Developer JWT registration integration', () => {
  it('registers an agent with a cryptographically verified Developer JWT', async () => {
    const {
      token,
      publicKey
    } = await createSignedDeveloperToken()

    const authenticationProvider =
      new JwtAuthenticationProvider({
        issuer,
        audience,
        verificationKey: publicKey
      })

    const m2oath =
      createM2OathHostedComposition({
        authenticationProvider,

        developerPrincipals: [
          {
            type: 'oauth-subject',
            subject,
            issuer
          }
        ]
      })

    const gateway =
      new M2OathAgentRegistrationGateway({
        sdk: m2oath.sdk
      })

    const agent =
      await gateway.registerAgent(
        {
          displayName: 'JWT Weather Agent',
          identifier: {
            type: 'runtime-jwt',
            value: 'jwt-weather-agent-runtime',
            issuer: 'https://runtime.example'
          }
        },
        {
          credential: token
        }
      )

    expect(agent).toEqual({
      agentId: expect.stringMatching(
        /^agt_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      ),
      displayName: 'JWT Weather Agent',
      status: 'active'
    })
  })

  it('rejects registration when Developer JWT verification fails', async () => {
    const {
      publicKey
    } = await createSignedDeveloperToken()

    const {
      privateKey: attackerPrivateKey
    } = await generateKeyPair('RS256')

    const invalidToken =
      await new SignJWT({})
        .setProtectedHeader({
          alg: 'RS256'
        })
        .setIssuer(issuer)
        .setAudience(audience)
        .setSubject(subject)
        .setIssuedAt()
        .setExpirationTime('5m')
        .sign(attackerPrivateKey)

    const authenticationProvider =
      new JwtAuthenticationProvider({
        issuer,
        audience,
        verificationKey: publicKey
      })

    const m2oath =
      createM2OathHostedComposition({
        authenticationProvider,

        developerPrincipals: [
          {
            type: 'oauth-subject',
            subject,
            issuer
          }
        ]
      })

    const gateway =
      new M2OathAgentRegistrationGateway({
        sdk: m2oath.sdk
      })

    await expect(
      gateway.registerAgent(
        {
          displayName: 'Rejected Agent',
          identifier: {
            type: 'runtime-jwt',
            value: 'rejected-runtime'
          }
        },
        {
          credential: invalidToken
        }
      )
    ).rejects.toThrow()
  })
})
