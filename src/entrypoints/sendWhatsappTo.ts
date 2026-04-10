import { config } from "../config.js";
import { formatResults } from "../core/formatResults.js";
import { parseInput } from "../core/parseInput.js";
import { sendBatch } from "../core/sendBatch.js";
import { sleep } from "../core/sleep.js";
import { PuppeteerWhatsappGateway } from "../adapters/PuppeteerWhatsappGateway.js";
import { launchBrowser, openWhatsappWeb } from "../adapters/browser.js";
import {
  ensureScreenshotsDir,
  readInputJson,
  screenshotsDir,
  writeResponseTxt,
} from "../adapters/fileIO.js";

const main = async () => {
  const parsed = parseInput(await readInputJson());
  if (!parsed.ok) {
    console.error(
      "No se pudo parsear src/whatsappToSend.json. Verifica el formato.",
    );
    process.exit(1);
  }

  await ensureScreenshotsDir();
  const browser = await launchBrowser();
  try {
    const page = await openWhatsappWeb(browser);
    await sleep(config.OPEN_WHATSAPP_WAIT);

    const gateway = new PuppeteerWhatsappGateway(page, screenshotsDir);
    const results = await sendBatch(gateway, parsed.inputs);
    await writeResponseTxt(formatResults(results));
    console.log("Done!");
  } finally {
    await browser.close();
  }
};

main().then(() => process.exit(0));
