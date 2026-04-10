import { config } from "../config.js";
import { sleep } from "../core/sleep.js";
import { launchBrowser, openWhatsappWeb } from "../adapters/browser.js";

const LOGIN_TIMEOUT_MS = 120_000;
const ALREADY_LOGGED_IN_PROBE_MS = 2_000;

const main = async () => {
  const browser = await launchBrowser();
  try {
    const page = await openWhatsappWeb(browser);
    await sleep(config.OPEN_WHATSAPP_WAIT);

    const alreadyLoggedIn = await page
      .waitForSelector("#pane-side", { timeout: ALREADY_LOGGED_IN_PROBE_MS })
      .then(() => true)
      .catch(() => false);

    if (alreadyLoggedIn) {
      console.log("Ya hay una cuenta de Whatsapp Web asociada.");
      return;
    }

    console.log("Escanea el QR con el móvil para iniciar sesión...");
    try {
      await page.waitForSelector("#pane-side", { timeout: LOGIN_TIMEOUT_MS });
      console.log("Sesión iniciada correctamente.");
    } catch {
      console.log("Timeout esperando a que escanees el QR.");
    }
  } finally {
    await browser.close();
  }
};

main().then(() => process.exit(0));
