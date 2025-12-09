import { sleep } from "./utils/sleep.js";
import { AlreadyLoggedInError } from "./errors/AlreadyLoggedInError.js";
import { WhatsappPage } from "./pages/WhatsappPage.js";
import dotenv from "dotenv";
import { config } from "./utils/config.js";
import { createBrowser } from "./utils/createBrowser.js";
import { ResponseWriter } from "./types/ResponseWriter.js";

const main = async () => {
  dotenv.config();
  const browser = await createBrowser();
  const page = await browser.newPage();
  const whatsappPage = new WhatsappPage(page);
  await page.goto("https://web.whatsapp.com/");
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  );
  await sleep(config.OPEN_WHATSAPP_WAIT);

  if (await whatsappPage.isLoggedIn()) throw new AlreadyLoggedInError("");

  await whatsappPage.waitForLogIn(60_000);
  await sleep(config.LONG_WAIT);
  await page.close();
};

main()
  .then(() => {
    console.log("Done!");
    ResponseWriter.write();
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    ResponseWriter.write([error]);
    process.exit(1);
  });
