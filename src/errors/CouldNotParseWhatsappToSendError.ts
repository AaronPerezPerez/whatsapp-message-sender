export class CouldNotParseWhatsappToSendError extends Error {
  constructor() {
    super(
      "Could not parse whatsappToSend.json file. Check if it is correctly formatted.",
    );
  }
}
