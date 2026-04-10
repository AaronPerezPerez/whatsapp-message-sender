import { STATUS_MESSAGES, type SendResult } from "./types.js";

export const formatResults = (results: SendResult[]): string =>
  results
    .map((result) => `${result.id}:${STATUS_MESSAGES[result.status]}\n`)
    .join("");
