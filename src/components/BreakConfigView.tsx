import React, { useEffect, useMemo, useState } from "react";
import { Trabajador, Configuracion, Bloqueo, HorarioBloque } from "../types";
import { parseHorario, serializeHorario } from "../services/odooService";

const WEEKDAYS: { key: string; label: string }[] = [
  { key: "lunes", label: "Lunes" },
  { key: "martes", label: "Martes" },
  { key: "miércoles", label: "Miércoles" },
  { key: "jueves", label: "Jueves" },
  { key: "viernes", label: "Viernes" },
  { key: "sábado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

type HorarioDraft = Record<string, HorarioBloque[]>;

interface BreakConfigViewProps {
  trabajadores: Trabajador[];
  configuracion: Configuracion | null;
  bloqueos: Bloqueo[];
  onSaveDefaultHorario: (horario: string) => Promise<void>;
  onSaveWorkerHorario: (trabajadorId: string, horarioLaboral: string) => Promise<void>;
  onCreateBloqueo: (b: BloqueoInput) => Promise<void>;
  onUpdateBloqueo: (id: string, b: BloqueoInput) => Promise<void>;
  onDeleteBloqueo: (id: string) => Promise<void>;
}

export interface BloqueoInput {
  name: string;
  fechaInicio: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
  trabajadorId?: string;
}

type DraftSetter = React.Dispatch<React.SetStateAction<HorarioDraft>>;

function makeHandlers(setDraft: DraftSetter) {
  return {
    updateBlock: (day: string, idx: number, field: 0 | 1, value: string) =>
      setDraft((prev) => {
        const next = { ...prev };
        const blocks = (next[day] || []).map((b) => [...b] as HorarioBloque);
        if (blocks[idx]) blocks[idx][field] = value;
        next[day] = blocks;
        return next;
      }),
    addBlock: (day: string) =>
      setDraft((prev) => ({ ...prev, [day]: [...(prev[day] || []), ["09:00", "18:00"]] })),
    removeBlock: (day: string, idx: number) =>
      setDraft((prev) => ({ ...prev, [day]: (prev[day] || []).filter((_, i) => i !== idx) })),
    clearDay: (day: string) => setDraft((prev) => ({ ...prev, [day]: [] })),
  };
}

function renderEditor(
  draft: HorarioDraft,
  handlers: ReturnType<typeof makeHandlers>
) {
  return (
    <div className="space-y-3">
      {WEEKDAYS.map((day) => {
        const blocks = draft[day.key] || [];
        return (
          <div
            key={day.key}
            className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-2xl border ${
              blocks.length ? "border-outline-variant/10 bg-ivory-base/30" : "border-dashed border-outline-variant/30"
            }`}
          >
            <div className="w-20 shrink-0">
              <span className="font-sans text-xs font-extrabold text-primary">{day.label}</span>
            </div>

            <div className="flex-1 flex flex-wrap items-center gap-2">
              {blocks.length === 0 ? (
                <span className="text-[11px] font-bold text-outline italic">Cerrado</span>
              ) : (
                blocks.map((b, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <input
                      type="time"
                      value={b[0]}
                      onChange={(e) => handlers.updateBlock(day.key, idx, 0, e.target.value)}
                      className="px-2 py-1 border border-outline-variant/30 rounded-lg text-xs text-on-surface bg-white focus:outline-none focus:border-primary"
                    />
                    <span className="text-outline text-[10px]">–</span>
                    <input
                      type="time"
                      value={b[1]}
                      onChange={(e) => handlers.updateBlock(day.key, idx, 1, e.target.value)}
                      className="px-2 py-1 border border-outline-variant/30 rounded-lg text-xs text-on-surface bg-white focus:outline-none focus:border-primary"
                    />
                    <button
                      onClick={() => handlers.removeBlock(day.key, idx)}
                      className="p-1 text-warm-terracotta hover:bg-warm-terracotta/10 rounded-full cursor-pointer"
                      title="Quitar bloque"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handlers.addBlock(day.key)}
                className="px-2.5 py-1 text-[10px] font-bold text-primary bg-primary/5 border border-primary/15 rounded-full cursor-pointer hover:bg-primary hover:text-white transition-colors"
              >
                {blocks.length ? "+ Bloque" : "Abrir"}
              </button>
              {blocks.length > 0 && (
                <button
                  onClick={() => handlers.clearDay(day.key)}
                  className="px-2.5 py-1 text-[10px] font-bold text-warm-terracotta bg-warm-terracotta/5 border border-warm-terracotta/15 rounded-full cursor-pointer hover:bg-warm-terracotta hover:text-white transition-colors"
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>
        );
      })}
      <p className="font-sans text-[11px] text-outline">
        El hueco entre bloques (p. ej. 13:00–15:00) se interpreta como descanso/almuerzo. Un solo bloque = jornada corrida.
      </p>
    </div>
  );
}

export function BreakConfigView({
  trabajadores,
  configuracion,
  bloqueos,
  onSaveDefaultHorario,
  onSaveWorkerHorario,
  onCreateBloqueo,
  onUpdateBloqueo,
  onDeleteBloqueo,
}: BreakConfigViewProps) {
  const [tab, setTab] = useState<"horario" | "bloqueos">("horario");

  const defaultParsed = useMemo(() => parseHorario(configuracion?.horarioGlobal || ""), [configuracion?.horarioGlobal]);
  const defaultRaw = useMemo(() => serializeHorario(defaultParsed), [defaultParsed]);

  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
  const [showDefault, setShowDefault] = useState(false);

  const [workerDraft, setWorkerDraft] = useState<HorarioDraft>({});
  const [defaultDraft, setDefaultDraft] = useState<HorarioDraft>({});

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const selectedWorker = trabajadores.find((t) => t.id === selectedWorkerId) || null;

  useEffect(() => {
    if (!selectedWorkerId && trabajadores.length) setSelectedWorkerId(trabajadores[0].id);
  }, [trabajadores, selectedWorkerId]);

  useEffect(() => {
    setWorkerDraft(parseHorario(selectedWorker?.horarioLaboral || ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkerId, trabajadores]);

  useEffect(() => {
    setDefaultDraft(JSON.parse(JSON.stringify(defaultParsed)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultRaw]);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 3500);
  };

  const handleSaveWorker = async () => {
    if (!selectedWorker) return;
    setSaving(true);
    try {
      await onSaveWorkerHorario(selectedWorker.id, serializeHorario(workerDraft));
      flash("Horario guardado correctamente.");
    } catch {
      flash("Error al guardar el horario.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDefault = async () => {
    setSaving(true);
    try {
      await onSaveDefaultHorario(serializeHorario(defaultDraft));
      flash("Horario predeterminado guardado.");
    } catch {
      flash("Error al guardar el horario predeterminado.");
    } finally {
      setSaving(false);
    }
  };

  const applyDefaultToWorker = () => {
    if (!selectedWorker) return;
    setWorkerDraft(JSON.parse(JSON.stringify(defaultDraft)));
    flash("Horario predeterminado cargado. Revisa y pulsa 'Guardar horario'.");
  };

  // Bloqueos state
  const [editingBloqueo, setEditingBloqueo] = useState<Bloqueo | null>(null);
  const [bloqueoModalOpen, setBloqueoModalOpen] = useState(false);
  const [form, setForm] = useState<BloqueoInput>({
    name: "",
    fechaInicio: "",
    fechaFin: "",
    horaInicio: "",
    horaFin: "",
    trabajadorId: "",
  });
  const [allDay, setAllDay] = useState(false);
  const [savingBloqueo, setSavingBloqueo] = useState(false);

  const openNewBloqueo = () => {
    setEditingBloqueo(null);
    setForm({ name: "", fechaInicio: "", fechaFin: "", horaInicio: "", horaFin: "", trabajadorId: "" });
    setAllDay(false);
    setBloqueoModalOpen(true);
  };

  const openEditBloqueo = (b: Bloqueo) => {
    setEditingBloqueo(b);
    setBloqueoModalOpen(true);
    setForm({
      name: b.name,
      fechaInicio: b.fechaInicio,
      fechaFin: b.fechaFin,
      horaInicio: b.horaInicio,
      horaFin: b.horaFin,
      trabajadorId: b.trabajadorId || "",
    });
    setAllDay(!b.horaFin);
  };

  const applyPreset = (tipo: "vacaciones" | "feriado" | "puntual") => {
    if (tipo === "vacaciones") {
      setForm((f) => ({ ...f, name: "Vacaciones", horaInicio: "", horaFin: "" }));
      setAllDay(true);
    } else if (tipo === "feriado") {
      setForm((f) => ({ ...f, name: "Feriado", horaInicio: "", horaFin: "", fechaFin: "" }));
      setAllDay(true);
    } else {
      setForm((f) => ({ ...f, name: "Cierre puntual" }));
      setAllDay(false);
    }
  };

  const handleSaveBloqueo = async () => {
    if (!form.name || !form.fechaInicio) return;
    setSavingBloqueo(true);
    const payload: BloqueoInput = {
      name: form.name,
      fechaInicio: form.fechaInicio,
      fechaFin: form.fechaFin,
      horaInicio: allDay ? "" : form.horaInicio,
      horaFin: allDay ? "" : form.horaFin,
      trabajadorId: form.trabajadorId || undefined,
    };
    try {
      if (editingBloqueo) await onUpdateBloqueo(editingBloqueo.id, payload);
      else await onCreateBloqueo(payload);
      setEditingBloqueo(null);
      setBloqueoModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingBloqueo(false);
    }
  };

  return (
    <div className="w-full text-left space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-sans text-[11px] font-black text-secondary uppercase tracking-widest">Panel Administrativo Canino</span>
          <h2 className="font-serif text-3xl md:text-5xl text-primary font-bold mt-1">Horarios &amp; Descansos</h2>
          <p className="font-sans text-xs text-on-surface-variant mt-1.5 font-medium">
            Configura el horario de cada trabajador, el horario predeterminado del salón y los bloqueos puntuales.
          </p>
        </div>
        <div className="flex p-1 bg-surface-container rounded-full border border-outline-variant/20 bg-[#f9f6f0]">
          {(["horario", "bloqueos"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 px-6 py-2 rounded-full font-sans text-xs font-bold transition-all cursor-pointer ${
                tab === t ? "bg-white shadow-sm text-primary" : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {t === "horario" ? "Horario" : "Bloqueos"}
            </button>
          ))}
        </div>
      </div>

      {tab === "horario" && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {trabajadores.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedWorkerId(t.id)}
                className={`px-4 py-2 rounded-full font-sans text-xs font-bold border transition-all cursor-pointer ${
                  selectedWorkerId === t.id ? "bg-primary text-white border-primary" : "bg-white text-on-surface-variant border-outline-variant/25 hover:border-primary/40"
                }`}
              >
                {t.nombre}
              </button>
            ))}
            <button
              onClick={() => setShowDefault((v) => !v)}
              className={`px-4 py-2 rounded-full font-sans text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                showDefault ? "bg-secondary text-white border-secondary" : "bg-white text-on-surface-variant border-outline-variant/25 hover:border-secondary/40"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">tune</span>
              Horario predeterminado
            </button>
          </div>

          {/* Panel predeterminado */}
          {showDefault && (
            <div className="bg-surface-container-low/40 border border-secondary/20 rounded-3xl p-5 md:p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-primary">Horario predeterminado del salón</h3>
                  <p className="text-[11px] text-on-surface-variant">
                    Es la plantilla de la que parten los trabajadores nuevos y la que puedes aplicar a un trabajador concreto.
                  </p>
                </div>
                <button
                  onClick={handleSaveDefault}
                  disabled={saving}
                  className="px-5 py-2.5 bg-secondary hover:bg-secondary/90 text-white font-sans text-xs font-bold rounded-full cursor-pointer shrink-0"
                >
                  {saving ? "Guardando..." : "Guardar predeterminado"}
                </button>
              </div>
              {renderEditor(defaultDraft, makeHandlers(setDefaultDraft))}
            </div>
          )}

          {selectedWorker ? (
            <div className="bg-white rounded-3xl border border-outline-variant/15 p-5 md:p-6 space-y-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif text-base font-bold text-primary">Horario de {selectedWorker.nombre}</h3>
                  <p className="text-[11px] text-on-surface-variant">Calendario de trabajo independiente de {selectedWorker.nombre}.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={applyDefaultToWorker}
                    className="px-4 py-2 bg-ivory-base hover:bg-surface-container text-primary font-sans text-[11px] font-bold rounded-full cursor-pointer border border-outline-variant/25 flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[15px]">download</span>
                    Aplicar horario predeterminado
                  </button>
                  <button
                    onClick={handleSaveWorker}
                    disabled={saving}
                    className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-sans text-xs font-bold rounded-full cursor-pointer"
                  >
                    {saving ? "Guardando..." : "Guardar horario"}
                  </button>
                </div>
              </div>
              {renderEditor(workerDraft, makeHandlers(setWorkerDraft))}
            </div>
          ) : (
            <p className="text-xs text-outline italic">No hay trabajadores configurados.</p>
          )}

          {msg && <p className="text-xs font-bold text-secondary">{msg}</p>}
        </section>
      )}

      {tab === "bloqueos" && (
        <section className="space-y-5">
          <div className="flex justify-between items-center">
            <p className="font-sans text-xs text-on-surface-variant">
              Vacaciones, feriados y cierres puntuales. Puedes aplicarlos a todo el equipo o a un trabajador concreto.
            </p>
            <button
              onClick={openNewBloqueo}
              className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-sans text-xs font-bold rounded-full cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">add</span> Nuevo bloqueo
            </button>
          </div>

          <div className="space-y-3">
            {bloqueos.map((b) => (
              <div key={b.id} className="bg-white border border-outline-variant/15 rounded-3xl p-4 flex items-center justify-between gap-3 shadow-xs">
                <div className="text-left min-w-0">
                  <h4 className="font-sans text-sm font-extrabold text-primary">{b.name}</h4>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    {b.fechaInicio}
                    {b.fechaFin && b.fechaFin !== b.fechaInicio ? ` al ${b.fechaFin}` : ""}
                    {b.horaInicio ? ` · ${b.horaInicio}–${b.horaFin}` : " · Todo el día"}
                  </p>
                  <span className="text-[10px] font-bold text-outline mt-0.5 block">
                    {b.trabajadorName ? `Trabajador: ${b.trabajadorName}` : "Todo el equipo"}
                  </span>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => openEditBloqueo(b)}
                    className="p-1.5 bg-primary/5 text-primary hover:bg-primary hover:text-white rounded-full cursor-pointer transition-colors"
                    title="Editar"
                  >
                    <span className="material-symbols-outlined text-[15px]">edit</span>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`¿Desbloquear/eliminar "${b.name}"?`)) onDeleteBloqueo(b.id);
                    }}
                    className="p-1.5 bg-warm-terracotta/10 text-warm-terracotta hover:bg-warm-terracotta hover:text-white rounded-full cursor-pointer transition-colors"
                    title="Eliminar"
                  >
                    <span className="material-symbols-outlined text-[15px]">delete</span>
                  </button>
                </div>
              </div>
            ))}

            {bloqueos.length === 0 && (
              <p className="text-xs text-outline italic text-center py-8">No hay bloqueos. La agenda está libre de límites.</p>
            )}
          </div>
        </section>
      )}

      {/* Modal bloqueo */}
      {bloqueoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4" onClick={() => { setBloqueoModalOpen(false); setEditingBloqueo(null); }}>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-bold text-primary mb-4">{editingBloqueo ? "Editar bloqueo" : "Nuevo bloqueo"}</h3>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => applyPreset("vacaciones")} className="px-3 py-1 text-[10px] font-bold rounded-full bg-surface-container text-primary cursor-pointer">Vacaciones</button>
                <button onClick={() => applyPreset("feriado")} className="px-3 py-1 text-[10px] font-bold rounded-full bg-surface-container text-primary cursor-pointer">Feriado</button>
                <button onClick={() => applyPreset("puntual")} className="px-3 py-1 text-[10px] font-bold rounded-full bg-surface-container text-primary cursor-pointer">Cierre puntual</button>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface pl-1 block">Título</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ej. Vacaciones de verano" className="w-full px-4 py-2 border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface pl-1 block">Desde</label>
                  <input type="date" value={form.fechaInicio} onChange={(e) => setForm((f) => ({ ...f, fechaInicio: e.target.value }))} className="w-full px-3 py-2 border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface pl-1 block">Hasta</label>
                  <input type="date" value={form.fechaFin} onChange={(e) => setForm((f) => ({ ...f, fechaFin: e.target.value }))} className="w-full px-3 py-2 border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary" />
                </div>
              </div>

              <label className="flex items-center gap-2 text-[11px] font-bold text-on-surface cursor-pointer">
                <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="rounded border-outline-variant text-primary focus:ring-primary accent-primary h-3.5 w-3.5" />
                Todo el día
              </label>

              {!allDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-on-surface pl-1 block">Desde hora</label>
                    <input type="time" value={form.horaInicio} onChange={(e) => setForm((f) => ({ ...f, horaInicio: e.target.value }))} className="w-full px-3 py-2 border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-on-surface pl-1 block">Hasta hora</label>
                    <input type="time" value={form.horaFin} onChange={(e) => setForm((f) => ({ ...f, horaFin: e.target.value }))} className="w-full px-3 py-2 border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary" />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface pl-1 block">Aplica a</label>
                <select value={form.trabajadorId} onChange={(e) => setForm((f) => ({ ...f, trabajadorId: e.target.value }))} className="w-full px-4 py-2 border border-outline-variant rounded-full text-xs text-on-surface bg-white focus:outline-none focus:border-primary">
                  <option value="">Todo el equipo</option>
                  {trabajadores.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button onClick={() => { setBloqueoModalOpen(false); setEditingBloqueo(null); }} className="px-5 py-2 bg-white border border-outline-variant/30 text-primary font-sans text-xs font-bold rounded-full cursor-pointer">Cancelar</button>
                <button onClick={handleSaveBloqueo} disabled={savingBloqueo} className="px-5 py-2 bg-primary text-white font-sans text-xs font-bold rounded-full cursor-pointer">{savingBloqueo ? "Guardando..." : "Guardar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}