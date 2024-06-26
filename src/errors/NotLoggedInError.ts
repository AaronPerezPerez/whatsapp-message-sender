import { DomainError } from "./DomainError.js";

export class NotLoggedInError extends DomainError {
  constructor(messageId: string) {
    super(messageId, "No hay cuenta de Whatsapp Web asociada");
  }
}
