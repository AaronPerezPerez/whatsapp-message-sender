import type { SendResult, WhatsappGateway, WhatsappToSend } from "./types.js";

export const sendBatch = async (
  gateway: WhatsappGateway,
  inputs: WhatsappToSend[],
): Promise<SendResult[]> => {
  const results: SendResult[] = [];

  for (const input of inputs) {
    if (!(await gateway.isLoggedIn())) {
      results.push({ id: input.id, status: "NOT_LOGGED_IN" });
      continue;
    }

    await gateway.screenshot(`${input.id}_1`);

    if (!(await gateway.openChat(input.to))) {
      results.push({ id: input.id, status: "CONTACT_NOT_FOUND" });
      continue;
    }

    await gateway.screenshot(`${input.id}_2`);

    if (!(await gateway.sendMessage(input.message))) {
      // Fallo al enviar tras abrir el chat → CONTACT_NOT_FOUND para preservar
      // el contrato byte-exacto de response.txt (el legacy lanzaba
      // ContactNotFound aquí). Si en el futuro hay que distinguir, añadir un
      // nuevo status y coordinar con el consumidor externo.
      results.push({ id: input.id, status: "CONTACT_NOT_FOUND" });
      continue;
    }

    await gateway.screenshot(`${input.id}_3`);
    results.push({ id: input.id, status: "OK" });
  }

  return results;
};
