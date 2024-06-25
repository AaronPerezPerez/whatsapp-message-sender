import { DomainError } from "./DomainError.js";

export class NotLoggedInError extends DomainError {
  constructor(messageId: string) {
    super(messageId, "No whatsapp web account linked");
  }
}
