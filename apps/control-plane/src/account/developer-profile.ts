/**
 * Optional developer-specific product profile.
 *
 * DeveloperProfile is not a human identity and does not require
 * separate authentication.
 */
export interface DeveloperProfile {
  userId: string
  createdAt: Date
  updatedAt: Date
}
