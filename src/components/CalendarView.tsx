import React, { useState, useEffect } from "react";
import { Appointment } from "../types";
import { googleSignIn, getAccessToken, logoutGoogle, initAuth } from "../firebase";
import { User } from "firebase/auth";

interface CalendarViewProps {
  appointments: Appointment[];
  onNavigate: (viewId: string) => void;
  userRole?: string;
  onSelectClientDetail?: (ownerName: string, dogName: string) => void;
  onUpdateAppointmentStatus?: (appointmentId: string, status: string) => void;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const WEEKDAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const WEEKDAY_NAMES_MINI = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function CalendarView({
  appointments,
  onNavigate,
  userRole,
  onSelectClientDetail,
  onUpdateAppointmentStatus,
}: CalendarViewProps) {
  // Reactive Date state, initialized to June 20, 2026 (matching system base)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date(2026, 5, 20));
  const [viewType, setViewType] = useState<"Dia" | "Semana" | "Mes">("Dia");

  // We derive selected components for backward compatibility
  const selectedDay = selectedDate.getDate();
  const selectedMonth = selectedDate.getMonth();
  const selectedYear = selectedDate.getFullYear();

  // Month grid navigation helper state
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date(2026, 5, 20));

  // Google Calendar Integration State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [synchronizedIds, setSynchronizedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("le_petit_can_synced_gcal_ids");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist synced IDs in local cache
  useEffect(() => {
    localStorage.setItem("le_petit_can_synced_gcal_ids", JSON.stringify(synchronizedIds));
  }, [synchronizedIds]);

  const handleAppointmentClick = (ap: Appointment) => {
    if (onSelectClientDetail) {
      onSelectClientDetail(ap.ownerName, ap.dogName);
    } else {
      onNavigate("client_detail");
    }
  };

  // Auth synchronization listener
  useEffect(() => {
    const unsub = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        fetchGoogleEvents(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsub();
  }, []);

  // Fetch primary calendar events
  const fetchGoogleEvents = async (token: string) => {
    setIsSyncing(true);
    setErrorMessage(null);
    try {
      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=40&orderBy=startTime&singleEvents=true",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setGoogleEvents(data.items || []);
      } else {
        const errRes = await response.json().catch(() => ({}));
        console.error("Failed to fetch Google Calendar events", errRes);
        if (response.status === 401) {
          setGoogleToken(null);
          setGoogleUser(null);
        }
      }
    } catch (err) {
      console.error("Error fetching Google Calendar events:", err);
      setErrorMessage("No se pudieron cargar los eventos de Google Calendar.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectGoogle = async () => {
    setIsSyncing(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
        await fetchGoogleEvents(result.accessToken);
      }
    } catch (err: any) {
      console.error("Failed to connect Google account", err);
      if (err?.code === "auth/popup-closed-by-user" || (err?.message && err.message.includes("popup-closed-by-user")) || String(err).includes("popup-closed-by-user")) {
        setErrorMessage(
          "La ventana emergente de inicio de sesión de Google fue cerrada o bloqueada por el navegador. En la visualización dentro de un iframe de AI Studio, Chrome bloquea estos popups por restricciones de seguridad. Por favor, abre la aplicación en una pestaña nueva completa con el botón de abajo para conectar tu cuenta con éxito."
        );
      } else {
        setErrorMessage("Error al conectar con Google. Por favor, asegúrese de autorizar los permisos de Google Calendar.");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!window.confirm("¿Estás seguro de que deseas desconectar tu cuenta de Google Calendar?")) {
      return;
    }
    setIsSyncing(true);
    try {
      await logoutGoogle();
      setGoogleUser(null);
      setGoogleToken(null);
      setGoogleEvents([]);
    } catch (err) {
      console.error("Disconnect error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Export specific salon appointment to Google Calendar
  const handleSyncAppointment = async (appointment: Appointment) => {
    if (!googleToken) {
      alert("Por favor, conecte con Google Calendar antes de sincronizar.");
      return;
    }

    const confirmed = window.confirm(
      `¿Desea crear un nuevo evento en su Google Calendar para la cita de ${appointment.dogName} (${appointment.service}) a las ${appointment.time}?`
    );
    if (!confirmed) return;

    setIsSyncing(true);
    try {
      const yearContext = selectedDate.getFullYear();
      const monthContext = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
      const dayStr = selectedDate.getDate().toString().padStart(2, "0");

      const hourAndMinutes = appointment.rawTime || appointment.time;
      const startDateTime = `${yearContext}-${monthContext}-${dayStr}T${hourAndMinutes}:00`;

      // Estimate 1 hour duration
      const [h, m] = hourAndMinutes.split(":");
      const endHours = (parseInt(h, 10) + 1).toString().padStart(2, "0");
      const endDateTime = `${yearContext}-${monthContext}-${dayStr}T${endHours}:${m}:00`;

      const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${googleToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: `✂️ Le Petit Can: ${appointment.dogName} (${appointment.breed || "Mascota"})`,
          description: `Cita de Peluquería Boutique\nServicio: ${appointment.service}\nDueño/a: ${appointment.ownerName}\nTamaño: ${appointment.size}\nEstado actual: ${appointment.status}`,
          start: {
            dateTime: startDateTime,
            timeZone: "Europe/Madrid",
          },
          end: {
            dateTime: endDateTime,
            timeZone: "Europe/Madrid",
          },
          colorId: "5",
        }),
      });

      if (response.ok) {
        setSynchronizedIds((prev) => [...prev, appointment.id]);
        alert(`¡Cita de ${appointment.dogName} sincronizada con éxito en Google Calendar!`);
        fetchGoogleEvents(googleToken);
      } else {
        const errJson = await response.json().catch(() => ({}));
        alert(`Hubo un error al sincronizar con Google: ${errJson.error?.message || response.statusText}`);
      }
    } catch (err) {
      console.error("Event creation error:", err);
      alert("Error de red al intentar crear el evento en Google Calendar.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Helper check to filter Google Calendar events for a given active Date
  const getGoogleEventsForDate = (date: Date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const d = date.getDate().toString().padStart(2, "0");
    const targetPrefix = `${y}-${m}-${d}`;
    return googleEvents.filter((ev) => {
      const startStr = ev.start?.dateTime || ev.start?.date;
      return startStr ? startStr.startsWith(targetPrefix) : false;
    });
  };

  // Helper to filter appointments for a given Date
  const getSalonAppointmentsForDate = (targetDate: Date) => {
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1; // 1-indexed
    const targetDay = targetDate.getDate();
    const dateStr = `${targetYear}-${targetMonth.toString().padStart(2, "0")}-${targetDay.toString().padStart(2, "0")}`;

    return appointments.filter((app) => {
      if (app.date) {
        return app.date === dateStr;
      }
      // Demo appointments fall on June 20, 2026 by default
      if (app.id === "a1" || app.id === "a2" || app.id === "a3" || app.id === "a4" || app.id === "a5") {
        if (targetYear === 2026 && targetMonth === 6 && targetDay === 20) {
          return true;
        }
        // Seed other specific days in June 2026 for high-fidelity visualization
        if (targetYear === 2026 && targetMonth === 6) {
          if (targetDay === 18 && (app.id === "a1" || app.id === "a5")) return true;
          if (targetDay === 22 && (app.id === "a2" || app.id === "a4")) return true;
          if (targetDay === 23 && app.id === "a3") return true;
        }
        return false;
      }
      return app.id.startsWith("a_") || app.time === "17:30";
    });
  };

  const activeAppointments = getSalonAppointmentsForDate(selectedDate);
  const filteredGoogleEvents = getGoogleEventsForDate(selectedDate);

  // Helper to get selected week days list (Monday to Sunday)
  const getDaysOfActiveWeek = (baseDate: Date) => {
    const currentDayOfWeek = baseDate.getDay(); // 0 Sunday, 1 Monday...
    const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const monday = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    monday.setDate(baseDate.getDate() + distanceToMonday);

    const daysList = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      daysList.push(nextDay);
    }
    return daysList;
  };

  const activeWeekDays = getDaysOfActiveWeek(selectedDate);

  // Helper to generate the complete calendar grid for a given month/year
  const getMonthGridCells = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();
    // Monday index of 1st day (0: Mon, 1: Tue ... 6: Sun)
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;

    const cells = [];
    // Padding cells before the 1st
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(null);
    }
    // Days cells
    for (let day = 1; day <= totalDays; day++) {
      cells.push(new Date(year, month, day));
    }
    return cells;
  };

  const monthGridCells = getMonthGridCells(currentMonthDate);

  // Date increment/decrement helpers
  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(selectedDate.getDate() - 1);
    setSelectedDate(prev);
    setCurrentMonthDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(selectedDate.getDate() + 1);
    setSelectedDate(next);
    setCurrentMonthDate(next);
  };

  const handlePrevWeek = () => {
    const prev = new Date(selectedDate);
    prev.setDate(selectedDate.getDate() - 7);
    setSelectedDate(prev);
    setCurrentMonthDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(selectedDate);
    next.setDate(selectedDate.getDate() + 7);
    setSelectedDate(next);
    setCurrentMonthDate(next);
  };

  const handlePrevMonth = () => {
    const prev = new Date(currentMonthDate);
    prev.setMonth(currentMonthDate.getMonth() - 1);
    setCurrentMonthDate(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentMonthDate);
    next.setMonth(currentMonthDate.getMonth() + 1);
    setCurrentMonthDate(next);
  };

  const formatMonthName = (date: Date) => {
    return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatSpanishDate = (date: Date) => {
    const day = date.getDate();
    const month = MONTH_NAMES[date.getMonth()];
    const year = date.getFullYear();
    return `${day} de ${month} de ${year}`;
  };

  return (
    <div className="w-full text-left space-y-8 animate-in fade-in duration-300">
      {/* View Selector & Header */}
      <section className="mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <span className="font-sans text-[11px] font-black text-secondary uppercase tracking-widest">
              Panel Administrativo Canino
            </span>
            <h2 className="font-serif text-3xl md:text-5xl text-primary font-bold mt-1">
              Calendario
            </h2>
            <p className="font-sans text-xs text-on-surface-variant mt-1.5 font-medium">
              Agenda inteligente de estética y sincronización en tiempo real con Google Calendar
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {userRole === "empleado" ? (
              <div
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-surface-container-low text-outline font-sans text-xs font-semibold rounded-full border border-outline-variant/20 select-none cursor-not-allowed"
                title="Configuración de descansos restringida a Propietarios"
              >
                <span className="material-symbols-outlined text-sm">lock</span>
                Descansos (Protegido)
              </div>
            ) : (
              <button
                onClick={() => onNavigate("break_config")}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-surface-container-low border border-outline-variant/30 text-primary font-sans text-xs font-bold rounded-full transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-base">coffee</span>
                Configurar Descansos
              </button>
            )}
            
            <div className="flex p-1 bg-surface-container rounded-full max-w-xs border border-outline-variant/20 bg-[#f9f6f0]">
              {(["Dia", "Semana", "Mes"] as const).map((vt) => (
                <button
                  key={vt}
                  onClick={() => setViewType(vt)}
                  className={`flex-1 px-6 py-2 rounded-full font-sans text-xs font-bold transition-all cursor-pointer ${
                    viewType === vt
                      ? "bg-white shadow-sm text-primary"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  {vt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------- VIEW TYPE: DIA -------------------------------- */}
      {viewType === "Dia" && (
        <section className="space-y-6">
          {/* Header Navigation for Day View */}
          <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-outline-variant/15 shadow-xs">
            <button
              onClick={handlePrevDay}
              className="p-2 hover:bg-ivory-base rounded-full border border-outline-variant/15 flex items-center justify-center transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            <div className="text-center">
              <h3 className="font-serif text-lg font-bold text-primary">
                {formatMonthName(selectedDate)}
              </h3>
              <p className="font-sans text-[11px] text-on-surface-variant font-bold mt-0.5">
                {WEEKDAY_NAMES[selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1]}, {selectedDate.getDate()}
              </p>
            </div>
            <button
              onClick={handleNextDay}
              className="p-2 hover:bg-ivory-base rounded-full border border-outline-variant/15 flex items-center justify-center transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>

          {/* Horizontal scroll date carousel centering around baseDate */}
          <div className="flex items-center gap-3 overflow-x-auto pb-3 hide-scrollbar">
            {activeWeekDays.map((d) => {
              const isSelected = selectedDate.getDate() === d.getDate() && selectedDate.getMonth() === d.getMonth();
              const isTodayNum = d.getDate() === 20 && d.getMonth() === 5 && d.getFullYear() === 2026; // June 20, 2026
              const weekdayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
              const apptsCount = getSalonAppointmentsForDate(d).length;

              return (
                <button
                  key={d.getTime()}
                  onClick={() => {
                    setSelectedDate(d);
                    setCurrentMonthDate(d);
                  }}
                  className={`flex flex-col items-center min-w-[76px] py-4 rounded-3xl transition-all cursor-pointer border relative ${
                    isSelected
                      ? "bg-primary text-white border-primary shadow-md scale-102"
                      : "bg-ivory-base border-outline-variant/20 text-on-surface hover:bg-surface-container"
                  }`}
                >
                  <span
                    className={`font-sans text-[10px] font-bold tracking-widest ${
                      isSelected ? "opacity-90 text-white" : "text-on-surface-variant"
                    }`}
                  >
                    {WEEKDAY_NAMES_MINI[weekdayIndex]}
                  </span>
                  <span className="font-serif text-2xl font-bold mt-1 leading-none">
                    {d.getDate()}
                  </span>
                  {isTodayNum && (
                    <span className={`absolute top-1 text-[7px] font-bold tracking-tighter uppercase ${isSelected ? "text-white/70" : "text-secondary"}`}>
                      Hoy
                    </span>
                  )}
                  {apptsCount > 0 && (
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 ${isSelected ? "bg-white" : "bg-primary"}`}></span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* -------------------------------- VIEW TYPE: SEMANA -------------------------------- */}
      {viewType === "Semana" && (
        <section className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-outline-variant/15 shadow-xs">
            <button
              onClick={handlePrevWeek}
              className="p-2 hover:bg-ivory-base rounded-full border border-outline-variant/15 flex items-center justify-center transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            <div className="text-center">
              <h3 className="font-serif text-lg font-bold text-primary">
                Semana de {activeWeekDays[0].getDate()} al {activeWeekDays[6].getDate()} de {MONTH_NAMES[selectedDate.getMonth()]}
              </h3>
              <p className="font-sans text-xs text-on-surface-variant font-medium mt-0.5">
                Visualización Semanal Integrada • {selectedDate.getFullYear()}
              </p>
            </div>
            <button
              onClick={handleNextWeek}
              className="p-2 hover:bg-ivory-base rounded-full border border-outline-variant/15 flex items-center justify-center transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {activeWeekDays.map((d) => {
              const appts = getSalonAppointmentsForDate(d);
              const isSelected = selectedDate.getDate() === d.getDate() && selectedDate.getMonth() === d.getMonth();
              const weekdayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;

              return (
                <div
                  key={d.getTime()}
                  onClick={() => {
                    setSelectedDate(d);
                    setCurrentMonthDate(d);
                  }}
                  className={`bg-white p-4 rounded-2xl border transition-all hover:shadow-xs cursor-pointer text-left space-y-3 ${
                    isSelected
                      ? "border-primary/80 ring-1 ring-primary/40 bg-primary/[0.01]"
                      : "border-outline-variant/15"
                  }`}
                >
                  <div className={`border-b pb-2 flex justify-between items-center ${isSelected ? "border-primary/20" : "border-outline-variant/10"}`}>
                    <div>
                      <h4 className="font-sans text-xs font-extrabold text-on-surface">
                        {WEEKDAY_NAMES_MINI[weekdayIndex]}
                      </h4>
                      <p className="font-serif text-lg font-bold text-primary">
                        {d.getDate()}
                      </p>
                    </div>
                    {appts.length > 0 && (
                      <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                        {appts.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 min-h-[90px] max-h-[160px] overflow-y-auto pr-1">
                    {appts.length === 0 ? (
                      <p className="text-[10px] text-outline italic pt-4">No hay citas</p>
                    ) : (
                      appts.map((ap) => (
                        <div
                          key={ap.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAppointmentClick(ap);
                          }}
                          className="p-2 bg-ivory-base/50 border border-outline-variant/10 hover:border-primary/40 rounded-lg text-[10px] leading-snug space-y-0.5 cursor-pointer transition-colors"
                        >
                          <p className="font-mono font-bold text-primary">{ap.time}</p>
                          <p className="font-sans font-bold text-on-surface truncate">{ap.dogName}</p>
                          <p className="text-[9px] text-[#755848] truncate">{ap.service}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDate(d);
                      onNavigate("new_appointment");
                    }}
                    className="w-full py-1 border border-dashed border-outline-variant/40 hover:border-primary/40 rounded-lg text-outline hover:text-primary text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[12px]">add</span>
                    <span>Reservar</span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* -------------------------------- VIEW TYPE: MES -------------------------------- */}
      {viewType === "Mes" && (
        <section className="space-y-6">
          {/* Header Navigation for Month View */}
          <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-outline-variant/15 shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-ivory-base rounded-full border border-outline-variant/15 flex items-center justify-center transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            <div className="text-center">
              <h3 className="font-serif text-lg font-bold text-primary uppercase tracking-wider">
                {formatMonthName(currentMonthDate)}
              </h3>
              <p className="font-sans text-xs text-on-surface-variant font-medium mt-0.5">
                Calendario General Mensual • Narón Salón
              </p>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-ivory-base rounded-full border border-outline-variant/15 flex items-center justify-center transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-outline-variant/15 p-4 shadow-sm">
            {/* Weekdays heads */}
            <div className="grid grid-cols-7 gap-1 border-b pb-2 mb-2 text-center">
              {WEEKDAY_NAMES_MINI.map((dayName) => (
                <div key={dayName} className="font-sans text-xs font-black text-on-surface-variant uppercase tracking-wider py-1">
                  {dayName}
                </div>
              ))}
            </div>

            {/* Grid Days cells */}
            <div className="grid grid-cols-7 gap-2">
              {monthGridCells.map((cellDate, index) => {
                if (!cellDate) {
                  return <div key={`empty-${index}`} className="aspect-square bg-stone-50/40 rounded-xl"></div>;
                }

                const dayNum = cellDate.getDate();
                const appts = getSalonAppointmentsForDate(cellDate);
                const isSelected = selectedDate.getDate() === dayNum && selectedDate.getMonth() === cellDate.getMonth() && selectedDate.getFullYear() === cellDate.getFullYear();
                const isToday = dayNum === 20 && cellDate.getMonth() === 5 && cellDate.getFullYear() === 2026; // June 20, 2026

                return (
                  <button
                    key={cellDate.getTime()}
                    onClick={() => {
                      setSelectedDate(cellDate);
                    }}
                    className={`aspect-square p-2.5 rounded-2xl flex flex-col justify-between border relative transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary border-primary text-white shadow-md scale-102"
                        : isToday
                          ? "bg-secondary-container/10 border-secondary text-secondary"
                          : "bg-ivory-base/30 hover:bg-stone-50 border-outline-variant/10 text-on-surface"
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="font-serif text-sm font-extrabold leading-none">{dayNum}</span>
                      {isToday && (
                        <span className={`text-[7px] font-bold uppercase tracking-tighter ${isSelected ? "text-white/80" : "text-secondary"}`}>
                          Hoy
                        </span>
                      )}
                    </div>

                    {appts.length > 0 && (
                      <div className="w-full text-left">
                        {/* Display a counting tag on tablet/desktop, otherwise just a dot */}
                        <div className="hidden sm:block text-[8px] bg-primary-container text-on-primary-container px-1 py-0.5 rounded text-center truncate font-black mt-1">
                          {appts.length} {appts.length === 1 ? "cita" : "citas"}
                        </div>
                        <div className="block sm:hidden w-1.5 h-1.5 rounded-full bg-primary mx-auto"></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* --------------------------- TIMELINE INTEGRATION LIST (BOTTOM SECTION) --------------------------- */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Unified daily timeline */}
        <div className="lg:col-span-2 space-y-6 text-left">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <h3 className="font-serif text-2xl font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-xl">calendar_today</span>
              <span>Citas de Peluquería</span>
            </h3>
            <span className="bg-primary/5 text-primary text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-tight">
              {formatSpanishDate(selectedDate)}
            </span>
          </div>

          <div className="space-y-6 relative ml-1 md:ml-4">
            <div className="absolute left-6 md:left-20 top-0 bottom-0 w-px bg-outline-variant/30 z-0"></div>

            {activeAppointments.length === 0 ? (
              <div className="relative z-10 pl-12 md:pl-28 py-10 text-left">
                <span className="material-symbols-outlined text-4xl text-outline/40">calendar_today</span>
                <p className="font-serif text-lg font-bold text-on-surface-variant mt-2">No hay citas registradas para este día</p>
                <p className="text-xs text-outline leading-tight mt-1">Puedes registrar una nueva cita usando el botón flotante inferior.</p>
              </div>
            ) : (
              activeAppointments.map((item) => {
                const isSynced = synchronizedIds.includes(item.id);
                return (
                  <div key={item.id} className="relative z-10 flex gap-4 md:gap-6 items-start group animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="mt-4 font-sans text-xs font-extrabold text-primary w-12 md:w-16 text-right shrink-0">
                      {item.time} {item.period}
                    </div>
                    
                    <div
                      onClick={() => handleAppointmentClick(item)}
                      className="flex-1 bg-white p-5 md:p-6 rounded-[2rem] border border-outline-variant/15 hover:border-primary-container/60 transition-all shadow-[0_10px_35px_-5px_rgba(117,88,72,0.02)] hover:shadow-md cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                        <div>
                          <h4 className="font-serif text-lg font-bold text-on-surface">
                            {item.dogName}{" "}
                            <span className="font-sans text-xs font-semibold text-on-surface-variant ml-2">
                              — {item.breed} ({item.size})
                            </span>
                          </h4>
                          <p className="font-sans text-xs font-semibold text-on-surface-variant mt-1.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">person_outline</span>
                            <span>Dueño: {item.ownerName}</span>
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={item.status}
                            onChange={(e) => {
                              if (onUpdateAppointmentStatus) {
                                onUpdateAppointmentStatus(item.id, e.target.value);
                              }
                            }}
                            className={`px-3.5 py-1 rounded-full font-sans text-[10px] font-bold uppercase tracking-wider border-0 outline-none cursor-pointer focus:ring-1 focus:ring-primary ${
                              item.status === "Confirmada" || item.status === "Confirmado"
                                ? "bg-tertiary-container text-on-tertiary-container"
                                : item.status === "En Camino" || item.status === "En camino"
                                  ? "bg-secondary-container text-on-secondary-container"
                                  : item.status === "Anulada" || item.status === "Anulado"
                                    ? "bg-red-100 text-red-800"
                                    : item.status === "Finalizada" || item.status === "Finalizado"
                                      ? "bg-stone-200 text-stone-800"
                                      : "bg-primary-container text-on-primary-container"
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

                      <div className="flex items-center justify-between flex-wrap gap-4 pt-1 border-t border-outline-variant/10 mt-3">
                        <div className="flex items-center gap-2 text-on-surface-variant font-sans text-xs font-medium">
                          <span className="material-symbols-outlined text-sm">content_cut</span>
                          <span>{item.service}</span>
                        </div>

                        {googleToken && (
                          <button
                            onClick={() => handleSyncAppointment(item)}
                            disabled={isSyncing || isSynced}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-sans text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer hover:shadow-xs ${
                              isSynced
                                ? "bg-secondary/10 text-secondary border border-secondary/20 cursor-default"
                                : "bg-primary text-white hover:bg-primary/95"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[13px]">
                              {isSynced ? "check_circle" : "sync"}
                            </span>
                            {isSynced ? "Sincronizado" : "Sincronizar"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Simulated Break Slots under standard hours - show for June 20, 2026 */}
            {selectedDate.getDate() === 20 && selectedDate.getMonth() === 5 && selectedDate.getFullYear() === 2026 && (
              <div className="relative z-10 flex gap-4 md:gap-6 items-start group animate-in fade-in duration-350">
                <div className="mt-3.5 font-sans text-xs font-bold text-outline w-12 md:w-16 text-right shrink-0">
                  12:30 PM
                </div>
                <div
                  onClick={() => onNavigate("break_config")}
                  className="flex-1 bg-surface-container-low/50 p-4 rounded-[2rem] border border-outline-variant/25 flex items-center justify-between opacity-75 cursor-pointer hover:bg-surface-container-low transition-colors"
                >
                  <div className="flex items-center gap-3 text-left">
                    <span className="material-symbols-outlined text-outline text-lg">lock</span>
                    <span className="font-sans text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Horario Bloqueado / Almuerzo de Estilistas
                    </span>
                  </div>
                  <span className="font-sans text-xs font-semibold text-outline px-3 py-1 rounded-md bg-white border border-outline-variant/20">
                    60 min
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Google Calendar Events sidebar */}
        <div className="space-y-6 text-left">
          <div className="border-b border-outline-variant/20 pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                  <h3 className="font-serif text-2xl font-bold text-secondary">
                    Google Calendar
                  </h3>
                </div>

                {!googleUser && (
                  <button
                    onClick={handleConnectGoogle}
                    disabled={isSyncing}
                    className="gsi-material-button flex items-center justify-center gap-2 bg-[#ffffff] hover:bg-[#f2f2f2] focus:outline-none border border-[#dadce0] text-[#3c4043] px-3.5 py-1.5 rounded-full font-sans text-[11px] font-bold shadow-xs active:scale-98 transition-all cursor-pointer shrink-0 ml-2"
                  >
                    <div className="w-4 h-4 flex items-center justify-center shrink-0">
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block" }}>
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                    </div>
                    <span>{isSyncing ? "..." : "Conectar"}</span>
                  </button>
                )}
              </div>

              {googleUser && (
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container rounded-full border border-secondary/20">
                      <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-secondary">
                        {googleUser.photoURL ? (
                          <img src={googleUser.photoURL} alt={googleUser.displayName || "Google User"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">G</div>
                        )}
                      </div>
                      <span className="font-sans text-[10px] font-bold text-primary truncate max-w-[80px]" title={googleUser.displayName || ""}>{googleUser.displayName || "Google"}</span>
                    </div>
                    <button
                      onClick={() => fetchGoogleEvents(googleToken || "")}
                      disabled={isSyncing}
                      className="p-1 bg-ivory-base hover:bg-surface-container text-primary rounded-full transition-all cursor-pointer border border-outline-variant/30"
                      title="Actualizar eventos"
                    >
                      <span className={`material-symbols-outlined text-[13px] ${isSyncing ? "animate-spin" : ""}`}>sync</span>
                    </button>
                    <button
                      onClick={handleDisconnectGoogle}
                      className="px-2 py-0.5 bg-warm-terracotta/10 hover:bg-warm-terracotta/20 text-warm-terracotta rounded-full font-sans text-[9px] font-bold transition-all cursor-pointer"
                    >
                      Desconectar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] font-sans text-on-surface-variant mt-1">
              Eventos personales para prevención de solapamientos
            </p>
          </div>

          {errorMessage && (
            <div className="p-4 bg-error-container/10 border border-error/20 text-error rounded-3xl flex flex-col gap-3 text-[11px] font-semibold">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">error</span>
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
              {window.self !== window.top && (
                <button
                  onClick={() => window.open(window.location.href, "_blank")}
                  className="px-4 py-2 bg-primary hover:bg-[#634a3c] text-white rounded-full font-sans text-[10px] font-extrabold uppercase shadow-sm cursor-pointer flex items-center justify-center gap-1.5 self-start transition-all"
                >
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                  <span>Abrir en Pestaña Completa ↗</span>
                </button>
              )}
            </div>
          )}

          {!googleToken ? (
            <div className="bg-ivory-base border border-outline-variant/25 rounded-3xl p-6 text-center space-y-4">
              <span className="material-symbols-outlined text-4xl text-outline/50 animate-pulse">lock_person</span>
              <h4 className="font-serif text-base font-bold text-primary">Previene Solapamientos</h4>
              <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                Empareja tu Google Calendar para visualizar eventos de tu agenda personal aquí y evitar reservar citas de mascotas a la misma hora.
              </p>

              {window.self !== window.top ? (
                <div className="space-y-3 pt-2">
                  <div className="p-3.5 bg-secondary-container/10 border border-outline-variant/20 rounded-2xl text-[10.5px] text-on-surface-variant text-left leading-relaxed">
                    <span className="font-bold text-[#755848] block mb-0.5">⚠️ Entorno de Previsualización</span>
                    Los navegadores web modernos no permiten los popups de Firebase Auth dentro de un iframe para proteger tu privacidad. Haz clic abajo para abrir la app a pantalla completa e iniciar sesión de forma segura.
                  </div>
                  <button
                    onClick={() => window.open(window.location.href, "_blank")}
                    className="w-full py-2.5 bg-primary hover:bg-[#634a3c] text-white rounded-full font-sans text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    <span>Abrir en Pestaña Completa</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectGoogle}
                  className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white rounded-full font-sans text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Conectar para Desbloquear
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-sans font-bold text-outline uppercase tracking-wider">
                  Eventos para el Día {selectedDate.getDate()}
                </span>
                <span className="text-[10px] font-mono text-outline">
                  {filteredGoogleEvents.length} eventos
                </span>
              </div>

              {filteredGoogleEvents.length === 0 ? (
                <div className="bg-surface-container-low border border-outline-variant/15 rounded-3xl p-5 text-center">
                  <span className="material-symbols-outlined text-3xl text-outline/35">verified</span>
                  <p className="font-sans text-xs font-bold text-on-surface-variant mt-2">Día despejado de solapamientos</p>
                  <p className="text-[10px] text-outline mt-1 leading-tight">No tienes eventos en tu Google Calendar que interfieran.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {filteredGoogleEvents.map((ev) => {
                    const startRaw = ev.start?.dateTime || ev.start?.date || "";
                    const timeLabel = ev.start?.dateTime
                      ? new Date(startRaw).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                      : "Todo el día";

                    return (
                      <div
                        key={ev.id}
                        className="p-4 bg-white rounded-2xl border-l-[4px] border-primary border-t border-r border-b border-outline-variant/15 hover:shadow-xs transition-shadow"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-sans text-xs font-extrabold text-on-surface line-clamp-2 leading-snug">
                            {ev.summary || "(Sin asunto)"}
                          </h4>
                          <span className="font-mono text-[9px] font-extrabold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase">
                            Google
                          </span>
                        </div>
                        <p className="text-[10px] font-sans text-on-surface-variant mt-1.5 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-xs">schedule</span>
                          <span>{timeLabel}</span>
                        </p>
                        {ev.description && (
                          <p className="text-[9.5px] font-sans text-outline mt-2 leading-normal line-clamp-2 border-t border-outline-variant/10 pt-1.5 italic">
                            {ev.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="bg-ivory-base rounded-2xl p-4.5 border border-outline-variant/15 space-y-2">
                <h5 className="font-serif text-sm font-bold text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs">info</span>
                  Nota sobre Sincronización
                </h5>
                <p className="text-[10px] text-on-surface-variant leading-normal">
                  Cualquier cita marcada como <b>sincronizada</b> se añadirá automáticamente a tu cuenta principal de Google. Esto permite que tus clientes también reciban invitaciones si activas avisos.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FLOATING ACTION BUTTONS */}
      <button
        onClick={() => onNavigate("break_config")}
        className="fixed bottom-40 right-6 w-12 h-12 bg-surface-variant text-on-surface-variant rounded-full flex items-center justify-center shadow-md hover:shadow-lg active:scale-90 transition-all z-40 border border-outline-variant/30 cursor-pointer text-center bg-white"
        title="Configuración de Descansos"
      >
        <span className="material-symbols-outlined text-lg">settings_accessibility</span>
      </button>

      <button
        onClick={() => onNavigate("new_appointment")}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all z-40 cursor-pointer text-center"
        title="Nueva Cita"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>
    </div>
  );
}
