import { readFile, writeFile, mkdir } from "fs/promises";
import path from "node:path";
import { fileURLToPath } from "url";

const adaptersDir = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(adaptersDir, "..");
const projectRoot = path.resolve(srcDir, "..");

export const inputJsonPath = path.join(srcDir, "whatsappToSend.json");
export const responseTxtPath = path.join(projectRoot, "response.txt");
export const screenshotsDir = path.join(projectRoot, "screenshots");

export const readInputJson = async (): Promise<string> =>
  readFile(inputJsonPath, "utf-8").catch(() => "");

export const writeResponseTxt = async (content: string): Promise<void> => {
  await writeFile(responseTxtPath, content);
};

export const ensureScreenshotsDir = async (): Promise<void> => {
  await mkdir(screenshotsDir, { recursive: true });
};
