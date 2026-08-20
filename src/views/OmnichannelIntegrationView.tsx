import React, { useState, useEffect } from "react";
import { useMetaChannels, MetaChannelsConfig } from "../context/MetaChannelsContext";

interface OmnichannelIntegrationViewProps {
  onBack: () => void;
}

export function OmnichannelIntegrationView({ onBack }: OmnichannelIntegrationViewProps) {
  const { metaChannelsConfig, saveMetaChannelsConfig, loading } = useMetaChannels();
  
  // Local state for the controlled form inputs
  const [formState, setFormState] = useState<MetaChannelsConfig>({
    whatsapp: { phoneNumberId: "", wabaId: "", accessToken: "" },
    facebook: { pageId: "", pageAccessToken: "" },
    instagram: { igBusinessId: "", pageAccessToken: "" }
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; success: boolean } | null>(null);

  // Synchronize form state once the global configuration is loaded from Context
  useEffect(() => {
    if (!loading && metaChannelsConfig) {
      setFormState({
        whatsapp: {
          phoneNumberId: metaChannelsConfig.whatsapp?.phoneNumberId || "",
          wabaId: metaChannelsConfig.whatsapp?.wabaId || "",
          accessToken: metaChannelsConfig.whatsapp?.accessToken || ""
        },
        facebook: {
          pageId: metaChannelsConfig.facebook?.pageId || "",
          pageAccessToken: metaChannelsConfig.facebook?.pageAccessToken || ""
        },
        instagram: {
          igBusinessId: metaChannelsConfig.instagram?.igBusinessId || "",
          pageAccessToken: metaChannelsConfig.instagram?.pageAccessToken || ""
        }
      });
    }
  }, [metaChannelsConfig, loading]);

  const handleWhatsappChange = (field: "phoneNumberId" | "wabaId" | "accessToken", value: string) => {
    setFormState((prev) => ({
      ...prev,
      whatsapp: {
        ...((prev.whatsapp || { phoneNumberId: "", wabaId: "", accessToken: "" }) as any),
        [field]: value
      }
    }));
  };

  const handleFacebookChange = (field: "pageId" | "pageAccessToken", value: string) => {
    setFormState((prev) => ({
      ...prev,
      facebook: {
        ...((prev.facebook || { pageId: "", pageAccessToken: "" }) as any),
        [field]: value
      }
    }));
  };

  const handleInstagramChange = (field: "igBusinessId" | "pageAccessToken", value: string) => {
    setFormState((prev) => ({
      ...prev,
      instagram: {
        ...((prev.instagram || { igBusinessId: "", pageAccessToken: "" }) as any),
        [field]: value
      }
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    
    try {
      // Basic cleaning / empty fields mapping
      const cleanedConfig: MetaChannelsConfig = {};
      
      if (formState.whatsapp?.phoneNumberId || formState.whatsapp?.wabaId || formState.whatsapp?.accessToken) {
        cleanedConfig.whatsapp = {
          phoneNumberId: formState.whatsapp.phoneNumberId.trim(),
          wabaId: formState.whatsapp.wabaId.trim(),
          accessToken: formState.whatsapp.accessToken.trim()
        };
      }
      
      if (formState.facebook?.pageId || formState.facebook?.pageAccessToken) {
        cleanedConfig.facebook = {
          pageId: formState.facebook.pageId.trim(),
          pageAccessToken: formState.facebook.pageAccessToken.trim()
        };
      }
      
      if (formState.instagram?.igBusinessId || formState.instagram?.pageAccessToken) {
        cleanedConfig.instagram = {
          igBusinessId: formState.instagram.igBusinessId.trim(),
          pageAccessToken: formState.instagram.pageAccessToken.trim()
        };
      }

      await saveMetaChannelsConfig(cleanedConfig);
      
      setStatusMessage({ text: "✓ Credenciales y configuración global guardadas con éxito", success: true });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error("Failed to save Meta channels:", err);
      setStatusMessage({ 
        text: `Error al guardar: ${err instanceof Error ? err.message : String(err)}`, 
        success: false 
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[250px]">
        <span className="material-symbols-outlined text-4xl text-[#cf9681] animate-spin mb-4">sync</span>
        <p className="font-serif text-base font-bold text-stone-700">Cargando módulos de mensajería...</p>
        <p className="font-sans text-[11px] text-stone-400 mt-1">Conectando con Le Petit Can Cloud Storage</p>
      </div>
    );
  }

  return (
    <div className="w-full text-left max-w-container-max mx-auto px-1 animate-in fade-in duration-300">
      
      {/* Header and Back navigation button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-primary font-sans text-xs font-bold hover:opacity-85 active:scale-95 cursor-pointer mb-1.5"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Volver al Panel
          </button>
          <h2 className="font-serif text-3xl text-primary font-bold">Integración omnicanal</h2>
          <p className="font-sans text-xs text-on-surface-variant max-w-2xl mt-1 leading-relaxed">
            Configura aquí las cuentas oficiales de WhatsApp, Facebook e Instagram que usará la peluquería Le Petit Can para centralizar todos los mensajes en la bandeja de Mensajes.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 mb-6 rounded-2xl border text-xs font-bold font-sans transition-all duration-300 ${
          statusMessage.success 
            ? "bg-green-50 border-green-200 text-green-700 font-bold" 
            : "bg-red-50 border-red-200 text-red-700 font-bold"
        }`}>
          {statusMessage.text}
        </div>
      )}

      {/* Main configuration forms */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 1. WhatsApp Cloud Card */}
          <div className="bg-white border border-outline-variant/30 rounded-[2.5rem] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center shrink-0 text-green-600">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.514-2.961-2.628-.086-.114-.705-.938-.705-1.792 0-.853.447-1.273.605-1.446.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298l.541 1.316c.046.112.078.242.005.388-.073.146-.11.237-.217.363-.106.127-.221.282-.315.38-.106.11-.217.231-.093.442.124.211.549.905 1.176 1.464.808.72 1.488.943 1.698 1.049.211.106.332.088.456-.056.124-.144.534-.621.678-.832.144-.211.289-.177.487-.104l1.385.654c.198.093.33.14.373.213.044.073.044.419-.101.824z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-serif text-base font-bold text-stone-800">WhatsApp Cloud API</h4>
                  <span className="text-[10px] font-sans text-green-600 font-bold uppercase tracking-wider">Canal Principal</span>
                </div>
              </div>

              <p className="font-sans text-[11px] text-stone-500 leading-relaxed min-h-[50px]">
                Configura los parámetros oficiales de la API de WhatsApp Cloud en Meta for Developers para recibir y responder notas de voz o mensajes.
              </p>

              <div className="space-y-3 pt-2 font-sans text-xs">
                <div>
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                    Phone Number ID
                  </label>
                  <input
                    type="text"
                    required={!!(formState.whatsapp?.wabaId || formState.whatsapp?.accessToken)}
                    value={formState.whatsapp?.phoneNumberId || ""}
                    onChange={(e) => handleWhatsappChange("phoneNumberId", e.target.value)}
                    placeholder="Ej. 104829375820124"
                    className="w-full px-4 py-2 border border-outline-variant/40 rounded-full text-xs focus:outline-none focus:border-primary bg-background text-on-surface-variant font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                    WABA Account ID
                  </label>
                  <input
                    type="text"
                    required={!!(formState.whatsapp?.phoneNumberId || formState.whatsapp?.accessToken)}
                    value={formState.whatsapp?.wabaId || ""}
                    onChange={(e) => handleWhatsappChange("wabaId", e.target.value)}
                    placeholder="Ej. 928374950182475"
                    className="w-full px-4 py-2 border border-outline-variant/40 rounded-full text-xs focus:outline-none focus:border-primary bg-background text-on-surface-variant font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                    Meta System Access Token
                  </label>
                  <textarea
                    rows={3}
                    required={!!(formState.whatsapp?.phoneNumberId || formState.whatsapp?.wabaId)}
                    value={formState.whatsapp?.accessToken || ""}
                    onChange={(e) => handleWhatsappChange("accessToken", e.target.value)}
                    placeholder="EAAGb..."
                    className="w-full px-4 py-2.5 border border-outline-variant/40 rounded-2xl text-xs focus:outline-none focus:border-primary bg-background text-on-surface-variant font-mono resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. FB Messenger Card */}
          <div className="bg-white border border-outline-variant/30 rounded-[2.5rem] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-serif text-base font-bold text-stone-800">Facebook Messenger</h4>
                  <span className="text-[10px] font-sans text-blue-600 font-bold uppercase tracking-wider">Página Corporativa</span>
                </div>
              </div>

              <p className="font-sans text-[11px] text-stone-500 leading-relaxed min-h-[50px]">
                Permite la recepción de chats directos enviados a la FanPage oficial de Facebook de la marca Le Petit Can en la bandeja omnicanal.
              </p>

              <div className="space-y-3 pt-2 font-sans text-xs">
                <div>
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                    FB Page ID
                  </label>
                  <input
                    type="text"
                    required={!!formState.facebook?.pageAccessToken}
                    value={formState.facebook?.pageId || ""}
                    onChange={(e) => handleFacebookChange("pageId", e.target.value)}
                    placeholder="Ej. 102934857482"
                    className="w-full px-4 py-2 border border-outline-variant/40 rounded-full text-xs focus:outline-none focus:border-primary bg-background text-on-surface-variant font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                    Page Access Token
                  </label>
                  <textarea
                    rows={4}
                    required={!!formState.facebook?.pageId}
                    value={formState.facebook?.pageAccessToken || ""}
                    onChange={(e) => handleFacebookChange("pageAccessToken", e.target.value)}
                    placeholder="EAAH..."
                    className="w-full px-4 py-2.5 border border-outline-variant/40 rounded-2xl text-xs focus:outline-none focus:border-primary bg-background text-on-surface-variant font-mono resize-none leading-relaxed h-[115px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Instagram Business Card */}
          <div className="bg-white border border-outline-variant/30 rounded-[2.5rem] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center shrink-0 text-pink-600">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.058-1.69-.072-4.949-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-serif text-base font-bold text-stone-800">Instagram Business</h4>
                  <span className="text-[10px] font-sans text-pink-600 font-bold uppercase tracking-wider">Bandeja Directa</span>
                </div>
              </div>

              <p className="font-sans text-[11px] text-stone-500 leading-relaxed min-h-[50px]">
                Enlaza los mensajes directos de tu perfil de Instagram Profesional para responderlos de manera simultánea desde Le Petit Can.
              </p>

              <div className="space-y-3 pt-2 font-sans text-xs">
                <div>
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                    Instagram Business ID
                  </label>
                  <input
                    type="text"
                    required={!!formState.instagram?.pageAccessToken}
                    value={formState.instagram?.igBusinessId || ""}
                    onChange={(e) => handleInstagramChange("igBusinessId", e.target.value)}
                    placeholder="Ej. 178414058201934"
                    className="w-full px-4 py-2 border border-outline-variant/40 rounded-full text-xs focus:outline-none focus:border-primary bg-background text-on-surface-variant font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                    Page Access Token
                  </label>
                  <textarea
                    rows={4}
                    required={!!formState.instagram?.igBusinessId}
                    value={formState.instagram?.pageAccessToken || ""}
                    onChange={(e) => handleInstagramChange("pageAccessToken", e.target.value)}
                    placeholder="EAAH..."
                    className="w-full px-4 py-2.5 border border-outline-variant/40 rounded-2xl text-xs focus:outline-none focus:border-primary bg-background text-on-surface-variant font-mono resize-none leading-relaxed h-[115px]"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Security Alert Block & Submission */}
        <div className="bg-ivory-base border border-outline-variant/25 rounded-[2.5rem] p-6 text-left flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-full bg-[#755848]/10 flex items-center justify-center shrink-0 text-[#755848]">
              <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
            </div>
            <div>
              <h5 className="font-serif text-sm font-bold text-[#755848]">Control de Acceso de Seguridad</h5>
              <p className="font-sans text-[11px] text-[#81746e] max-w-xl leading-relaxed mt-0.5">
                Solo el Administrador SaaS puede modificar estas credenciales. Se aplican a toda la bandeja de Mensajes de Le Petit Can.
              </p>
            </div>
          </div>

          <div className="flex gap-3 shrink-0 font-sans">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 border border-outline-variant/40 rounded-full text-xs font-bold text-outline hover:text-primary transition-all active:scale-95 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-primary hover:bg-primary-dark disabled:bg-stone-300 text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-sm transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">save</span>
                  <span>Guardar credenciales</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
