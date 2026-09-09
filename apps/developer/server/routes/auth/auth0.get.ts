import {
  HttpControlPlaneClient
} from '@m2oath/control-plane-client'

export default defineOAuthAuth0EventHandler({
  config: {
    emailRequired: true,

    audience:
      'https://control-plane.m2oath.com',

    scope: [
      'openid',
      'profile',
      'email',
      'agent:create'
    ]
  },

  async onSuccess(event, { user, tokens }) {
    if (!tokens.access_token) {
      throw createError({
        statusCode: 502,
        statusMessage:
          'Auth0 did not return an access token'
      })
    }

    const config
      = useRuntimeConfig(event)

    const client
      = new HttpControlPlaneClient({
        baseUrl:
          config.controlPlaneBaseUrl,

        bearerToken:
          tokens.access_token
      })

    const { developer }
      = await client.bootstrapDeveloperSession({
        displayName:
          user.name
      })

    if (developer.status !== 'active') {
      throw createError({
        statusCode: 403,
        statusMessage:
          'Developer account is disabled'
      })
    }

    await setUserSession(event, {
      user: {
        developerId:
          developer.developerId,

        role:
          developer.role,

        subject:
          user.sub,

        email:
          user.email,

        name:
          user.name
      },

      secure: {
        controlPlaneAccessToken:
          tokens.access_token
      }
    })

    return sendRedirect(
      event,
      '/dashboard'
    )
  },

  onError(event, error) {
    console.error(
      'Developer Auth0 login failed',
      error
    )

    return sendRedirect(
      event,
      '/?auth=failed'
    )
  }
})
