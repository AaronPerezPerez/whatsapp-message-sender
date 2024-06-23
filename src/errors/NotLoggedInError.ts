export class NotLoggedInError extends Error {
  constructor() {
    super("No whatsapp web account linked");
  }
}
