import { fileURLToPath } from "url";
import { dirname } from "path";
import { readFile } from "fs/promises";
import path from "node:path";
import { sleep } from "./utils/sleep.js";
import { CouldNotParseWhatsappToSendError } from "./errors/CouldNotParseWhatsappToSendError.js";
import { WhatsappPage } from "./pages/WhatsappPage.js";
import {
  WhatsappToSend,
  WhatsappToSendPrimitives,
} from "./types/WhatsappToSend.js";
import { NotLoggedInError } from "./errors/NotLoggedInError.js";
import { config } from "./utils/config.js";
import { createBrowser } from "./utils/createBrowser.js";
import { ResponseWriter } from "./types/ResponseWriter.js";

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
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3641.0 Safari/537.36",
  );

  await page.goto("https://web.whatsapp.com/");

  await sleep(config.OPEN_WHATSAPP_WAIT);

  await page.screenshot({ path: "screenshot.png", fullPage: true });
  if (!(await whatsappPage.isLoggedIn())) throw new NotLoggedInError();

  await whatsappPage.goToChat(whatsappToSend.to);
  await whatsappPage.sendMessage(whatsappToSend.message);
};
main()
  .then(() => {
    console.log("Done!");
    ResponseWriter.write();
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    ResponseWriter.write(error);
    process.exit(1);
  });
