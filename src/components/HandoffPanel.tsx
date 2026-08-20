import React, { useState } from "react";
import { DesignTokens, ScreenList, AssetsList } from "../tokens";

interface HandoffPanelProps {
  currentView: string;
  setView: (viewId: string) => void;
}

export function HandoffPanel({ currentView, setView }: HandoffPanelProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [copiedAssetIdx, setCopiedAssetIdx] = useState<number | null>(null);

  const handleCopyColor = (colorHex: string) => {
    navigator.clipboard.writeText(colorHex);
    setCopiedColor(colorHex);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const handleCopyAsset = (url: string, index: number) => {
    navigator.clipboard.writeText(url);
    setCopiedAssetIdx(index);
    setTimeout(() => setCopiedAssetIdx(null), 2000);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-primary text-white border-2 border-white px-5 py-3 rounded-full shadow-2xl hover:scale-102 active:scale-95 transition-all text-xs font-bold font-sans tracking-wider cursor-pointer font-serif italic"
      >
        <span className="material-symbols-outlined text-sm">handyman</span>
        <span>{isOpen ? "Cerrar Handoff Panel" : "Antigravity Handoff & Preview ❖"}</span>
      </button>

      {/* Main Panel Content */}
      {isOpen && (
        <div className="fixed top-20 left-6 bottom-24 w-80 md:w-96 bg-white rounded-[32px] shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col z-50 animate-fade-in text-left">
          {/* Header */}
          <div className="p-6 bg-primary text-white flex justify-between items-center shrink-0">
            <div>
              <h3 className="font-serif text-lg font-bold tracking-wide italic">Atelier Handoff Spec</h3>
              <p className="text-[10px] text-white/80 font-sans font-semibold uppercase tracking-wider mt-0.5">
                Preparado para Antigravity &amp; Devs
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Body Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar">
            {/* Screen Selector Preview controller */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-widest border-b border-outline-variant/20 pb-1">
                Forzar Selector de Pantalla
              </h4>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Navega directamente por cualquiera de las 8 vistas fieles de Stitch importadas:
              </p>
              <div className="grid grid-cols-1 gap-1.5 pt-1">
                {ScreenList.map((scr) => {
                  const isActive = currentView === scr.id;
                  return (
                    <button
                      key={scr.id}
                      onClick={() => {
                        setView(scr.id);
                        // On mobile, auto-close panel on click
                        if (window.innerWidth < 768) {
                          setIsOpen(false);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-sans font-semibold text-left transition-all cursor-pointer ${
                        isActive
                          ? "bg-secondary text-white shadow-sm font-bold"
                          : "bg-surface-container-low text-on-surface-variant hover:bg-primary-container/10"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{scr.icon}</span>
                      <span className="truncate">{scr.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Design Tokens - Colors */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-widest border-b border-outline-variant/20 pb-1">
                Design Tokens: Paleta Stitch
              </h4>
              <p className="text-[11px] text-on-surface-variant">
                Paleta central extraída de la UI de Stitch (Clic para copiar Hex):
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { name: "Principal (Marrón)", hex: DesignTokens.colors.primary, bg: "bg-primary text-white" },
                  { name: "Fondo Base (Marfil)", hex: DesignTokens.colors.background, bg: "border border-outline-variant/10 text-on-surface" },
                  { name: "Secundario (Salvia)", hex: DesignTokens.colors.secondary, bg: "bg-secondary text-white" },
                  { name: "Terracotta Cálido", hex: DesignTokens.colors.warmTerracotta, bg: "bg-warm-terracotta text-white" },
                  { name: "Gris Antracita", hex: DesignTokens.colors.anthraciteGrey, bg: "bg-anthracite-grey text-white" },
                  { name: "Ivory Premium", hex: DesignTokens.colors.ivoryBase, bg: "bg-ivory-base border text-on-surface" },
                  { name: "Prensa Banner", hex: DesignTokens.colors.primaryContainer, bg: "bg-primary-container text-on-primary-container" },
                  { name: "Salvia Soft", hex: DesignTokens.colors.secondaryContainer, bg: "bg-secondary-container text-on-secondary-container" }
                ].map((col) => (
                  <button
                    key={col.hex}
                    onClick={() => handleCopyColor(col.hex)}
                    className="p-2 rounded-xl text-[10px] font-sans font-bold flex flex-col gap-1 items-start text-left transition-all hover:scale-101 shrink-0 relative bg-neutral-50 border border-neutral-100 cursor-pointer"
                  >
                    <div className={`w-full h-5 rounded-md ${col.bg} flex items-center justify-center font-mono text-[9px]`}>
                      {col.hex}
                    </div>
                    <span className="truncate w-full text-on-surface-variant font-medium">{col.name}</span>
                    {copiedColor === col.hex && (
                      <span className="absolute inset-0 bg-secondary text-white rounded-xl flex items-center justify-center text-[10px] font-semibold animate-fade-in font-sans">
                        ¡Copiado!
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Typography Tokens */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-widest border-b border-outline-variant/20 pb-1">
                Tipografías
              </h4>
              <div className="space-y-1 bg-neutral-50 p-3 rounded-2xl border border-neutral-100 text-xs">
                <div className="flex justify-between">
                  <span className="text-outline font-sans">Display / Títulos:</span>
                  <span className="font-bold text-primary font-serif">Playfair Display</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline font-sans">UI de Sistema:</span>
                  <span className="font-bold text-primary font-sans">Manrope (400-800)</span>
                </div>
              </div>
            </div>

            {/* Assets List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-widest border-b border-outline-variant/20 pb-1">
                Assets Recuperados (Stitch)
              </h4>
              <div className="space-y-3">
                {AssetsList.map((ast, idx) => (
                  <div key={idx} className="bg-neutral-50 p-2.5 rounded-2xl border border-neutral-100 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-sans text-xs font-bold text-primary truncate max-w-[160px]">
                        {ast.name}
                      </span>
                      <button
                        onClick={() => handleCopyAsset(ast.url, idx)}
                        className={`text-[10px] px-2.5 py-0.5 rounded-md font-sans transition-all duration-200 cursor-pointer font-bold ${
                          copiedAssetIdx === idx
                            ? "bg-secondary text-white"
                            : "bg-primary-container text-on-primary-container hover:opacity-90 active:scale-95"
                        }`}
                      >
                        {copiedAssetIdx === idx ? "¡Copiado!" : "Copiar URL"}
                      </button>
                    </div>
                    <p className="text-[10px] text-on-surface-variant font-sans leading-normal">
                      {ast.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Proyecto Handoff Specs */}
            <div className="space-y-2 text-xs">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-widest border-b border-outline-variant/20 pb-1">
                Estructura del Proyecto
              </h4>
              <div className="space-y-1 list-none font-sans text-[11px] text-on-surface-variant leading-relaxed">
                <li>❖ <strong className="text-primary">/src/tokens.ts</strong>: Constante tipada central con especificaciones Visuales, colores y enlaces a assets.</li>
                <li>❖ <strong className="text-primary">/src/types.ts</strong>: Interfaces de TypeScript para Modelos y contratos de datos.</li>
                <li>❖ <strong className="text-primary">/src/components/*</strong>: Vistas modulares de las interfaces de usuarios fieles a Stitch.</li>
                <li>❖ <strong className="text-primary">/src/index.css</strong>: Theme global de Tailwind v4 conectando fuentes y variables.</li>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
