import { ChatThread, ChatMessage } from "../types";

export interface ChatwootConfig {
  inboxWebhookUrl: string;
  sendMessageWebhookUrl: string;
  appSecret: string;
}

const BASE = import.meta.env.VITE_N8N_BASE_URL || "https://n8n-n8n-test.hmrhwx.easypanel.host/webhook";
const APP_SECRET = import.meta.env.VITE_APP_SECRET || "HW9EASIns89jsd63nkjasA67";

function getConfig(): ChatwootConfig {
  try {
    const saved = localStorage.getItem("chatwoot_n8n_config");
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    inboxWebhookUrl: BASE + "/inbox",
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
    return data as ChatThread[];
  } catch (err) {
    console.warn("[chatwootService] Error fetching inbox:", err);
    return [];
  }
}

export async function listMessages(
  conversationId?: string
): Promise<ChatMessage[]> {
  const config = getConfig();
  try {
    const url = new URL(config.inboxWebhookUrl);
    if (conversationId) url.searchParams.set("conversationId", conversationId);

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: getHeaders(),
    });

    if (!res.ok) {
      console.warn("[chatwootService] Messages fetch failed:", res.status, res.statusText);
      return [];
    }

    const data = await res.json();
    if (Array.isArray(data)) return data as ChatMessage[];
    return (data as any)?.messages || [];
  } catch (err) {
    console.warn("[chatwootService] Error fetching messages:", err);
    return [];
  }
}

export async function sendMessage(
  conversationId: string,
  payload: { text: string; isAudio?: boolean; audioDuration?: string }
): Promise<ChatMessage> {
  const config = getConfig();
  try {
    const res = await fetch(config.sendMessageWebhookUrl, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        conversation_id: conversationId,
        content: payload.text,
        is_audio: payload.isAudio || false,
        audio_duration: payload.audioDuration || null,
      }),
    });

    if (!res.ok) {
      throw new Error(`Send message failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const newMsg: ChatMessage = {
      id: `sent_${Date.now()}`,
      sender: "me",
      text: payload.text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAudio: payload.isAudio,
      audioDuration: payload.audioDuration,
      channel: data?.channel || "WhatsApp",
    };
    return newMsg;
  } catch (err) {
    console.error("[chatwootService] Error sending message:", err);
    throw err;
  }
}

export function saveChatwootConfig(config: ChatwootConfig) {
  localStorage.setItem("chatwoot_n8n_config", JSON.stringify(config));
}