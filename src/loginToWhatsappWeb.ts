import puppeteer from "puppeteer-core";
import { sleep } from "./utils/sleep.js";
import { UnreachableWhatsappMainPage } from "./errors/UnreachableWhatsappMainPage.js";
import { AlreadyLoggedInError } from "./errors/AlreadyLoggedInError.js";
import { WhatsappPage } from "./pages/WhatsappPage.js";
import dotenv from "dotenv";
import { config } from "./utils/config.js";
import { createBrowser } from "./utils/createBrowser.js";

const main = async () => {
  dotenv.config();
  const browser = await createBrowser();
  const page = await browser.newPage();
  const whatsappPage = new WhatsappPage(page);
  await page.goto("https://web.whatsapp.com/");
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3641.0 Safari/537.36",
  );
  await sleep(config.OPEN_WHATSAPP_WAIT);

  if (await whatsappPage.isLoggedIn()) throw new AlreadyLoggedInError();

  await whatsappPage.waitForLogIn(60_000);
  await sleep(config.LONG_WAIT);
  await page.close();
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
