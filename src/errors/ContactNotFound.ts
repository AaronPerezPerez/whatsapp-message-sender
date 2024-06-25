import { DomainError } from "./DomainError.js";

export class ContactNotFound extends DomainError {
  constructor(messageId: string) {
    super(messageId, "Contact not found");
  }
}
