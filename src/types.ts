export interface Appointment {
  id: string;
  time: string;
  period: "AM" | "PM";
  dogName: string;
  breed: string;
  size: "Toy" | "Pequeño" | "Mediano" | "Grande" | "Gigante" | "Pequeño Diamante";
  ownerName: string;
  service: string;
  status: string;
  rawTime: string; // e.g. "09:30"
  date?: string; // e.g. "2026-06-20"
  ownerFirstName?: string;
  ownerLastName?: string;
  ownerPhone?: string;
  ownerPhone2?: string;
  ownerPhone2Label?: string;
  ownerEmail?: string;
  ownerCity?: string;
  ownerZipCode?: string;
  ownerInstagram?: string;
  ownerFacebook?: string;
}

export interface VisitHistory {
  id: string;
  date: string;
  serviceTitle: string;
  duration: string;
  status: string;
  services: string[];
  notes: string;
  employeeName?: string;
  pricePaid?: number;
}

export interface MetaChannelConfig {
  whatsapp?: { phoneNumberId: string; wabaId: string; accessToken: string };
  facebook?: { pageId: string; pageAccessToken: string };
  instagram?: { igBusinessId: string; pageAccessToken: string };
}

export interface ClientProfile {
  id: string;
  name: string;
  breed: string;
  size: string;
  behavior: string;
  birthDate: string;
  avatarUrl: string;
  avgDuration: string;
  status: "ACTIVO" | "INACTIVO";
  lastVisitDate: string;
  lastVisitService: string;
  history: VisitHistory[];
  channels?: MetaChannelConfig;
}

export interface ChatMessage {
  id: string;
  sender: "client" | "me";
  text: string;
  time: string;
  isAudio?: boolean;
  audioDuration?: string;
  channel?: "WhatsApp" | "Instagram" | "Facebook" | "Web" | "Gmail" | "whatsapp" | "instagram" | "facebook";
  externalId?: string;
  clientId?: string;
}

export interface ChatThread {
  id: string;
  dogName: string;
  ownerName: string;
  channel: "WhatsApp" | "Instagram" | "Facebook" | "Web" | "Gmail" | "whatsapp" | "instagram" | "facebook";
  avatarUrl: string;
  lastMessageText: string;
  lastMessageTime: string;
  unread: boolean;
  messages: ChatMessage[];
  resolved: boolean;
  externalId?: string;
  clientId?: string;
  platformConversationId?: string;
}

export interface ActiveBreak {
  id: string;
  title: string;
  timeRange: string;
  days: string;
  icon: string;
}

export interface AppointmentDraft {
  size: "Toy" | "Mini" | "Midi" | "Maxi" | "Epic";
  sizeLabel: string;
  weight: string;
  duration: string;
  price: string;
}

export type UserRole = "administrador" | "propietario" | "empleado";

export interface UserSession {
  email: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export interface Pet {
  id: string;
  name: string;
  breed: string;
  size: "Toy" | "Pequeño" | "Mediano" | "Grande" | "Gigante" | "Pequeño Diamante";
  behavior: string;
  birthDate: string;
  avatarUrl: string;
  avgDuration: string;
  status: "ACTIVO" | "INACTIVO";
  lastVisitDate: string;
  lastVisitService: string;
  history: VisitHistory[];
}

export interface Owner {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  contact: string;
  phone: string;
  phone2?: string;
  phone2Label?: string;
  city?: string;
  zipCode?: string;
  instagram?: string;
  facebook?: string;
  since: string;
  avatar: string;
  pets: Pet[];
  channels?: MetaChannelConfig;
}

export interface ServicePricing {
  priceDisp: string;
  priceNum: number;
  durationDisp: string;
  durationMin: number;
  isHourly?: boolean;
}

export interface Service {
  id: string;
  title: string;
  desc: string;
  pricing: Record<string, ServicePricing>;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description?: string;
}

