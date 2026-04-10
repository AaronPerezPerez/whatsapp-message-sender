import { sleep } from "./utils/sleep.js";
import { config } from "./utils/config.js";
import { createBrowser } from "./utils/createBrowser.js";

const dumpDom = async (page: import("puppeteer").Page, label: string) => {
  const diag = await page.evaluate(`(() => {
    function pick(el) {
      if (!el) return null;
      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        label: el.getAttribute('aria-label'),
        placeholder: el.getAttribute('aria-placeholder'),
        role: el.getAttribute('role'),
        dataTab: el.getAttribute('data-tab'),
        contentEditable: el.getAttribute('contenteditable'),
        text: (el.textContent || '').trim().slice(0, 80),
        value: el.value || null,
      };
    }
    const mainPanel = document.querySelector('#main');
    const mainHeaderText = mainPanel
      ? (mainPanel.querySelector('header') ? (mainPanel.querySelector('header').textContent || '').trim().slice(0, 120) : null)
      : null;
    const mainEditables = mainPanel
      ? Array.from(mainPanel.querySelectorAll('[contenteditable="true"], [role="textbox"]')).map(pick)
      : [];
    const firstFiveRows = Array.from(
      document.querySelectorAll('#pane-side [role="listitem"], #pane-side [role="row"]')
    ).slice(0, 5).map(pick);
    return {
      hasMain: !!mainPanel,
      mainHeaderText: mainHeaderText,
      mainEditables: mainEditables,
      firstFiveRows: firstFiveRows,
    };
  })()`);
  console.log(`=== DUMP: ${label} ===`);
  console.log(JSON.stringify(diag, null, 2));
};

const main = async () => {
  const browser = await createBrowser();
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  );
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto("https://web.whatsapp.com/");
  await page.waitForSelector("#pane-side", { timeout: 30_000 });
  await sleep(1_500);

  const searchSelector = 'input[role="textbox"][data-tab="3"]';
  await page.focus(searchSelector);
  // React-aware value setter + dispatchEvent
  await page.evaluate(
    `(() => {
      const input = document.querySelector('input[role="textbox"][data-tab="3"]');
      const desc = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
      desc.set.call(input, '34601091362');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`,
  );
  await sleep(config.FIND_CONTACT_WAIT);

  await dumpDom(page, "AFTER REACT-AWARE SET");

  // Real puppeteer click on the first result (non-header) using xpath-like approach
  const firstRowInfo = await page.evaluate(`(() => {
    const rows = Array.from(document.querySelectorAll('#pane-side [role="listitem"], #pane-side [role="row"]'));
    for (let i = 0; i < rows.length; i++) {
      const text = (rows[i].textContent || '').trim();
      if (text && text !== 'Chats' && text !== 'Contactos' && text !== 'Mensajes') {
        rows[i].setAttribute('data-wms-target', '1');
        const rect = rows[i].getBoundingClientRect();
        return { index: i, text: text.slice(0, 80), x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
      }
    }
    return null;
  })()`);
  console.log("First candidate row:", firstRowInfo);

  if (firstRowInfo && typeof firstRowInfo === "object" && "x" in firstRowInfo) {
    await page.mouse.click((firstRowInfo as any).x, (firstRowInfo as any).y);
    await sleep(3_000);
  }

  await dumpDom(page, "AFTER REAL CLICK");

  await browser.close();
};

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
