import { ChatThread, ChatMessage } from "../types";

export interface InstagramConfig {
  igBusinessId: string;
  pageAccessToken: string;
}

// Rich Mock database for sandbox Instagram Business conversations
const instagramMockThreads: ChatThread[] = [
  {
    id: "ig_1",
    dogName: "Milú",
    ownerName: "Laura Castro",
    channel: "instagram",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100",
    lastMessageText: "¡Me encantan vuestras historias! Volvemos la prósima semana.",
    lastMessageTime: "Miércoles",
    unread: false,
    resolved: false,
    externalId: "ig_user_44332211", // Instagram user API Scoped ID
    clientId: "o3",
    platformConversationId: "conv_ig_milu_laura",
    messages: [
      {
        id: "igm_1",
        sender: "client",
        text: "Hola @lepetitcan, ¿tenéis champú de frambuesa en stock?",
        time: "11:40",
        channel: "instagram",
      },
      {
        id: "igm_2",
        sender: "me",
        text: "¡Hola Laura! Sí, nos quedan un par de unidades de la línea orgánica de lavanda y fresa/frambuesa. Te reservamos uno si quieres.",
        time: "11:46",
        channel: "instagram",
      },
      {
        id: "igm_3",
        sender: "client",
        text: "¡Súper! Qué bien, me encantan vuestras historias! Volvemos la prósima semana.",
        time: "12:00",
        channel: "instagram",
        externalId: "igmid.1451293812:d31a9b",
      }
    ],
  }
];

/**
 * List Instagram Business Conversations
 */
export async function listConversations(
  config?: InstagramConfig,
  filters?: { resolved?: boolean; search?: string }
): Promise<ChatThread[]> {
  console.log("[metaInstagramService] Listing Instagram conversations with configuration:", config);
  
  let threads = [...instagramMockThreads];
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
 * List messages inside an Instagram thread
 */
export async function listMessages(
  config?: InstagramConfig,
  conversationId?: string
): Promise<ChatMessage[]> {
  console.log(`[metaInstagramService] Fetching messages for thread ${conversationId} with page token config:`, config);
  const found = instagramMockThreads.find(t => t.id === conversationId);
  return found ? found.messages : [];
}

/**
 * Send Instagram Message
 */
export async function sendMessage(
  config: InstagramConfig | undefined,
  conversationId: string,
  payload: { text: string }
): Promise<ChatMessage> {
  console.log(`[metaInstagramService] Dispatching Instagram DM to thread: ${conversationId}`);
  console.log("[metaInstagramService] Verification options:", config);

  // TODO: here we will call the Instagram Messaging API through the Graph API
  // Method: POST
  // URL: https://graph.facebook.com/v21.0/me/messages?access_token=${config?.pageAccessToken}
  // Body: {
  //   recipient: { id: "INSTAGRAM_SENDER_ASID" },
  //   messaging_type: "RESPONSE",
  //   message: { text: payload.text }
  // }

  const newMsg: ChatMessage = {
    id: `igm_sent_${Date.now()}`,
    sender: "me",
    text: payload.text,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    channel: "instagram",
    externalId: `igmid.sent_${Date.now()}`
  };

  const thread = instagramMockThreads.find(t => t.id === conversationId);
  if (thread) {
    thread.messages.push(newMsg);
    thread.lastMessageText = payload.text;
    thread.lastMessageTime = "Ahora mismo";
  }

  return newMsg;
}

/**
 * Parse Instagram raw Webhook payload (using the Instagram Graph API Webhook messaging model, i.e., page object).
 */
export function parseWebhookEvent(rawPayload: any): {
  threads: Partial<ChatThread>[];
  messages: ChatMessage[];
} {
  console.log("[metaInstagramService] Parsing Instagram Business webhooks event stream:", rawPayload);
  
  const parsedThreads: Partial<ChatThread>[] = [];
  const parsedMessages: ChatMessage[] = [];

  try {
    if (rawPayload && rawPayload.object === "instagram") {
      const entries = rawPayload.entry || [];
      for (const ent of entries) {
        const messagings = ent.messaging || [];
        for (const msgEvent of messagings) {
          if (msgEvent.message) {
            const senderId = msgEvent.sender?.id;
            const msgId = msgEvent.message.mid;
            const text = msgEvent.message.text || "";

            const chatMsg: ChatMessage = {
              id: `igm_webhook_${msgId}`,
              sender: "client",
              text,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              channel: "instagram",
              externalId: msgId,
              clientId: senderId
            };

            parsedMessages.push(chatMsg);

            const pThread: Partial<ChatThread> = {
              id: `ig_thread_${senderId}`,
              dogName: "Mascota",
              ownerName: `Usuario Instagram (@${senderId?.slice(0, 5)})`,
              channel: "instagram",
              avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=100",
              lastMessageText: text,
              lastMessageTime: chatMsg.time,
              unread: true,
              resolved: false,
              externalId: senderId,
              clientId: senderId,
              platformConversationId: `conv_ig_${senderId}`
            };

            parsedThreads.push(pThread);
          }
        }
      }
    }
  } catch (err) {
    console.error("[metaInstagramService] Error parsing Instagram Webhook payload:", err);
  }

  return {
    threads: parsedThreads,
    messages: parsedMessages
  };
}
