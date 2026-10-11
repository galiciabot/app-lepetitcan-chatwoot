import React, { useEffect, useMemo, useState } from "react";
import { Trabajador, Configuracion, Bloqueo, HorarioBloque } from "../types";
import { parseHorario, serializeHorario } from "../services/odooService";

const WEEKDAYS: { key: string; label: string; mini: string }[] = [
  { key: "lunes", label: "Lunes", mini: "Lun" },
  { key: "martes", label: "Martes", mini: "Mar" },
  { key: "miércoles", label: "Miércoles", mini: "Mié" },
  { key: "jueves", label: "Jueves", mini: "Jue" },
  { key: "viernes", label: "Viernes", mini: "Vie" },
  { key: "sábado", label: "Sábado", mini: "Sáb" },
  { key: "domingo", label: "Domingo", mini: "Dom" },
];

const DAY_KEYS = WEEKDAYS.map((d) => d.key);

function blocksEqual(a?: HorarioBloque[], b?: HorarioBloque[]): boolean {
  const aa = a || [];
  const bb = b || [];
  if (aa.length !== bb.length) return false;
  return aa.every((blk, i) => blk[0] === bb[i][0] && blk[1] === bb[i][1]);
}

function mergeHorario(
  global: Record<string, HorarioBloque[]>,
  override: Record<string, HorarioBloque[]>
): Record<string, HorarioBloque[]> {
  const out: Record<string, HorarioBloque[]> = {};
  for (const day of DAY_KEYS) {
    out[day] = Object.prototype.hasOwnProperty.call(override, day) ? (override[day] || []) : (global[day] || []);
  }
  return out;
}

function diffHorario(
  effective: Record<string, HorarioBloque[]>,
  global: Record<string, HorarioBloque[]>
): Record<string, HorarioBloque[]> {
  const override: Record<string, HorarioBloque[]> = {};
  for (const day of DAY_KEYS) {
    if (!blocksEqual(effective[day], global[day])) {
      override[day] = effective[day] || [];
    }
  }
  return override;
}

interface BreakConfigViewProps {
  trabajadores: Trabajador[];
  configuracion: Configuracion | null;
  bloqueos: Bloqueo[];
  onSaveGlobalHorario: (horarioGlobal: string) => Promise<void>;
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

export function BreakConfigView({
  trabajadores,
  configuracion,
  bloqueos,
  onSaveGlobalHorario,
  onSaveWorkerHorario,
  onCreateBloqueo,
  onUpdateBloqueo,
  onDeleteBloqueo,
}: BreakConfigViewProps) {
  const [tab, setTab] = useState<"horario" | "bloqueos">("horario");
  const [scope, setScope] = useState<string>("global");

  const globalParsed = useMemo(() => parseHorario(configuracion?.horarioGlobal || ""), [configuracion?.horarioGlobal]);
  const globalRaw = useMemo(() => serializeHorario(globalParsed), [globalParsed]);
  const worker = trabajadores.find((t) => t.id === scope);

  const [horarioDraft, setHorarioDraft] = useState<Record<string, HorarioBloque[]>>({});
  const [savingHorario, setSavingHorario] = useState(false);
  const [horarioMsg, setHorarioMsg] = useState<string | null>(null);

  useEffect(() => {
    if (scope === "global") {
      setHorarioDraft(JSON.parse(JSON.stringify(globalParsed)));
    } else if (worker) {
      const override = parseHorario(worker.horarioLaboral);
      setHorarioDraft(JSON.parse(JSON.stringify(mergeHorario(globalParsed, override))));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, trabajadores, globalRaw]);

  const updateBlock = (day: string, idx: number, field: 0 | 1, value: string) => {
    setHorarioDraft((prev) => {
      const next = { ...prev };
      const blocks = (next[day] || []).map((b) => [...b] as HorarioBloque);
      if (blocks[idx]) blocks[idx][field] = value;
      next[day] = blocks;
      return next;
    });
  };

  const addBlock = (day: string) =>
    setHorarioDraft((prev) => ({ ...prev, [day]: [...(prev[day] || []), ["09:00", "18:00"]] }));

  const removeBlock = (day: string, idx: number) =>
    setHorarioDraft((prev) => ({ ...prev, [day]: (prev[day] || []).filter((_, i) => i !== idx) }));

  const clearDay = (day: string) => setHorarioDraft((prev) => ({ ...prev, [day]: [] }));

  const handleSaveHorario = async () => {
    setSavingHorario(true);
    setHorarioMsg(null);
    try {
      if (scope === "global") {
        await onSaveGlobalHorario(serializeHorario(horarioDraft));
      } else if (worker) {
        const override = diffHorario(horarioDraft, globalParsed);
        await onSaveWorkerHorario(worker.id, serializeHorario(override));
      }
      setHorarioMsg("Horario guardado correctamente.");
    } catch (err) {
      setHorarioMsg("Error al guardar el horario.");
    } finally {
      setSavingHorario(false);
      setTimeout(() => setHorarioMsg(null), 3500);
    }
  };

  // Bloqueos state
  const [editingBloqueo, setEditingBloqueo] = useState<Bloqueo | null>(null);
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
  };

  const openEditBloqueo = (b: Bloqueo) => {
    setEditingBloqueo(b);
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
            Configura el horario semanal del salón, los descansos de cada trabajador y los bloqueos puntuales.
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
            <button
              onClick={() => setScope("global")}
              className={`px-4 py-2 rounded-full font-sans text-xs font-bold border transition-all cursor-pointer ${
                scope === "global" ? "bg-primary text-white border-primary" : "bg-white text-on-surface-variant border-outline-variant/25 hover:border-primary/40"
              }`}
            >
              Horario del salón (global)
            </button>
            {trabajadores.map((t) => (
              <button
                key={t.id}
                onClick={() => setScope(t.id)}
                className={`px-4 py-2 rounded-full font-sans text-xs font-bold border transition-all cursor-pointer ${
                  scope === t.id ? "bg-primary text-white border-primary" : "bg-white text-on-surface-variant border-outline-variant/25 hover:border-primary/40"
                }`}
              >
                {t.nombre}
              </button>
            ))}
          </div>

          {scope !== "global" && (
            <p className="text-[11px] text-on-surface-variant bg-ivory-base/60 border border-outline-variant/15 rounded-2xl px-4 py-3">
              Estás editando el horario de <b>{worker?.nombre}</b>. Los días que dejes igual que el horario global se heredarán automáticamente; solo se guardan las diferencias.
            </p>
          )}

          <div className="bg-white rounded-3xl border border-outline-variant/15 p-5 md:p-6 space-y-3 shadow-sm">
            {WEEKDAYS.map((day) => {
              const blocks = horarioDraft[day.key] || [];
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
                            onChange={(e) => updateBlock(day.key, idx, 0, e.target.value)}
                            className="px-2 py-1 border border-outline-variant/30 rounded-lg text-xs text-on-surface bg-white focus:outline-none focus:border-primary"
                          />
                          <span className="text-outline text-[10px]">–</span>
                          <input
                            type="time"
                            value={b[1]}
                            onChange={(e) => updateBlock(day.key, idx, 1, e.target.value)}
                            className="px-2 py-1 border border-outline-variant/30 rounded-lg text-xs text-on-surface bg-white focus:outline-none focus:border-primary"
                          />
                          <button
                            onClick={() => removeBlock(day.key, idx)}
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
                      onClick={() => addBlock(day.key)}
                      className="px-2.5 py-1 text-[10px] font-bold text-primary bg-primary/5 border border-primary/15 rounded-full cursor-pointer hover:bg-primary hover:text-white transition-colors"
                    >
                      {blocks.length ? "+ Bloque" : "Abrir"}
                    </button>
                    {blocks.length > 0 && (
                      <button
                        onClick={() => clearDay(day.key)}
                        className="px-2.5 py-1 text-[10px] font-bold text-warm-terracotta bg-warm-terracotta/5 border border-warm-terracotta/15 rounded-full cursor-pointer hover:bg-warm-terracotta hover:text-white transition-colors"
                      >
                        Cerrar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
              <span className="font-sans text-[11px] text-outline">
                El hueco entre bloques (p. ej. 13:00–15:00) se interpreta como descanso/almuerzo. Un solo bloque = jornada corrida.
              </span>
              <button
                onClick={handleSaveHorario}
                disabled={savingHorario}
                className="px-6 py-3 bg-primary hover:bg-primary/95 text-white font-sans text-xs font-bold rounded-full cursor-pointer shrink-0"
              >
                {savingHorario ? "Guardando..." : "Guardar horario"}
              </button>
            </div>

            {horarioMsg && <p className="text-xs font-bold text-secondary">{horarioMsg}</p>}
          </div>
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
      {editingBloqueo !== null && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4" onClick={() => setEditingBloqueo(null)}>
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
                <button onClick={() => setEditingBloqueo(null)} className="px-5 py-2 bg-white border border-outline-variant/30 text-primary font-sans text-xs font-bold rounded-full cursor-pointer">Cancelar</button>
                <button onClick={handleSaveBloqueo} disabled={savingBloqueo} className="px-5 py-2 bg-primary text-white font-sans text-xs font-bold rounded-full cursor-pointer">{savingBloqueo ? "Guardando..." : "Guardar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}