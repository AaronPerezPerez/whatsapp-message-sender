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
    const contactSearchSelector = await this.page.$('button[aria-label="Busca un chat o inicia uno nuevo."]'); //TODO: Fix this, it's not a good selector as it should be aria-label="Buscar"
    console.log(
      "Is logged in",
      !Boolean(qrSelector) && Boolean(contactSearchSelector)
    );
    const qrSelectorIsPresent = Boolean(qrSelector);
    const contactSearchIsPresent = Boolean(contactSearchSelector);

    console.log({ qrSelectorIsPresent, contactSearchIsPresent });
    return !qrSelectorIsPresent && contactSearchIsPresent;
  }

  async goToChat(whatsappToSend: WhatsappToSend) {
    const contactSearchSelector = 'button[aria-label="Busca un chat o inicia uno nuevo."]'; //TODO: Fix this, it's not a good selector as it should be aria-label="Buscar"
    console.log("Focusing selector for contact search");
    await this.page.click(contactSearchSelector);

    await this.page.keyboard.down("Control");
    await this.page.keyboard.press("A");
    await this.page.keyboard.up("Control");
    await this.page.keyboard.press("Backspace");
    console.log("Typing");
    await this.page.keyboard.type(whatsappToSend.to);

    await sleep(config.FIND_CONTACT_WAIT);

    const spans = await this.page.$$("span");
    const contactNotFoundMessage = await Promise.all(
        spans.map(async (span) => {
          const innerText = await span.getProperty("innerText");
          return await innerText.jsonValue();
        })
    ).then((texts) =>
        texts.find((text) =>
            text.includes("No se encontró ningún chat, contacto ni mensaje.")
        )
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

  async sendMessage(whatsappToSend: WhatsappToSend) {
    const messageWriteInputSelector =
      'div[aria-placeholder="Escribe un mensaje"]';
    await this.page
      .type(messageWriteInputSelector, whatsappToSend.message)
      .catch(() => {
        throw new ContactNotFound(whatsappToSend.id);
      });

    await sleep(config.SEND_WHATSAPP_WAIT);
    await this.page.keyboard.press("Enter");
    await sleep(config.MEDIUM_WAIT);
  }

  async waitForLogIn(timeoutInMs: number) {
    try {
      await this.page.waitForSelector(
        'div[aria-label="Cuadro de texto para ingresar la búsqueda"]',
        { timeout: timeoutInMs }
      );
    } catch (e) {
      throw new UnreachableWhatsappMainPage("");
    }
  }
}
