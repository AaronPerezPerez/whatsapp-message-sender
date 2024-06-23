export const config = {
  HEADLESS: process.env.HEADLESS === "true",
  BROWSER_PATH:
    process.env.BROWSER_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  SHORT_WAIT: Number(process.env.SHORT_WAIT) || 1000,
  MEDIUM_WAIT: Number(process.env.MEDIUM_WAIT) || 3000,
  LONG_WAIT: Number(process.env.LONG_WAIT) || 5000,
};
