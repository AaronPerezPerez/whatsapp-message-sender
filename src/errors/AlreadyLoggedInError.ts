import { DomainError } from "./DomainError.js";

export class AlreadyLoggedInError extends DomainError {
  constructor(messageId: string) {
    super(messageId, "Ya hay una cuenta de Whatsapp web asociada");
  }
}
