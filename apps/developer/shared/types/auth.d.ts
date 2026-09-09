declare module '#auth-utils' {
  interface User {
    developerId: string
    role: 'developer' | 'admin'
    subject: string
    email?: string
    name?: string
  }

  interface SecureSessionData {
    controlPlaneAccessToken?: string
  }
}

export {}
