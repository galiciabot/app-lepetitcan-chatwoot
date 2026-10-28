import { ChatThread, ChatMessage, ConversationStatus, ConversationPriority } from "../types";

export interface ChatwootConfig {
  inboxWebhookUrl: string;
  messagesWebhookUrl: string;
  sendMessageWebhookUrl: string;
  sendAttachmentWebhookUrl: string;
  statusWebhookUrl: string;
  priorityWebhookUrl: string;
  deleteWebhookUrl: string;
  cannedResponsesWebhookUrl: string;
  appSecret: string;
}

const BASE = import.meta.env.VITE_N8N_BASE_URL || "https://n8n-n8n-test.hmrhwx.easypanel.host/webhook";
const APP_SECRET = import.meta.env.VITE_APP_SECRET || "HW9EASIns89jsd63nkjasA67";

function defaultConfig(): ChatwootConfig {
  return {
    inboxWebhookUrl: BASE + "/inbox",
    messagesWebhookUrl: BASE + "/conversation-messages",
    sendMessageWebhookUrl: BASE + "/send-message",
    sendAttachmentWebhookUrl: BASE + "/send-attachment",
    statusWebhookUrl: BASE + "/conversation-status",
    priorityWebhookUrl: BASE + "/conversation-priority",
    deleteWebhookUrl: BASE + "/conversation-delete",
    cannedResponsesWebhookUrl: BASE + "/canned-responses",
    appSecret: APP_SECRET,
  };
}

function getConfig(): ChatwootConfig {
  const defaults = defaultConfig();
  try {
    const saved = localStorage.getItem("chatwoot_n8n_config");
    if (saved) return { ...defaults, ...JSON.parse(saved) };
  } catch {}
  return defaults;
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
    status: raw.status || "open",
    priority: raw.priority || null,
    canReply: raw.canReply !== false,
    snoozedUntil: raw.snoozedUntil || null,
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
    contentType: raw.contentType,
    attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
    stickerUrl: raw.stickerUrl || null,
    imageUrl: raw.imageUrl || null,
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

export async function updateConversationStatus(
  conversationId: string,
  status: ConversationStatus,
  snoozedUntil?: number
): Promise<void> {
  const config = getConfig();
  const body: Record<string, unknown> = { conversation_id: conversationId, status };
  if (snoozedUntil) body.snoozed_until = snoozedUntil;

  const res = await fetch(config.statusWebhookUrl, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Update status failed: ${res.status} ${res.statusText}`);
}

export async function updateConversationPriority(
  conversationId: string,
  priority: ConversationPriority | null
): Promise<void> {
  const config = getConfig();
  const res = await fetch(config.priorityWebhookUrl, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ conversation_id: conversationId, priority }),
  });
  if (!res.ok) throw new Error(`Update priority failed: ${res.status} ${res.statusText}`);
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const config = getConfig();
  const res = await fetch(config.deleteWebhookUrl, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ conversation_id: conversationId }),
  });
  if (!res.ok) throw new Error(`Delete conversation failed: ${res.status} ${res.statusText}`);
}

export function saveChatwootConfig(config: ChatwootConfig) {
  localStorage.setItem("chatwoot_n8n_config", JSON.stringify(config));
}

export interface CannedResponse {
  id: string;
  shortCode: string;
  content: string;
}

export async function listCannedResponses(): Promise<CannedResponse[]> {
  const config = getConfig();
  try {
    const res = await fetch(config.cannedResponsesWebhookUrl, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!res.ok) {
      console.warn("[chatwootService] Canned responses fetch failed:", res.status);
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data as CannedResponse[];
  } catch (err) {
    console.warn("[chatwootService] Error fetching canned responses:", err);
    return [];
  }
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.split(",").pop() || "");
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

export async function sendAttachment(
  conversationId: string,
  file: File,
  content?: string
): Promise<void> {
  const config = getConfig();
  const dataBase64 = await readFileAsBase64(file);

  const res = await fetch(config.sendAttachmentWebhookUrl, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      conversation_id: conversationId,
      content: content || "",
      filename: file.name,
      mime: file.type || "application/octet-stream",
      dataBase64,
    }),
  });

  if (!res.ok) {
    throw new Error(`Send attachment failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (data && data.status === "failed") {
    const reason = data.content_attributes && data.content_attributes.external_error;
    throw new Error(reason || "Chatwoot no pudo enviar el archivo.");
  }
}