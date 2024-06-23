import { parseEmojis } from "../utils/parseEmojis.js";

export type WhatsappToSendPrimitives = {
  to: string;
  message: string;
};

export class WhatsappToSend {
  static fromPrimitives(primitives: WhatsappToSendPrimitives) {
    return new WhatsappToSend(primitives.to, primitives.message);
  }

  private constructor(
    public to: string,
    public message: string,
  ) {
    this.message = parseEmojis(this.message);
  }
}
