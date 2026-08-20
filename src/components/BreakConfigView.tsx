import React, { useState } from "react";
import { ActiveBreak } from "../types";

export function BreakConfigView() {
  const [autoBlock, setAutoBlock] = useState<boolean>(true);
  const [breakTitle, setBreakTitle] = useState<string>("Pausa de Almuerzo");
  const [customTitle, setCustomTitle] = useState<string>("");
  const [fromTime, setFromTime] = useState<string>("14:00");
  const [toTime, setToTime] = useState<string>("15:30");
  const [allDay, setAllDay] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("Todo el año");
  const [selectedWeek, setSelectedWeek] = useState<string>("Todas las semanas");
  const [dayMode, setDayMode] = useState<"semana" | "mes">("semana");
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState<string>("Todos los días");
  const [success, setSuccess] = useState<boolean>(false);

  // Active breaks state to show full interactivity (add / remove / edit)
  const [breaks, setBreaks] = useState<ActiveBreak[]>([
    {
      id: "b1",
      title: "Pausa de Almuerzo",
      timeRange: "14:00 — 15:30",
      days: "Lun a Sáb • Todo el año",
      icon: "restaurant",
    },
    {
      id: "b2",
      title: "Cierre Diario",
      timeRange: "19:30 — 20:00",
      days: "Lun a Vie • Todo el año",
      icon: "coffee",
    },
    {
      id: "b3",
      title: "Descanso de Verano",
      timeRange: "09:00 — 18:00",
      days: "Día 15 • Agosto",
      icon: "sunny",
    },
  ]);

  const [activeDays, setActiveDays] = useState<string[]>(["L", "M", "X", "J", "V", "S"]);
  const daysOfWeek = ["L", "M", "X", "J", "V", "S", "D"];

  const handleToggleDay = (day: string) => {
    if (activeDays.includes(day)) {
      setActiveDays(activeDays.filter((d) => d !== day));
    } else {
      setActiveDays([...activeDays, day]);
    }
  };

  const handleAddOrSave = () => {
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);

      const finalTitle = breakTitle === "Personalizado" ? (customTitle || "Bloqueo Especial") : breakTitle;

      // Generar desglose legible del tiempo asignado
      let daysDesglose = "";
      if (selectedMonth !== "Todo el año") {
        daysDesglose += `${selectedMonth}`;
      } else {
        daysDesglose += "Todo el año";
      }

      if (selectedWeek !== "Todas las semanas") {
        daysDesglose += ` • ${selectedWeek}`;
      }

      if (dayMode === "mes" && selectedDayOfMonth !== "Todos los días") {
        daysDesglose += ` • Día ${selectedDayOfMonth}`;
      } else if (dayMode === "semana" && activeDays.length > 0) {
        if (activeDays.length === 7) {
          daysDesglose += ` • Diari`;
        } else {
          daysDesglose += ` • ${activeDays.join(", ")}`;
        }
      } else {
        daysDesglose += ` • Diari`;
      }

      // Icono representativo
      let finalIcon = "coffee";
      const normalizedTitle = finalTitle.toLowerCase();
      if (normalizedTitle.includes("almuerzo") || normalizedTitle.includes("comida") || normalizedTitle.includes("cena")) {
        finalIcon = "restaurant";
      } else if (normalizedTitle.includes("vacaci") || normalizedTitle.includes("verano") || normalizedTitle.includes("viaje")) {
        finalIcon = "sunny";
      } else if (normalizedTitle.includes("reun") || normalizedTitle.includes("formac") || normalizedTitle.includes("curs")) {
        finalIcon = "groups";
      } else if (normalizedTitle.includes("cierre") || normalizedTitle.includes("fin")) {
        finalIcon = "door_back";
      }

      const newBreak: ActiveBreak = {
        id: `b_${Date.now()}`,
        title: finalTitle,
        timeRange: allDay ? "Todo el día (00:00 — 23:59)" : `${fromTime} — ${toTime}`,
        days: daysDesglose,
        icon: finalIcon,
      };

      setBreaks([newBreak, ...breaks]);
      setCustomTitle("");
    }, 1500);
  };

  const handleDeleteBreak = (id: string) => {
    setBreaks(breaks.filter((b) => b.id !== id));
  };

  const meses = [
    "Todo el año",
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre"
  ];

  const semanas = [
    "Todas las semanas",
    "1ª Semana",
    "2ª Semana",
    "3ª Semana",
    "4ª Semana"
  ];

  const getDaysInMonth = (month: string): number => {
    switch (month) {
      case "Febrero":
        return 28;
      case "Abril":
      case "Junio":
      case "Septiembre":
      case "Noviembre":
        return 30;
      default:
        return 31; // Enero, Marzo, Mayo, Julio, Agosto, Octubre, Diciembre, "Todo el año"
    }
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    const maxDays = getDaysInMonth(month);
    if (selectedDayOfMonth !== "Todos los días" && parseInt(selectedDayOfMonth, 10) > maxDays) {
      setSelectedDayOfMonth("Todos los días");
    }
  };

  return (
    <div className="w-full text-left font-sans text-on-surface">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Configuration Form */}
        <div className="lg:col-span-7 space-y-8">
          <div className="flex flex-col gap-2">
            <h2 className="font-serif text-3xl md:text-5xl text-primary font-bold">
              Configurar Descansos
            </h2>
            <p className="font-sans text-xs md:text-sm text-on-surface-variant max-w-md font-medium">
              Administra los horarios de descanso y bloquea de manera interactiva por mes, semana, día y hora.
            </p>
          </div>

          <div className="bg-ivory-base rounded-[2.5rem] p-6 md:p-8 border border-outline-variant/20 shadow-[0_15px_40px_-10px_rgba(117,88,72,0.03)] space-y-6">
            
            {/* Global Toggle */}
            <div className="flex items-center justify-between p-5 bg-white rounded-3xl border border-outline-variant/15 shadow-[0_5px_15px_rgba(117,88,72,0.015)]">
              <div className="flex flex-col text-left">
                <span className="font-sans text-sm md:text-base font-bold text-primary">
                  Activar Bloqueos Automáticos
                </span>
                <span className="font-sans text-[11px] text-outline mt-0.5">
                  Previene reservas previas durante tus momentos de respiro
                </span>
              </div>
              <button
                onClick={() => setAutoBlock(!autoBlock)}
                className={`relative inline-flex items-center cursor-pointer focus:outline-none w-14 h-8 rounded-full transition-colors duration-300 ${
                  autoBlock ? "bg-primary" : "bg-outline-variant"
                }`}
              >
                <span
                  className={`absolute top-[4px] start-[4px] bg-white rounded-full h-6 w-6 transition-transform duration-300 shadow-sm ${
                    autoBlock ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Title / Preset Selector */}
            <div className="space-y-3">
              <label className="font-sans text-xs font-bold uppercase tracking-widest text-[#755848]">
                Concepto o Título del Descanso
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-1">
                  <div className="select-wrapper relative">
                    <select
                      value={breakTitle}
                      onChange={(e) => setBreakTitle(e.target.value)}
                      className="w-full bg-white border border-outline-variant/20 rounded-2xl p-3.5 px-4 font-sans text-xs md:text-sm font-semibold text-primary focus:outline-none focus:ring-1 focus:ring-primary/25 appearance-none cursor-pointer"
                    >
                      <option value="Pausa de Almuerzo">🍲 Pausa de Almuerzo</option>
                      <option value="Cierre Diario">☕ Cierre Diario</option>
                      <option value="Reunión de Equipo">👥 Reunión de Equipo</option>
                      <option value="Formación Canina">🎓 Formación Especializada</option>
                      <option value="Descanso de Verano">☀️ Descanso Vacacional</option>
                      <option value="Personalizado">✏️ Concepto Personalizado</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#755848] pointer-events-none">expand_more</span>
                  </div>
                </div>
                {breakTitle === "Personalizado" && (
                  <div className="col-span-1">
                    <input
                      type="text"
                      placeholder="Ej. Limpieza a fondo"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full bg-white border border-outline-variant/20 rounded-2xl p-3.5 px-4 font-sans text-xs md:text-sm font-bold placeholder-outline/50 focus:outline-none focus:ring-1 focus:ring-primary/25 text-primary"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Time / Hour Block */}
            <div className="space-y-3 border-t border-outline-variant/10 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-[#755848]">
                  Selección de Horas (Duración)
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !allDay;
                    setAllDay(nextVal);
                    if (nextVal) {
                      setFromTime("00:00");
                      setToTime("23:59");
                    } else {
                      setFromTime("14:00");
                      setToTime("15:30");
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full font-sans text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    allDay
                      ? "bg-primary text-white border border-primary shadow-sm"
                      : "bg-white text-outline border border-outline-variant/30 hover:bg-surface-container"
                  }`}
                >
                  {allDay ? "☀️ Todo el día" : "⏱️ Definir horario"}
                </button>
              </div>

              <div className={`flex items-center gap-3 transition-all duration-300 ${allDay ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
                <div className="flex-1 space-y-1 text-left">
                  <label className="font-sans text-[10px] font-bold text-outline uppercase px-1">
                    Desde las
                  </label>
                  <input
                    type="time"
                    value={fromTime}
                    disabled={allDay}
                    onChange={(e) => setFromTime(e.target.value)}
                    className="w-full bg-white disabled:bg-surface-container-low border border-outline-variant/15 rounded-2xl p-3.5 font-sans text-xs md:text-sm font-bold text-primary focus:outline-none focus:ring-1 focus:ring-primary/25 shadow-sm"
                  />
                </div>
                <div className="pt-5 text-outline select-none shrink-0">
                  <span className="material-symbols-outlined text-sm md:text-base">trending_flat</span>
                </div>
                <div className="flex-1 space-y-1 text-left">
                  <label className="font-sans text-[10px] font-bold text-outline uppercase px-1">
                    Hasta las
                  </label>
                  <input
                    type="time"
                    value={toTime}
                    disabled={allDay}
                    onChange={(e) => setToTime(e.target.value)}
                    className="w-full bg-white disabled:bg-surface-container-low border border-outline-variant/15 rounded-2xl p-3.5 font-sans text-xs md:text-sm font-bold text-primary focus:outline-none focus:ring-1 focus:ring-primary/25 shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Month & Week Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-outline-variant/10 pt-4">
              <div className="space-y-3">
                <label className="font-sans text-xs font-bold uppercase tracking-widest text-[#755848] block">
                  Filtrar por Mes
                </label>
                <div className="relative">
                  <select
                    value={selectedMonth}
                    onChange={(e) => handleMonthChange(e.target.value)}
                    className="w-full bg-white border border-outline-variant/20 rounded-2xl p-3.5 px-4 font-sans text-xs md:text-sm font-semibold text-primary focus:outline-none appearance-none cursor-pointer"
                  >
                    {meses.map((mes) => (
                      <option key={mes} value={mes}>{mes}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#755848] pointer-events-none">expand_more</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="font-sans text-xs font-bold uppercase tracking-widest text-[#755848] block">
                  Filtrar por Semana
                </label>
                <div className="relative">
                  <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                    className="w-full bg-white border border-outline-variant/20 rounded-2xl p-3.5 px-4 font-sans text-xs md:text-sm font-semibold text-primary focus:outline-none appearance-none cursor-pointer"
                  >
                    {semanas.map((sem) => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#755848] pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>

            {/* Day Selector (Week Days vs Specific Day of month) */}
            <div className="space-y-4 border-t border-outline-variant/10 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-[#755848]">
                  Definir Alcance del Día
                </h3>
                <div className="flex bg-surface-container rounded-full p-0.5 border border-outline-variant/15">
                  <button
                    onClick={() => setDayMode("semana")}
                    className={`px-4 py-1.5 rounded-full font-sans text-[10px] font-bold tracking-wider uppercase transition-all ${
                      dayMode === "semana"
                        ? "bg-white text-primary shadow-sm"
                        : "text-outline hover:text-primary"
                    }`}
                  >
                    Días Semana
                  </button>
                  <button
                    onClick={() => setDayMode("mes")}
                    className={`px-4 py-1.5 rounded-full font-sans text-[10px] font-bold tracking-wider uppercase transition-all ${
                      dayMode === "mes"
                        ? "bg-white text-primary shadow-sm"
                        : "text-outline hover:text-primary"
                    }`}
                  >
                    Día del Mes
                  </button>
                </div>
              </div>

              {dayMode === "semana" ? (
                <div className="space-y-3">
                  <p className="text-[11px] text-outline italic">Selecciona los días recurrentes de la semana:</p>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => {
                      const isActive = activeDays.includes(day);
                      return (
                        <button
                          key={day}
                          onClick={() => handleToggleDay(day)}
                          className={`w-11 h-11 rounded-full border text-[11px] font-bold font-sans transition-all cursor-pointer flex items-center justify-center ${
                            isActive
                              ? "bg-primary text-white border-primary shadow-md"
                              : "bg-white text-outline border-outline-variant/40 hover:bg-white/80"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px] text-outline italic">Selecciona un día fijo del mes:</p>
                  <div className="relative">
                    <select
                      value={selectedDayOfMonth}
                      onChange={(e) => setSelectedDayOfMonth(e.target.value)}
                      className="w-full bg-white border border-outline-variant/20 rounded-2xl p-3.5 px-4 font-sans text-xs md:text-sm font-semibold text-primary focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="Todos los días">Todos los días</option>
                      {Array.from({ length: getDaysInMonth(selectedMonth) }, (_, i) => (i + 1).toString()).map((dayStr) => (
                        <option key={dayStr} value={dayStr}>Día {dayStr}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#755848] pointer-events-none">expand_more</span>
                  </div>
                </div>
              )}
            </div>

            {/* CTA Button */}
            <div className="pt-4 border-t border-outline-variant/10">
              <button
                onClick={handleAddOrSave}
                disabled={success}
                className={`w-full transition-all duration-300 py-4 rounded-3xl font-serif text-base font-bold flex items-center justify-center gap-3 cursor-pointer shadow-md ${
                  success
                    ? "bg-secondary text-white"
                    : "bg-primary text-white hover:bg-[#634a3c]"
                }`}
              >
                <span>{success ? "¡Descanso Aplicado!" : "Aplicar y Añadir Bloqueo"}</span>
                <span className="material-symbols-outlined text-lg">
                  {success ? "check_circle" : "add"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Active Blocks & Atmospheric Visual */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Visual Decoration Card */}
          <div className="relative h-64 rounded-[2.5rem] overflow-hidden group shadow-md border border-outline-variant/20">
            <img
              alt="Relaxed atmosphere"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-3ehQVB6isaD93gzdsJxFwCTTjcTTfFaSz6qLKHkj85uGwTSf0IA32BAOhbUmROGnvKam7antYSmweVdeuxQnMdmfE1-Wrpa66BOX-QN9ujmimwvJ7Z4cl1PyNQrRAiAGUkiGdztBZOGzAFKeg2RZg-GglieGsQmGLvwvpAKnxh4cl92wKsaqLKWyeMUmUW9I35q5AXpc2kUh6CkXBKBiEjbSqb3mC3wEpiKogW0IvkHdR17rgbpz1t97TBeICNbd4C--fenb0X8"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent flex flex-col justify-end p-6 text-left">
              <span className="font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-white/90 bg-white/10 backdrop-blur-xs px-2.5 py-1 rounded-full self-start">
                Atelier Equilibrado
              </span>
              <p className="font-serif text-lg md:text-xl font-bold text-white mt-1.5 leading-snug">
                Tu bienestar físico y mental se traduce en sesiones felices
              </p>
            </div>
          </div>

          {/* Active Blocks List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-[#755848] text-left">
                Bloqueos Activos
              </h3>
              <span className="bg-primary/5 text-primary border border-primary/10 px-3 py-1 rounded-full font-sans text-[10px] font-bold uppercase tracking-wider">
                {breaks.length} Franjas
              </span>
            </div>

            <div className="space-y-3.5">
              {breaks.map((b) => (
                <div
                  key={b.id}
                  className="bg-white p-5 rounded-3xl border border-outline-variant/15 flex items-center justify-between hover:shadow-sm transition-shadow group shadow-[0_5px_15px_-5px_rgba(117,88,72,0.02)]"
                >
                  <div className="flex items-center gap-3.5 text-left min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-primary/5 border border-primary/5 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {b.icon}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-sans text-xs md:text-sm font-extrabold text-[#755848] truncate">
                        {b.title}
                      </h4>
                      <p className="font-sans text-[11px] text-outline truncate mt-0.5">
                        {b.timeRange}
                      </p>
                      <p className="font-sans text-[9px] font-extrabold text-[#957e70] bg-[#faf6f0] border border-outline-variant/15 px-2 py-0.5 rounded-full inline-block mt-1">
                        {b.days}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => {
                        if (b.timeRange.includes("Todo el día")) {
                          setAllDay(true);
                          setFromTime("00:00");
                          setToTime("23:59");
                        } else {
                          setAllDay(false);
                          const [f, t] = b.timeRange.split(" — ");
                          setFromTime(f.trim());
                          setToTime(t.trim());
                        }
                        // Extraer título pre-seleccionado
                        const validTitles = ["Pausa de Almuerzo", "Cierre Diario", "Reunión de Equipo", "Formación Canina", "Descanso de Verano"];
                        if (validTitles.includes(b.title)) {
                          setBreakTitle(b.title);
                        } else {
                          setBreakTitle("Personalizado");
                          setCustomTitle(b.title);
                        }
                      }}
                      className="p-1 px-2.5 text-[#755848] bg-ivory-base hover:bg-outline-variant/20 rounded-full transition-colors cursor-pointer flex items-center gap-1 font-sans text-[9px] font-bold uppercase"
                      title="Copiar franja"
                    >
                      <span className="material-symbols-outlined text-[11px]">edit</span>
                      <span>Copiar</span>
                    </button>
                    <button
                      onClick={() => handleDeleteBreak(b.id)}
                      className="p-1.5 text-error hover:bg-error/5 border border-transparent hover:border-error/15 rounded-full transition-colors cursor-pointer"
                      title="Eliminar bloqueo"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              ))}

              {breaks.length === 0 && (
                <div className="text-center py-8 bg-white rounded-3xl border border-dashed border-outline-variant/30">
                  <span className="material-symbols-outlined text-3xl text-outline/40">coffee_maker</span>
                  <p className="text-[11px] text-outline font-bold mt-2">No hay bloqueos activos</p>
                  <p className="text-[10px] text-outline/80 leading-normal mt-0.5 px-6">La agenda está libre de límites. Cualquier cliente podrá agendar citas en cualquier franja.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

