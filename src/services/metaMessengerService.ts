import { ChatThread, ChatMessage } from "../types";

export interface MessengerConfig {
  pageId: string;
  pageAccessToken: string;
}

// Rich Mock database for sandbox Facebook Messenger conversations
const messengerMockThreads: ChatThread[] = [
  {
    id: "fb_1",
    dogName: "Kobe",
    ownerName: "Jesús Gómez",
    channel: "facebook",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCUIWGD2R213a1OenjCraZmuoyfbvs4paKI6Lmb7BECCdzw9DPxc2ctTn_1rrXZnwZnTR-eAUDsqaYX1XYlyaPfAtuAN3gvxcsKbcCoROrdimYxD2xYTsGRwx4taIuB1YjxUFAy5xd-lId3I5dkT7i4ToFSofxh5-ZV9VYSM64SBj-sp7PcAN_9MVVS9RmMXrgamw621kFsIeo8XSIkN7Wp5O_zQemax0DVmxdth4_tovOhvNP_QVyTNjwo069dadJxOfYt9tY8LT0",
    lastMessageText: "Hola! ¿El baño es con ozonoterapia?",
    lastMessageTime: "Ayer",
    unread: false,
    resolved: false,
    externalId: "fb_user_10203040", // Meta scoped user ID
    clientId: "o3",
    platformConversationId: "t_10203040",
    messages: [
      {
        id: "fbm_1",
        sender: "client",
        text: "Hola! Querría consultar por los bonos de peluquería.",
        time: "18:00",
        channel: "facebook",
      },
      {
        id: "fbm_2",
        sender: "me",
        text: "¡Hola! Sí, por supuesto. Tenemos bonos de 3 y 5 sesiones con descuento.",
        time: "18:05",
        channel: "facebook",
      },
      {
        id: "fbm_3",
        sender: "client",
        text: "Hola! ¿El baño es con ozonoterapia?",
        time: "18:10",
        channel: "facebook",
        externalId: "mid.1451239128312:a2f90b1",
      }
    ],
  }
];

/**
 * List Facebook Messenger Conversations
 */
export async function listConversations(
  config?: MessengerConfig,
  filters?: { resolved?: boolean; search?: string }
): Promise<ChatThread[]> {
  console.log("[metaMessengerService] Listing conversations with config:", config);
  
  let threads = [...messengerMockThreads];
  if (filters?.resolved !== undefined) {
    threads = threads.filter(t => t.resolved === filters.resolved);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    threads = threads.filter(t => 
      t.ownerName.toLowerCase().includes(q) || 
      t.dogName.toLowerCase().includes(q) || 
      t.lastMessageText.toLowerCase().includes(q)
    );
  }
  return threads;
}

/**
 * List messages inside a specific Facebook thread
 */
export async function listMessages(
  config?: MessengerConfig,
  conversationId?: string
): Promise<ChatMessage[]> {
  console.log(`[metaMessengerService] Fetching messages for: ${conversationId} with page config:`, config);
  const found = messengerMockThreads.find(t => t.id === conversationId);
  return found ? found.messages : [];
}

/**
 * Send Facebook Messenger message
 */
export async function sendMessage(
  config: MessengerConfig | undefined,
  conversationId: string,
  payload: { text: string }
): Promise<ChatMessage> {
  console.log(`[metaMessengerService] Sending Messenger message to client thread: ${conversationId}`);
  console.log("[metaMessengerService] Credentials verified:", config);

  // TODO: here we will call the Messenger Send API /v21.0/me/messages
  // Method: POST
  // URL: https://graph.facebook.com/v21.0/me/messages?access_token=${config?.pageAccessToken}
  // Body: {
  //   recipient: { id: "RECIPIENT_PSID" },
  //   messaging_type: "RESPONSE",
  //   message: { text: payload.text }
  // }

  const newMsg: ChatMessage = {
    id: `fbm_sent_${Date.now()}`,
    sender: "me",
    text: payload.text,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    channel: "facebook",
    externalId: `mid.sent_${Date.now()}`
  };

  const thread = messengerMockThreads.find(t => t.id === conversationId);
  if (thread) {
    thread.messages.push(newMsg);
    thread.lastMessageText = payload.text;
    thread.lastMessageTime = "Ahora mismo";
  }

  return newMsg;
}

/**
 * Parse Messenger raw Webhook paypload.
 * Structure matches Meta Webhooks Graph API format for Messenger (object: "page", entry -> messaging -> message).
 */
export function parseWebhookEvent(rawPayload: any): {
  threads: Partial<ChatThread>[];
  messages: ChatMessage[];
} {
  console.log("[metaMessengerService] Parsing Facebook Messenger webhooks event:", rawPayload);
  
  const parsedThreads: Partial<ChatThread>[] = [];
  const parsedMessages: ChatMessage[] = [];

  try {
    if (rawPayload && rawPayload.object === "page") {
      const entries = rawPayload.entry || [];
      for (const ent of entries) {
        const messagings = ent.messaging || [];
        for (const msgEvent of messagings) {
          if (msgEvent.message) {
            const senderId = msgEvent.sender?.id;
            const msgId = msgEvent.message.mid;
            const text = msgEvent.message.text || "";

            const chatMsg: ChatMessage = {
              id: `fbm_webhook_${msgId}`,
              sender: "client",
              text,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              channel: "facebook",
              externalId: msgId,
              clientId: senderId
            };

            parsedMessages.push(chatMsg);

            const pThread: Partial<ChatThread> = {
              id: `fb_thread_${senderId}`,
              dogName: "Mascota",
              ownerName: `Usuario Messenger (${senderId?.slice(0, 5)})`,
              channel: "facebook",
              avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100",
              lastMessageText: text,
              lastMessageTime: chatMsg.time,
              unread: true,
              resolved: false,
              externalId: senderId,
              clientId: senderId,
              platformConversationId: `t_${senderId}`
            };

            parsedThreads.push(pThread);
          }
        }
      }
    }
  } catch (err) {
    console.error("[metaMessengerService] Error parsing Facebook Webhook payload:", err);
  }

  return {
    threads: parsedThreads,
    messages: parsedMessages
  };
}
