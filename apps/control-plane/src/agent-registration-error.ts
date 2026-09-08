export type AgentRegistrationFailureStage =
  | 'authentication'
  | 'authorization'

export class AgentRegistrationError extends Error {
  constructor(
    public readonly stage: AgentRegistrationFailureStage,
    public readonly reason: string
  ) {
    super(
      `Agent registration failed during ${stage}: ${reason}`
    )

    this.name = 'AgentRegistrationError'
  }
}
