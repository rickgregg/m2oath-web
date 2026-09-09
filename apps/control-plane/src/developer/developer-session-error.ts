export type DeveloperSessionErrorStage =
  | 'authentication'
  | 'identity'

export class DeveloperSessionError
  extends Error {
  constructor(
    public readonly stage:
      DeveloperSessionErrorStage,
    message: string
  ) {
    super(message)
    this.name =
      'DeveloperSessionError'
  }
}
