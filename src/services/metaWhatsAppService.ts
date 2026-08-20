import { ChatThread, ChatMessage, MetaChannelConfig } from "../types";

export interface WhatsAppConfig {
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
}

// Rich Mock database for sandbox WhatsApp threads
const whatsappMockThreads: ChatThread[] = [
  {
    id: "wa_1",
    dogName: "Rocky",
    ownerName: "Sofía Larrea",
    channel: "whatsapp",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAWQ0TP2GwJweHEQOk-oElvihstkjIhq8Whku_Gf23AYuRj5bFJCACUtHC2t0SXuNbShOEx8hpydKwsXl9HmAQt5S2kBHQivyAlKav2VsNDSui9GuCCrSjSot2PY7LGn5aO7C_BRy2kbLjKOmTrNeR3WPBihi99pQFiMjGDNYPXmwkmeXOL2ERvtN8-SSdj19oyqXg167sA84R4PAy6gH14DOIAnSe0U2vVOyVzOYBQvehjScIX2MyXXv7v0vf3arf-jjQXwEe6Beo",
    lastMessageText: "¿Podemos cambiar la cita de mañana para las 17h?",
    lastMessageTime: "14:30",
    unread: true,
    resolved: false,
    externalId: "34600112233", // WhatsApp Phone number
    clientId: "o3",
    platformConversationId: "conv_wa_rocky_sofia",
    messages: [
      {
        id: "wam_1",
        sender: "client",
        text: "Hola! Buenas tardes, tengo cita mañana por la mañana para Rocky.",
        time: "14:28",
        channel: "whatsapp",
        externalId: "wamid.HBgLMzQ2MDAxMTIyMzMVAgIGFhITNDA3MEEzNDAwMTIyMzM=",
      },
      {
        id: "wam_2",
        sender: "client",
        text: "¿Podemos cambiar la cita de mañana para las 17h?",
        time: "14:30",
        channel: "whatsapp",
        externalId: "wamid.HBgLMzQ2MDAxMTIyMzMVAgIGFhITNDA3MEEzNDAwMTIyMzN22",
      }
    ],
  },
  {
    id: "wa_2",
    dogName: "Nico",
    ownerName: "Elena Sanz",
    channel: "whatsapp",
    avatarUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=100",
    lastMessageText: "¡Qué bien! Ya salimos para allá a recogerlo.",
    lastMessageTime: "10:15",
    unread: false,
    resolved: true,
    externalId: "3461234567 España",
    clientId: "o1",
    platformConversationId: "conv_wa_nico_elena",
    messages: [
      {
        id: "wam_3",
        sender: "me",
        text: "Hola Elena, te confirmo que Nico ya está listo de su sesión de baño hidratante y corte de uñas.",
        time: "10:00",
        channel: "whatsapp",
      },
      {
        id: "wam_4",
        sender: "client",
        text: "¡Qué bien! Ya salimos para allá a recogerlo. Gracias.",
        time: "10:15",
        channel: "whatsapp",
        externalId: "wamid.HBgLMzQ2MTIzNDU2NzhVAgIGFhITNDA3MEEzNDAwMTIyMzN2",
      }
    ]
  }
];

/**
 * List WhatsApp Conversations/Threads
 */
export async function listConversations(
  config?: WhatsAppConfig,
  filters?: { resolved?: boolean; search?: string }
): Promise<ChatThread[]> {
  console.log("[metaWhatsAppService] Listing conversations with config:", config);
  
  // Return mock list filtered out
  let threads = [...whatsappMockThreads];
  if (filters?.resolved !== undefined) {
    threads = threads.filter(t => t.resolved === filters.resolved);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    threads = threads.filter(t => 
      t.dogName.toLowerCase().includes(q) || 
      t.ownerName.toLowerCase().includes(q) || 
      t.lastMessageText.toLowerCase().includes(q)
    );
  }
  return threads;
}

/**
 * List messages inside a specific WhatsApp thread
 */
export async function listMessages(
  config?: WhatsAppConfig,
  conversationId?: string
): Promise<ChatMessage[]> {
  console.log(`[metaWhatsAppService] Fetching messages for conversation: ${conversationId} under config:`, config);
  const found = whatsappMockThreads.find(t => t.id === conversationId);
  return found ? found.messages : [];
}

/**
 * Send WhatsApp text/payload message
 */
export async function sendMessage(
  config: WhatsAppConfig | undefined,
  conversationId: string,
  payload: { text: string; isAudio?: boolean; audioDuration?: string }
): Promise<ChatMessage> {
  console.log(`[metaWhatsAppService] Sending WhatsApp message to conversation ${conversationId}`);
  console.log("[metaWhatsAppService] Current credentials config:", config);
  
  // TODO: here we will call the official WhatsApp Cloud API endpoint /v21.0/{phone_number_id}/messages
  // Method: POST
  // URL: https://graph.facebook.com/v21.0/${config?.phoneNumberId}/messages
  // Headers: { "Authorization": `Bearer ${config?.accessToken}`, "Content-Type": "application/json" }
  // Body: {
  //   messaging_product: "whatsapp",
  //   recipient_type: "individual",
  //   to: "RECIPIENT_PHONE_NUMBER",
  //   type: "text",
  //   text: { preview_url: false, body: payload.text }
  // }

  const newMsg: ChatMessage = {
    id: `wam_sent_${Date.now()}`,
    sender: "me",
    text: payload.text,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isAudio: payload.isAudio,
    audioDuration: payload.audioDuration,
    channel: "whatsapp",
    externalId: `wamid.sent_${Date.now()}`
  };

  // Update mock in-memory
  const thread = whatsappMockThreads.find(t => t.id === conversationId);
  if (thread) {
    thread.messages.push(newMsg);
    thread.lastMessageText = payload.isAudio ? "🎵 Nota de voz" : payload.text;
    thread.lastMessageTime = "Ahora mismo";
  }

  return newMsg;
}

/**
 * Parse a raw WhatsApp Cloud API Webhook payload.
 * Structure matches Meta Webhook format (entry -> changes -> value -> messages & contacts).
 */
export function parseWebhookEvent(rawPayload: any): {
  threads: Partial<ChatThread>[];
  messages: ChatMessage[];
} {
  console.log("[metaWhatsAppService] Parsing Webhook event raw payload:", rawPayload);
  
  const parsedThreads: Partial<ChatThread>[] = [];
  const parsedMessages: ChatMessage[] = [];

  try {
    if (rawPayload && rawPayload.object === "whatsapp_business_account") {
      const entries = rawPayload.entry || [];
      for (const ent of entries) {
        const changes = ent.changes || [];
        for (const change of changes) {
          if (change.field === "messages") {
            const val = change.value || {};
            const contacts = val.contacts || [];
            const messages = val.messages || [];

            // Simple search mapping
            const contactName = contacts[0]?.profile?.name || "Cliente WhatsApp";
            
            for (const msg of messages) {
              const msgId = msg.id;
              const senderNum = msg.from;
              let isAudio = false;
              let txtBody = "";
              let audioSecs = "";

              if (msg.type === "text") {
                txtBody = msg.text?.body || "";
              } else if (msg.type === "audio") {
                isAudio = true;
                txtBody = "Nota de voz";
                audioSecs = "0:05"; // default placeholder length
              } else {
                txtBody = `Mensaje de tipo: ${msg.type}`;
              }

              const chatMsg: ChatMessage = {
                id: `wam_webhook_${msgId}`,
                sender: "client",
                text: txtBody,
                time: new Date(parseInt(msg.timestamp) * 1000 || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isAudio,
                audioDuration: isAudio ? audioSecs : undefined,
                channel: "whatsapp",
                externalId: msgId,
                clientId: senderNum
              };

              parsedMessages.push(chatMsg);

              // Build high-affinity partial ChatThread mapping
              const pThread: Partial<ChatThread> = {
                id: `wa_thread_${senderNum}`,
                dogName: "Mascota", // Placeholder, will map in webhook helper
                ownerName: contactName,
                channel: "whatsapp",
                avatarUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=100",
                lastMessageText: isAudio ? "🎵 Nota de voz" : txtBody,
                lastMessageTime: chatMsg.time,
                unread: true,
                resolved: false,
                externalId: senderNum,
                clientId: senderNum,
                platformConversationId: `conv_wa_${senderNum}`
              };

              parsedThreads.push(pThread);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("[metaWhatsAppService] Error parsing WhatsApp Webhook payload:", err);
  }

  return {
    threads: parsedThreads,
    messages: parsedMessages
  };
}
