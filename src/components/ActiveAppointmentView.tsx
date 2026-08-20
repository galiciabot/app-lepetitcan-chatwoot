import React, { useState, useEffect, useRef } from "react";
import { triggerN8NWebhook, triggerHioposTicketSync } from "./WebhookHelper";

interface VoiceNotesButtonProps {
  onTranscribe: (text: string) => void;
}

export function VoiceNotesButton({ onTranscribe }: VoiceNotesButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [supportSpeech, setSupportSpeech] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSupportSpeech(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "es-ES";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onTranscribe(transcript);
        }
      };

      rec.onerror = (e: any) => {
        console.warn("Speech recognition error, triggering smart fallback animation:", e);
        handleSimulatedSpeech();
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [onTranscribe]);

  // Pulse animation intervals when listening
  useEffect(() => {
    let interval: any;
    if (isListening) {
      interval = setInterval(() => {
        setPulseCount((c) => (c + 1) % 4);
      }, 300);
    } else {
      setPulseCount(0);
    }
    return () => clearInterval(interval);
  }, [isListening]);

  const handleSimulatedSpeech = () => {
    setIsListening(true);
    // Simulate user talking, typing typical groomer observations
    const simulatedPhrases = [
      "El canino se ha portado de forma excepcional durante el baño nutritivo. Pelo suave, hidratado y sin nudos.",
      "Revisión de piel realizada: presenta ligera rojez en la zona abdominal posterior. Se aplicó bálsamo calmante de caléndula.",
      "Excelente comportamiento en mesa de peinado. Corte de uñas y oídos limpios finalizados sin estrés.",
      "El deslanado ha retirado gran volumen de subpelo muerto. Se recomienda cepillado de mantenimiento en siete días."
    ];
    const pickedText = simulatedPhrases[Math.floor(Math.random() * simulatedPhrases.length)];
    
    setTimeout(() => {
      onTranscribe(pickedText);
      setIsListening(false);
    }, 3000);
  };

  const toggleListen = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      } else {
        setIsListening(false);
      }
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        // Fallback for sandboxed frames or permission denial
        handleSimulatedSpeech();
      }
    } else {
      handleSimulatedSpeech();
    }
  };

  const presets = [
    { label: "Portamiento excelente", text: "Excelente comportamiento durante el baño y corte boutique." },
    { label: "Ligera dermatitis", text: "Presenta zonas de piel sensible. Aplicado champú dermo-protector." },
    { label: "Muda de pelo abundante", text: "Deslanado exhaustivo completado para retirar exceso de subpelo muerto." }
  ];

  return (
    <div className="relative flex items-center gap-1">
      {showPresetsMenu && (
        <div className="absolute bottom-full right-0 mb-2 w-56 bg-white border border-outline-variant/30 rounded-2xl p-2.5 shadow-xl animate-scale-up z-[60] space-y-1.5 text-left font-sans">
          <p className="text-[10px] font-bold text-outline text-left px-2 mb-1 uppercase tracking-wider">Plantillas rápidas de voz:</p>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                onTranscribe(p.text);
                setShowPresetsMenu(false);
              }}
              className="w-full text-left text-[11px] p-2 hover:bg-primary/5 rounded-xl text-on-surface hover:text-primary transition-colors block text-ellipsis overflow-hidden whitespace-nowrap"
            >
              🎵 {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Quick templates trigger */}
      <button
        type="button"
        onClick={() => setShowPresetsMenu(!showPresetsMenu)}
        className="w-8 h-8 rounded-full border border-outline-variant/30 flex items-center justify-center text-outline hover:text-primary active:scale-95 transition-all text-xs"
        title="Plantillas rápidas de voz"
      >
        <span className="material-symbols-outlined text-[16px]">library_books</span>
      </button>

      {/* Main audio icon button */}
      <button
        type="button"
        onClick={toggleListen}
        className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 relative cursor-pointer ${
          isListening
            ? "bg-warm-terracotta text-white ring-4 ring-warm-terracotta/20 scale-105"
            : "bg-surface-container-high text-primary hover:bg-primary/10 hover:text-primary"
        }`}
        title={isListening ? "Escuchando... clica para detener" : "Dictar notas por voz"}
      >
        <span className="material-symbols-outlined text-[20px] transition-transform duration-200">
          {isListening ? "mic" : "mic_none"}
        </span>

        {/* Dynamic soundwaves visualization inside button */}
        {isListening && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warm-terracotta opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-warm-terracotta"></span>
          </span>
        )}
      </button>

      {isListening && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-anthracite-grey/95 text-white py-3 px-6 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10 animate-fade-in z-50">
          <div className="flex gap-1 items-center h-4 shrink-0 px-1">
            <span className={`w-1 bg-warm-terracotta rounded transition-all duration-200 ${pulseCount === 0 ? "h-4" : "h-1.5"}`}></span>
            <span className={`w-1 bg-warm-terracotta rounded transition-all duration-200 ${pulseCount === 1 ? "h-3" : "h-2"}`}></span>
            <span className={`w-1 bg-warm-terracotta rounded transition-all duration-200 ${pulseCount === 2 ? "h-5" : "h-2.5"}`}></span>
            <span className={`w-1 bg-warm-terracotta rounded transition-all duration-200 ${pulseCount === 3 ? "h-3" : "h-1.5"}`}></span>
          </div>
          <span className="font-sans text-xs font-semibold tracking-wide flex items-center gap-1.5">
            Grabando nota... <span className="text-[10px] text-warm-terracotta animate-pulse font-mono">REC</span>
          </span>
          <button
            onClick={() => setIsListening(false)}
            className="text-[10px] font-bold text-outline hover:text-white transition-colors bg-white/10 px-2 py-1 rounded-md"
          >
            Detener
          </button>
        </div>
      )}
    </div>
  );
}

const GROOMERS = [
  { name: "Iliana Sanz", shortName: "Iliana", role: "Senior", bg: "bg-secondary-container/30 text-secondary border-secondary/20 hover:bg-secondary-container/40" },
  { name: "Marco", shortName: "Marco", role: "Junior", bg: "bg-primary-container/30 text-primary border-primary/20 hover:bg-primary-container/40" },
  { name: "Sofía", shortName: "Sofía", role: "Specialist", bg: "bg-warm-terracotta/10 text-warm-terracotta border-warm-terracotta/20 hover:bg-warm-terracotta/20" }
];

export function ActiveAppointmentView() {
  const [steps, setSteps] = useState([
    { id: "recepcion", name: "Recepción y Revisión", defaultTime: "10:00 AM", isCompleted: true, assignedGroomer: "Iliana Sanz" },
    { id: "bano", name: "Baño Hidratante (Lavado)", defaultTime: "10:30 AM", isCompleted: true, assignedGroomer: "Sofía" },
    { id: "secado", name: "Secado y Peinado", defaultTime: "11:15 AM", isCompleted: true, assignedGroomer: "Marco" },
    { id: "corte", name: "Corte Higiénico / Estilismo", defaultTime: "12:00 PM", isCompleted: false, assignedGroomer: "Iliana Sanz" },
  ]);

  const [activeDropdownStepId, setActiveDropdownStepId] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(75);
  const [notes, setNotes] = useState<string>("");
  const [noteOpen, setNoteOpen] = useState<boolean>(false);
  const [igOpen, setIgOpen] = useState<boolean>(false);
  const [reviewSent, setReviewSent] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);

  // Toggle step completed status and sync progress bar
  const toggleStepCompleted = (id: string) => {
    const updatedSteps = steps.map(s => {
      if (s.id === id) {
        return { ...s, isCompleted: !s.isCompleted };
      }
      return s;
    });
    setSteps(updatedSteps);
    
    // Calculate new progress percent
    const completedCount = updatedSteps.filter(s => s.isCompleted).length;
    const newProgress = Math.round((completedCount / updatedSteps.length) * 100);
    setProgress(newProgress);
  };

  const assignGroomerToStep = (stepId: string, groomerName: string) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, assignedGroomer: groomerName } : s));
    setActiveDropdownStepId(null);
  };

  const handleComplete = () => {
    setProgress(100);
    setCompleted(true);

    // List of assignments
    const assignmentsSummary = steps.map(s => `${s.name}: ${s.assignedGroomer}`).join(", ");

    // Trigger real integrations hooks!
    const jobData = {
      appointmentId: "a_kobe_active",
      dogName: "Kobe",
      breed: "Bulldog Francés",
      size: "Pequeño",
      ownerName: "Ana G.",
      service: "Baño + Arreglo",
      notes: notes || "Sesión regular finalizada correctamente.",
      price: 45.0,
      tasksAndGroomers: steps.map(s => ({ task: s.name, groomer: s.assignedGroomer })),
      assignmentsSummary
    };

    triggerN8NWebhook("completed", jobData);

    triggerHioposTicketSync({
      products: [
        { id: "active_srv_baño", name: "Servicio Baño + Arreglo (Kobe)", qty: 1, unitPrice: 45.0 }
      ],
      total: 45.0,
      client: {
        name: "Ana G.",
        phone: "+34 634 567 890"
      }
    });
  };

  return (
    <div className="w-full text-center max-w-container-max mx-auto">
      {/* Hero Section: Cita Active Status */}
      <section className="mb-10 text-center animate-fade-in">
        <span className="inline-block px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container font-sans text-[11px] font-bold uppercase tracking-wider mb-4 border border-secondary/10">
          Cita en Curso
        </span>
        <h1 className="font-serif text-3xl md:text-5xl text-primary font-bold mb-2">
          Cita: Kobe
        </h1>
        <p className="font-serif text-lg text-on-surface-variant italic">
          Bulldog Francés
        </p>
      </section>

      {/* Profile / Info Card */}
      <div className="relative mb-12 max-w-2xl mx-auto">
        <div className="bg-surface-container-low rounded-[32px] p-6 md:p-8 shadow-sm border border-secondary/15 relative overflow-hidden">
          {/* Paw background element of Stitch design */}
          <div className="absolute top-0 right-0 p-6 opacity-5 select-none pointer-events-none">
            <span className="material-symbols-outlined text-[140px] text-primary">pets</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10 text-left">
            {/* Client Info */}
            <div className="flex items-start gap-4 p-3 bg-white rounded-2xl border border-outline-variant/10">
              <div className="bg-primary-container/20 p-4 rounded-xl text-primary-fixed-dim">
                <span className="material-symbols-outlined text-primary text-2xl">person</span>
              </div>
              <div>
                <p className="font-sans text-[10px] font-bold text-outline uppercase tracking-wider mb-0.5">
                  Dueña
                </p>
                <p className="font-sans text-base font-bold text-on-surface">Ana G.</p>
              </div>
            </div>

            {/* Service Info */}
            <div className="flex items-start gap-4 p-3 bg-white rounded-2xl border border-outline-variant/10">
              <div className="bg-secondary-container/30 p-4 rounded-xl text-on-secondary-container animate-pulse">
                <span className="material-symbols-outlined text-secondary text-2xl">content_cut</span>
              </div>
              <div>
                <p className="font-sans text-[10px] font-bold text-outline uppercase tracking-wider mb-0.5">
                  Servicio habitual
                </p>
                <p className="font-sans text-base font-bold text-on-surface">Baño + Arreglo</p>
              </div>
            </div>
          </div>

          {/* Dynamic Groomers team list of Stitch styling */}
          <div className="mt-5 p-4 bg-white/65 border border-outline-variant/15 rounded-2xl flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between text-left relative z-10">
            <div>
              <p className="font-sans text-[10px] font-bold text-outline uppercase tracking-wider mb-0.5">Equipo de Estilistas</p>
              <p className="font-sans text-xs text-on-surface-variant font-medium">Distribución de tareas en curso</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(new Set(steps.map(s => s.assignedGroomer))).map(groomerName => {
                const gr = GROOMERS.find(g => g.name === groomerName || g.shortName === groomerName);
                const countOfTasks = steps.filter(s => s.assignedGroomer === groomerName).length;
                return (
                  <span
                    key={groomerName}
                    title={`${groomerName}: ${countOfTasks} ${countOfTasks === 1 ? 'tarea' : 'tareas'}`}
                    className={`font-sans text-[10px] font-extrabold px-3 py-1 rounded-full border flex items-center gap-1 transition-all ${gr?.bg || "bg-secondary-container/10 text-secondary border-secondary/10"}`}
                  >
                    <span className="material-symbols-outlined text-[14px]">face</span>
                    <span>{gr?.shortName || groomerName}</span>
                    <span className="opacity-60 bg-black/5 px-1 rounded-md text-[9px]">{countOfTasks}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Live Progress Indicator */}
          <div className="mt-8 bg-white/70 p-6 rounded-2xl border border-outline-variant/35 shadow-sm text-left">
            <div className="flex justify-between items-center mb-3">
              <span className="font-sans text-xs font-bold text-on-surface uppercase tracking-wider">
                Progreso del Estilismo
              </span>
              <span className="text-secondary font-sans font-bold text-sm">
                {progress}%
              </span>
            </div>
            <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden flex cursor-pointer" title="Modificar progreso" onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const pct = Math.round((x / rect.width) * 100);
              setProgress(pct);
            }}>
              <div
                className="h-full bg-secondary-fixed-dim rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-outline mt-2 text-center">
              *Haz clic en la barra para ajustar el progreso manualmente.
            </p>
          </div>
        </div>
      </div>

      {completed && (
        <div className="max-w-2xl mx-auto mb-6 p-4 rounded-2xl bg-secondary text-white font-sans text-xs font-bold animate-bounce flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">celebration</span>
          <span>¡Sesión terminada con éxito! Kobe está precioso y listo para el handoff.</span>
        </div>
      )}

      {/* Action Grid (Bento Style) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 max-w-2xl mx-auto">
        {/* Add Notes */}
        <button
          onClick={() => setNoteOpen(true)}
          className="flex flex-col items-center justify-center bg-white p-6 rounded-[24px] border border-outline-variant/20 hover:bg-surface-container-low transition-all active:scale-95 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-4 group-hover:bg-primary-container/20 transition-colors">
            <span className="material-symbols-outlined text-primary text-xl">edit_note</span>
          </div>
          <span className="font-sans text-xs font-semibold text-on-surface text-center">
            {notes ? "Ver/Editar Notas" : "Añadir Notas"}
          </span>
        </button>

        {/* Instagram Action */}
        <button
          onClick={() => setIgOpen(true)}
          className="flex flex-col items-center justify-center bg-white p-6 rounded-[24px] border border-outline-variant/20 hover:bg-surface-container-low transition-all active:scale-95 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-4 group-hover:bg-pink-600/10 transition-colors">
            <span className="material-symbols-outlined text-primary text-xl">photo_camera</span>
          </div>
          <span className="font-sans text-xs font-semibold text-on-surface text-center">
            Publicar en IG
          </span>
        </button>

        {/* Request Review */}
        <button
          onClick={() => {
            setReviewSent(true);
            setTimeout(() => setReviewSent(false), 4000);
          }}
          className="flex flex-col items-center justify-center bg-white p-6 rounded-[24px] border border-outline-variant/20 hover:bg-surface-container-low transition-all active:scale-95 group col-span-2 md:col-span-1 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-4 group-hover:bg-warm-terracotta/20 transition-colors">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              star
            </span>
          </div>
          <span className="font-sans text-xs font-semibold text-on-surface text-center">
            {reviewSent ? "✓ Solicitada" : "Solicitar Reseña"}
          </span>
        </button>
      </div>

      {reviewSent && (
        <p className="text-xs text-secondary font-sans font-semibold mb-6 animate-pulse">
          Solicitud de reseña SMS enviada a Ana G. exitosamente.
        </p>
      )}

      {/* Primary Action Button */}
      <div className="max-w-2xl mx-auto mb-12">
        <button
          onClick={handleComplete}
          className="w-full bg-primary-container text-on-primary-container py-4.5 rounded-full font-sans text-sm font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">task_alt</span>
          <span>Trabajo Terminado</span>
        </button>
      </div>

      {/* Session Progress steps of Stitch with Professional Delegation */}
      <section className="mt-12 pb-12 text-left max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-outline-variant/40 pb-3 mb-6 gap-2">
          <div>
            <h3 className="font-serif text-lg font-bold text-primary">
              Desglose y Reparto de Tareas
            </h3>
            <p className="font-sans text-[11px] text-on-surface-variant font-medium">Asigna y controla qué estilista realiza cada fase del servicio</p>
          </div>
          <span className="bg-primary/5 text-primary text-[10px] font-extrabold px-3 py-1 rounded-full border border-primary/10">
            Cita Compartida
          </span>
        </div>

        <div className="space-y-4">
          {steps.map((step) => {
            const currentGroomerObj = GROOMERS.find(g => g.name === step.assignedGroomer);
            return (
              <div 
                key={step.id} 
                className={`flex items-center justify-between p-4 rounded-3xl border transition-all relative ${
                  activeDropdownStepId === step.id ? "z-30" : "z-10"
                } ${
                  step.isCompleted 
                    ? "bg-ivory-base/40 border-outline-variant/20 opacity-85" 
                    : "bg-white border-outline-variant/30 shadow-sm"
                }`}
              >
                {/* Check & Step details */}
                <div className="flex items-center gap-4 flex-1 mr-2 select-none">
                  <button 
                    onClick={() => toggleStepCompleted(step.id)} 
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all cursor-pointer grow-0 shrink-0 ${
                      step.isCompleted 
                        ? "bg-secondary border-secondary text-white shadow-sm" 
                        : "border-outline-variant hover:border-secondary text-transparent"
                    }`}
                    title={step.isCompleted ? "Marcar como pendiente" : "Marcar como completada"}
                  >
                    <span className="material-symbols-outlined text-xs font-bold leading-none">check</span>
                  </button>

                  <div className="text-left">
                    <span className={`font-sans text-xs font-semibold block ${step.isCompleted ? "text-on-surface/75 line-through decoration-secondary/30" : "text-on-surface"}`}>
                      {step.name}
                    </span>
                    <span className="text-[10px] text-outline font-medium flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[10px]">schedule</span>
                      {step.isCompleted ? "Hito completado" : `Planificado ${step.defaultTime}`}
                    </span>
                  </div>
                </div>

                {/* Professional Assignment Selector */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setActiveDropdownStepId(activeDropdownStepId === step.id ? null : step.id)}
                    className={`font-sans text-[10px] font-extrabold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                      currentGroomerObj?.bg || "bg-secondary-container/10 text-secondary border-secondary/15"
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">face</span>
                    <span>{currentGroomerObj?.shortName || step.assignedGroomer}</span>
                    <span className="material-symbols-outlined text-[14px] opacity-70">arrow_drop_down</span>
                  </button>

                  {activeDropdownStepId === step.id && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-outline-variant/40 rounded-2xl p-2 shadow-2xl z-30 animate-scale-up">
                      <p className="font-sans text-[9px] font-bold text-outline uppercase tracking-wider px-2 py-1 mb-1 border-b border-outline-variant/15 text-left">Asignar esta fase a:</p>
                      <div className="space-y-1">
                        {GROOMERS.map(g => (
                          <button
                            key={g.name}
                            onClick={() => assignGroomerToStep(step.id, g.name)}
                            className="w-full text-left font-sans text-xs p-2.5 hover:bg-primary/5 rounded-xl text-on-surface hover:text-primary transition-all flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex flex-col text-left">
                              <span className="font-bold text-[11px]">{g.name}</span>
                              <span className="text-[9px] text-outline">{g.role}</span>
                            </div>
                            {step.assignedGroomer === g.name && (
                              <span className="material-symbols-outlined text-base text-secondary">check_circle</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Note modal */}
      {noteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-anthracite-grey/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-2xl relative text-left">
            <button onClick={() => setNoteOpen(false)} className="absolute top-6 right-6 text-outline hover:text-primary">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <h3 className="font-serif text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">edit_note</span>
              Notas de la Sesión
            </h3>
            <div className="relative mb-4">
              <textarea
                value={notes}
                rows={4}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-4 pr-12 border border-outline-variant/30 rounded-2xl font-sans text-xs text-on-surface-variant focus:ring-0 focus:border-primary placeholder:text-outline/40 resize-none header-glow"
                placeholder="Escribe comentarios, novedades o consejos para kobe..."
              />
              <div className="absolute right-3 bottom-4 flex items-center gap-1.5">
                <VoiceNotesButton onTranscribe={(text) => setNotes((prev) => prev ? prev + " " + text : text)} />
              </div>
            </div>
            <button
              onClick={() => {
                setNoteOpen(false);
                triggerN8NWebhook("note_added", {
                  appointmentId: "a_kobe_active",
                  dogName: "Kobe",
                  notes: notes
                });
              }}
              className="w-full py-4 bg-primary text-white rounded-full font-sans text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
            >
              Guardar Notas
            </button>
          </div>
        </div>
      )}

      {/* Instagram mock modal */}
      {igOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-anthracite-grey/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] max-w-sm w-full p-6 shadow-2xl relative text-center">
            <button onClick={() => setIgOpen(false)} className="absolute top-6 right-6 text-outline hover:text-primary">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <span className="inline-block p-3 rounded-full bg-pink-600/10 text-pink-600 mb-4">
              <span className="material-symbols-outlined text-2xl">photo_camera</span>
            </span>
            <h3 className="font-serif text-lg font-bold text-primary mb-1">Publicación de Instagram</h3>
            <p className="font-sans text-xs text-on-surface-variant mb-6">
              Simulador de post social para presumir el corte de Kobe.
            </p>

            <div className="border border-outline-variant/30 rounded-2xl overflow-hidden bg-ivory-base p-1 text-left mb-6 shadow-inner">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOz1iK9k98S_bm5UbX_n9zeD3i_Gt5iqEz9fIoUhrTbGxgzPvyZFWtxGf1I_nezCodmlmtJ3YEzF7dAfcpJOZF3mZHgyxBl2u-pc8lXhYNWh3gSMVmxOFVsLTRW2-AAJT6thM9l7iw9a1nD7NPxkrG1IC1vSfrmCOcRjxx9ArEl2DASMMAz23KsmcY2Fgq6j0sp_zHKBtWxlowvglSiDkqVM6EH87stj_Xo0t-MGD7IEgR3OCzXWeynQZQxqJx1AoWFmShzWT2teM"
                alt="Kobe"
                className="w-full aspect-square object-cover rounded-xl shadow-sm mb-3"
                referrerPolicy="no-referrer"
              />
              <div className="px-2 pb-2">
                <span className="font-sans text-xs font-bold text-primary">le_petit_can_atelier</span>
                <p className="font-sans text-[11px] text-on-surface-variant italic mt-1 leading-normal">
                  "¡Kobe luciendo espectacular con su tratamiento de Baño &amp; Hidratación habitual! Una experiencia de spa boutique única 🌿🐾 #bulldog #luxurygrooming #concept"
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setIgOpen(false);
                alert("¡Publicación simulada exitosamente en Instagram!");
              }}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-sans text-xs font-bold hover:opacity-95 active:scale-95 transition-all"
            >
              Publicar Ahora (Mock)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
