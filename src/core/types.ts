export type WhatsappToSend = {
  id: string;
  to: string;
  message: string;
};

export type Status = "OK" | "NOT_LOGGED_IN" | "CONTACT_NOT_FOUND";

export type SendResult = {
  id: string;
  status: Status;
};

// Los textos van literales a response.txt. Son la API pública del script:
// el consumidor externo parsea por string. No tocar sin coordinación.
export const STATUS_MESSAGES: Record<Status, string> = {
  OK: "OK",
  NOT_LOGGED_IN: "No hay cuenta de Whatsapp Web asociada",
  CONTACT_NOT_FOUND: "No se ha encontrado al contacto",
};

export interface WhatsappGateway {
  isLoggedIn(): Promise<boolean>;
  openChat(to: string): Promise<boolean>;
  sendMessage(text: string): Promise<boolean>;
  screenshot(label: string): Promise<void>;
}
