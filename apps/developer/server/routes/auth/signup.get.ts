import {
  developerAuth0Config,
  handleDeveloperAuth0Error,
  handleDeveloperAuth0Success
} from '../../auth/developer-auth0'

export default defineOAuthAuth0EventHandler({
  config: {
    ...developerAuth0Config,

    authorizationParams: {
      screen_hint: 'signup'
    }
  },

  onSuccess:
    handleDeveloperAuth0Success,

  onError:
    handleDeveloperAuth0Error
})
