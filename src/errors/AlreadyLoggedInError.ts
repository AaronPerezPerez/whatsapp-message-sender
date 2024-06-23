export class AlreadyLoggedInError extends Error {
  constructor() {
    super("Whatsapp web account already linked.");
  }
}
