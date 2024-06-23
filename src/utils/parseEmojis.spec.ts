import { describe, it, expect } from "vitest";
import { codeToEmoji, parseEmojis } from "./parseEmojis.js";

describe("parseEmojis", () => {
  let cases = Object.entries(codeToEmoji);
  it.each(cases)("parseEmojis(%s) -> %s", (code, emoji) => {
    expect(parseEmojis(code)).toEqual(emoji);
  });

  it("Replace multiple emojis", () => {
    const rawMessage =
      "Hello [greet] Call me [phone] I'm at [location] Bye [greet]";
    const expectedMessage = "Hello 👋🏻 Call me 📞 I'm at 📍 Bye 👋🏻";

    let parsed = parseEmojis(rawMessage);

    expect(parsed).toEqual(expectedMessage);
  });
});
