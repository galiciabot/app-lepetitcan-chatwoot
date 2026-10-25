import { ChatThread, ChatMessage } from "../types";

export interface ChatwootConfig {
  inboxWebhookUrl: string;
  messagesWebhookUrl: string;
  sendMessageWebhookUrl: string;
  appSecret: string;
}

const BASE = import.meta.env.VITE_N8N_BASE_URL || "https://n8n-n8n-test.hmrhwx.easypanel.host/webhook";
const APP_SECRET = import.meta.env.VITE_APP_SECRET || "HW9EASIns89jsd63nkjasA67";

function getConfig(): ChatwootConfig {
  try {
    const saved = localStorage.getItem("chatwoot_n8n_config");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.inboxWebhookUrl) return parsed;
    }
  } catch {}
  return {
    inboxWebhookUrl: BASE + "/inbox",
    messagesWebhookUrl: BASE + "/conversation-messages",
    sendMessageWebhookUrl: BASE + "/send-message",
    appSecret: APP_SECRET,
  };
}

function getHeaders() {
  const config = getConfig();
  return {
    "Content-Type": "application/json",
    "X-App-Secret": config.appSecret,
  };
}

function normalizeThread(raw: any): ChatThread | null {
  if (!raw || raw.id === undefined || raw.id === null) return null;
  return {
    id: String(raw.id),
    externalId: String(raw.externalId ?? raw.id),
    contactName: raw.contactName || raw.ownerName || "Contacto",
    ownerName: raw.ownerName || raw.contactName,
    channel: raw.channel || "Web",
    avatarUrl: raw.avatarUrl || "",
    lastMessageText: raw.lastMessageText || "",
    lastMessageTime: raw.lastMessageTime || "",
    unread: Boolean(raw.unread),
    resolved: Boolean(raw.resolved),
    messages: Array.isArray(raw.messages) ? raw.messages : [],
  };
}

function normalizeMessage(raw: any): ChatMessage | null {
  if (!raw || raw.id === undefined || raw.id === null) return null;
  return {
    id: String(raw.id),
    externalId: String(raw.externalId ?? raw.id),
    sender: raw.sender === "me" ? "me" : "client",
    text: raw.text ?? "",
    time: raw.time ?? "",
    createdAt: raw.createdAt,
  };
}

export async function listConversations(
  filters?: { resolved?: boolean; search?: string }
): Promise<ChatThread[]> {
  const config = getConfig();
  try {
    const url = new URL(config.inboxWebhookUrl);
    if (filters?.search) url.searchParams.set("search", filters.search);
    if (filters?.resolved !== undefined) url.searchParams.set("resolved", String(filters.resolved));

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: getHeaders(),
    });

    if (!res.ok) {
      console.warn("[chatwootService] Inbox fetch failed:", res.status, res.statusText);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map(normalizeThread).filter(Boolean) as ChatThread[];
  } catch (err) {
    console.warn("[chatwootService] Error fetching inbox:", err);
    return [];
  }
}

export async function listMessages(conversationId: string): Promise<ChatMessage[]> {
  const config = getConfig();
  try {
    const url = new URL(config.messagesWebhookUrl);
    url.searchParams.set("conversationId", conversationId);

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: getHeaders(),
    });

    if (!res.ok) {
      console.warn("[chatwootService] Messages fetch failed:", res.status, res.statusText);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map(normalizeMessage).filter(Boolean) as ChatMessage[];
  } catch (err) {
    console.warn("[chatwootService] Error fetching messages:", err);
    return [];
  }
}

export async function sendMessage(
  conversationId: string,
  text: string
): Promise<ChatMessage> {
  const config = getConfig();
  const res = await fetch(config.sendMessageWebhookUrl, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      conversation_id: conversationId,
      content: text,
    }),
  });

  if (!res.ok) {
    throw new Error(`Send message failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  if (data && data.status === "failed") {
    const reason = data.content_attributes && data.content_attributes.external_error;
    throw new Error(reason || "Chatwoot no pudo enviar el mensaje.");
  }

  return {
    id: String(data?.id ?? `sent_${Date.now()}`),
    externalId: data?.id ? String(data.id) : undefined,
    sender: "me",
    text,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    createdAt: data?.created_at,
  };
}

export function saveChatwootConfig(config: ChatwootConfig) {
  localStorage.setItem("chatwoot_n8n_config", JSON.stringify(config));
}