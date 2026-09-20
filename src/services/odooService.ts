import { Owner, Pet, Appointment, VisitHistory } from "../types";

const BASE = import.meta.env.VITE_N8N_BASE_URL || "https://n8n-n8n-test.hmrhwx.easypanel.host/webhook";
const APP_SECRET = import.meta.env.VITE_APP_SECRET || "HW9EASIns89jsd63nkjasA67";

function headers() {
  return {
    "Content-Type": "application/json",
    "X-App-Secret": APP_SECRET,
  };
}

function unwrap(item: any): any {
  if (!item || typeof item !== "object") return item;
  if (item.json && typeof item.json === "object") return item.json;
  return item;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: "GET", headers: headers() });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  const text = await res.text();
  if (!text || !text.trim()) return [] as T;
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) return data.map(unwrap) as T;
    if (data && Array.isArray(data.data)) return data.data.map(unwrap) as T;
    if (data && typeof data === "object" && data.id) return [unwrap(data)] as T;
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
  const text = await res.text();
  if (!text || !text.trim()) return {} as T;
  try { return JSON.parse(text) as T; } catch { return {} as T; }
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
  function?: string | false;
  comment?: string | false;
  pets?: RawPartner[];
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

export async function deleteContact(id: number | string): Promise<any> {
  return post<any>("/delete-contact", { id: String(id) });
}

export async function updateContact(id: number | string, data: {
  name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  street?: string;
  city?: string;
  zip?: string;
}): Promise<any> {
  return post<any>("/update-contact", { id: String(id), ...data });
}

export async function createPet(data: {
  name: string;
  parent_id: number;
  breed: string;
  size?: string;
  behavior?: string;
  birthDate?: string;
}): Promise<any> {
  return post<any>("/create-pet", {
    name: data.name,
    parent_id: data.parent_id,
    breed: data.breed,
    comment: JSON.stringify({
      size: data.size || "",
      behavior: data.behavior || "",
      birthDate: data.birthDate || "",
    }),
  });
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
  const rawPets: RawPartner[] = raw.pets || [];
  const pets: Pet[] = rawPets.map((rp): Pet => {
    let extra: any = {};
    try { if (rp.comment) extra = JSON.parse(rp.comment as string); } catch { extra = {}; }
    return {
      id: String(rp.id),
      name: rp.name,
      breed: (rp.function as string) || "",
      size: extra.size || "Mediano",
      behavior: extra.behavior || "",
      birthDate: extra.birthDate || "",
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(rp.name)}&background=446742&color=fff&size=128`,
      avgDuration: "",
      status: "ACTIVO",
      lastVisitDate: "",
      lastVisitService: "",
      history: [],
    };
  });

  return {
    id: String(raw.id),
    name: raw.name,
    firstName: raw.name?.split(" ")[0] || "",
    lastName: raw.name?.split(" ").slice(1).join(" ") || "",
    contact: raw.email || "",
    phone: raw.phone || "",
    phone2: raw.mobile || undefined,
    city: raw.city || undefined,
    zipCode: raw.zip || undefined,
    since: "",
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(raw.name)}&background=755848&color=fff&size=128`,
    pets,
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