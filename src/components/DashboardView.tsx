import React from "react";
import { Appointment, ChatThread } from "../types";

interface DashboardViewProps {
  onNavigate: (viewId: string) => void;
  onOpenChat: (chatId: string) => void;
  appointments: Appointment[];
  chatThreads: ChatThread[];
  userName?: string;
  onSelectClientDetail?: (ownerName: string, dogName: string) => void;
  onUpdateAppointmentStatus?: (appointmentId: string, status: string) => void;
}

export function DashboardView({
  onNavigate,
  onOpenChat,
  appointments,
  chatThreads,
  userName,
  onSelectClientDetail,
  onUpdateAppointmentStatus,
}: DashboardViewProps) {
  // We can filter specific appointments/chats for the dashboard display
  const activeChats = chatThreads.filter((c) => !c.resolved).slice(0, 2);

  return (
    <div className="w-full">
      {/* Welcome Card */}
      <section className="relative overflow-hidden rounded-[32px] bg-white p-8 md:p-12 border border-secondary-container/20 shadow-[0_10px_30px_rgba(117,88,72,0.02)] mb-8">
        <div className="relative z-10 max-w-2xl">
          <span className="font-sans text-xs font-bold text-secondary uppercase tracking-widest mb-4 block">
            Bienvenido/a, {userName || "Iliana"}
          </span>
          <h2 className="font-serif text-3xl md:text-5xl text-primary font-bold mb-6 leading-tight">
            Hoy cuidamos de sus peludos con calma y detalle.
          </h2>
          <div className="flex gap-4">
            <button
              onClick={() => onNavigate("new_appointment")}
              className="bg-primary-container text-on-primary-container px-6 py-3 rounded-full font-sans text-sm font-semibold hover:opacity-90 transition-all active:scale-95 flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
              Nueva Cita
            </button>
          </div>
        </div>
        {/* Decorative Organic Shape */}
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-secondary-container/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-48 h-48 bg-primary-container/20 rounded-full blur-2xl"></div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Widget Citas del Día */}
        <section className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl md:text-2xl font-semibold text-on-background">
              Citas del Día
            </h3>
            <button
              onClick={() => onNavigate("calendar")}
              className="text-secondary font-sans text-sm font-semibold hover:underline cursor-pointer"
            >
              Ver calendario
            </button>
          </div>

          <div className="space-y-3">
            {appointments.slice(0, 3).map((appt) => (
              <div
                key={appt.id}
                onClick={() => {
                  if (onSelectClientDetail) {
                    onSelectClientDetail(appt.ownerName, appt.dogName);
                  } else {
                    onNavigate("client_detail");
                  }
                }}
                className="group flex items-center gap-4 bg-white p-4 rounded-2xl border border-outline-variant hover:border-secondary transition-all hover:shadow-md cursor-pointer"
              >
                <div className="w-16 h-16 rounded-xl bg-ivory-base flex flex-col items-center justify-center border border-outline-variant transition-colors group-hover:bg-primary-container/10">
                  <span className="font-sans text-[11px] font-semibold text-on-surface-variant">
                    {appt.rawTime}
                  </span>
                  <span className="font-serif text-lg font-bold text-primary">
                    {appt.period}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-sans text-base font-bold text-on-surface">
                      {appt.dogName}
                    </h4>
                    <div onClick={(e) => e.stopPropagation()}>
                      <select
                        value={appt.status}
                        onChange={(e) => {
                          if (onUpdateAppointmentStatus) {
                            onUpdateAppointmentStatus(appt.id, e.target.value);
                          }
                        }}
                        className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-tighter border-0 cursor-pointer focus:ring-1 focus:ring-primary outline-none ${
                          appt.status.toLowerCase().includes("confirm")
                            ? "bg-secondary-container text-on-secondary-container"
                            : appt.status.toLowerCase().includes("camino")
                            ? "bg-primary-container text-on-primary-container"
                            : appt.status.toLowerCase().includes("anul")
                            ? "bg-red-100 text-red-800"
                            : appt.status.toLowerCase().includes("final")
                            ? "bg-stone-200 text-stone-800"
                            : "bg-surface-variant text-on-surface-variant"
                        }`}
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Confirmada">Confirmada</option>
                        <option value="En camino">En Camino</option>
                        <option value="En Proceso">En Proceso</option>
                        <option value="Finalizada">Finalizada</option>
                        <option value="Anulada">Anulada</option>
                      </select>
                    </div>
                  </div>
                  <p className="font-sans text-xs text-on-surface-variant mt-1 font-medium">
                    Propietario: {appt.ownerName} • {appt.service}
                  </p>
                </div>
                <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">
                  chevron_right
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Mensajería Pendiente */}
        <section className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl md:text-2xl font-semibold text-on-background">
              Mensajería
            </h3>
            <span className="bg-warm-terracotta text-white font-sans text-xs font-semibold px-2.5 py-1 rounded-md shadow-sm">
              2 Nuevos
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {activeChats.map((chat) => (
              <div
                key={chat.id}
                className="bg-white/60 backdrop-blur-md p-6 rounded-[24px] shadow-sm hover:shadow-md transition-shadow border border-secondary-container/10"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-outline-variant bg-surface-container">
                      <img
                        alt={chat.dogName}
                        className="w-full h-full object-cover"
                        src={chat.avatarUrl}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h4 className="font-sans text-base font-bold text-on-surface">
                        {chat.dogName}
                      </h4>
                      <span className="font-sans text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[14px]">
                          {chat.channel === "WhatsApp"
                            ? "phone_iphone"
                            : chat.channel === "Instagram"
                            ? "photo_camera"
                            : "chat"}
                        </span>{" "}
                        {chat.channel}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-outline-variant font-medium">
                    {chat.lastMessageTime}
                  </span>
                </div>
                <p className="font-sans text-sm text-on-surface-variant mb-6 line-clamp-2 italic text-left">
                  "{chat.lastMessageText}"
                </p>
                <button
                  onClick={() => onOpenChat(chat.id)}
                  className="w-full py-3 rounded-full border border-primary text-primary font-sans text-xs font-bold hover:bg-primary hover:text-white transition-colors active:scale-95 text-center cursor-pointer block"
                >
                  Abrir conversación
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
