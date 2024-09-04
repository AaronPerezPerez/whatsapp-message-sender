import puppeteer from "puppeteer";
import { ContactNotFound } from "../errors/ContactNotFound.js";
import { sleep } from "../utils/sleep.js";
import { UnreachableWhatsappMainPage } from "../errors/UnreachableWhatsappMainPage.js";
import { config } from "../utils/config.js";
import { WhatsappToSend } from "../types/WhatsappToSend.js";

export class WhatsappPage {
  private page: puppeteer.Page;

  constructor(page: puppeteer.Page) {
    this.page = page;
  }

  async isLoggedIn(): Promise<boolean> {
    const qrSelector = await this.page.$('canvas[aria-label="Scan me!"]');
    const contactSearchSelector = await this.page.$(
      'div[aria-label="Buscar"]',
    );
    return !Boolean(qrSelector) && Boolean(contactSearchSelector)
        ;
  }

  async sendMessage(whatsappToSend: WhatsappToSend) {
    const messageWriteInputSelector = 'div[aria-label="Escribe un mensaje"]';

    await this.page
      .type(messageWriteInputSelector, whatsappToSend.message)
      .catch(() => {
        throw new ContactNotFound(whatsappToSend.id);
      });
    await sleep(config.SEND_WHATSAPP_WAIT);
    await this.page.keyboard.press("Enter");
    await sleep(config.MEDIUM_WAIT);
  }

  async goToChat(whatsappToSend: WhatsappToSend) {
    const contactSearchSelector =
      'div[aria-label="Buscar"]';
    await this.page.focus(contactSearchSelector);
    await this.page.keyboard.down("Control");
    await this.page.keyboard.press("A");
    await this.page.keyboard.up("Control");
    await this.page.keyboard.press("Backspace");
    await this.page.type(contactSearchSelector, whatsappToSend.to);

    await sleep(config.FIND_CONTACT_WAIT);

    const spans = await this.page.$$("span");
    const contactNotFoundMessage = await Promise.all(
      spans.map(async (span) => {
        const innerText = await span.getProperty("innerText");
        return await innerText.jsonValue();
      }),
    ).then((texts) =>
      texts.find((text) =>
        text.includes("No se encontró ningún chat, contacto ni mensaje."),
      ),
    );

    if (contactNotFoundMessage) {
      await this.page.focus(contactSearchSelector);
      await this.page.keyboard.down("Control");
      await this.page.keyboard.press("A");
      await this.page.keyboard.up("Control");
      await this.page.keyboard.press("Backspace");
      throw new ContactNotFound(whatsappToSend.id);
    }
    await this.page.mouse.click(250, 250);
  }

  async waitForLogIn(timeoutInMs: number) {
    try {
      await this.page.waitForSelector(
        'div[aria-label="Cuadro de texto para ingresar la búsqueda"]',
        { timeout: timeoutInMs },
      );
    } catch (e) {
      throw new UnreachableWhatsappMainPage("");
    }
  }
}
