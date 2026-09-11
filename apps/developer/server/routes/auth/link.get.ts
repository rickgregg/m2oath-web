import {
  developerAuth0Config,
  handleDeveloperAuth0LinkError,
  handleDeveloperAuth0LinkSuccess
} from '../../auth/developer-auth0'

const auth0LinkHandler
  = defineOAuthAuth0EventHandler({
    config: {
      ...developerAuth0Config,

      authorizationParams: {
        prompt: 'login'
      }
    },

    onSuccess:
      handleDeveloperAuth0LinkSuccess,

    onError:
      handleDeveloperAuth0LinkError
  })

export default defineEventHandler(async (event) => {
  const session
    = await getUserSession(event)

  const hasDeveloperSession
    = Boolean(
      session.user?.subject
      && session.user?.developerId
      && session.secure
        ?.controlPlaneAccessToken
        ?.trim()
    )

  if (!hasDeveloperSession) {
    return sendRedirect(
      event,
      '/'
    )
  }

  return auth0LinkHandler(event)
})
