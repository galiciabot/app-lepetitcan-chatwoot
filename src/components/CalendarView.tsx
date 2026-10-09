import React, { useMemo, useState } from "react";
import { Appointment, Owner } from "../types";

interface CalendarViewProps {
  appointments: Appointment[];
  owners: Owner[];
  onNavigate: (viewId: string) => void;
  userRole?: string;
  onSelectClientDetail?: (ownerName: string, dogName: string) => void;
  onUpdateAppointmentStatus?: (appointmentId: string, status: string) => void;
  onDeleteAppointment?: (appointmentId: string) => void;
  onMoveAppointment?: (
    appointmentId: string,
    target: { fecha: string; hora: string; trabajadorId?: string; trabajadorName?: string }
  ) => void;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
const WEEKDAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const WEEKDAY_NAMES_MINI = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const STATUS_OPTIONS = ["Pendiente", "Confirmada", "En camino", "En Proceso", "Finalizada", "Anulada"];

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function CalendarView({
  appointments,
  owners,
  onNavigate,
  userRole,
  onSelectClientDetail,
  onUpdateAppointmentStatus,
  onDeleteAppointment,
  onMoveAppointment,
}: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date());
  const [viewType, setViewType] = useState<"Dia" | "Semana" | "Mes">("Dia");
  const [workerFilter, setWorkerFilter] = useState<string>("all");
  const [moveAppt, setMoveAppt] = useState<Appointment | null>(null);
  const [moveForm, setMoveForm] = useState<{ fecha: string; hora: string; trabajadorId: string }>({
    fecha: "",
    hora: "09:00",
    trabajadorId: "",
  });
  const today = new Date();

  const workerList = useMemo(() => {
    const map = new Map<string, string>();
    appointments.forEach((a) => {
      const id = a.trabajadorId || "sin";
      const name = a.trabajadorName || "Sin asignar";
      if (!map.has(id)) map.set(id, name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [appointments]);

  const getOwnerPet = (ap: Appointment) => {
    let owner = ap.ownerId ? owners.find((o) => String(o.id) === String(ap.ownerId)) : undefined;
    if (!owner && ap.ownerName) {
      owner = owners.find((o) => o.name.toLowerCase() === ap.ownerName.toLowerCase());
    }
    let pet = ap.petId && owner ? owner.pets?.find((p) => String(p.id) === String(ap.petId)) : undefined;
    if (!pet && owner && ap.dogName) {
      pet = owner.pets?.find((p) => p.name.toLowerCase() === ap.dogName.toLowerCase());
    }
    return { owner, pet };
  };

  const getSalonAppointmentsForDate = (d: Date): Appointment[] => {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    const dd = d.getDate().toString().padStart(2, "0");
    const dateStr = `${y}-${m}-${dd}`;
    return appointments.filter((ap) => ap.date === dateStr);
  };

  const activeAppointments = getSalonAppointmentsForDate(selectedDate);
  const filteredAppointments = activeAppointments.filter((ap) =>
    workerFilter === "all" ? true : (ap.trabajadorId || "sin") === workerFilter
  );

  const getDaysOfActiveWeek = (baseDate: Date): Date[] => {
    const currentDayOfWeek = baseDate.getDay();
    const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const monday = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    monday.setDate(baseDate.getDate() + distanceToMonday);
    const daysList: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      daysList.push(nextDay);
    }
    return daysList;
  };

  const getMonthGridCells = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) cells.push(null);
    for (let day = 1; day <= totalDays; day++) cells.push(new Date(year, month, day));
    return cells;
  };

  const activeWeekDays = getDaysOfActiveWeek(selectedDate);
  const monthGridCells = getMonthGridCells(currentMonthDate);

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

  const formatMonthName = (date: Date) => `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
  const formatSpanishDate = (date: Date) =>
    `${date.getDate()} de ${MONTH_NAMES[date.getMonth()]} de ${date.getFullYear()}`;

  const handleAppointmentClick = (ap: Appointment) => {
    if (onSelectClientDetail) {
      onSelectClientDetail(ap.ownerName, ap.dogName);
    } else {
      onNavigate("client_detail");
    }
  };

  const openMove = (ap: Appointment) => {
    setMoveAppt(ap);
    setMoveForm({
      fecha: ap.date || "",
      hora: ap.rawTime || ap.time || "09:00",
      trabajadorId: ap.trabajadorId || "",
    });
  };

  const submitMove = () => {
    if (!moveAppt) return;
    const wid = moveForm.trabajadorId;
    const wname = wid ? workerList.find((w) => w.id === wid)?.name || "" : undefined;
    onMoveAppointment?.(moveAppt.id, {
      fecha: moveForm.fecha,
      hora: moveForm.hora,
      trabajadorId: wid || undefined,
      trabajadorName: wid ? wname : undefined,
    });
    setMoveAppt(null);
  };

  const confirmDelete = (ap: Appointment) => {
    if (window.confirm(`¿Anular la cita de ${ap.dogName}? Quedará marcada como "Anulada" (no se borra).`)) {
      onDeleteAppointment?.(ap.id);
    }
  };

  return (
    <div className="w-full text-left space-y-8 animate-in fade-in duration-300">
      {/* Header + view selector */}
      <section className="mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <span className="font-sans text-[11px] font-black text-secondary uppercase tracking-widest">
              Panel Administrativo Canino
            </span>
            <h2 className="font-serif text-3xl md:text-5xl text-primary font-bold mt-1">Calendario</h2>
            <p className="font-sans text-xs text-on-surface-variant mt-1.5 font-medium">
              Agenda de citas por día y trabajador
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {userRole === "empleado" ? (
              <div className="flex items-center justify-center gap-2 px-5 py-2.5 bg-surface-container-low text-outline font-sans text-xs font-semibold rounded-full border border-outline-variant/20 select-none cursor-not-allowed">
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
                    viewType === vt ? "bg-white shadow-sm text-primary" : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  {vt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DIA */}
      {viewType === "Dia" && (
        <section className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-outline-variant/15 shadow-xs">
            <button onClick={handlePrevDay} className="p-2 hover:bg-ivory-base rounded-full border border-outline-variant/15 flex items-center justify-center transition-all cursor-pointer">
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            <div className="text-center">
              <h3 className="font-serif text-lg font-bold text-primary">{formatMonthName(selectedDate)}</h3>
              <p className="font-sans text-[11px] text-on-surface-variant font-bold mt-0.5">
                {WEEKDAY_NAMES[selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1]}, {selectedDate.getDate()}
              </p>
            </div>
            <button onClick={handleNextDay} className="p-2 hover:bg-ivory-base rounded-full border border-outline-variant/15 flex items-center justify-center transition-all cursor-pointer">
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-3 hide-scrollbar">
            {activeWeekDays.map((d) => {
              const isSelected = isSameDay(d, selectedDate);
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
                  <span className={`font-sans text-[10px] font-bold tracking-widest ${isSelected ? "opacity-90 text-white" : "text-on-surface-variant"}`}>
                    {WEEKDAY_NAMES_MINI[weekdayIndex]}
                  </span>
                  <span className="font-serif text-2xl font-bold mt-1 leading-none">{d.getDate()}</span>
                  {isSameDay(d, today) && (
                    <span className={`absolute top-1 text-[7px] font-bold tracking-tighter uppercase ${isSelected ? "text-white/70" : "text-secondary"}`}>Hoy</span>
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

      {/* SEMANA */}
      {viewType === "Semana" && (
        <section className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-outline-variant/15 shadow-xs">
            <button onClick={handlePrevWeek} className="p-2 hover:bg-ivory-base rounded-full border border-outline-variant/15 flex items-center justify-center transition-all cursor-pointer">
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            <div className="text-center">
              <h3 className="font-serif text-lg font-bold text-primary">
                Semana de {activeWeekDays[0].getDate()} al {activeWeekDays[6].getDate()} de {MONTH_NAMES[selectedDate.getMonth()]}
              </h3>
              <p className="font-sans text-xs text-on-surface-variant font-medium mt-0.5">Visualización Semanal • {selectedDate.getFullYear()}</p>
            </div>
            <button onClick={handleNextWeek} className="p-2 hover:bg-ivory-base rounded-full border border-outline-variant/15 flex items-center justify-center transition-all cursor-pointer">
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {activeWeekDays.map((d) => {
              const appts = getSalonAppointmentsForDate(d);
              const isSelected = isSameDay(d, selectedDate);
              const weekdayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
              return (
                <div
                  key={d.getTime()}
                  onClick={() => {
                    setSelectedDate(d);
                    setCurrentMonthDate(d);
                  }}
                  className={`bg-white p-4 rounded-2xl border transition-all hover:shadow-xs cursor-pointer text-left space-y-3 ${
                    isSelected ? "border-primary/80 ring-1 ring-primary/40 bg-primary/[0.01]" : "border-outline-variant/15"
                  }`}
                >
                  <div className={`border-b pb-2 flex justify-between items-center ${isSelected ? "border-primary/20" : "border-outline-variant/10"}`}>
                    <div>
                      <h4 className="font-sans text-xs font-extrabold text-on-surface">{WEEKDAY_NAMES_MINI[weekdayIndex]}</h4>
                      <p className="font-serif text-lg font-bold text-primary">{d.getDate()}</p>
                    </div>
                    {appts.length > 0 && (
                      <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">{appts.length}</span>
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
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* MES */}
      {viewType === "Mes" && (
        <section className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-outline-variant/15 shadow-xs">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-ivory-base rounded-full border border-outline-variant/15 flex items-center justify-center transition-all cursor-pointer">
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            <div className="text-center">
              <h3 className="font-serif text-lg font-bold text-primary uppercase tracking-wider">{formatMonthName(currentMonthDate)}</h3>
              <p className="font-sans text-xs text-on-surface-variant font-medium mt-0.5">Calendario General Mensual</p>
            </div>
            <button onClick={handleNextMonth} className="p-2 hover:bg-ivory-base rounded-full border border-outline-variant/15 flex items-center justify-center transition-all cursor-pointer">
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-outline-variant/15 p-4 shadow-sm">
            <div className="grid grid-cols-7 gap-1 border-b pb-2 mb-2 text-center">
              {WEEKDAY_NAMES_MINI.map((dayName) => (
                <div key={dayName} className="font-sans text-xs font-black text-on-surface-variant uppercase tracking-wider py-1">{dayName}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {monthGridCells.map((cellDate, index) => {
                if (!cellDate) return <div key={`empty-${index}`} className="aspect-square bg-stone-50/40 rounded-xl"></div>;
                const dayNum = cellDate.getDate();
                const appts = getSalonAppointmentsForDate(cellDate);
                const isSelected = isSameDay(cellDate, selectedDate);
                const isToday = isSameDay(cellDate, today);
                return (
                  <button
                    key={cellDate.getTime()}
                    onClick={() => setSelectedDate(cellDate)}
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
                        <span className={`text-[7px] font-bold uppercase tracking-tighter ${isSelected ? "text-white/80" : "text-secondary"}`}>Hoy</span>
                      )}
                    </div>
                    {appts.length > 0 && (
                      <div className="w-full text-left">
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

      {/* TIMELINE (lista del día) con filtro por trabajador */}
      <section className="space-y-6 text-left">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3 flex-wrap gap-3">
          <h3 className="font-serif text-2xl font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-xl">calendar_today</span>
            <span>Citas de Peluquería</span>
          </h3>
          <span className="bg-primary/5 text-primary text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-tight">
            {formatSpanishDate(selectedDate)}
          </span>
        </div>

        {/* Filtro por trabajador */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setWorkerFilter("all")}
            className={`px-4 py-1.5 rounded-full font-sans text-[11px] font-bold border transition-all cursor-pointer ${
              workerFilter === "all" ? "bg-primary text-white border-primary" : "bg-white text-on-surface-variant border-outline-variant/25 hover:border-primary/40"
            }`}
          >
            Todos
          </button>
          {workerList.map((w) => (
            <button
              key={w.id}
              onClick={() => setWorkerFilter(w.id)}
              className={`px-4 py-1.5 rounded-full font-sans text-[11px] font-bold border transition-all cursor-pointer ${
                workerFilter === w.id ? "bg-primary text-white border-primary" : "bg-white text-on-surface-variant border-outline-variant/25 hover:border-primary/40"
              }`}
            >
              {w.name}
            </button>
          ))}
        </div>

        <div className="space-y-4 relative ml-1 md:ml-4">
          <div className="absolute left-6 md:left-20 top-0 bottom-0 w-px bg-outline-variant/30 z-0"></div>

          {filteredAppointments.length === 0 ? (
            <div className="relative z-10 pl-12 md:pl-28 py-10 text-left">
              <span className="material-symbols-outlined text-4xl text-outline/40">calendar_today</span>
              <p className="font-serif text-lg font-bold text-on-surface-variant mt-2">No hay citas registradas para este día</p>
              <p className="text-xs text-outline leading-tight mt-1">Puedes registrar una nueva cita con el botón flotante inferior.</p>
            </div>
          ) : (
            filteredAppointments.map((item) => {
              const { owner, pet } = getOwnerPet(item);
              const sizeLabel = pet?.size || item.size;
              const phone = owner?.phone || item.ownerPhone || "";
              const notas = pet?.notes || "";

              return (
                <div key={item.id} className="relative z-10 flex gap-4 md:gap-6 items-start group">
                  <div className="mt-4 font-sans text-xs font-extrabold text-primary w-12 md:w-16 text-right shrink-0">
                    {item.time} {item.period}
                  </div>

                  <div
                    onClick={() => handleAppointmentClick(item)}
                    className="flex-1 bg-white p-5 md:p-6 rounded-[2rem] border border-outline-variant/15 hover:border-primary-container/60 transition-all shadow-[0_10px_35px_-5px_rgba(117,88,72,0.02)] hover:shadow-md cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-3">
                      <div>
                        <h4 className="font-serif text-lg font-bold text-on-surface">
                          {item.dogName}{" "}
                          {sizeLabel && (
                            <span className="font-sans text-xs font-semibold text-on-surface-variant ml-1">— {sizeLabel}</span>
                          )}
                        </h4>
                        <p className="font-sans text-xs font-semibold text-on-surface-variant mt-1.5 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[13px]">content_cut</span>
                          <span>{item.service}</span>
                          {item.trabajadorName && (
                            <span className="ml-2 text-primary/80"> · {item.trabajadorName}</span>
                          )}
                        </p>
                        <p className="font-sans text-xs font-semibold text-on-surface-variant mt-1.5 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[13px]">person_outline</span>
                          <span>{owner?.name || item.ownerName}</span>
                          {phone && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">call</span>
                              <span>{phone}</span>
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={item.status}
                          onChange={(e) => onUpdateAppointmentStatus?.(item.id, e.target.value)}
                          className={`px-3.5 py-1 rounded-full font-sans text-[10px] font-bold uppercase tracking-wider border-0 outline-none cursor-pointer focus:ring-1 focus:ring-primary ${
                            item.status === "Confirmada" || item.status === "Confirmado"
                              ? "bg-tertiary-container text-on-tertiary-container"
                              : item.status === "En camino" || item.status === "En Camino"
                                ? "bg-secondary-container text-on-secondary-container"
                                : item.status === "Anulada" || item.status === "Anulado"
                                  ? "bg-red-100 text-red-800"
                                  : item.status === "Finalizada" || item.status === "Finalizado"
                                    ? "bg-stone-200 text-stone-800"
                                    : "bg-primary-container text-on-primary-container"
                          }`}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>

                        <button
                          onClick={() => openMove(item)}
                          title="Mover cita"
                          className="p-1.5 bg-ivory-base hover:bg-surface-container text-primary rounded-full transition-all cursor-pointer border border-outline-variant/30"
                        >
                          <span className="material-symbols-outlined text-[15px]">edit_calendar</span>
                        </button>
                        <button
                          onClick={() => confirmDelete(item)}
                          title="Anular cita"
                          className="p-1.5 bg-warm-terracotta/10 hover:bg-warm-terracotta/20 text-warm-terracotta rounded-full transition-all cursor-pointer border border-outline-variant/30"
                        >
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                        </button>
                      </div>
                    </div>

                    {notas && (
                      <div className="pt-2 border-t border-outline-variant/10 mt-1">
                        <p className="font-sans text-[11px] text-on-surface-variant leading-relaxed">
                          <span className="font-bold text-[#755848]">Notas: </span>
                          {notas}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Modal mover cita */}
      {moveAppt && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setMoveAppt(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-bold text-primary mb-4">Mover cita de {moveAppt.dogName}</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface pl-1 block">Fecha</label>
                <input
                  type="date"
                  value={moveForm.fecha}
                  onChange={(e) => setMoveForm((f) => ({ ...f, fecha: e.target.value }))}
                  className="w-full px-4 py-2 border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface pl-1 block">Hora</label>
                <input
                  type="time"
                  value={moveForm.hora}
                  onChange={(e) => setMoveForm((f) => ({ ...f, hora: e.target.value }))}
                  className="w-full px-4 py-2 border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface pl-1 block">Trabajador</label>
                <select
                  value={moveForm.trabajadorId}
                  onChange={(e) => setMoveForm((f) => ({ ...f, trabajadorId: e.target.value }))}
                  className="w-full px-4 py-2 border border-outline-variant rounded-full text-xs text-on-surface bg-white focus:outline-none focus:border-primary"
                >
                  <option value="">Sin asignar</option>
                  {workerList.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setMoveAppt(null)}
                  className="px-5 py-2 bg-white hover:bg-surface-container border border-outline-variant/30 text-primary font-sans text-xs font-bold rounded-full cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={submitMove}
                  className="px-5 py-2 bg-primary hover:bg-primary/95 text-white font-sans text-xs font-bold rounded-full cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating buttons */}
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