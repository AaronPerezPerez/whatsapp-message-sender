import { describe, it, expect } from "vitest";
import { codeToEmoji, parseEmojis } from "./parseEmojis.js";

describe("parseEmojis", () => {
  const cases = Object.entries(codeToEmoji);
  it.each(cases)("parseEmojis(%s) -> %s", (code, emoji) => {
    expect(parseEmojis(code)).toEqual(emoji);
  });

  it("replaces multiple emojis in the same text", () => {
    const raw = "Hello [greet] Call me [phone] I'm at [location] Bye [greet]";
    const expected = "Hello 👋🏻 Call me 📞 I'm at 📍 Bye 👋🏻";
    expect(parseEmojis(raw)).toEqual(expected);
  });

  it("leaves unknown codes untouched", () => {
    expect(parseEmojis("[unknown] stays")).toEqual("[unknown] stays");
  });
});
