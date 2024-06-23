import dotenv from "dotenv";
import puppeteer from "puppeteer";
import { config } from "./config.js";
import path from "node:path";
import { fileURLToPath } from "url";
import { dirname } from "path";

export const createBrowser = async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  dotenv.config({ path: path.join(__dirname, "../../.env") });

  return await puppeteer.launch({
    headless: config.HEADLESS,
    userDataDir: "./profile",
    args: ["--lang=es-ES,es"],
    // executablePath: config.BROWSER_PATH,
  });
};
