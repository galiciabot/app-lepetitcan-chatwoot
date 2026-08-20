import React from "react";

interface SaaSPaymentControlProps {
  isSuspended: boolean;
  onToggleSuspension: (val: boolean) => void;
  onLogout: () => void;
  adminName: string;
}

export function SaaSPaymentControl({
  isSuspended,
  onToggleSuspension,
  onLogout,
  adminName,
}: SaaSPaymentControlProps) {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header section with modern editorial design */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-primary text-white p-8 rounded-[2.5rem] shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="space-y-2 z-10 text-left">
          <span className="text-[10px] bg-white/10 px-3 py-1 rounded-full font-sans font-bold tracking-widest uppercase text-secondary-fixed-dim">
            CONSOLA DE HOSPEDAJE GITHUB / SAAS
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold leading-tight">
            Panel del Administrador de Sistemas
          </h2>
          <p className="font-sans text-xs opacity-90 max-w-2xl leading-relaxed">
            Bienvenido, <span className="font-bold text-secondary-fixed-dim">{adminName}</span>. Desde este portal tienes control operacional 
            sobre la licencia contratada por la peluquería <span className="italic font-serif">Le Petit Can</span>.
          </p>
        </div>
        <button
          onClick={onLogout}
          className="z-10 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 rounded-full font-sans text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          Cerrar Admin
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Core Kill Switch Panel */}
        <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-[2.5rem] border border-outline-variant/30 shadow-[0_4px_25px_rgba(117,88,72,0.02)] flex flex-col justify-between">
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">payments</span>
              <h3 className="font-serif text-xl font-bold text-primary">Estado de la Suscripción del Cliente</h3>
            </div>
            
            <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
              Como administrador encargado de alojar la aplicación en tu repositorio de GitHub, puedes desactivar o activar de forma remota 
              el acceso del cliente en caso de atraso en el pago de su cuota mensual.
            </p>

            <div className="p-4 bg-ivory-base rounded-2xl border border-outline-variant/20 flex items-center justify-between gap-4 mt-2">
              <div className="space-y-1">
                <p className="font-sans text-xs font-bold text-anthracite-grey">
                  {isSuspended ? "🔴 SERVICIO SUSPENDIDO POR IMPAGO" : "🟢 SERVICIO ACTIVO Y AL DÍA"}
                </p>
                <p className="text-[10.5px] text-on-surface-variant font-sans">
                  {isSuspended 
                    ? "Los roles de Propietario (Iliana) y Empleado verán inmediatamente bloqueadas todas sus vistas bajo un aviso formal de cobro." 
                    : "El cliente tiene acceso total autorizado al software. Toda la información comercial se encuentra habilitada."}
                </p>
              </div>
              <div className="shrink-0 flex items-center">
                {/* Visual Elegance Switch styling */}
                <button
                  type="button"
                  onClick={() => onToggleSuspension(!isSuspended)}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isSuspended ? "bg-warm-terracotta" : "bg-secondary"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isSuspended ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="bg-primary-container/20 border border-primary-container/30 rounded-2xl p-4 text-[11px] leading-relaxed text-on-surface-variant space-y-1.5">
              <span className="font-bold text-primary block">🔑 ¿Cómo probar la simulación de impago fácilmente?</span>
              <ol className="list-decimal list-inside space-y-1">
                <li>Activa la suspensión (poniendo arriba el switch en <b>Sujeto a Bloqueo [🔴]</b>).</li>
                <li>Haz clic en <b>"Cerrar sesión"</b> en la barra superior o móvil.</li>
                <li>Inicia sesión con la cuenta de <b>Propietaria (iliana@lepetitcan.com)</b> o de <b>Empleado</b>.</li>
                <li>Verás que quedan bloqueados por completo de inmediato.</li>
                <li>Vuelve a cerrar sesión, entra como <b>Administrador</b>, desactiva la suspensión y verás que toda la información comercial (citas, historial de mascotas, descansos) sigue 100% intacta.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Technical Safety Panel explaining how persistence & GitHub works */}
        <div className="lg:col-span-5 bg-ivory-base p-6 md:p-8 rounded-[2.5rem] border border-outline-variant/30 flex flex-col justify-between text-left">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">terminal</span>
              <h3 className="font-serif text-lg font-bold text-primary">Detalles de Arquitectura</h3>
            </div>

            <div className="space-y-3 font-sans text-xs text-on-surface-variant leading-relaxed">
              <p>
                <b>Integración Segura con GitHub:</b> El repositorio aloja el código estanco. Al estar este interruptor controlado centralmente (o en tu backend principal), puedes desconectar de manera remota al inquilino.
              </p>
              <p>
                <b>Persistencia de Datos:</b> La base de datos y la sesión se desacoplan de la interfaz visual. Al realizar la suspensión, los datos <i>nunca</i> se borran; quedan congelados y protegidos en su estado actual, listos para volver a habilitarse en milisegundos tras registrar el cobro.
              </p>
              <p>
                <b>Arquitectura de Roles en Le Petit Can:</b>
              </p>
              <ul className="space-y-1.5 pl-2 list-disc">
                <li><b className="text-secondary">Administrador (Nosotros):</b> Superusuario. Gestiona licencias y salud del hosting.</li>
                <li><b className="text-primary">Propietario (Iliana):</b> Administra agenda, descansos, analíticas y mascotas.</li>
                <li><b className="text-[#849f7e]">Empleado:</b> Acceso restringido (sólo ve calendario, dashboard, chats y mascotas).</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-between text-[10px] text-outline font-sans">
            <span>Versión: 2.1.0-Production</span>
            <span>Acción: GitHub Remote Switch Enabled</span>
          </div>
        </div>

      </div>
    </div>
  );
}
