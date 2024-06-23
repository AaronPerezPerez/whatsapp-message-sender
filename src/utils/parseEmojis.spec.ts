import { describe, it, expect } from "vitest";
import { codeToEmoji, parseEmojis } from "./parseEmojis.js";

describe("parseEmojis", () => {
  let cases = Object.entries(codeToEmoji);
  it.each(cases)("parseEmojis(%s) -> %s", (code, emoji) => {
    expect(parseEmojis(code)).toEqual(emoji);
  });
});
