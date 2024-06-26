import { DomainError } from "./DomainError.js";

export class CouldNotParseWhatsappToSendError extends DomainError {
  constructor(messageId: string) {
    super(
      messageId,
      "No se pudo parsear el whatsapp a enviar. Por favor, verifique que el formato sea correcto",
    );
  }
}
