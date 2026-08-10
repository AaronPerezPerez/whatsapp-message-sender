import { describe, it, expect, beforeEach } from "vitest";
import { sendBatch } from "./sendBatch.js";
import type { WhatsappGateway, WhatsappToSend } from "./types.js";

class InMemoryWhatsappGateway implements WhatsappGateway {
  loggedIn = true;
  knownContacts = new Set<string>();
  failSending = false;
  sentMessages: { to: string; text: string }[] = [];
  screenshots: string[] = [];
  private currentChat: string | null = null;

  async isLoggedIn() {
    return this.loggedIn;
  }

  async openChat(to: string) {
    if (!this.knownContacts.has(to)) return false;
    this.currentChat = to;
    return true;
  }

  async sendMessage(text: string) {
    if (this.failSending || this.currentChat === null) return false;
    this.sentMessages.push({ to: this.currentChat, text });
    return true;
  }

  async screenshot(label: string) {
    this.screenshots.push(label);
  }
}

const input = (id: string, to: string, message = "hola"): WhatsappToSend => ({
  id,
  to,
  message,
});

describe("sendBatch", () => {
  let gateway: InMemoryWhatsappGateway;

  beforeEach(() => {
    gateway = new InMemoryWhatsappGateway();
  });

  it("sends to every known contact and returns OK for each", async () => {
    gateway.knownContacts.add("34600000001");
    gateway.knownContacts.add("34600000002");

    const results = await sendBatch(gateway, [
      input("1", "34600000001", "hola uno"),
      input("2", "34600000002", "hola dos"),
    ]);

    expect(results).toEqual([
      { id: "1", status: "OK" },
      { id: "2", status: "OK" },
    ]);
    expect(gateway.sentMessages).toEqual([
      { to: "34600000001", text: "hola uno" },
      { to: "34600000002", text: "hola dos" },
    ]);
  });

  it("takes three screenshots per successful send, labelled _1, _2, _3", async () => {
    gateway.knownContacts.add("34600000001");

    await sendBatch(gateway, [input("abc", "34600000001")]);

    expect(gateway.screenshots).toEqual(["abc_1", "abc_2", "abc_3"]);
  });

  it("returns CONTACT_NOT_FOUND when the contact is unknown and keeps going", async () => {
    gateway.knownContacts.add("34600000002");

    const results = await sendBatch(gateway, [
      input("1", "unknown"),
      input("2", "34600000002"),
    ]);

    expect(results).toEqual([
      { id: "1", status: "CONTACT_NOT_FOUND" },
      { id: "2", status: "OK" },
    ]);
    expect(gateway.sentMessages).toEqual([{ to: "34600000002", text: "hola" }]);
  });

  it("does not take the _2 or _3 screenshot when the chat cannot be opened", async () => {
    const results = await sendBatch(gateway, [input("42", "unknown")]);

    expect(results).toEqual([{ id: "42", status: "CONTACT_NOT_FOUND" }]);
    expect(gateway.screenshots).toEqual(["42_1"]);
  });

  it("returns CONTACT_NOT_FOUND when sending fails after opening the chat", async () => {
    gateway.knownContacts.add("34600000001");
    gateway.failSending = true;

    const results = await sendBatch(gateway, [input("1", "34600000001")]);

    expect(results).toEqual([{ id: "1", status: "CONTACT_NOT_FOUND" }]);
    expect(gateway.screenshots).toEqual(["1_1", "1_2"]);
    expect(gateway.sentMessages).toEqual([]);
  });

  it("returns NOT_LOGGED_IN for every input when the session is gone", async () => {
    gateway.loggedIn = false;

    const results = await sendBatch(gateway, [
      input("1", "34600000001"),
      input("2", "34600000002"),
    ]);

    expect(results).toEqual([
      { id: "1", status: "NOT_LOGGED_IN" },
      { id: "2", status: "NOT_LOGGED_IN" },
    ]);
    expect(gateway.screenshots).toEqual([]);
  });

  it("returns an empty array when given no inputs", async () => {
    expect(await sendBatch(gateway, [])).toEqual([]);
  });
});
