export class DomainError extends Error {
  constructor(
    public readonly messageId: string,
    message: string,
  ) {
    super(message);
  }
}
