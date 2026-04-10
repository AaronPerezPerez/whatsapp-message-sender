import { describe, it, expect } from "vitest";
import { formatResults } from "./formatResults.js";

describe("formatResults", () => {
  it("formats OK status with the literal 'OK'", () => {
    expect(formatResults([{ id: "1", status: "OK" }])).toEqual("1:OK\n");
  });

  it("formats CONTACT_NOT_FOUND with the legacy Spanish string", () => {
    expect(formatResults([{ id: "2", status: "CONTACT_NOT_FOUND" }])).toEqual(
      "2:No se ha encontrado al contacto\n",
    );
  });

  it("formats NOT_LOGGED_IN with the legacy Spanish string", () => {
    expect(formatResults([{ id: "3", status: "NOT_LOGGED_IN" }])).toEqual(
      "3:No hay cuenta de Whatsapp Web asociada\n",
    );
  });

  it("concatenates multiple results preserving order", () => {
    const output = formatResults([
      { id: "1", status: "OK" },
      { id: "2", status: "CONTACT_NOT_FOUND" },
      { id: "3", status: "NOT_LOGGED_IN" },
    ]);
    expect(output).toEqual(
      "1:OK\n" +
        "2:No se ha encontrado al contacto\n" +
        "3:No hay cuenta de Whatsapp Web asociada\n",
    );
  });

  it("returns an empty string for no results", () => {
    expect(formatResults([])).toEqual("");
  });
});
