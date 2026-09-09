export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  return {
    loggedIn:
      Boolean(session.user?.subject),

    subject:
      session.user?.subject ?? null,

    hasControlPlaneAccessToken:
      Boolean(
        session.secure?.controlPlaneAccessToken
      )
  }
})
