import { Owner, Pet, Appointment, VisitHistory } from "../types";

const BASE = import.meta.env.VITE_N8N_BASE_URL || "https://n8n-n8n-test.hmrhwx.easypanel.host/webhook";
const APP_SECRET = import.meta.env.VITE_APP_SECRET || "HW9EASIns89jsd63nkjasA67";

function headers() {
  return {
    "Content-Type": "application/json",
    "X-App-Secret": APP_SECRET,
  };
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: "GET", headers: headers() });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  const text = await res.text();
  if (!text || !text.trim()) return [] as T;
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) return data as T;
    if (data && Array.isArray(data.data)) return data.data as T;
    if (data && typeof data === "object" && data.id) return [data] as T;
    return data as T;
  } catch {
    return [] as T;
  }
}

async function post<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

// ========== CONTACTS ==========

export interface RawPartner {
  id: number;
  name: string;
  email?: string | false;
  phone?: string | false;
  mobile?: string | false;
  parent_id?: number | false | [number, string];
  is_company?: boolean;
  street?: string | false;
  city?: string | false;
  zip?: string | false;
}

export async function getContacts(): Promise<RawPartner[]> {
  return get<RawPartner[]>("/get-contacts");
}

export async function createContact(data: {
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  street?: string;
  city?: string;
  zip?: string;
}): Promise<any> {
  return post<any>("/create-contact", data);
}

// ========== APPOINTMENTS ==========

export interface OdooAppointment {
  id: number;
  title: string;
  start: string;
  end: string;
  duration: number;
  partnerName: string;
  description: string;
  status: string;
}

export async function getAppointments(): Promise<OdooAppointment[]> {
  return get<OdooAppointment[]>("/get-appointments");
}

export async function createAppointment(data: {
  name: string;
  start: string;
  stop: string;
  duration?: number;
  partner_id?: number;
  description?: string;
}): Promise<any> {
  return post<any>("/create-appointment", data);
}

// ========== PAYMENTS ==========

export async function createPayment(data: {
  partner_id: number;
  date: string;
  total: number;
  move_type?: string;
  lines?: any[];
}): Promise<any> {
  return post<any>("/create-payment", data);
}

// ========== HEALTH ==========

export async function healthCheck(): Promise<any> {
  return get<any>("/health-check");
}

// ========== TRANSFORMERS ==========

export function partnerToOwner(raw: RawPartner): Owner {
  return {
    id: String(raw.id),
    name: raw.name,
    firstName: raw.name?.split(" ")[0] || "",
    lastName: raw.name?.split(" ").slice(1).join(" ") || "",
    contact: raw.email || "",
    phone: raw.phone || raw.mobile || "",
    city: raw.city || undefined,
    zipCode: raw.zip || undefined,
    since: "",
    avatar: "",
    pets: [],
  };
}

export function appointmentToAppointment(raw: OdooAppointment): Appointment {
  return {
    id: String(raw.id),
    time: raw.start?.slice(11, 16) || "00:00",
    period: parseInt(raw.start?.slice(11, 13) || "0") < 12 ? "AM" as const : "PM" as const,
    dogName: raw.title || "",
    breed: "",
    size: "Mediano" as any,
    ownerName: raw.partnerName || "",
    service: raw.title || "",
    status: raw.status === "open" ? "Confirmada" : raw.status,
    rawTime: raw.start?.slice(11, 16) || "00:00",
    date: raw.start?.slice(0, 10) || "",
  };
}