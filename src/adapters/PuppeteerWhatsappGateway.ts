import path from "node:path";
import type { Page } from "puppeteer";
import { config } from "../config.js";
import { sleep } from "../core/sleep.js";
import type { WhatsappGateway } from "../core/types.js";

// Selectores centralizados. Usamos atributos estables (#id, data-tab, role)
// porque aria-label en español cambia cada pocas semanas en WhatsApp Web.
// Ver CLAUDE.md → "Operativa de debug".
const SELECTORS = {
  paneSide: "#pane-side",
  mainPanel: "#main",
  searchInput: 'input[role="textbox"][data-tab="3"]',
  messageInput: 'div[role="textbox"][data-tab="10"]',
} as const;

// Cabeceras de secciones en la lista de resultados de búsqueda. No son chats
// reales, hay que saltarlas al hacer click en el primer resultado.
const RESULT_SECTION_HEADERS = [
  "Chats",
  "Contactos",
  "Mensajes",
  "Grupos en común",
  "Sin leer",
  "Favoritos",
  "Grupos",
];

const LOGIN_TIMEOUT_MS = 15_000;
const WAIT_SELECTOR_TIMEOUT_MS = 10_000;

export class PuppeteerWhatsappGateway implements WhatsappGateway {
  constructor(
    private readonly page: Page,
    private readonly screenshotsDir: string,
  ) {}

  async isLoggedIn(): Promise<boolean> {
    try {
      await this.page.waitForSelector(SELECTORS.paneSide, {
        timeout: LOGIN_TIMEOUT_MS,
      });
      return true;
    } catch {
      return false;
    }
  }

  async openChat(to: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(SELECTORS.searchInput, {
        timeout: WAIT_SELECTOR_TIMEOUT_MS,
      });
      await this.page.focus(SELECTORS.searchInput);
      await this.setReactInputValue(SELECTORS.searchInput, to);
      await sleep(config.FIND_CONTACT_WAIT);

      if (!(await this.clickFirstSearchResult())) return false;

      await this.page.waitForSelector(SELECTORS.mainPanel, {
        timeout: WAIT_SELECTOR_TIMEOUT_MS,
      });
      return true;
    } catch {
      return false;
    }
  }

  async sendMessage(text: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(SELECTORS.messageInput, {
        timeout: WAIT_SELECTOR_TIMEOUT_MS,
      });
      await this.page.type(SELECTORS.messageInput, text);
      await sleep(config.SEND_WHATSAPP_WAIT);
      await this.page.keyboard.press("Enter");
      return true;
    } catch {
      return false;
    }
  }

  async screenshot(label: string): Promise<void> {
    await this.page.screenshot({
      path: path.join(this.screenshotsDir, `${label}.png`),
    });
  }

  // WhatsApp Web usa un <input> controlado por React: keyboard.type deja
  // .value escrito pero NO dispara el handler de React y la lista no se
  // filtra. Hay que usar el setter nativo del prototype y emitir 'input'.
  private async setReactInputValue(
    selector: string,
    value: string,
  ): Promise<void> {
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

  // row.click() sintético desde evaluate no abre el chat: WhatsApp Web
  // ignora clicks JS. page.mouse.click(x, y) va por CDP y sí funciona.
  private async clickFirstSearchResult(): Promise<boolean> {
    const coords = await this.page.evaluate(
      `(() => {
        const headers = ${JSON.stringify(RESULT_SECTION_HEADERS)};
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
