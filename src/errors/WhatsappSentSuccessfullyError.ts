import { DomainError } from "./DomainError.js";

export class WhatsappSentSuccessfullyError extends DomainError {
  constructor(messageId: string) {
    super(messageId, "OK");
  }
}
