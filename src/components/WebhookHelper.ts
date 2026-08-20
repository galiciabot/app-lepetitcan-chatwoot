import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import * as metaWhatsAppService from "../services/metaWhatsAppService";
import * as metaMessengerService from "../services/metaMessengerService";
import * as metaInstagramService from "../services/metaInstagramService";

/**
 * PRODUCTION BACKEND HTTP WEBHOKE ENDPOINTS REFERENCE (TODO):
 * 
 * In a real backend (Node/Express, Python/FastAPI), we would expose these HTTP endpoints
 * to handle live webhook event triggers from Meta:
 * 
 * 1. GET /webhooks/meta/whatsapp (Webhook Verification)
 *    POST /webhooks/meta/whatsapp (Handles incoming messages, deliveries, and audio notes)
 * 
 * 2. GET /webhooks/meta/messenger (Webhook Verification)
 *    POST /webhooks/meta/messenger (Handles page messaging events from Facebook Messenger)
 * 
 * 3. GET /webhooks/meta/instagram (Webhook Verification)
 *    POST /webhooks/meta/instagram (Handles direct messaging from Instagram Business)
 * 
 * Each POST endpoint must verify the X-Hub-Signature-256 header using the Meta app's Client Secret
 * before calling the corresponding parseWebhookEvent workflow.
 */

/**
 * Handle incoming raw WhatsApp Webhook payloads
 */
export function handleWhatsAppWebhook(rawPayload: any) {
  console.log("[WebhookHelper] Received WhatsApp raw webhook event");
  const parsed = metaWhatsAppService.parseWebhookEvent(rawPayload);
  return parsed;
}

/**
 * Handle incoming raw Messenger Webhook payloads
 */
export function handleMessengerWebhook(rawPayload: any) {
  console.log("[WebhookHelper] Received Messenger raw webhook event");
  const parsed = metaMessengerService.parseWebhookEvent(rawPayload);
  return parsed;
}

/**
 * Handle incoming raw Instagram Webhook payloads
 */
export function handleInstagramWebhook(rawPayload: any) {
  console.log("[WebhookHelper] Received Instagram raw webhook event");
  const parsed = metaInstagramService.parseWebhookEvent(rawPayload);
  return parsed;
}

/**
 * Simulate an incoming WhatsApp message payload for sandbox testing
 */
export function simulateWhatsAppIncomingMessage(fromNumber: string, contactName: string, text: string): any {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "am_whatsapp_account_id",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "34981123456",
                phone_number_id: "10928372348"
              },
              contacts: [
                {
                  profile: {
                    name: contactName
                  },
                  wa_id: fromNumber
                }
              ],
              messages: [
                {
                  from: fromNumber,
                  id: `wamid.HBgLMzQ2${Date.now()}==`,
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  text: {
                    body: text
                  },
                  type: "text"
                }
              ]
            }
          }
        ]
      }
    ]
  };
}

/**
 * Simulate an incoming Facebook Messenger page payload for sandbox testing
 */
export function simulateMessengerIncomingMessage(senderId: string, text: string): any {
  return {
    object: "page",
    entry: [
      {
        id: "fb_page_id_123",
        time: Date.now(),
        messaging: [
          {
            sender: {
              id: senderId
            },
            recipient: {
              id: "fb_page_id_123"
            },
            timestamp: Date.now(),
            message: {
              mid: `mid.user_sent_${Date.now()}`,
              text: text
            }
          }
        ]
      }
    ]
  };
}

/**
 * Simulate an incoming Instagram business message payload for sandbox testing
 */
export function simulateInstagramIncomingMessage(senderId: string, text: string): any {
  return {
    object: "instagram",
    entry: [
      {
        id: "ig_business_id_123",
        time: Date.now(),
        messaging: [
          {
            sender: {
              id: senderId
            },
            recipient: {
              id: "ig_business_id_123"
            },
            timestamp: Date.now(),
            message: {
              mid: `igmid.user_sent_${Date.now()}`,
              text: text
            }
          }
        ]
      }
    ]
  };
}

export async function triggerN8NWebhook(eventType: "booking" | "completed" | "note_added", data: any) {
  try {
    const docRef = doc(db, "configs", "integrations");
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;
    
    const config = snap.data();
    if (!config.n8nWebhookUrl) return;
    
    // Check if trigger is enabled
    if (eventType === "booking" && !config.n8nOnBooking) return;
    if (eventType === "completed" && !config.n8nOnCompleted) return;
    if (eventType === "note_added" && !config.n8nOnNoteAdded) return;
    
    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      source: "Le Petit Can Client App",
      data
    };
    
    console.log(`[Webhook Trigger] Sending ${eventType} event to: ${config.n8nWebhookUrl}`);
    
    // Silent call to avoid blocking user flow
    fetch(config.n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      mode: "cors"
    }).then(res => {
      console.log(`[Webhook Response] Status: ${res.status}`);
    }).catch(err => {
      console.warn(`[Webhook Error] Failed to send webhook:`, err);
    });
  } catch (err) {
    console.error("Failed to execute triggerN8NWebhook helper:", err);
  }
}

export async function triggerHioposTicketSync(ticketData: any) {
  try {
    const docRef = doc(db, "configs", "integrations");
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;
    
    const config = snap.data();
    if (!config.hioposApiUrl || !config.hioposSyncOnCheckout) return;
    
    console.log(`[Hiopos Trigger] Syncing ticket to: ${config.hioposApiUrl}`);
    
    fetch(`${config.hioposApiUrl}/tickets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.hioposToken}`
      },
      body: JSON.stringify({
        establishmentId: config.hioposBranchId,
        currency: "EUR",
        products: ticketData.products,
        totalAmount: ticketData.total,
        clientRef: ticketData.client
      }),
      mode: "cors"
    }).then(res => {
      console.log(`[Hiopos Sync Response] Status: ${res.status}`);
    }).catch(err => {
      console.warn(`[Hiopos Sync Error] Failed to post ticket:`, err);
    });
  } catch (err) {
    console.error("Failed to execute triggerHioposTicketSync:", err);
  }
}
