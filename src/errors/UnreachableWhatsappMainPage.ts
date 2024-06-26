import { DomainError } from "./DomainError.js";

export class UnreachableWhatsappMainPage extends DomainError {
  constructor(messageId: string) {
    super(
      messageId,
      "No se puedo alcanzar la página principal de Whatsapp Web",
    );
  }
}
