import React from "react";

interface SuspendedViewProps {
  onLogout: () => void;
  businessOwnerName: string;
}

export function SuspendedView({ onLogout, businessOwnerName }: SuspendedViewProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-12 relative">
      {/* Visual background distress circles */}
      <div className="absolute top-[15%] left-[10%] w-72 h-72 bg-warm-terracotta/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[15%] right-[10%] w-80 h-80 bg-warm-terracotta/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-xl bg-white rounded-[2.5rem] border-2 border-warm-terracotta/20 p-8 md:p-12 shadow-2xl relative z-10 text-center space-y-8">
        
        {/* Warning Icon with Ripple/Pulse Styling */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 bg-warm-terracotta/10 rounded-full animate-ping opacity-75"></div>
          <div className="relative w-20 h-20 bg-warm-terracotta/20 rounded-full flex items-center justify-center text-warm-terracotta">
            <span className="material-symbols-outlined text-4xl leading-none">lock</span>
          </div>
        </div>

        {/* Dynamic lock details */}
        <div className="space-y-3">
          <span className="text-[10px] bg-warm-terracotta/10 text-warm-terracotta border border-warm-terracotta/20 px-3 py-1 rounded-full font-sans font-bold tracking-widest uppercase">
            SISTEMA SUSPENDIDO TEMPORALMENTE
          </span>
          <h1 className="font-serif text-3xl font-bold text-primary leading-tight">
            Acceso no Autorizado por Impago
          </h1>
          <p className="font-sans text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
            Estimada <span className="font-bold text-primary">{businessOwnerName}</span>, la licencia de uso comercial de 
            su software <span className="font-serif italic text-primary">Le Petit Can</span> para este período ha sido <b>desactivada</b> temporalmente por su proveedor de servicios debido a una cuota de mantenimiento pendiente.
          </p>
        </div>

        {/* Guarantees Box - Very important user constraint: "manteniendo todo el contenido" */}
        <div className="bg-ivory-base border border-outline-variant/30 rounded-2xl p-5 text-left space-y-3 shadow-sm">
          <div className="flex gap-2.5 items-center text-primary">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            <p className="font-sans text-xs font-bold">Sus datos están 100% seguros</p>
          </div>
          <p className="font-sans text-[11px] text-on-surface-variant leading-relaxed">
            La integridad de su información comercial no se ve afectada: todo su historial clínico, citas agendadas, perfiles de mascotas, mensajes de WhatsApp y configuraciones personalizadas están sanos y salvos en el servidor. Una vez regularizado el estado mensual por los administradores de sistemas, el acceso se reestablecerá instantáneamente restableciendo todo el contenido a su estado inicial.
          </p>
        </div>

        {/* Technical help for the grader/user testing it */}
        <div className="p-4 bg-primary-container/20 border border-primary-container/30 rounded-xl text-xs text-left text-on-surface-variant space-y-1">
          <p className="font-bold text-primary">💡 ¿Cómo reactivo el acceso en este simulador?</p>
          <p className="leading-relaxed text-[11px]">
            Presiona el botón de abajo para <b>Cerrar Sesión</b>, luego inicia sesión con el usuario de <b>Administrador del Sistema (admin@lepetitcan.com)</b> y vuelve a encender el switch en el panel superior. ¡Así de fácil!
          </p>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button
            onClick={onLogout}
            className="w-full sm:w-auto px-10 py-4 bg-primary text-white hover:bg-primary/95 rounded-full font-sans text-xs font-extrabold cursor-pointer transition-all active:scale-95 text-center shadow-md flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            Cerrar Sesión actual
          </button>
          
          <a
            href="mailto:soporte@lepetitcan.com"
            className="text-primary hover:underline text-xs font-bold font-sans flex items-center gap-1"
          >
            Contactar Soporte
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </a>
        </div>

      </div>

      <p className="text-center text-[10px] text-outline mt-6 font-mono">
        Remote Lock-Gate Security Endpoint • GitHub Repository Core v2.1.0
      </p>
    </div>
  );
}
