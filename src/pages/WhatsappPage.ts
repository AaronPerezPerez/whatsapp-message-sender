import puppeteer from "puppeteer";
import { ContactNotFound } from "../errors/ContactNotFound.js";
import { sleep } from "../utils/sleep.js";
import { UnreachableWhatsappMainPage } from "../errors/UnreachableWhatsappMainPage.js";
import { config } from "../utils/config.js";
import { WhatsappToSend } from "../types/WhatsappToSend.js";

// Selectores centralizados. Usan atributos estables (#id, data-tab, role)
// en lugar de aria-label localizado porque WhatsApp Web cambia los textos
// cada pocas semanas. Ver CLAUDE.md → "Operativa de debug".
const SELECTORS = {
  paneSide: "#pane-side",
  mainPanel: "#main",
  searchInput: 'input[role="textbox"][data-tab="3"]',
  messageInput: 'div[role="textbox"][data-tab="10"]',
} as const;

// Textos de cabeceras de secciones en la lista de resultados que no son
// chats reales y deben saltarse al hacer click en el primer resultado.
const RESULT_SECTION_HEADERS = new Set([
  "Chats",
  "Contactos",
  "Mensajes",
  "Grupos en común",
  "Sin leer",
  "Favoritos",
  "Grupos",
]);

export class WhatsappPage {
  constructor(private readonly page: puppeteer.Page) {}

  async isLoggedIn(): Promise<boolean> {
    try {
      await this.page.waitForSelector(SELECTORS.paneSide, { timeout: 15_000 });
      return true;
    } catch {
      return false;
    }
  }

  async goToChat(whatsappToSend: WhatsappToSend) {
    await this.page.waitForSelector(SELECTORS.searchInput, { timeout: 10_000 });
    await this.page.focus(SELECTORS.searchInput);

    // WhatsApp Web usa un <input> controlado por React: keyboard.type deja
    // .value escrito pero NO dispara el handler de React, así que la lista
    // no se filtra. Hay que usar el setter nativo y emitir 'input'.
    await this.setReactInputValue(SELECTORS.searchInput, whatsappToSend.to);
    await sleep(config.FIND_CONTACT_WAIT);

    const clicked = await this.clickFirstSearchResult();
    if (!clicked) throw new ContactNotFound(whatsappToSend.id);

    try {
      await this.page.waitForSelector(SELECTORS.mainPanel, { timeout: 10_000 });
    } catch {
      throw new ContactNotFound(whatsappToSend.id);
    }
  }

  async sendMessage(whatsappToSend: WhatsappToSend) {
    await this.page.waitForSelector(SELECTORS.messageInput, { timeout: 10_000 });
    await this.page
      .type(SELECTORS.messageInput, whatsappToSend.message)
      .catch(() => {
        throw new ContactNotFound(whatsappToSend.id);
      });

    await sleep(config.SEND_WHATSAPP_WAIT);
    await this.page.keyboard.press("Enter");
    await sleep(config.MEDIUM_WAIT);
  }

  async waitForLogIn(timeoutInMs: number) {
    try {
      await this.page.waitForSelector(SELECTORS.paneSide, {
        timeout: timeoutInMs,
      });
    } catch {
      throw new UnreachableWhatsappMainPage("");
    }
  }

  private async setReactInputValue(selector: string, value: string) {
    await this.page.evaluate(
      `(() => {
        const input = document.querySelector(${JSON.stringify(selector)});
        if (!input) return;
        const desc = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
        desc.set.call(input, ${JSON.stringify(value)});
        input.dispatchEvent(new Event('input', { bubbles: true }));
      })()`,
    );
  }

  private async clickFirstSearchResult(): Promise<boolean> {
    const coords = await this.page.evaluate(
      `(() => {
        const headers = ${JSON.stringify(Array.from(RESULT_SECTION_HEADERS))};
        const rows = Array.from(document.querySelectorAll('#pane-side [role="row"], #pane-side [role="listitem"]'));
        for (const row of rows) {
          const text = (row.textContent || '').trim();
          if (!text || headers.indexOf(text) !== -1) continue;
          const rect = row.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }
        return null;
      })()`,
    );
    if (!coords || typeof coords !== "object") return false;
    const { x, y } = coords as { x: number; y: number };
    await this.page.mouse.click(x, y);
    return true;
  }
}
