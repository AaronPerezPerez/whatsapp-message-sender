export class UnreachableWhatsappMainPage extends Error {
  constructor() {
    super("Could not reach Whatsapp main page");
  }
}
