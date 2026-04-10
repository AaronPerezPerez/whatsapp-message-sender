import puppeteer, { type Browser, type Page } from "puppeteer";
import { config } from "../config.js";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const WHATSAPP_WEB_URL = "https://web.whatsapp.com/";

// El `.env` ya lo carga `env-cmd` antes de importar módulos (ver package.json).
// No llamamos dotenv aquí para no acoplar el adapter al filesystem.
export const launchBrowser = async (): Promise<Browser> =>
  puppeteer.launch({
    defaultViewport: { width: 1920, height: 1080 },
    headless: config.HEADLESS,
    userDataDir: "./profile",
    args: ["--lang=es-ES,es", "--start-maximized"],
  });

export const openWhatsappWeb = async (browser: Browser): Promise<Page> => {
  const page = await browser.newPage();
  // setUserAgent y setViewport DEBEN ir antes de goto — si no, WhatsApp Web
  // detecta cambio de UA y fuerza recarga con estado sucio.
  await page.setUserAgent(USER_AGENT);
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(WHATSAPP_WEB_URL);
  return page;
};
