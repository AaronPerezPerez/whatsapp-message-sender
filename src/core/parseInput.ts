import { parseEmojis } from "./parseEmojis.js";
import type { WhatsappToSend } from "./types.js";

export type ParseInputResult =
  | { ok: true; inputs: WhatsappToSend[] }
  | { ok: false };

const isValidItem = (item: unknown): item is WhatsappToSend =>
  typeof item === "object" &&
  item !== null &&
  typeof (item as WhatsappToSend).id === "string" &&
  typeof (item as WhatsappToSend).to === "string" &&
  typeof (item as WhatsappToSend).message === "string";

export const parseInput = (raw: string): ParseInputResult => {
  if (!raw.trim()) return { ok: false };
  try {
    const json: unknown = JSON.parse(raw);
    if (!Array.isArray(json) || !json.every(isValidItem)) return { ok: false };
    return {
      ok: true,
      inputs: json.map((item) => ({
        ...item,
        message: parseEmojis(item.message),
      })),
    };
  } catch {
    return { ok: false };
  }
};
