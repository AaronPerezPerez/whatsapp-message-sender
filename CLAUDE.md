# CLAUDE.md — whatsapp-message-sender

> **Reglas de máxima prioridad**
>
> ## Idioma
> Comunicarse siempre en **español**.
>
> ## Commits
> **NUNCA** incluir `Co-Authored-By: Claude` ni menciones a Claude en los commits.
>
> ## MCP servers
> - Usar **Serena** (`find_symbol`, `get_symbols_overview`, `search_for_pattern`) en vez de leer archivos enteros.
> - Usar **Context7** para documentación actualizada de Puppeteer u otras libs antes de asumir APIs.

---

## Qué hace este repo

Automatización de envío de mensajes de WhatsApp usando **Puppeteer** contra **WhatsApp Web**. No usa la API oficial de Meta — controla un Chromium real con sesión persistente en `./profile`.

### Flujo completo de uso

1. **`npm run login`** — lanza un Chromium visible, abre WhatsApp Web y espera a que escanees el QR con el móvil. Al escanear, la sesión queda guardada en `./profile/` y no hace falta repetirlo hasta que caduque la sesión.
2. **Crear `src/whatsappToSend.json`** con un array de mensajes:
   ```json
   [{ "id": "123", "to": "34699887766", "message": "..." }]
   ```
3. **`npm run sendWhatsapp`** — lee ese JSON, abre `web.whatsapp.com` reutilizando el perfil, y para cada entrada: busca el contacto por número, abre el chat, escribe el mensaje y lo envía.
4. **Leer `response.txt`** — el resultado se escribe allí, una línea por mensaje con formato `id:estado`. El "estado" es siempre el `message` del `DomainError` correspondiente (por convención del script, el éxito se representa con un `WhatsappSentSuccessfullyError` cuyo `message` es literal `"OK"`).

| Script | Comando | Archivo entrada | Archivo salida |
|--------|---------|-----------------|----------------|
| Enlazar sesión | `npm run login` | — | `./profile/` (perfil Chromium) |
| Envío en lote | `npm run sendWhatsapp` | `src/whatsappToSend.json` | `response.txt` + `screenshots/${id}_{1,2,3}.png` |

Ambos scripts ejecutan via `env-cmd tsx ...`, así que el `.env` de la raíz se carga en `process.env` **antes** de importar módulos.

---

## Arquitectura (de un vistazo)

```
src/
├── loginToWhatsappWeb.ts     # entrypoint: login
├── sendWhatsappTo.ts         # entrypoint: envío en lote
├── inspectDom.ts             # herramienta de debug (ver más abajo)
├── pages/
│   └── WhatsappPage.ts       # Page Object con selectores de WhatsApp Web
├── types/
│   ├── WhatsappToSend.ts     # Value object + primitives
│   └── ResponseWriter.ts     # Escribe response.txt
├── utils/
│   ├── createBrowser.ts      # Lanza puppeteer con flags y userDataDir
│   ├── config.ts             # Lee process.env con defaults
│   ├── parseEmojis.ts        # Sustituye [code] → emoji
│   ├── parseEmojis.spec.ts   # Test con vitest
│   └── sleep.ts
└── errors/                   # Errores de dominio (DomainError base)
    ├── DomainError.ts
    ├── WhatsappSentSuccessfullyError.ts   # ← ojo: usado como señal de éxito
    ├── NotLoggedInError.ts
    ├── ContactNotFound.ts
    ├── AlreadyLoggedInError.ts
    ├── CouldNotParseWhatsappToSendError.ts
    └── UnreachableWhatsappMainPage.ts
```

Patrón: **Page Object** (`WhatsappPage`) encapsula los selectores; los entrypoints orquestan el flujo. Los errores de dominio heredan de `DomainError` y llevan siempre `messageId` + `message`, porque se serializan en `response.txt` para que el llamador externo pueda parsear el resultado.

### Convenciones importantes

- **Imports con extensión `.js`** aunque el fuente sea `.ts` (es ESM puro, `"type": "module"` en `package.json`).
- **Archivos**: PascalCase para clases/errores (`WhatsappPage.ts`, `ContactNotFound.ts`), camelCase para entrypoints y utilidades (`sendWhatsappTo.ts`, `createBrowser.ts`).
- **Selectores centralizados** en `WhatsappPage.ts` bajo la constante `SELECTORS`. Si tienes que tocar un selector, tócalo ahí.
- **Ningún fetcher ni capa de repositorio**: estos scripts leen de un JSON y escriben a un `.txt`. Sin persistencia.
- **Sin comentarios de relleno**: solo cuando expliquen el porqué. Los TODO existentes son contratos pendientes, no los borres sin arreglar el issue subyacente.

---

## Cómo ejecutar

```bash
# 1. Copiar .env.example → .env y ajustar tiempos/flags si hace falta
cp .env.example .env

# 2. Primer login (deja el QR visible y escanea con el móvil)
npm run login

# 3. Crear el JSON de entrada
cp src/whatsappToSend.example.json src/whatsappToSend.json
#    formato: [{ id, to: "34XXXXXXXXX", message: "..." }]

# 4. Enviar
npm run sendWhatsapp

# 5. Leer el resultado
cat response.txt
```

### Variables de entorno (`src/utils/config.ts`)

| Variable | Default | Para qué |
|----------|---------|----------|
| `HEADLESS` | `false` | Ejecutar Chromium sin UI (útil en servidor). |
| `OPEN_WHATSAPP_WAIT` | `5000` | Espera tras `goto` a `web.whatsapp.com`. |
| `FIND_CONTACT_WAIT` | `5000` | Espera tras escribir el número en la búsqueda. |
| `SEND_WHATSAPP_WAIT` | `5000` | Espera entre `type` y `Enter` al enviar. |
| `SHORT_WAIT` / `MEDIUM_WAIT` / `LONG_WAIT` | 1k/3k/5k | Sleeps genéricos. |

> ⚠️ Si subes los waits, recuerda que el perfil de ejecución no tiene timeouts de arriba: un sleep largo bloquea todo el lote.

### Artefactos runtime (ignorados por git)

- `./profile/` — perfil de Chromium con la sesión de WhatsApp Web.
- `src/whatsappToSend.json` — input del lote.
- `response.txt` — resultado (una línea por mensaje).
- `screenshots/` — capturas _antes de buscar_, _tras abrir chat_ y _tras enviar_, nombradas `${id}_1.png … _3.png`. Útiles para debug cuando algo rompe.

---

## Operativa de debug (MUY IMPORTANTE)

WhatsApp Web **cambia los selectores y la estructura del DOM cada pocas semanas**. El historial del repo está dominado por `fix: aria-label...`. Antes de tocar nada frente a un fallo:

1. **Ejecuta con `HEADLESS=false`** y observa el navegador en vivo.
2. **Abre las screenshots** de `screenshots/${id}_{1,2,3}.png` → estado justo antes/después de cada paso del último intento.
3. **Usa `npx env-cmd tsx src/inspectDom.ts`** (incluido en el repo) — es un script idempotente que abre WhatsApp Web con el perfil actual, hace una búsqueda y dumpea por consola los atributos relevantes del DOM (ids, aria-labels, data-tabs, roles, contenteditable). Úsalo para ver qué ha cambiado WhatsApp Web sin tener que abrir DevTools a mano. Edita el término de búsqueda si necesitas probar con otro número.
4. **Prefiere selectores estables** sobre textos localizados:
   - `#pane-side`, `#main` → contenedores de los últimos años, muy estables.
   - `data-tab="3"` (input de búsqueda), `data-tab="10"` (input de mensaje) → estables.
   - `role="row"`, `role="textbox"` → estables.
   - Evita `aria-label` en español — cambia frecuentemente.

### Síntomas habituales y dónde mirar

| Síntoma | Archivo / causa probable |
|---------|--------------------------|
| Dice "not logged in" aunque la sesión existe | `WhatsappPage.isLoggedIn` — revisa que `#pane-side` siga existiendo en el DOM actual (dumpear con `inspectDom.ts`). |
| Busca pero no filtra la lista; envía al contacto equivocado | React input: ver sección "React-controlled inputs" más abajo. |
| `ContactNotFound` para números válidos | O bien `#main` tarda >10s (subir timeout) o bien `clickFirstSearchResult` está clickando un header de sección → añadir el texto al `RESULT_SECTION_HEADERS` de `WhatsappPage.ts`. |
| Mensaje escrito pero nunca enviado | Selector `div[role="textbox"][data-tab="10"]` — dumpear el `#main` para ver si `data-tab` cambió. |
| Login parece no aplicar UA | Ya arreglado: `setUserAgent` debe ir **antes** de `page.goto` en `loginToWhatsappWeb.ts`. |

### React-controlled inputs (lección aprendida)

El `input[data-tab="3"]` de búsqueda está controlado por React. Puppeteer's `page.keyboard.type()` y `page.type(selector, value)` **dejan el `.value` escrito pero NO disparan el handler de React**, así que la lista lateral no se filtra. La solución es usar el setter nativo del prototype y emitir un evento `input`:

```ts
await page.evaluate((sel, val) => {
  const input = document.querySelector(sel) as HTMLInputElement;
  const desc = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
  desc!.set!.call(input, val);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}, selector, value);
```

Esto ya está implementado en `WhatsappPage.setReactInputValue`. El `div[contenteditable="true"]` del input de mensaje (`data-tab="10"`) **NO** tiene este problema — es un contenteditable nativo y `page.type` funciona bien ahí.

### Click en resultado de búsqueda

`row.click()` desde `page.evaluate` **no abre** el chat (WhatsApp Web ignora clicks sintéticos de JS). Hay que usar `page.mouse.click(x, y)` con las coordenadas del row, que Puppeteer dispara como evento de ratón real vía CDP. Ver `WhatsappPage.clickFirstSearchResult`.

---

## Tests

- `vitest` instalado como devDep pero **no hay script `test`** en `package.json` (el actual hace `exit 1`).
- Único spec: `src/utils/parseEmojis.spec.ts`.
- No hay tests E2E porque requerirían una sesión real de WhatsApp Web. Para lógica pura (parsers, errores, value objects) sí escribir test con vitest.

---

## Commits

Estilo observado en el historial: **Conventional Commits** cortos en inglés (`fix:`, `feat:`). Mantenerlo así.

**NO** incluir `Co-Authored-By: Claude` ni referencias al asistente.

---

## TODOs vivos que arrastra el repo

- `sendWhatsappTo.ts:34` — "This is terrible, fix this as soon as possible (use Either-like monad??)". Se refiere al flujo que usa `WhatsappSentSuccessfullyError` como señal de éxito lanzándolo dentro del `try`. Al refactorizar, sustituir por `Result<T, DomainError>` o similar y mantener la forma de `response.txt` igual (el consumidor externo parsea esa salida).
