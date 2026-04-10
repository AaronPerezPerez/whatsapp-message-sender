import { describe, it, expect } from "vitest";
import { parseInput } from "./parseInput.js";

describe("parseInput", () => {
  it("parses a valid JSON array of messages", () => {
    const raw = JSON.stringify([
      { id: "1", to: "34600000001", message: "hola" },
      { id: "2", to: "34600000002", message: "adios" },
    ]);

    const result = parseInput(raw);

    expect(result).toEqual({
      ok: true,
      inputs: [
        { id: "1", to: "34600000001", message: "hola" },
        { id: "2", to: "34600000002", message: "adios" },
      ],
    });
  });

  it("applies parseEmojis to each message", () => {
    const raw = JSON.stringify([
      { id: "1", to: "34600000001", message: "Hola [greet]" },
    ]);

    const result = parseInput(raw);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.inputs[0].message).toEqual("Hola 👋🏻");
  });

  it("returns ok:false for invalid JSON", () => {
    expect(parseInput("not json")).toEqual({ ok: false });
  });

  it("returns ok:false for empty input", () => {
    expect(parseInput("")).toEqual({ ok: false });
    expect(parseInput("   ")).toEqual({ ok: false });
  });

  it("returns ok:false when the JSON is not an array", () => {
    expect(parseInput('{"id":"1"}')).toEqual({ ok: false });
  });

  it("returns ok:false when any item is missing a required field", () => {
    const raw = JSON.stringify([
      { id: "1", to: "34600000001", message: "ok" },
      { id: "2", to: "34600000002" },
    ]);
    expect(parseInput(raw)).toEqual({ ok: false });
  });

  it("returns ok:false when any item has a non-string field", () => {
    const raw = JSON.stringify([{ id: 1, to: "34600000001", message: "ok" }]);
    expect(parseInput(raw)).toEqual({ ok: false });
  });
});
