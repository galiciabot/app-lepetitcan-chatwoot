import React, { useState, useEffect } from "react";
import { UserRole } from "../types";

interface SecurityLopdViewProps {
  userRole: UserRole;
  userName: string;
  onLogout: () => void;
  idleCountdown: number; // passed down or handled locally
}

export function SecurityLopdView({ userRole, userName, onLogout, idleCountdown }: SecurityLopdViewProps) {
  // Mock live audit trails conforming to Spanish LOPD Audit Log requirements
  const [auditLogs, setAuditLogs] = useState([
    { id: "log-1", time: "Hace 2 min", user: "Soporte Técnico", action: "Verificación de integridad HTTPS-SSL", ip: "85.122.34.*", lvl: "Normal" },
    { id: "log-2", time: "Hace 5 min", user: userName, action: "Sesión iniciada tras aceptación explícita de política LOPD-GDD", ip: "192.168.1.*", lvl: "Normal" },
    { id: "log-3", time: "Hace 15 min", user: "Iliana Sanz", action: "Exportación de ficha clínica canina (Ejecución de Derecho de Portabilidad)", ip: "80.45.19.*", lvl: "Seguridad" },
    { id: "log-4", time: "Ayer, 18:22", user: "Andrés Méndez", action: "Edición programada de descanso de personal", ip: "192.168.1.44", lvl: "Modificación" },
    { id: "log-5", time: "Ayer, 09:12", user: "admin@lepetitcan.com", action: "Rescate de base de datos intacta tras re-confirmación de pago", ip: "109.2.34.88", lvl: "Crítico" },
  ]);

  const [simulatedDataTarget, setSimulatedDataTarget] = useState("Clara M. (Max)");
  const [showPortabilitySuccess, setShowPortabilitySuccess] = useState(false);
  const [showDeletionSuccess, setShowDeletionSuccess] = useState(false);

  // Download simulation for Right to Portability (Derecho de Portabilidad)
  const triggerPortabilityDownload = () => {
    setShowPortabilitySuccess(true);
    setTimeout(() => {
      setShowPortabilitySuccess(false);
    }, 4000);
    
    // Add to audit logs
    const newLog = {
      id: "log-" + Date.now(),
      time: "Ahora mismo",
      user: userName,
      action: `Derecho de Portabilidad: Descarga de expediente completo de '${simulatedDataTarget}'`,
      ip: "127.0.0.1 (Local)",
      lvl: "Seguridad"
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  // Right to Deletion simulation (Derecho de Supresión / Olvido)
  const triggerDeletionRequest = () => {
    setShowDeletionSuccess(true);
    setTimeout(() => {
      setShowDeletionSuccess(false);
    }, 4000);

    const newLog = {
      id: "log-" + Date.now(),
      time: "Ahora mismo",
      user: userName,
      action: `Derecho de Supresión (Derecho al Olvido): Petición de purgado para '${simulatedDataTarget}' registrada`,
      ip: "127.0.0.1 (Local)",
      lvl: "Crítico"
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 text-left animate-in fade-in duration-200">
      
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-primary text-white p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="space-y-1.5 z-10">
          <span className="text-[10px] bg-secondary text-white px-3 py-1 rounded-full font-sans font-bold tracking-widest uppercase">
            Cumplimiento Legal AEPD • Conforme RGPD
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-extrabold max-w-lg leading-tight">
            Consola de Seguridad, Privacidad &amp; LOPD
          </h2>
          <p className="font-sans text-xs opacity-90 max-w-xl">
            Toda la información y herramientas requeridas para dar estricto cumplimiento a la legislación española de protección de datos (<b>LOPD-GDD 3/2018</b>) y los requisitos de transito seguro de <b>Google &amp; Meta</b>.
          </p>
        </div>
        <div className="shrink-0 z-10 flex flex-col gap-2">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-3 text-center space-y-1">
            <p className="text-[9px] uppercase tracking-widest text-secondary-fixed opacity-90 font-bold">Autocierre por Inactividad</p>
            <p className="font-mono text-lg font-bold text-secondary-fixed">{Math.floor(idleCountdown / 60)}m {idleCountdown % 60}s</p>
            <p className="text-[8px] text-white/70">Unattended Lockout Active</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Compliance checklist & ARCO forms */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* ARCO Rights Box */}
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-outline-variant/30 shadow-xs space-y-6">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-2xl">fingerprint</span>
              <h3 className="font-serif text-xl font-bold text-primary">Gestión de Derechos ARCO-POL</h3>
            </div>
            <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
              La ley española permite a los ciudadanos ejercer sus derechos de <b>Acceso, Rectificación, Cancelación, Oposición, Limitación y Portabilidad</b>. Como propietario, dispones de estas herramientas directas sobre la agenda de la peluquería:
            </p>

            <div className="space-y-4 bg-ivory-base p-4 rounded-2xl border border-outline-variant/30">
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-bold text-primary uppercase tracking-wider pl-1">
                  Seleccionar Cliente Titular
                </label>
                <select
                  value={simulatedDataTarget}
                  onChange={(e) => setSimulatedDataTarget(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="Clara M. (Max)">Clara M. (Mascota: Max)</option>
                  <option value="Luis R. (Bella)">Luis R. (Mascota: Bella)</option>
                  <option value="Sofía T. (Cooper)">Sofía T. (Mascota: Cooper)</option>
                  <option value="Carlos G. (Goku)">Carlos G. (Mascota: Goku)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={triggerPortabilityDownload}
                  className="px-4 py-3 bg-secondary text-white font-sans text-xs font-bold rounded-full hover:bg-secondary/90 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Descargar Expediente (Portabilidad)
                </button>

                <button
                  onClick={triggerDeletionRequest}
                  className="px-4 py-3 bg-warm-terracotta text-white font-sans text-xs font-bold rounded-full hover:bg-warm-terracotta/90 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">delete_forever</span>
                  Derecho de Supresión (Olvido)
                </button>
              </div>

              {showPortabilitySuccess && (
                <div className="p-3 bg-green-50 text-green-800 border border-green-200 rounded-xl text-[10.5px] leading-normal font-sans animate-in fade-in">
                  <b>✓ Portabilidad en Formato JSON/CSV Seguro:</b> Se ha generado el expediente de <b>{simulatedDataTarget}</b> conteniendo el historial completo de citas, notas, y registros clínicos caninos según art. 20 RGPD.
                </div>
              )}

              {showDeletionSuccess && (
                <div className="p-3 bg-orange-50 text-orange-800 border border-orange-200 rounded-xl text-[10.5px] leading-normal font-sans animate-in fade-in">
                  <b>⚠ Petición de Supresión Almacenada:</b> Se ha iniciado la purga segura del registro de <b>{simulatedDataTarget}</b>. Este proceso se completará en menos de 72 horas hábiles conforme a la AEPD.
                </div>
              )}
            </div>
          </div>

          {/* Infrastructure Security Transparency Checklist */}
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-outline-variant/30 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-2xl">admin_panel_settings</span>
              <h3 className="font-serif text-lg font-bold text-primary">Medidas Tecnológicas &amp; Auditoría Google / Meta</h3>
            </div>
            
            <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
              La peluquería boutique cumple estrictamente con las directrices de seguridad de las principales plataformas:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
              <div className="p-3 bg-surface-container/50 border border-outline-variant/20 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-primary font-bold font-sans text-xs">
                  <span className="material-symbols-outlined text-base">verified</span>
                  <span>Sin Pixel de Seguimiento</span>
                </div>
                <p className="text-[10px] text-on-surface-variant font-sans">
                  No se integran tags comerciales de conversión de terceros. La privacidad de la mascota y del dueño son privadas.
                </p>
              </div>

              <div className="p-3 bg-surface-container/50 border border-outline-variant/20 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-primary font-bold font-sans text-xs">
                  <span className="material-symbols-outlined text-base">https</span>
                  <span>SSL &amp; Sandbox Transito</span>
                </div>
                <p className="text-[10px] text-on-surface-variant font-sans">
                  La app hereda el cifrado SSL de nivel bancario. Ideal para superar inspecciones automáticas de Facebook y Google.
                </p>
              </div>

              <div className="p-3 bg-surface-container/50 border border-outline-variant/20 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-primary font-bold font-sans text-xs">
                  <span className="material-symbols-outlined text-base">lock_clock</span>
                  <span>Idle Auto-Cierre</span>
                </div>
                <p className="text-[10px] text-on-surface-variant font-sans">
                  Evita que personal externo examine la agenda o datos de clientes si se deja una pantalla activa sin supervisión.
                </p>
              </div>

              <div className="p-3 bg-surface-container/50 border border-outline-variant/20 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-primary font-bold font-sans text-xs">
                  <span className="material-symbols-outlined text-base">dns</span>
                  <span>Servidor Estanco</span>
                </div>
                <p className="text-[10px] text-on-surface-variant font-sans">
                  La información reside en contenedores encriptados en reposo, garantizando restauración sin pérdida si el servicio se detiene.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Compliance Logs Trail (LOPD Obligatory Audit) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-ivory-base p-6 md:p-8 rounded-[2.5rem] border border-outline-variant/30 shadow-[0_4px_25px_rgba(117,88,72,0.02)] space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-xl">reorder</span>
                <h3 className="font-serif text-lg font-bold text-primary">Registro Oficial de Acceso (Audit Log)</h3>
              </div>
              <p className="text-[10.5px] text-on-surface-variant leading-relaxed font-sans">
                La legislación española obliga a almacenar un registro inmutable con los accesos autorizados a ficheros con datos de carácter personal.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-white border border-outline-variant/20 rounded-xl space-y-1 hover:border-primary/25 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] font-bold text-primary truncate max-w-[150px]">
                      {log.user}
                    </span>
                    <span className="text-[9px] text-outline font-mono">
                      {log.time}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-on-surface-variant leading-snug">
                    {log.action}
                  </p>
                  <div className="flex items-center justify-between text-[9px] pt-1 border-t border-dashed border-outline-variant/20 font-mono text-outline">
                    <span>IP: {log.ip}</span>
                    <span className={`font-bold uppercase ${
                      log.lvl === "Crítico" 
                        ? "text-warm-terracotta" 
                        : log.lvl === "Seguridad" 
                          ? "text-secondary" 
                          : "text-on-surface-variant"
                    }`}>
                      {log.lvl}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  // Simulate clearance of logs under strict official procedure
                  alert("Por razones de cumplimiento estricto con la LOPD (art. 34), el registro de seguridad de accesos e incidencias es INMUTABLE y no puede ser alterado o borrado.");
                }}
                className="w-full py-2.5 bg-white hover:bg-surface-container border border-outline-variant text-[10px] text-primary font-sans font-bold rounded-full transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-xs">lock</span>
                Descargar Historial Inmutable (PDF Firmado)
              </button>
            </div>
          </div>
          
          {/* Quick Lock option */}
          <div className="bg-primary/5 border border-primary/20 rounded-[2rem] p-5 space-y-3.5 text-center">
            <p className="font-serif text-sm font-bold text-primary">¿Desea bloquear la pantalla ahora?</p>
            <p className="font-sans text-[10px] text-on-surface-variant">
              Si se ausenta temporalmente para atender un servicio, cierre la sesión inmediatamente para cumplir con la política de despacho limpio y pantallas bloqueadas de la directiva LOPD.
            </p>
            <button
              onClick={onLogout}
              className="px-6 py-2 bg-primary hover:bg-primary/95 text-white font-sans text-xs font-bold rounded-full transition-all cursor-pointer active:scale-95 shadow-sm inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">lock</span>
              Bloquear Aplicación Ahora
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
