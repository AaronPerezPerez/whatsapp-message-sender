import puppeteer from "puppeteer";
import { NotLoggedInError } from "../errors/NotLoggedInError.js";
import { ContactNotFound } from "../errors/ContactNotFound.js";
import { sleep } from "../utils/sleep.js";
import { UnreachableWhatsappMainPage } from "../errors/UnreachableWhatsappMainPage.js";
import { config } from "../utils/config.js";

export class WhatsappPage {
  private page: puppeteer.Page;

  constructor(page: puppeteer.Page) {
    this.page = page;
  }
  async isLoggedIn(): Promise<boolean> {
    const qrSelector = await this.page.$('canvas[aria-label="Scan me!"]');
    const contactSearchSelector = await this.page.$(
      'div[aria-label="Cuadro de texto para ingresar la búsqueda"]',
    );

    return !Boolean(qrSelector) && Boolean(contactSearchSelector);
  }

  async sendMessage(message: string) {
    await this.page
      .type('div[aria-label="Escribe un mensaje"]', message)
      .catch(() => {
        throw new ContactNotFound();
      });
    await sleep(config.SHORT_WAIT);
    await this.page.keyboard.press("Enter");
    await sleep(config.MEDIUM_WAIT);
  }

  async goToChat(contactNumber: string) {
    await this.page.type(
      'div[aria-label="Cuadro de texto para ingresar la búsqueda"]',
      contactNumber,
    );
    await sleep(config.SHORT_WAIT);
    await this.page.mouse.click(250, 250);
  }

  async waitForLogIn(timeoutInMs: number) {
    try {
      await this.page.waitForSelector(
        'div[aria-label="Cuadro de texto para ingresar la búsqueda"]',
        { timeout: timeoutInMs },
      );
    } catch (e) {
      throw new UnreachableWhatsappMainPage();
    }
  }
}
