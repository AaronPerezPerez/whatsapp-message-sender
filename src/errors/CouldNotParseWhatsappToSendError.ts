import { DomainError } from "./DomainError.js";

export class CouldNotParseWhatsappToSendError extends DomainError {
  constructor(messageId: string) {
    super(
      messageId,
      "Could not parse whatsappToSend.json file. Check if it is correctly formatted.",
    );
  }
}
