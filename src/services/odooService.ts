import { Owner, Pet, Appointment, VisitHistory, OdooService, ServicioPayload, Disponibilidad, Trabajador, Configuracion, Bloqueo, HorarioBloque } from "../types";

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

export function imageFieldToUrl(b64?: string | false): string {
  if (!b64 || typeof b64 !== "string" || !b64.length) return "";
  if (b64.startsWith("data:")) return b64;
  const prefix = b64.startsWith("/9j/") ? "data:image/jpeg;base64," : "data:image/png;base64,";
  return prefix + b64;
}

export function dataUrlToBase64(url?: string): string {
  if (!url || typeof url !== "string" || !url.startsWith("data:")) return "";
  const comma = url.indexOf(",");
  return comma > -1 ? url.slice(comma + 1) : "";
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
  image_1920?: string | false;
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
  image?: string;
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
  image?: string;
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
  notes?: string;
  image?: string;
}): Promise<any> {
  return post<any>("/create-pet", {
    name: data.name,
    parent_id: data.parent_id,
    breed: data.breed,
    comment: JSON.stringify({
      size: data.size || "",
      behavior: data.behavior || "",
      birthDate: data.birthDate || "",
      notes: data.notes || "",
    }),
    image: data.image || "",
  });
}

export async function updatePet(id: number | string, data: {
  name: string;
  breed: string;
  size?: string;
  behavior?: string;
  birthDate?: string;
  notes?: string;
  image?: string;
}): Promise<any> {
  return post<any>("/update-pet", {
    id: String(id),
    name: data.name,
    breed: data.breed,
    comment: JSON.stringify({
      size: data.size || "",
      behavior: data.behavior || "",
      birthDate: data.birthDate || "",
      notes: data.notes || "",
    }),
    image: data.image || "",
  });
}

export async function deletePet(id: number | string): Promise<any> {
  return post<any>("/delete-pet", { id: String(id) });
}

// ========== TRABAJADORES ==========

export async function getTrabajadores(): Promise<Trabajador[]> {
  const list = await get<any[]>("/get-trabajadores");
  return list.map((w) => ({
    id: String(w.id),
    nombre: w.nombre || "",
    horarioLaboral: w.horarioLaboral,
    activo: w.activo !== false,
  }));
}

export async function updateTrabajador(id: number | string, data: {
  name?: string;
  horario_laboral?: string;
  active?: boolean;
}): Promise<any> {
  return post<any>("/update-trabajador", {
    id: String(id),
    name: data.name,
    horario_laboral: data.horario_laboral,
    active: data.active,
  });
}

// ========== CONFIGURACION ==========

export async function getConfiguracion(): Promise<Configuracion | null> {
  const list = await get<any[]>("/get-configuracion");
  if (!list || !list.length) return null;
  return { id: String(list[0].id), horarioGlobal: list[0].horarioGlobal || "" };
}

export async function updateConfiguracion(id: number | string, horarioGlobal: string): Promise<any> {
  return post<any>("/update-configuracion", { id: String(id), horario_global: horarioGlobal });
}

// ========== BLOQUEOS ==========

export async function getBloqueos(): Promise<Bloqueo[]> {
  const list = await get<any[]>("/get-bloqueos");
  return list.map((b) => ({
    id: String(b.id),
    name: b.name || "",
    fechaInicio: b.fechaInicio || "",
    fechaFin: b.fechaFin || "",
    horaInicio: b.horaInicio || "",
    horaFin: b.horaFin || "",
    trabajadorId: b.trabajadorId ? String(b.trabajadorId) : undefined,
    trabajadorName: b.trabajadorName || undefined,
  }));
}

export async function createBloqueo(data: {
  name: string;
  fecha_inicio: string;
  fecha_fin: string;
  hora_inicio: string;
  hora_fin: string;
  trabajador_id?: number | false;
}): Promise<any> {
  return post<any>("/create-bloqueo", data);
}

export async function updateBloqueo(id: number | string, data: {
  name: string;
  fecha_inicio: string;
  fecha_fin: string;
  hora_inicio: string;
  hora_fin: string;
  trabajador_id?: number | false;
}): Promise<any> {
  return post<any>("/update-bloqueo", { id: String(id), ...data });
}

export async function deleteBloqueo(id: number | string): Promise<any> {
  return post<any>("/delete-bloqueo", { id: String(id) });
}

// ========== HORARIO HELPERS ==========

export function parseHorario(text?: string): Record<string, HorarioBloque[]> {
  if (!text) return {};
  try {
    const parsed = JSON.parse(String(text).replace(/<[^>]*>/g, ""));
    const out: Record<string, HorarioBloque[]> = {};
    if (!parsed || typeof parsed !== "object") return out;
    for (const [k, v] of Object.entries(parsed)) {
      if (Array.isArray(v)) {
        const isFlat = typeof v[0] === "string";
        const blocks: HorarioBloque[] = isFlat ? [[v[0] as string, v[1] as string]] : (v as HorarioBloque[]);
        out[k] = blocks.filter((b) => Array.isArray(b) && b.length >= 2);
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function serializeHorario(h: Record<string, HorarioBloque[]>): string {
  return JSON.stringify(h);
}

// ========== SERVICES ==========

export async function getServices(): Promise<OdooService[]> {
  return get<OdooService[]>("/get-services");
}

export async function createServicio(data: ServicioPayload): Promise<any> {
  return post<any>("/create-servicio", data);
}

export async function updateServicio(id: number | string, data: ServicioPayload): Promise<any> {
  return post<any>("/update-servicio", { id: String(id), ...data });
}

export async function getDisponibilidad(data: {
  fecha: string;
  servicioId: number | string;
  tamano: string;
  ajustesMin?: number;
  trabajadorId?: number | string | null;
}): Promise<Disponibilidad> {
  return post<Disponibilidad>("/get-disponibilidad", data);
}

// ========== APPOINTMENTS ==========

export interface OdooAppointment {
  id: number;
  title: string;
  start: string;
  end: string;
  duration: number;
  partnerName: string;
  partnerId?: number | false;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  dogName?: string;
  mascotaId?: number | false;
  serviceName?: string;
  servicioId?: number | false;
  trabajadorId?: number | false;
  trabajadorName?: string;
  estado?: string;
  duracionTotalMin?: number;
  description: string;
  status?: string;
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
  lpc_servicio_id?: number;
  lpc_trabajador_id?: number;
  lpc_mascota_id?: number;
  lpc_estado?: string;
  lpc_duracion_total_min?: number;
  description?: string;
}): Promise<any> {
  const body: Record<string, any> = {
    name: data.name,
    start: data.start,
    stop: data.stop,
    partner_id: data.partner_id ?? false,
    lpc_servicio_id: data.lpc_servicio_id ?? false,
    lpc_trabajador_id: data.lpc_trabajador_id ?? false,
    lpc_mascota_id: data.lpc_mascota_id ?? false,
    lpc_estado: data.lpc_estado ?? "pendiente",
  };
  if (data.duration != null) body.duration = data.duration;
  if (data.lpc_duracion_total_min != null) body.lpc_duracion_total_min = data.lpc_duracion_total_min;
  if (data.description != null) body.description = data.description;
  return post<any>("/create-appointment", body);
}

export async function updateAppointment(id: number | string, data: {
  name: string;
  start: string;
  stop: string;
  duration?: number;
  partner_id?: number | false;
  lpc_servicio_id?: number | false;
  lpc_trabajador_id?: number | false;
  lpc_mascota_id?: number | false;
  lpc_estado?: string;
  lpc_duracion_total_min?: number;
}): Promise<any> {
  const body: Record<string, any> = {
    id: String(id),
    name: data.name,
    start: data.start,
    stop: data.stop,
    partner_id: data.partner_id ?? false,
    lpc_servicio_id: data.lpc_servicio_id ?? false,
    lpc_trabajador_id: data.lpc_trabajador_id ?? false,
    lpc_mascota_id: data.lpc_mascota_id ?? false,
    lpc_estado: data.lpc_estado ?? "pendiente",
  };
  if (data.duration != null) body.duration = data.duration;
  if (data.lpc_duracion_total_min != null) body.lpc_duracion_total_min = data.lpc_duracion_total_min;
  return post<any>("/update-appointment", body);
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
    try { if (rp.comment) extra = JSON.parse(String(rp.comment).replace(/<[^>]*>/g, "")); } catch { extra = {}; }
    return {
      id: String(rp.id),
      name: rp.name,
      breed: (rp.function as string) || "",
      size: extra.size || "Mediano",
      behavior: extra.behavior || "",
      birthDate: extra.birthDate || "",
      notes: extra.notes || "",
      avatarUrl: imageFieldToUrl(rp.image_1920) || `https://ui-avatars.com/api/?name=${encodeURIComponent(rp.name)}&background=446742&color=fff&size=128`,
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
    avatar: imageFieldToUrl(raw.image_1920) || `https://ui-avatars.com/api/?name=${encodeURIComponent(raw.name)}&background=755848&color=fff&size=128`,
    pets,
  };
}

const ESTADO_KEY_TO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  en_camino: "En camino",
  en_proceso: "En Proceso",
  finalizada: "Finalizada",
  anulada: "Anulada",
};

const ESTADO_LABEL_TO_KEY: Record<string, string> = {
  Pendiente: "pendiente",
  Confirmada: "confirmada",
  Confirmado: "confirmada",
  "En camino": "en_camino",
  "En Camino": "en_camino",
  "En Proceso": "en_proceso",
  Finalizada: "finalizada",
  Finalizado: "finalizada",
  Anulada: "anulada",
  Anulado: "anulada",
};

export function estadoLabelToKey(label?: string): string {
  return label ? (ESTADO_LABEL_TO_KEY[label] || "pendiente") : "pendiente";
}

export function appointmentToAppointment(raw: OdooAppointment): Appointment {
  const estado = raw.estado || raw.status || "";
  const duracionTotalMin = raw.duracionTotalMin
    ? raw.duracionTotalMin
    : raw.duration && raw.duration > 0 && raw.duration <= 24
      ? Math.round(raw.duration * 60)
      : undefined;
  return {
    id: String(raw.id),
    time: raw.start?.slice(11, 16) || "00:00",
    period: parseInt(raw.start?.slice(11, 13) || "0") < 12 ? "AM" as const : "PM" as const,
    dogName: raw.dogName || raw.title || "",
    breed: "",
    size: "Mediano" as any,
    ownerName: raw.ownerName || raw.partnerName || "",
    service: raw.serviceName || raw.title || "",
    status: ESTADO_KEY_TO_LABEL[estado] || estado || "Pendiente",
    rawTime: raw.start?.slice(11, 16) || "00:00",
    date: raw.start?.slice(0, 10) || "",
    ownerPhone: raw.ownerPhone || "",
    ownerEmail: raw.ownerEmail || "",
    ownerId: raw.partnerId ? String(raw.partnerId) : undefined,
    petId: raw.mascotaId ? String(raw.mascotaId) : undefined,
    serviceId: raw.servicioId ? String(raw.servicioId) : undefined,
    trabajadorId: raw.trabajadorId ? String(raw.trabajadorId) : undefined,
    trabajadorName: raw.trabajadorName || undefined,
    duracionTotalMin,
  };
}