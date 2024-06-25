import { DomainError } from "./DomainError.js";

export class AlreadyLoggedInError extends DomainError {
  constructor(messageId: string) {
    super(messageId, "Whatsapp web account already linked.");
  }
}
