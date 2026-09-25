const EXPIRATION_SAFETY_WINDOW_MS
  = 60_000

type ControlPlaneCredentialStatus =
  | 'unavailable'
  | 'unknown'
  | 'current'
  | 'expiring'
  | 'expired'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  const accessToken
    = session.secure
      ?.controlPlaneAccessToken
      ?.trim()

  const expiresAt
    = session.secure
      ?.controlPlaneAccessTokenExpiresAt

  let controlPlaneCredentialStatus:
    ControlPlaneCredentialStatus

  if (!accessToken) {
    controlPlaneCredentialStatus
      = 'unavailable'
  } else if (typeof expiresAt !== 'number') {
    controlPlaneCredentialStatus
      = 'unknown'
  } else if (expiresAt <= Date.now()) {
    controlPlaneCredentialStatus
      = 'expired'
  } else if (
    expiresAt
      <= Date.now()
        + EXPIRATION_SAFETY_WINDOW_MS
  ) {
    controlPlaneCredentialStatus
      = 'expiring'
  } else {
    controlPlaneCredentialStatus
      = 'current'
  }

  return {
    loggedIn:
      Boolean(session.user?.subject),

    subject:
      session.user?.subject ?? null,

    hasControlPlaneAccessToken:
      Boolean(accessToken),

    controlPlaneCredentialStatus,

    controlPlaneAccessTokenExpiresAt:
      typeof expiresAt === 'number'
        ? expiresAt
        : null
  }
})
