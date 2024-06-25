import { DomainError } from "./DomainError.js";

export class UnreachableWhatsappMainPage extends DomainError {
  constructor(messageId: string) {
    super(messageId, "Could not reach Whatsapp main page");
  }
}
