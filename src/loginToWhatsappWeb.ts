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
  console.log(process.env.HEADLESS);
  const page = await browser.newPage();
  const whatsappPage = new WhatsappPage(page);
  await page.goto("https://web.whatsapp.com/");
  await page.setViewport({ width: 1080, height: 1024 });

  await sleep(config.LONG_WAIT);

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
