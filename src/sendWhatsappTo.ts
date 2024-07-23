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
import { DomainError } from "./errors/DomainError.js";
import { WhatsappSentSuccessfullyError } from "./errors/WhatsappSentSuccessfullyError.js";

const retrieveWhatsappToSend = async (): Promise<WhatsappToSend[]> => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const raw = await readFile(path.join(__dirname, "whatsappToSend.json"), {
    encoding: "utf-8",
  }).catch(() => "");

  try {
    const json: WhatsappToSendPrimitives[] = JSON.parse(raw);
    return json.map(WhatsappToSend.fromPrimitives);
  } catch (e) {
    throw new CouldNotParseWhatsappToSendError("");
  }
};

//TODO: This is terrible, fix this as soon as possible (use Either-like monad??)
const main = async () => {
  const whatsappsToSend = await retrieveWhatsappToSend();
  const browser = await createBrowser();
  const page = await browser.newPage();
  const whatsappPage = new WhatsappPage(page);
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3641.0 Safari/537.36",
  );

  await page.goto("https://web.whatsapp.com/");


  await sleep(config.OPEN_WHATSAPP_WAIT);
  const errors: DomainError[] = [];
  for (const whatsappToSend of whatsappsToSend) {
    const recorder = await page.screencast({path: `recording_${whatsappToSend.id}.webm`});
    try {
      if (!(await whatsappPage.isLoggedIn()))
        throw new NotLoggedInError(whatsappToSend.id);

      await whatsappPage.goToChat(whatsappToSend);
      await whatsappPage.sendMessage(whatsappToSend);

      throw new WhatsappSentSuccessfullyError(whatsappToSend.id);
    } catch (e) {
      errors.push(e as DomainError);
    } finally {
      await recorder.stop();
    }
  }

  return errors;
};
main().then((errors) => {
  console.log("Done!");
  ResponseWriter.write(errors);
  process.exit(0);
});
