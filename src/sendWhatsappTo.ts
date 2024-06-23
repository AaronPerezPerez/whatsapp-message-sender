import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from "dotenv";
import { readFile } from "fs/promises";
import path from "node:path";
import { sleep } from "./utils/sleep.js";
import { UnreachableWhatsappMainPage } from "./errors/UnreachableWhatsappMainPage.js";
import { CouldNotParseWhatsappToSendError } from "./errors/CouldNotParseWhatsappToSendError.js";
import { WhatsappPage } from "./pages/WhatsappPage.js";
import {
  WhatsappToSend,
  WhatsappToSendPrimitives,
} from "./types/WhatsappToSend.js";
import { NotLoggedInError } from "./errors/NotLoggedInError.js";
import { config } from "./utils/config.js";
import { createBrowser } from "./utils/createBrowser.js";

const retrieveWhatsappToSend = async (): Promise<WhatsappToSend> => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const raw = await readFile(path.join(__dirname, "whatsappToSend.json"), {
    encoding: "utf-8",
  }).catch(() => "");

  try {
    const json: WhatsappToSendPrimitives = JSON.parse(raw);
    return WhatsappToSend.fromPrimitives(json);
  } catch (e) {
    throw new CouldNotParseWhatsappToSendError();
  }
};
const main = async () => {
  const whatsappToSend = await retrieveWhatsappToSend();
  const browser = await createBrowser();
  const page = await browser.newPage();
  const whatsappPage = new WhatsappPage(page);

  await page.goto("https://web.whatsapp.com/");
  await page.setViewport({ width: 1080, height: 1024 });

  await sleep(config.OPEN_WHATSAPP_WAIT);

  if (!(await whatsappPage.isLoggedIn())) throw new NotLoggedInError();

  await whatsappPage.goToChat(whatsappToSend.to);
  await whatsappPage.sendMessage(whatsappToSend.message);
};
main()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
