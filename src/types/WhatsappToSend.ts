import { parseEmojis } from "../utils/parseEmojis.js";

export type WhatsappToSendPrimitives = {
  id: string;
  to: string;
  message: string;
};

export class WhatsappToSend {
  static fromPrimitives(primitives: WhatsappToSendPrimitives) {
    return new WhatsappToSend(primitives.id, primitives.to, primitives.message);
  }

  private constructor(
    public id: string,
    public to: string,
    public message: string,
  ) {
    this.message = parseEmojis(this.message);
  }
}
