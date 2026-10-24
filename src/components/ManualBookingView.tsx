import React, { useRef, useState } from "react";
import { Owner, Pet, Service, Trabajador, Appointment, Disponibilidad } from "../types";
import { getDisponibilidad, createContact, createPet } from "../services/odooService";

const SIZES = ["Toy", "Pequeño", "Mediano", "Grande", "Gigante", "Pequeño Diamante"];

interface ManualBookingViewProps {
  owners: Owner[];
  services: Service[];
  trabajadores: Trabajador[];
  serviceIdByCode: Record<string, string>;
  onAppointmentCreated: (a: Appointment) => Promise<{ id: string; trabajadorId?: number } | null>;
  onNavigateBack: () => void;
  onDataChanged?: () => void;
}

function getUpcomingDays(): { date: string; label: string; num: string }[] {
  const weekdays = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const days: { date: string; label: string; num: string }[] = [];
  const start = new Date();
  for (let i = 0; i < 14; i++) {
    const current = new Date();
    current.setDate(start.getDate() + i);
    const dow = current.getDay();
    const y = current.getFullYear();
    const mo = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    days.push({ date: `${y}-${mo}-${d}`, label: weekdays[dow], num: String(current.getDate()) });
  }
  return days;
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ManualBookingView({
  owners,
  services,
  trabajadores,
  serviceIdByCode,
  onAppointmentCreated,
  onNavigateBack,
  onDataChanged,
}: ManualBookingViewProps) {
  const activeServices = services || [];
  const activeTrabajadores = (trabajadores || []).filter((t) => t.activo !== false);
  const upcomingDays = getUpcomingDays();

  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerSearchOpen, setOwnerSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [serviceId, setServiceId] = useState(activeServices[0]?.id || "");
  const [size, setSize] = useState<string>("Mediano");
  const [date, setDate] = useState<string>(upcomingDays[0]?.date || "");
  const [workerMode, setWorkerMode] = useState<"auto" | "especifico">("auto");
  const [workerId, setWorkerId] = useState("");
  const [time, setTime] = useState("");
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad | null>(null);
  const [loadingDisp, setLoadingDisp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ dogName: string; fecha: string; hora: string; groomer?: string } | null>(null);

  // Nueva entidad: cliente
  const [newOwnerOpen, setNewOwnerOpen] = useState(false);
  const [newOwnerForm, setNewOwnerForm] = useState({ name: "", phone: "", email: "", city: "", zip: "" });
  const [savingOwner, setSavingOwner] = useState(false);
  const [ownerFormError, setOwnerFormError] = useState<string | null>(null);

  // Nueva entidad: mascota
  const [newPetOpen, setNewPetOpen] = useState(false);
  const [newPetForm, setNewPetForm] = useState({ name: "", breed: "", size: "Mediano", behavior: "", birthDate: "", notes: "" });
  const [savingPet, setSavingPet] = useState(false);
  const [petFormError, setPetFormError] = useState<string | null>(null);

  const minDate = toIso(new Date());
  const maxDateObj = new Date();
  maxDateObj.setDate(maxDateObj.getDate() + 365);
  const maxDate = toIso(maxDateObj);

  const pets = selectedOwner?.pets || [];
  const selectedService = activeServices.find((s) => s.id === serviceId);
  const servicioIdNum = selectedService && serviceIdByCode ? Number(serviceIdByCode[selectedService.id]) : undefined;

  const filteredOwners = owners
    .filter((o) => {
      if (!o.name || o.name === "My Company") return false;
      const q = ownerSearch.trim().toLowerCase();
      if (!q) return true;
      return o.name.toLowerCase().includes(q) || (o.phone || "").includes(q) || (o.contact || "").toLowerCase().includes(q);
    })
    .slice(0, 50);

  // Cerrar el desplegable de búsqueda al hacer click fuera
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setOwnerSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectOwner = (o: Owner) => {
    setSelectedOwner(o);
    setSelectedPet(null);
    setOwnerSearch("");
    setOwnerSearchOpen(false);
    setSize("Mediano");
  };

  const clearOwner = () => {
    setSelectedOwner(null);
    setSelectedPet(null);
    setOwnerSearch("");
    setSize("Mediano");
  };

  const selectPet = (p: Pet) => {
    setSelectedPet(p);
    setSize(SIZES.includes(p.size) ? p.size : "Mediano");
  };

  const handleFresh = () => {
    setSuccess(null);
    setError(null);
    setTime("");
    setSelectedOwner(null);
    setSelectedPet(null);
    setOwnerSearch("");
    setSize("Mediano");
  };

  const submitNewOwner = async () => {
    setOwnerFormError(null);
    if (!newOwnerForm.name.trim() || !newOwnerForm.phone.trim()) {
      setOwnerFormError("Nombre y teléfono son obligatorios.");
      return;
    }
    setSavingOwner(true);
    try {
      const res = await createContact({
        name: newOwnerForm.name.trim(),
        phone: newOwnerForm.phone.trim(),
        email: newOwnerForm.email.trim(),
        city: newOwnerForm.city.trim(),
        zip: newOwnerForm.zip.trim(),
        image: "",
      });
      const id = res?.id;
      if (!id) throw new Error("Sin id");
      const owner: Owner = {
        id: String(id),
        name: newOwnerForm.name.trim(),
        contact: newOwnerForm.email.trim(),
        phone: newOwnerForm.phone.trim(),
        city: newOwnerForm.city.trim() || undefined,
        zipCode: newOwnerForm.zip.trim() || undefined,
        since: "",
        avatar: "",
        pets: [],
      };
      setSelectedOwner(owner);
      setSelectedPet(null);
      setOwnerSearchOpen(false);
      setNewOwnerOpen(false);
      setNewOwnerForm({ name: "", phone: "", email: "", city: "", zip: "" });
      onDataChanged?.();
    } catch {
      setOwnerFormError("Error al crear el cliente.");
    } finally {
      setSavingOwner(false);
    }
  };

  const submitNewPet = async () => {
    setPetFormError(null);
    if (!selectedOwner || !newPetForm.name.trim()) {
      setPetFormError("El nombre de la mascota es obligatorio.");
      return;
    }
    setSavingPet(true);
    try {
      const res = await createPet({
        name: newPetForm.name.trim(),
        parent_id: Number(selectedOwner.id),
        breed: newPetForm.breed.trim(),
        size: newPetForm.size,
        behavior: newPetForm.behavior.trim(),
        birthDate: newPetForm.birthDate,
        notes: newPetForm.notes.trim(),
        image: "",
      });
      const id = res?.id;
      if (!id) throw new Error("Sin id");
      const pet: Pet = {
        id: String(id),
        name: newPetForm.name.trim(),
        breed: newPetForm.breed.trim(),
        size: newPetForm.size as any,
        behavior: newPetForm.behavior.trim(),
        birthDate: newPetForm.birthDate,
        notes: newPetForm.notes.trim(),
        avatarUrl: "",
        avgDuration: "",
        status: "ACTIVO",
        lastVisitDate: "",
        lastVisitService: "",
        history: [],
      };
      setSelectedOwner((prev) => (prev ? { ...prev, pets: [...prev.pets, pet] } : prev));
      setSelectedPet(pet);
      setSize(SIZES.includes(pet.size) ? pet.size : "Mediano");
      setNewPetOpen(false);
      setNewPetForm({ name: "", breed: "", size: "Mediano", behavior: "", birthDate: "", notes: "" });
      onDataChanged?.();
    } catch {
      setPetFormError("Error al crear la mascota.");
    } finally {
      setSavingPet(false);
    }
  };

  React.useEffect(() => {
    if (!selectedService || !servicioIdNum || Number.isNaN(servicioIdNum)) {
      setDisponibilidad(null);
      return;
    }
    let cancelled = false;
    setLoadingDisp(true);
    setTime("");
    const wid = workerMode === "especifico" && workerId ? workerId : undefined;
    getDisponibilidad({ fecha: date, servicioId: servicioIdNum, tamano: size, trabajadorId: wid })
      .then((d) => { if (!cancelled) setDisponibilidad(d); })
      .catch(() => { if (!cancelled) setDisponibilidad(null); })
      .finally(() => { if (!cancelled) setLoadingDisp(false); });
    return () => { cancelled = true; };
  }, [date, selectedService, size, workerMode, workerId, servicioIdNum]);

  const allWorkers = disponibilidad?.trabajadores || [];
  const slotMap = new Map<string, string[]>();
  allWorkers.forEach((w) => {
    (w.slotsInicio || []).forEach((h) => {
      if (!slotMap.has(h)) slotMap.set(h, []);
      slotMap.get(h)!.push(w.nombre);
    });
  });
  const unionSlots = [...slotMap.keys()].sort();
  const especificWorker = workerMode === "especifico" ? allWorkers.find((w) => String(w.id) === String(workerId)) : undefined;
  const visibleSlots = workerMode === "especifico" ? [...(especificWorker?.slotsInicio || [])].sort() : unionSlots;

  const duracionTotalMin = disponibilidad?.duracionTotalMin || 90;

  const handleSubmit = async () => {
    setError(null);
    if (!selectedOwner || !selectedPet || !selectedService || !time) {
      setError("Selecciona cliente, mascota, servicio y una hora disponible.");
      return;
    }
    setSubmitting(true);
    try {
      const period = parseInt(time.split(":")[0], 10) < 12 ? ("AM" as const) : ("PM" as const);
      const appt: Appointment = {
        id: `manual_${Date.now()}`,
        time,
        period,
        dogName: selectedPet.name,
        breed: selectedPet.breed,
        size: size as any,
        ownerName: selectedOwner.name,
        service: selectedService.title,
        status: "Pendiente",
        rawTime: time,
        date,
        ownerPhone: selectedOwner.phone,
        ownerEmail: selectedOwner.contact,
        ownerId: selectedOwner.id,
        petId: selectedPet.id,
        serviceCode: selectedService.id,
        trabajadorId: workerMode === "especifico" && workerId ? workerId : undefined,
        duracionTotalMin,
      };
      const res = await onAppointmentCreated(appt);
      let groomer: string | undefined;
      if (workerMode === "especifico") {
        groomer = activeTrabajadores.find((t) => String(t.id) === String(workerId))?.nombre;
      } else if (res?.trabajadorId) {
        groomer = activeTrabajadores.find((t) => String(t.id) === String(res.trabajadorId))?.nombre;
      }
      setSuccess({ dogName: selectedPet.name, fecha: date, hora: time, groomer });
      setTime("");
    } catch {
      setError("Error al crear la cita. Revisa la conexión.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full text-left space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-sans text-[11px] font-black text-secondary uppercase tracking-widest">Agenda Interna</span>
          <h2 className="font-serif text-3xl md:text-5xl text-primary font-bold mt-1">Reservar Cita</h2>
          <p className="font-sans text-xs text-on-surface-variant mt-1.5 font-medium">
            Agenda manualmente una cita, con disponibilidad real del equipo. Puedes dar de alta cliente y mascota al vuelo.
          </p>
        </div>
        {onNavigateBack && (
          <button
            onClick={onNavigateBack}
            className="px-4 py-2 bg-white hover:bg-surface-container border border-outline-variant/30 text-primary font-sans text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 shrink-0 self-start md:self-center"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Volver
          </button>
        )}
      </div>

      {success && (
        <div className="bg-[#e6f4ea] border border-[#34a853]/20 p-4.5 rounded-3xl flex items-start gap-3.5 text-left">
          <div className="w-8 h-8 rounded-full bg-[#34a853]/10 flex items-center justify-center shrink-0 text-[#137333]">
            <span className="material-symbols-outlined text-lg">check_circle</span>
          </div>
          <div className="flex-1 space-y-0.5 font-sans">
            <h4 className="text-[12px] font-extrabold text-[#137333] uppercase tracking-wider">Cita creada</h4>
            <p className="text-[11.5px] text-[#137333]/90 leading-tight">
              {success.dogName} · {success.fecha} a las {success.hora}
              {success.groomer ? <> · Atendida por <strong>{success.groomer}</strong></> : ""}
            </p>
          </div>
          <button onClick={() => setSuccess(null)} className="text-[#137333]/70 hover:text-[#137333] cursor-pointer">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-outline-variant/15 p-5 md:p-6 space-y-6 shadow-sm">
        {/* Cliente + Mascota */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between pl-1">
              <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider block">Cliente</label>
              <button
                type="button"
                onClick={() => setNewOwnerOpen(true)}
                className="text-[11px] font-bold text-primary hover:text-secondary cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">person_add</span> Nuevo cliente
              </button>
            </div>
            {selectedOwner ? (
              <div className="flex items-center justify-between gap-2 px-4 py-2.5 border border-primary/20 bg-primary/5 rounded-full text-xs text-on-surface">
                <span className="truncate font-semibold">{selectedOwner.name}</span>
                <button
                  type="button"
                  onClick={clearOwner}
                  className="text-warm-terracotta hover:bg-warm-terracotta/10 rounded-full p-1 cursor-pointer"
                  title="Quitar cliente"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ) : (
              <div className="relative" ref={searchRef}>
                <div className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant rounded-full text-xs bg-white focus-within:border-primary">
                  <span className="material-symbols-outlined text-sm text-outline">search</span>
                  <input
                    value={ownerSearch}
                    onChange={(e) => { setOwnerSearch(e.target.value); setOwnerSearchOpen(true); }}
                    onFocus={() => setOwnerSearchOpen(true)}
                    onClick={() => setOwnerSearchOpen(true)}
                    placeholder="Buscar por nombre o teléfono…"
                    className="w-full bg-transparent text-on-surface focus:outline-none"
                  />
                </div>
                {ownerSearchOpen && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-outline-variant/20 rounded-2xl shadow-lg max-h-56 overflow-y-auto">
                    {filteredOwners.length === 0 ? (
                      <p className="text-[11px] text-outline italic px-4 py-3">Sin coincidencias. Usa "Nuevo cliente".</p>
                    ) : (
                      filteredOwners.map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectOwner(o)}
                          className="w-full text-left px-4 py-2 hover:bg-ivory-base/60 text-xs text-on-surface border-b border-outline-variant/10 last:border-0"
                        >
                          <span className="font-semibold">{o.name}</span>
                          {o.phone ? <span className="text-outline"> · {o.phone}</span> : null}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between pl-1">
              <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider block">Mascota</label>
              {selectedOwner && (
                <button
                  type="button"
                  onClick={() => setNewPetOpen(true)}
                  className="text-[11px] font-bold text-primary hover:text-secondary cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">pets</span> Nueva mascota
                </button>
              )}
            </div>
            {selectedOwner ? (
              selectedPet ? (
                <div className="flex items-center justify-between gap-2 px-4 py-2.5 border border-primary/20 bg-primary/5 rounded-full text-xs text-on-surface">
                  <span className="truncate font-semibold">{selectedPet.name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPet(null)}
                    className="text-warm-terracotta hover:bg-warm-terracotta/10 rounded-full p-1 cursor-pointer"
                    title="Quitar mascota"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ) : (
                <select
                  value=""
                  onChange={(e) => {
                    const p = pets.find((x) => String(x.id) === e.target.value);
                    if (p) selectPet(p);
                  }}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-full text-xs text-on-surface bg-white focus:outline-none focus:border-primary"
                >
                  <option value="">— Selecciona mascota —</option>
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} · {p.breed} · {p.size}</option>
                  ))}
                </select>
              )
            ) : (
              <p className="text-xs text-outline italic px-4 py-2.5">Primero elige o crea el cliente.</p>
            )}
          </div>
        </div>

        {/* Servicio + Tamaño */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider block pl-1">Servicio</label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-4 py-2.5 border border-outline-variant rounded-full text-xs text-on-surface bg-white focus:outline-none focus:border-primary"
            >
              {activeServices.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider block pl-1">Tamaño</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full px-4 py-2.5 border border-outline-variant rounded-full text-xs text-on-surface bg-white focus:outline-none focus:border-primary"
            >
              {SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Fecha */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider block pl-1">Fecha</label>
          <input
            type="date"
            value={date}
            min={minDate}
            max={maxDate}
            onChange={(e) => setDate(e.target.value)}
            className="w-full md:max-w-xs px-4 py-2.5 border border-outline-variant rounded-full text-xs text-on-surface bg-white focus:outline-none focus:border-primary"
          />
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {upcomingDays.map((day) => {
              const isActive = date === day.date;
              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setDate(day.date)}
                  className={`p-2.5 rounded-2xl border flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                    isActive ? "bg-primary border-primary text-white shadow-xs" : "bg-white border-outline-variant/20 hover:border-outline-variant/50 text-on-surface"
                  }`}
                >
                  <span className="text-[9px] uppercase tracking-wider font-sans font-bold opacity-80">{day.label}</span>
                  <span className="text-base font-mono font-bold leading-none">{day.num}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Profesional + Hora */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider block pl-1">Profesional</label>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setWorkerMode("auto")}
                  className={`px-3 py-2 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${workerMode === "auto" ? "bg-primary text-white border-primary" : "bg-white text-on-surface-variant border-outline-variant/25 hover:border-primary/40"}`}
                >
                  Cualquier disponible
                </button>
                <button
                  type="button"
                  onClick={() => setWorkerMode("especifico")}
                  className={`px-3 py-2 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${workerMode === "especifico" ? "bg-primary text-white border-primary" : "bg-white text-on-surface-variant border-outline-variant/25 hover:border-primary/40"}`}
                >
                  Específico
                </button>
              </div>
              {workerMode === "especifico" && (
                <select
                  value={workerId}
                  onChange={(e) => setWorkerId(e.target.value)}
                  className="w-full px-4 py-2 border border-outline-variant rounded-full text-xs text-on-surface bg-white focus:outline-none focus:border-primary"
                >
                  <option value="">— Elige profesional —</option>
                  {activeTrabajadores.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-1">
            <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider block pl-1">Hora disponible</label>
            {loadingDisp ? (
              <p className="text-xs text-outline italic pl-1 py-2">Consultando disponibilidad real…</p>
            ) : visibleSlots.length === 0 ? (
              <p className="text-xs text-warm-terracotta pl-1 py-2">
                {workerMode === "especifico" && !workerId ? "Selecciona un profesional para ver sus horas." : "No hay horas disponibles para esta fecha."}
              </p>
            ) : (
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5">
                {visibleSlots.map((h) => {
                  const isSelected = time === h;
                  const freeNames = workerMode === "auto" ? (slotMap.get(h) || []) : [];
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setTime(h)}
                      className={`py-2 px-1 rounded-xl border text-center font-mono text-xs font-semibold transition-all cursor-pointer ${
                        isSelected ? "bg-secondary text-white border-secondary font-bold" : "bg-white border-outline-variant/15 hover:border-outline-variant/40 text-on-surface-variant"
                      }`}
                    >
                      {h}
                      {workerMode === "auto" && freeNames.length > 0 && (
                        <span className="block text-[7px] font-sans font-bold opacity-70 mt-0.5">{freeNames.map((n) => n.split(" ")[0]).join("·")}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="text-xs font-semibold text-warm-terracotta bg-warm-terracotta/5 px-4 py-2.5 rounded-xl border border-warm-terracotta/15 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-outline-variant/10">
          <button
            type="button"
            onClick={handleFresh}
            className="px-6 py-3 bg-white hover:bg-surface-container border border-outline-variant/30 text-primary font-sans text-xs font-bold rounded-full transition-all cursor-pointer"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-3 bg-secondary hover:bg-secondary/95 text-white font-sans text-xs font-bold rounded-full transition-all tracking-widest uppercase cursor-pointer disabled:bg-outline flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">{submitting ? "hourglass_empty" : "done"}</span>
            <span>{submitting ? "Agendando…" : "Confirmar cita"}</span>
          </button>
        </div>
      </div>

      {/* Modal nuevo cliente */}
      {newOwnerOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4" onClick={() => setNewOwnerOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-bold text-primary mb-4">Nuevo cliente</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface pl-1 block">Nombre *</label>
                <input value={newOwnerForm.name} onChange={(e) => setNewOwnerForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nombre y apellidos" className="w-full px-4 py-2 border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface pl-1 block">Teléfono *</label>
                <input value={newOwnerForm.phone} onChange={(e) => setNewOwnerForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Ej. +34 612901234" className="w-full px-4 py-2 border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface pl-1 block">Email</label>
                <input value={newOwnerForm.email} onChange={(e) => setNewOwnerForm((f) => ({ ...f, email: e.target.value }))} placeholder="cliente@dominio.com" className="w-full px-4 py-2 border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface pl-1 block">Ciudad</label>
                  <input value={newOwnerForm.city} onChange={(e) => setNewOwnerForm((f) => ({ ...f, city: e.target.value }))} className="w-full px-3 py-2 border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface pl-1 block">Código Postal</label>
                  <input value={newOwnerForm.zip} onChange={(e) => setNewOwnerForm((f) => ({ ...f, zip: e.target.value }))} className="w-full px-3 py-2 border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary" />
                </div>
              </div>
              {ownerFormError && <p className="text-xs font-semibold text-warm-terracotta">{ownerFormError}</p>}
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => { setNewOwnerOpen(false); setOwnerFormError(null); }} className="px-5 py-2 bg-white border border-outline-variant/30 text-primary font-sans text-xs font-bold rounded-full cursor-pointer">Cancelar</button>
                <button type="button" onClick={submitNewOwner} disabled={savingOwner} className="px-5 py-2 bg-primary text-white font-sans text-xs font-bold rounded-full cursor-pointer disabled:opacity-50">{savingOwner ? "Guardando…" : "Guardar y continuar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal nueva mascota */}
      {newPetOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4" onClick={() => setNewPetOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-bold text-primary mb-4">Nueva mascota</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface pl-1 block">Nombre *</label>
                <input value={newPetForm.name} onChange={(e) => setNewPetForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ej. Max" className="w-full px-4 py-2 border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface pl-1 block">Raza</label>
                  <input value={newPetForm.breed} onChange={(e) => setNewPetForm((f) => ({ ...f, breed: e.target.value }))} placeholder="Ej. Golden" className="w-full px-3 py-2 border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface pl-1 block">Tamaño</label>
                  <select value={newPetForm.size} onChange={(e) => setNewPetForm((f) => ({ ...f, size: e.target.value }))} className="w-full px-3 py-2 border border-outline-variant rounded-full text-xs text-on-surface bg-white focus:outline-none focus:border-primary">
                    {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface pl-1 block">Comportamiento</label>
                <input value={newPetForm.behavior} onChange={(e) => setNewPetForm((f) => ({ ...f, behavior: e.target.value }))} placeholder="Tranquilo, nervioso…" className="w-full px-4 py-2 border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface pl-1 block">Fecha de nacimiento</label>
                <input type="date" value={newPetForm.birthDate} onChange={(e) => setNewPetForm((f) => ({ ...f, birthDate: e.target.value }))} className="w-full px-4 py-2 border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface pl-1 block">Notas</label>
                <input value={newPetForm.notes} onChange={(e) => setNewPetForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Alergias, cuidados…" className="w-full px-4 py-2 border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary" />
              </div>
              {petFormError && <p className="text-xs font-semibold text-warm-terracotta">{petFormError}</p>}
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => { setNewPetOpen(false); setPetFormError(null); }} className="px-5 py-2 bg-white border border-outline-variant/30 text-primary font-sans text-xs font-bold rounded-full cursor-pointer">Cancelar</button>
                <button type="button" onClick={submitNewPet} disabled={savingPet} className="px-5 py-2 bg-primary text-white font-sans text-xs font-bold rounded-full cursor-pointer disabled:opacity-50">{savingPet ? "Guardando…" : "Guardar y seleccionar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}