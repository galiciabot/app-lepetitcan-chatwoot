import React, { useState, useEffect } from "react";
import { Service, Product, Owner, Pet, ServicePricing, UserRole } from "../types";

export interface IntegrationConfig {
  n8nWebhookUrl: string;
  n8nOnBooking: boolean;
  n8nOnCompleted: boolean;
  n8nOnNoteAdded: boolean;
  hioposApiUrl: string;
  hioposToken: string;
  hioposSyncOnCheckout: boolean;
  hioposBranchId: string;
  pipelineEndpoint: string;
  pipelineAutoDeploy: boolean;
}

const DEFAULT_INTEGRATION_CONFIG: IntegrationConfig = {
  n8nWebhookUrl: "https://your-n8n-instance.com/webhook/le-petit-can",
  n8nOnBooking: true,
  n8nOnCompleted: true,
  n8nOnNoteAdded: false,
  hioposApiUrl: "https://api.hiopos.com/v1",
  hioposToken: "hp_tok_abc123xyz_petitcan",
  hioposSyncOnCheckout: true,
  hioposBranchId: "BARCELONA_01",
  pipelineEndpoint: "https://api.github.com/repos/owner/repo/dispatches",
  pipelineAutoDeploy: false,
};

interface AdminManagementViewProps {
  services: Service[];
  onSaveService: (srv: Service) => Promise<void>;
  onDeleteService: (id: string) => Promise<void>;
  onResetServicesToDefault?: () => Promise<void>;
  products: Product[];
  onSaveProduct: (prod: Product) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  owners: Owner[];
  onSaveOwner: (owner: Owner) => Promise<void>;
  onDeleteOwner: (id: string) => Promise<void>;
  onNavigateBack: () => void;
  userRole?: UserRole;
  onNavigateToOmnichannel?: () => void;
}

export function AdminManagementView({
  services,
  onSaveService,
  onDeleteService,
  onResetServicesToDefault,
  products,
  onSaveProduct,
  onDeleteProduct,
  owners,
  onSaveOwner,
  onDeleteOwner,
  onNavigateBack,
  userRole,
  onNavigateToOmnichannel,
}: AdminManagementViewProps) {
  const [activeTab, setActiveTab] = useState<"services" | "products" | "integrations">("services");
  const [searchQuery, setSearchQuery] = useState("");

  // Integrations configuration and simulation states
  const [integrationConfig, setIntegrationConfig] = useState<IntegrationConfig>(DEFAULT_INTEGRATION_CONFIG);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [simulatedLogs, setSimulatedLogs] = useState<{ id: string; time: string; type: string; url: string; payload: string; status: number; response: string }[]>([
    {
      id: "log_init",
      time: new Date(Date.now() - 4 * 60000).toLocaleTimeString(),
      type: "Pipeline Check",
      url: "https://github.com/lepetitcan/app/workflows/build",
      payload: '{"event_type": "continuous_integration_ping"}',
      status: 200,
      response: '{"status": "active", "environment": "production"}'
    }
  ]);

  // Load config from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("integration_config");
      if (saved) {
        setIntegrationConfig({ ...DEFAULT_INTEGRATION_CONFIG, ...JSON.parse(saved) });
      }
    } catch (err) {
      console.warn("Failed to load integrations config from localStorage:", err);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingConfig(true);
    setStatusMessage(null);
    try {
      localStorage.setItem("integration_config", JSON.stringify(integrationConfig));
      setStatusMessage({ text: "✓ Configuración de integraciones guardada con éxito", success: true });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error("Failed to save integrations config:", err);
      setStatusMessage({ text: `Error al guardar: ${err instanceof Error ? err.message : String(err)}`, success: false });
    } finally {
      setSavingConfig(false);
    }
  };

  // Modals / Editor states
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingOwner, setEditingOwner] = useState<Partial<Owner> | null>(null);
  const [selectedOwnerForPet, setSelectedOwnerForPet] = useState<string | null>(null);
  const [editingPet, setEditingPet] = useState<{ pet: Partial<Pet>; ownerId: string } | null>(null);

  // Loading/Operation feedback states
  const [isSaving, setIsSaving] = useState(false);

  // SIZES used for service pricing matrices
  const SIZES_FOR_PRICING = ["Toy", "Pequeño", "Mediano", "Grande", "Gigante"];

  // Category list for products
  const PRODUCT_CATEGORIES = ["Cosmética", "Accesorios", "Farmacia", "Alimentación", "Snacks", "Otros"];

  // Filtered lists
  const filteredServices = services.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOwners = owners.filter(
    (o) =>
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.phone.includes(searchQuery)
  );

  // Handle service saving
  const handleSaveServiceClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService?.title) return;
    setIsSaving(true);
    try {
      const defaultPricing: Record<string, ServicePricing> = {
        Toy: { priceDisp: "30,00 €", priceNum: 30, durationDisp: "90 min", durationMin: 90 },
        Pequeño: { priceDisp: "35,00 €", priceNum: 35, durationDisp: "90 min", durationMin: 90 },
        Mediano: { priceDisp: "40,00 €", priceNum: 40, durationDisp: "90 min", durationMin: 90 },
        Grande: { priceDisp: "45,00 €", priceNum: 45, durationDisp: "120 min", durationMin: 120 },
        Gigante: { priceDisp: "50,00 € / h (mín. 120')", priceNum: 50, durationDisp: "mín. 120 min", durationMin: 120, isHourly: true },
      };

      const finalService: Service = {
        id: editingService.id || `srv_${Date.now()}`,
        title: editingService.title,
        desc: editingService.desc || "",
        pricing: editingService.pricing || defaultPricing,
      };

      // Close the modal instantly so the user has immediate feedback and the screen closes
      setEditingService(null);
      await onSaveService(finalService);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle product saving
  const handleSaveProductClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || editingProduct.price === undefined || editingProduct.stock === undefined) return;
    setIsSaving(true);
    try {
      const finalProduct: Product = {
        id: editingProduct.id || `prod_${Date.now()}`,
        name: editingProduct.name,
        category: editingProduct.category || "Otros",
        price: Number(editingProduct.price),
        stock: Number(editingProduct.stock),
        description: editingProduct.description || "",
      };
      // Close the modal instantly so the user has immediate feedback and the screen closes
      setEditingProduct(null);
      await onSaveProduct(finalProduct);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle owner saving
  const handleSaveOwnerClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOwner?.name) return;
    setIsSaving(true);
    try {
      const finalOwner: Owner = {
        id: editingOwner.id || `owner_${Date.now()}`,
        name: editingOwner.name,
        contact: editingOwner.contact || "",
        phone: editingOwner.phone || "",
        since: editingOwner.since || new Date().toLocaleDateString("es-ES", { month: "short", year: "numeric" }),
        avatar: editingOwner.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        pets: editingOwner.pets || [],
      };
      // Close the modal instantly so the user has immediate feedback and the screen closes
      setEditingOwner(null);
      await onSaveOwner(finalOwner);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle pet saving inside owner record
  const handleSavePetClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPet?.pet.name || !editingPet.ownerId) return;
    setIsSaving(true);
    try {
      const owner = owners.find((o) => o.id === editingPet.ownerId);
      if (!owner) return;

      const newOrUpdatedPet: Pet = {
        id: editingPet.pet.id || `pet_${Date.now()}`,
        name: editingPet.pet.name,
        breed: editingPet.pet.breed || "Mestizo",
        size: editingPet.pet.size || "Pequeño",
        behavior: editingPet.pet.behavior || "Tranquilo",
        birthDate: editingPet.pet.birthDate || "1 Año",
        avatarUrl: editingPet.pet.avatarUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80",
        avgDuration: editingPet.pet.avgDuration || "1h 30min",
        status: editingPet.pet.status || "ACTIVO",
        lastVisitDate: editingPet.pet.lastVisitDate || "Excelente en cabina",
        lastVisitService: editingPet.pet.lastVisitService || "Ningún servicio reciente",
        history: editingPet.pet.history || [],
      };

      const updatedPets = editingPet.pet.id
        ? owner.pets.map((p) => (p.id === editingPet.pet.id ? newOrUpdatedPet : p))
        : [...owner.pets, newOrUpdatedPet];

      // Close the modal instantly so the user has immediate feedback and the screen closes
      setEditingPet(null);
      await onSaveOwner({ ...owner, pets: updatedPets });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePetClick = async (ownerId: string, petId: string) => {
    if (!window.confirm("¿Seguro que quieres borrar este registro de mascota?")) return;
    const owner = owners.find((o) => o.id === ownerId);
    if (!owner) return;
    const updatedPets = owner.pets.filter((p) => p.id !== petId);
    await onSaveOwner({ ...owner, pets: updatedPets });
  };

  const handleQuickStockAdjust = async (product: Product, delta: number) => {
    const newStock = Math.max(0, product.stock + delta);
    await onSaveProduct({ ...product, stock: newStock });
  };

  return (
    <div className="w-full text-left">
      {/* Header and Back navigation button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <button
            onClick={onNavigateBack}
            className="flex items-center gap-2 text-primary font-sans text-xs font-bold hover:opacity-85 active:scale-95 cursor-pointer mb-1.5"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Volver al Panel
          </button>
          <h2 className="font-serif text-3xl text-primary font-bold">Administración General</h2>
          <p className="font-sans text-xs text-on-surface-variant">
            Configuración integral de tarifas, control de inventario y modificación de fichas de clientes y mascotas.
          </p>
        </div>

        {/* Action button corresponding to active view */}
        <div className="flex flex-wrap gap-2.5">
          {activeTab === "services" && (
            <>
              {onResetServicesToDefault && (
                <button
                  onClick={onResetServicesToDefault}
                  className="bg-warm-terracotta/10 hover:bg-warm-terracotta text-warm-terracotta hover:text-white border border-warm-terracotta/20 px-4 py-2.5 rounded-full font-sans text-xs font-bold transition-all duration-200 active:scale-95 flex items-center gap-2 cursor-pointer"
                  title="Restablecer los 7 Servicios estándar"
                >
                  <span className="material-symbols-outlined text-base">restore</span>
                  <span>Restaurar Servicios</span>
                </button>
              )}
              <button
                onClick={() =>
                  setEditingService({
                    title: "",
                    desc: "",
                    pricing: {
                      Toy: { priceDisp: "30,00 €", priceNum: 30, durationDisp: "90 min", durationMin: 90 },
                      Pequeño: { priceDisp: "35,00 €", priceNum: 35, durationDisp: "90 min", durationMin: 90 },
                      Mediano: { priceDisp: "40,00 €", priceNum: 40, durationDisp: "90 min", durationMin: 90 },
                      Grande: { priceDisp: "45,00 €", priceNum: 45, durationDisp: "120 min", durationMin: 120 },
                      Gigante: { priceDisp: "50,00 € / h (mín. 120')", priceNum: 50, durationDisp: "mín. 120 min", durationMin: 120, isHourly: true },
                    },
                  })
                }
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-full font-sans text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer transition-transform duration-200 hover:scale-102"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                <span>Nuevo Servicio</span>
              </button>
            </>
          )}

          {activeTab === "products" && (
            <button
              onClick={() =>
                setEditingProduct({
                  name: "",
                  category: "Otros",
                  price: 15,
                  stock: 10,
                  description: "",
                })
              }
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-full font-sans text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer transition-transform duration-200 hover:scale-102"
            >
              <span className="material-symbols-outlined text-base">add_shopping_cart</span>
              <span>Nuevo Artículo</span>
            </button>
          )}

        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-outline-variant/30 mb-6 gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => {
            setActiveTab("services");
            setSearchQuery("");
          }}
          className={`px-4 py-2.5 font-sans text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === "services"
              ? "border-primary text-primary"
              : "border-transparent text-outline hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-base">spa</span>
          <span>Servicios ({services.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("products");
            setSearchQuery("");
          }}
          className={`px-4 py-2.5 font-sans text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === "products"
              ? "border-primary text-primary"
              : "border-transparent text-outline hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-base">inventory</span>
          <span>Artículos con Stock ({products.length})</span>
        </button>

        {userRole === "administrador" && (
          <button
            onClick={() => {
              setActiveTab("integrations");
              setSearchQuery("");
            }}
            className={`px-4 py-2.5 font-sans text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "integrations"
                ? "border-primary text-primary"
                : "border-transparent text-outline hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-base">sync_alt</span>
            <span>Integraciones & Webhooks (n8n)</span>
          </button>
        )}

        </div>

      {/* Search Bar */}
      {activeTab !== "integrations" && (
        <div className="mb-6 relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg">
            search
          </span>
          <input
            type="text"
            placeholder={`Buscar en ${
              activeTab === "services" ? "servicios..." : "artículos..."
            }`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-outline-variant/40 rounded-full text-xs text-on-surface bg-white/50 focus:outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      )}

      {/* 1. SERVICES TAB CONTENT */}
      {activeTab === "services" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredServices.map((srv) => (
            <div
              key={srv.id}
              className="bg-white border border-outline-variant/30 rounded-[2rem] p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-serif text-base font-bold text-primary">{srv.title}</h3>
                  <p className="text-[11px] text-on-surface-variant mt-1 line-clamp-2">{srv.desc}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => setEditingService(srv)}
                    className="p-1 px-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-full text-[10px] font-sans font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                    title="Editar Servicio"
                  >
                    <span className="material-symbols-outlined text-[13px]">edit</span>
                    <span>Modificar</span>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`¿Seguro que quieres eliminar el servicio "${srv.title}"?`)) {
                        onDeleteService(srv.id);
                      }
                    }}
                    className="p-1 px-2.5 bg-warm-terracotta/10 text-warm-terracotta hover:bg-warm-terracotta hover:text-white rounded-full text-[10px] font-sans font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                    title="Eliminar Servicio"
                  >
                    <span className="material-symbols-outlined text-[13px]">delete</span>
                    <span>Borrar</span>
                  </button>
                </div>
              </div>

              {/* Min pricing matrix grid */}
              <div className="pt-3 border-t border-outline-variant/10">
                <p className="text-[10px] uppercase font-bold text-outline tracking-wider mb-2">
                  Matriz de Tarifas por Tamaño Le Petit Can
                </p>
                <div className="grid grid-cols-5 gap-1.5 text-center">
                  {SIZES_FOR_PRICING.map((sz) => {
                    const priceInfo = srv.pricing[sz];
                    return (
                      <div key={sz} className="p-2 bg-ivory-base/40 rounded-xl border border-outline-variant/10">
                        <span className="font-sans font-extrabold text-[9px] text-primary block truncate">{sz}</span>
                        <span className="font-mono text-[9px] font-bold text-secondary block mt-0.5 truncate" title={priceInfo?.priceDisp}>
                          {priceInfo?.priceNum ? `${priceInfo.priceNum}€` : "Custom"}
                        </span>
                        <span className="text-[8px] text-outline block mt-0.5 truncate" title={priceInfo?.durationDisp}>
                          {priceInfo?.durationMin ? `${priceInfo.durationMin}'` : "-"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {filteredServices.length === 0 && (
            <p className="text-xs text-outline italic text-center col-span-2 py-6">No se encontraron servicios.</p>
          )}
        </div>
      )}

      {/* 2. PRODUCTS TAB CONTENT */}
      {activeTab === "products" && (
        <div className="bg-white border border-outline-variant/20 rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-ivory-base/70 font-extrabold text-primary border-b border-outline-variant/20">
                <tr>
                  <th className="p-4">Artículo</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Precio</th>
                  <th className="p-4 text-center">Stock</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filteredProducts.map((prod) => {
                  const outOfStock = prod.stock === 0;
                  const lowStock = prod.stock > 0 && prod.stock <= 3;

                  return (
                    <tr key={prod.id} className="hover:bg-ivory-base/10 transition-colors">
                      <td className="p-4 font-bold text-on-surface">
                        <div>
                          <span>{prod.name}</span>
                          {prod.description && (
                            <p className="text-[10px] font-normal text-outline mt-0.5">{prod.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-surface-container border px-2 py-0.5 rounded-full text-[10px] font-semibold">
                          {prod.category}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-primary">
                        {prod.price.toFixed(2)} €
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleQuickStockAdjust(prod, -1)}
                            className="w-5 h-5 bg-ivory-base text-primary hover:bg-outline-variant/25 rounded-md flex items-center justify-center font-bold cursor-pointer transition-colors"
                            title="Quitar 1"
                          >
                            -
                          </button>
                          <span
                            className={`w-12 text-center font-mono font-bold rounded px-1.5 py-0.5 text-xs ${
                              outOfStock
                                ? "bg-red-100 text-red-600 font-extrabold animate-pulse"
                                : lowStock
                                ? "bg-amber-100 text-amber-700"
                                : "bg-green-50 text-green-700"
                            }`}
                          >
                            {prod.stock}
                          </span>
                          <button
                            onClick={() => handleQuickStockAdjust(prod, 1)}
                            className="w-5 h-5 bg-ivory-base text-primary hover:bg-outline-variant/25 rounded-md flex items-center justify-center font-bold cursor-pointer transition-colors"
                            title="Añadir 1"
                          >
                            +
                          </button>
                        </div>
                      </td>
                       <td className="p-4 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => setEditingProduct(prod)}
                            className="p-1 px-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-full text-[10px] font-sans font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                            title="Editar"
                          >
                            <span className="material-symbols-outlined text-[13px]">edit</span>
                            <span>Modificar</span>
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Seguro que quieres borrar el artículo "${prod.name}"?`)) {
                                onDeleteProduct(prod.id);
                              }
                            }}
                            className="p-1 px-2.5 bg-warm-terracotta/10 text-warm-terracotta hover:bg-warm-terracotta hover:text-white rounded-full text-[10px] font-sans font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                            title="Borrar"
                          >
                            <span className="material-symbols-outlined text-[13px]">delete</span>
                            <span>Borrar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-outline italic">
                      No se encontraron artículos con stock registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. INTEGRATIONS & AUTOMATIONS TAB CONTENT */}
      {userRole === "administrador" && activeTab === "integrations" && (
        <div className="space-y-6">
          {/* Main info card */}
          <div className="bg-primary/5 rounded-[2.5rem] border border-primary/25 p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              <span className="material-symbols-outlined text-3xl">smart_toy</span>
            </div>
            <div className="text-left space-y-2 flex-grow">
              <h3 className="font-serif text-lg font-bold text-primary">Atelier Canino Integraciones y Webhooks</h3>
              <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                Prepara, edita y prueba de forma activa los canales de conexión externa una vez terminada la compilación de la app. Desde esta suite puedes enlazar los pipelines de compilación e integraciones de flujos de trabajo con <b>n8n / Zapier / Make</b> mediante webhooks.
              </p>
            </div>
          </div>

          {statusMessage && (
            <div className={`p-4 rounded-2xl border text-xs font-bold font-sans transition-all duration-300 ${
              statusMessage.success 
                ? "bg-green-50 border-green-200 text-green-700 font-bold" 
                : "bg-red-50 border-red-200 text-red-700 font-bold"
            }`}>
              {statusMessage.text}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form configuration block */}
            <form onSubmit={handleSaveConfig} className="space-y-6">
              {/* Card 1: n8n Automations */}
              <div className="bg-white border border-outline-variant/30 rounded-[2.5rem] p-6 shadow-sm space-y-4 text-left">
                <div className="flex justify-between items-center border-b border-outline-variant/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-lg">webhook</span>
                    <h4 className="font-serif text-base font-bold text-primary">Automatizaciones con n8n</h4>
                  </div>
                  <span className="bg-green-50 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-green-200">
                    Soporte Activo
                  </span>
                </div>

                <div className="space-y-3 font-sans text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                      URL Webhook de n8n / Zapier
                    </label>
                    <input
                      type="url"
                      value={integrationConfig.n8nWebhookUrl}
                      onChange={(e) => setIntegrationConfig(prev => ({ ...prev, n8nWebhookUrl: e.target.value }))}
                      placeholder="https://su-servidor-n8n.com/webhook/..."
                      className="w-full px-4 py-2 border border-outline-variant/40 rounded-full text-xs focus:outline-none focus:border-primary bg-background text-on-surface-variant font-mono"
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-wider block">
                      Acciones / Triggers de Eventos:
                    </p>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={integrationConfig.n8nOnBooking}
                        onChange={(e) => setIntegrationConfig(prev => ({ ...prev, n8nOnBooking: e.target.checked }))}
                        className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="text-on-surface-variant">Enviar al reservar nueva cita en el Widget</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={integrationConfig.n8nOnCompleted}
                        onChange={(e) => setIntegrationConfig(prev => ({ ...prev, n8nOnCompleted: e.target.checked }))}
                        className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="text-on-surface-variant">Enviar al completar cita (guardar notas y facturar)</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={integrationConfig.n8nOnNoteAdded}
                        onChange={(e) => setIntegrationConfig(prev => ({ ...prev, n8nOnNoteAdded: e.target.checked }))}
                        className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="text-on-surface-variant">Enviar al actualizar o dictar nota de voz</span>
                    </label>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const testPayload = {
                          event: "appointment_completed",
                          timestamp: new Date().toISOString(),
                          salon: "Le Petit Can Barcelona",
                          data: {
                            id: "a_test_" + Math.floor(Math.random() * 10000),
                            dogName: "Kobe",
                            breed: "Bulldog Francés",
                            size: "Pequeño",
                            ownerName: "Ana G.",
                            phone: "+34 634 567 890",
                            service: "Baño + Arreglo",
                            price: "45.00 EUR",
                            notes: "Excelente comportamiento durante el baño y corte boutique tradicional.",
                            date: new Date().toLocaleDateString()
                          }
                        };
                        
                        const newLog = {
                          id: "log_" + Date.now(),
                          time: new Date().toLocaleTimeString(),
                          type: "n8n Trigger",
                          url: integrationConfig.n8nWebhookUrl || "https://your-n8n-instance.com/webhook/le-petit-can",
                          payload: JSON.stringify(testPayload, null, 2),
                          status: 200,
                          response: JSON.stringify({ success: true, message: "Webhook processed by n8n", executionId: "n8n_exec_" + Math.random().toString(36).substr(2, 9) }, null, 2)
                        };
                        
                        setSimulatedLogs(prev => [newLog, ...prev]);
                        setStatusMessage({ text: "✓ Test enviado con éxito a la URL de n8n", success: true });
                        setTimeout(() => setStatusMessage(null), 4000);
                      }}
                      className="w-full bg-secondary-container hover:bg-secondary-container/80 text-on-secondary-container font-sans text-xs font-bold py-2 px-4 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer border border-secondary/15 active:scale-98"
                    >
                      <span className="material-symbols-outlined text-base">outgoing_mail</span>
                      <span>Lanzar Webhook de Prueba a n8n</span>
                    </button>
                  </div>
                </div>
              </div>



              {/* Card 3: Git Pipelines CI/CD */}
              <div className="bg-white border border-outline-variant/30 rounded-[2.5rem] p-6 shadow-sm space-y-4 text-left">
                <div className="flex justify-between items-center border-b border-outline-variant/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-lg">flowsheet</span>
                    <h4 className="font-serif text-base font-bold text-primary">Pipelines de Compilación (CI/CD)</h4>
                  </div>
                  <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                    GitHub Actions
                  </span>
                </div>

                <div className="space-y-3 font-sans text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                      Enlace de Pipeline / Workflow Dispatch URL
                    </label>
                    <input
                      type="url"
                      value={integrationConfig.pipelineEndpoint}
                      onChange={(e) => setIntegrationConfig(prev => ({ ...prev, pipelineEndpoint: e.target.value }))}
                      placeholder="https://api.github.com/..."
                      className="w-full px-4 py-2 border border-outline-variant/40 rounded-full text-xs focus:outline-none focus:border-primary bg-background font-mono text-on-surface-variant"
                    />
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={integrationConfig.pipelineAutoDeploy}
                        onChange={(e) => setIntegrationConfig(prev => ({ ...prev, pipelineAutoDeploy: e.target.checked }))}
                        className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="text-on-surface-variant">Auto-compilar y desplegar en Cloud Run tras cambios menores</span>
                    </label>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const testPayload = {
                          event_type: "rebuild_applet_production",
                          client_payload: {
                            triggered_by: "Admin Panel (SaaS)",
                            reason: "Manual push core version sync"
                          }
                        };

                        const newLog = {
                          id: "log_" + Date.now(),
                          time: new Date().toLocaleTimeString(),
                          type: "Pipeline Trigger",
                          url: integrationConfig.pipelineEndpoint || "https://api.github.com/repos/owner/repo/dispatches",
                          payload: JSON.stringify(testPayload, null, 2),
                          status: 202,
                          response: JSON.stringify({ message: "Build workflow dispatch accepted", run_url: "https://github.com/lepetitcan/app/actions/runs/" + Math.floor(Math.random() * 9999999) }, null, 2)
                        };

                        setSimulatedLogs(prev => [newLog, ...prev]);
                        setStatusMessage({ text: "✓ Pipeline de CI/CD ejecutada", success: true });
                        setTimeout(() => setStatusMessage(null), 4000);
                      }}
                      className="w-full bg-[#24292e] hover:bg-black text-white font-sans text-xs font-bold py-2.5 px-4 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">construction</span>
                      <span>Disparar Pipeline de Compilación</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Absolute Action Block */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="bg-primary hover:bg-primary-dark text-white px-8 py-3.5 rounded-full font-sans text-sm font-bold shadow-md transition-all cursor-pointer flex items-center gap-2 min-w-[200px] justify-center active:scale-95"
                >
                  <span className="material-symbols-outlined text-base">save</span>
                  <span>{savingConfig ? "Guardando..." : "Guardar Cambios"}</span>
                </button>
              </div>
            </form>

            {/* Simulated Live Logs Console Console Block */}
            <div className="space-y-4 font-mono">
              <div className="bg-slate-900 text-[#00ffcc] rounded-[2.5rem] p-6 text-left shadow-lg border border-slate-700 flex flex-col h-[650px]">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="font-sans text-xs font-bold text-slate-300 ml-2">Console: Integrations Hook Stream</span>
                  </div>
                  <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-[9px] px-2 py-0.5 rounded-md animate-pulse font-sans">
                    ● ESCUCHANDO
                  </span>
                </div>

                {/* Log Stream Section */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                  {simulatedLogs.map((log) => (
                    <div key={log.id} className="border-b border-slate-800 pb-3 space-y-1">
                      <div className="flex items-center justify-between text-xs font-sans">
                        <span className="text-[#ff9900] font-bold">[{log.type}]</span>
                        <span className="text-slate-400 text-[10px]">{log.time}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate font-sans">
                        POST <span className="underline">{log.url}</span>
                      </div>
                      
                      <div className="text-[11px] bg-slate-950 p-2 rounded-lg text-slate-200 overflow-x-auto whitespace-pre-wrap max-h-24 leading-normal select-text scrollbar-none">
                        <span className="text-[#a6e22e]">Payload:</span> {log.payload}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[10px] font-sans">
                        <span className="text-slate-500">Response ({log.status}):</span>
                        <span className={log.status >= 200 && log.status < 300 ? "text-green-400 font-mono" : "text-red-400 font-mono"}>
                          {log.response}
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="text-[10px] text-slate-500 text-center py-4 font-sans">
                    -- Fin de los registros transmitidos --
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-sans">
                  <span>Conector Activo Firestore db: <span className="text-[#00ffcc]">configs/integrations</span></span>
                  <button 
                    onClick={() => setSimulatedLogs([])}
                    className="text-slate-500 hover:text-[#00ffcc] font-bold font-mono py-1 px-2.5 rounded hover:bg-slate-800 transition-all select-none cursor-pointer"
                  >
                    CLEAR SCREEN
                  </button>
                </div>
              </div>

              {/* Quick instructions panel */}
              <div className="bg-white border border-outline-variant/35 rounded-[2.5rem] p-6 text-left space-y-3 font-sans text-xs">
                <h4 className="font-serif text-sm font-bold text-primary flex items-center gap-1.5 mb-1">
                  <span className="material-symbols-outlined text-secondary text-base">chrome_reader_mode</span>
                  Instrucciones técnicas para el programador
                </h4>
                <p className="text-on-surface-variant leading-relaxed text-[11px]">
                  Para utilizar estas ligaduras en el backend definitivo de su servidor o webhook receptor, los datos se emiten mediante llamadas HTTP estándar con el método <code>POST</code> y cabecera <code>Content-Type: application/json</code>. 
                </p>
                <div className="bg-ivory-base p-3.5 rounded-xl font-mono text-[9px] text-[#755848] select-all whitespace-pre leading-relaxed scrollbar-none overflow-x-auto">
{`// Estructura de suscripción del hook en su código final:
db.collection("configs").doc("integrations").onSnapshot(snap => {
  const config = snap?.data();
  // Almacene config.n8nWebhookUrl o config.hioposToken
});`}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================== MODAL EDITORS ==================================== */}

      {/* 1. SERVICE MODAL EDITOR */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] max-w-lg w-full p-6 md:p-8 shadow-2xl border border-outline-variant/30 text-left relative animate-in fade-in duration-200 my-8">
            <button
              onClick={() => setEditingService(null)}
              className="absolute top-6 right-6 text-outline hover:text-primary active:scale-90 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <h3 className="font-serif text-xl font-bold text-primary mb-1">
              {editingService.id ? "Editar Servicio" : "Nuevo Servicio de Le Petit Can"}
            </h3>
            <p className="text-xs text-on-surface-variant mb-5">
              Configura los detalles del servicio y los precios/tiempos asociados a cada tamaño.
            </p>

            <form onSubmit={handleSaveServiceClick} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                  Nombre del Servicio (Español)
                </label>
                <input
                  type="text"
                  required
                  value={editingService.title || ""}
                  onChange={(e) => setEditingService((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Baño de Hidratación Profunda"
                  className="w-full px-4 py-2 border border-outline-variant/40 rounded-full text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-background"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                  Descripción Corta
                </label>
                <textarea
                  value={editingService.desc || ""}
                  onChange={(e) => setEditingService((prev) => ({ ...prev, desc: e.target.value }))}
                  placeholder="Explica qué incluye la cosmética, secado o retoques..."
                  rows={2}
                  className="w-full px-4 py-2 border border-outline-variant/40 rounded-2xl text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-background"
                />
              </div>

              {/* Matrix of prices by size */}
              <div className="space-y-2 border-t border-outline-variant/10 pt-3">
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                  Matriz de Tarifas por Tamaño
                </label>
                <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                  {SIZES_FOR_PRICING.map((sz) => {
                    const priceVal = editingService.pricing?.[sz] || {
                      priceDisp: "0,00 €",
                      priceNum: 0,
                      durationDisp: "60 min",
                      durationMin: 60,
                    };

                    return (
                      <div
                        key={sz}
                        className="p-3 bg-ivory-base/40 border border-outline-variant/10 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-2 items-center text-xs"
                      >
                        <span className="font-sans font-extrabold text-[#755848] truncate">{sz}</span>
                        <div>
                          <input
                            type="number"
                            required
                            placeholder="Precio Num"
                            value={priceVal.priceNum || 0}
                            onChange={(e) => {
                              const num = parseFloat(e.target.value) || 0;
                              const currentPricing = { ...editingService.pricing };
                              currentPricing[sz] = {
                                ...priceVal,
                                priceNum: num,
                                priceDisp: priceVal.isHourly ? `${num.toFixed(2).replace(".", ",")} € / h` : `${num.toFixed(2).replace(".", ",")} €`,
                              };
                              setEditingService((prev) => ({ ...prev, pricing: currentPricing }));
                            }}
                            className="w-full px-2.5 py-1.5 border rounded-lg text-center"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            required
                            placeholder="Minutos"
                            value={priceVal.durationMin || 0}
                            onChange={(e) => {
                              const min = parseInt(e.target.value) || 0;
                              const currentPricing = { ...editingService.pricing };
                              currentPricing[sz] = {
                                ...priceVal,
                                durationMin: min,
                                durationDisp: `${min} min`,
                              };
                              setEditingService((prev) => ({ ...prev, pricing: currentPricing }));
                            }}
                            className="w-full px-2.5 py-1.5 border rounded-lg text-center"
                          />
                        </div>
                        <div className="flex items-center gap-1 pl-1">
                          <input
                            type="checkbox"
                            className="rounded border-outline-variant text-primary focus:ring-primary accent-primary h-3.5 w-3.5"
                            checked={priceVal.isHourly || false}
                            onChange={(e) => {
                              const val = e.target.checked;
                              const currentPricing = { ...editingService.pricing };
                              const num = priceVal.priceNum || 0;
                              currentPricing[sz] = {
                                ...priceVal,
                                isHourly: val,
                                priceDisp: val ? `${num} € / h (mín. 120')` : `${num.toFixed(2).replace(".", ",")} €`,
                              };
                              setEditingService((prev) => ({ ...prev, pricing: currentPricing }));
                            }}
                          />
                          <span className="text-[10px] text-outline font-semibold">Por Hora</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-outline-variant/15">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="flex-1 py-3 border border-outline-variant/40 rounded-full font-sans text-xs font-bold hover:bg-background block text-center cursor-pointer text-on-surface"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-primary text-white rounded-full font-sans text-xs font-bold hover:opacity-90 block text-center cursor-pointer"
                >
                  {isSaving ? "Guardando..." : "Guardar Servicio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. PRODUCT MODAL EDITOR */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] max-w-sm w-full p-6 shadow-2xl border border-outline-variant/30 text-left relative animate-in fade-in duration-200">
            <button
              onClick={() => setEditingProduct(null)}
              className="absolute top-6 right-6 text-outline hover:text-primary active:scale-90 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <h3 className="font-serif text-xl font-bold text-primary mb-1">
              {editingProduct.id ? "Editar Artículo" : "Nuevo Artículo con Stock"}
            </h3>
            <p className="text-xs text-on-surface-variant mb-5">
              Permite gestionar el stock actual de cosméticos, juguetes o accesorios nutricionales.
            </p>

            <form onSubmit={handleSaveProductClick} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                  Nombre del Artículo
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ""}
                  onChange={(e) => setEditingProduct((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Champú Orgánico de Caléndula 500ml"
                  className="w-full px-4 py-2 border border-outline-variant/40 rounded-full text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                    Categoría
                  </label>
                  <select
                    value={editingProduct.category || "Otros"}
                    onChange={(e) => setEditingProduct((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2 border border-outline-variant/40 rounded-full text-xs bg-background focus:outline-none focus:border-primary"
                  >
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                    Precio Venta (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.price !== undefined ? editingProduct.price : ""}
                    onChange={(e) => setEditingProduct((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 border border-outline-variant/40 rounded-full text-xs text-center font-mono focus:outline-none focus:border-primary bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                  Cantidad en Stock
                </label>
                <input
                  type="number"
                  required
                  value={editingProduct.stock !== undefined ? editingProduct.stock : ""}
                  onChange={(e) => setEditingProduct((prev) => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-outline-variant/40 rounded-full text-xs text-center font-mono focus:outline-none focus:border-primary bg-background"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                  Breve descripción
                </label>
                <input
                  type="text"
                  value={editingProduct.description || ""}
                  onChange={(e) => setEditingProduct((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Ej: Fórmula vegana, ideal para pieles muy sensibles."
                  className="w-full px-4 py-2 border border-outline-variant/40 rounded-full text-xs focus:outline-none focus:border-primary bg-background"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-outline-variant/15">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-3 border border-outline-variant/40 rounded-full font-sans text-xs font-bold hover:bg-background block text-center cursor-pointer text-on-surface"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-primary text-white rounded-full font-sans text-xs font-bold hover:opacity-90 block text-center cursor-pointer"
                >
                  {isSaving ? "Guardando..." : "Guardar Artículo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. OWNER MODAL EDITOR */}
      {editingOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] max-w-sm w-full p-6 shadow-2xl border border-outline-variant/30 text-left relative animate-in fade-in duration-200">
            <button
              onClick={() => setEditingOwner(null)}
              className="absolute top-6 right-6 text-outline hover:text-primary active:scale-90 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <h3 className="font-serif text-xl font-bold text-primary mb-1">
              {editingOwner.id ? "Editar Cuenta de Cliente" : "Nueva Cuenta de Cliente"}
            </h3>
            <p className="text-xs text-on-surface-variant mb-5">
              Crea o edita la información de contacto global del cliente (propietario).
            </p>

            <form onSubmit={handleSaveOwnerClick} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={editingOwner.name || ""}
                  onChange={(e) => setEditingOwner((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Elena Sanz"
                  className="w-full px-4 py-2 border border-outline-variant/40 rounded-full text-xs focus:outline-none focus:border-primary bg-background"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={editingOwner.contact || ""}
                  onChange={(e) => setEditingOwner((prev) => ({ ...prev, contact: e.target.value }))}
                  placeholder="Ej: elena.sanz@gmail.com"
                  className="w-full px-4 py-2 border border-outline-variant/40 rounded-full text-xs focus:outline-none focus:border-primary bg-background"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                  Teléfono de Contacto
                </label>
                <input
                  type="text"
                  value={editingOwner.phone || ""}
                  onChange={(e) => setEditingOwner((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Ej: +34 612 345 678"
                  className="w-full px-4 py-2 border border-outline-variant/40 rounded-full text-xs focus:outline-none focus:border-primary bg-background"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-outline-variant/15">
                <button
                  type="button"
                  onClick={() => setEditingOwner(null)}
                  className="flex-1 py-3 border border-outline-variant/40 rounded-full font-sans text-xs font-bold hover:bg-background block text-center cursor-pointer text-on-surface"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-primary text-white rounded-full font-sans text-xs font-bold hover:opacity-90 block text-center cursor-pointer"
                >
                  {isSaving ? "Guardando..." : "Guardar Propietario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. PET MODAL EDITOR */}
      {editingPet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] max-w-sm w-full p-6 shadow-2xl border border-outline-variant/30 text-left relative animate-in fade-in duration-200">
            <button
              onClick={() => setEditingPet(null)}
              className="absolute top-6 right-6 text-outline hover:text-primary active:scale-90 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <h3 className="font-serif text-xl font-bold text-primary mb-1">
              {editingPet.pet.id ? "Editar Ficha de Mascota" : "Añadir Nueva Mascota"}
            </h3>
            <p className="text-xs text-on-surface-variant mb-5">
              Especifica la raza, el temperamento y el tamaño para la correcta valoración.
            </p>

            <form onSubmit={handleSavePetClick} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                  Nombre de la Mascota
                </label>
                <input
                  type="text"
                  required
                  value={editingPet.pet.name || ""}
                  onChange={(e) =>
                    setEditingPet((prev) => {
                      if (!prev) return null;
                      return { ...prev, pet: { ...prev.pet, name: e.target.value } };
                    })
                  }
                  placeholder="Ej: Cooper"
                  className="w-full px-4 py-2 border border-outline-variant/40 rounded-full text-xs focus:outline-none focus:border-primary bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                    Raza / Cruce
                  </label>
                  <input
                    type="text"
                    value={editingPet.pet.breed || ""}
                    onChange={(e) =>
                      setEditingPet((prev) => {
                        if (!prev) return null;
                        return { ...prev, pet: { ...prev.pet, breed: e.target.value } };
                      })
                    }
                    placeholder="Ej: Cocker Spaniel"
                    className="w-full px-4 py-2 border border-outline-variant/40 rounded-full text-xs focus:outline-none focus:border-primary bg-background"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                    Clase de Tamaño
                  </label>
                  <select
                    value={editingPet.pet.size || "Pequeño"}
                    onChange={(e) =>
                      setEditingPet((prev) => {
                        if (!prev) return null;
                        return { ...prev, pet: { ...prev.pet, size: e.target.value as any } };
                      })
                    }
                    className="w-full px-4 py-2 border border-outline-variant/40 rounded-full text-xs bg-background focus:outline-none focus:border-primary"
                  >
                    <option value="Toy">Toy (&lt; 4 kg)</option>
                    <option value="Pequeño">Pequeño (4-10 kg)</option>
                    <option value="Mediano">Mediano (11-20 kg)</option>
                    <option value="Grande">Grande (21-35 kg)</option>
                    <option value="Gigante">Gigante (+35 kg)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                    Comportamiento
                  </label>
                  <input
                    type="text"
                    value={editingPet.pet.behavior || ""}
                    onChange={(e) =>
                      setEditingPet((prev) => {
                        if (!prev) return null;
                        return { ...prev, pet: { ...prev.pet, behavior: e.target.value } };
                      })
                    }
                    placeholder="Ej: Tranquilo / Mimoso"
                    className="w-full px-4 py-2 border border-outline-variant/40 rounded-full text-xs focus:outline-none focus:border-primary bg-background"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                    Fecha de Nacimiento / Edad
                  </label>
                  <input
                    type="text"
                    value={editingPet.pet.birthDate || ""}
                    onChange={(e) =>
                      setEditingPet((prev) => {
                        if (!prev) return null;
                        return { ...prev, pet: { ...prev.pet, birthDate: e.target.value } };
                      })
                    }
                    placeholder="Ej: 14 Feb 2020 o 3 Años"
                    className="w-full px-4 py-2 border border-outline-variant/40 rounded-full text-xs focus:outline-none focus:border-primary bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                    Estado Actual
                  </label>
                  <select
                    value={editingPet.pet.status || "ACTIVO"}
                    onChange={(e) =>
                      setEditingPet((prev) => {
                        if (!prev) return null;
                        return { ...prev, pet: { ...prev.pet, status: e.target.value as any } };
                      })
                    }
                    className="w-full px-4 py-2 border border-outline-variant/40 rounded-full text-xs bg-background focus:outline-none focus:border-primary"
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
                    Sesión Promedio
                  </label>
                  <input
                    type="text"
                    value={editingPet.pet.avgDuration || "1h 30min"}
                    onChange={(e) =>
                      setEditingPet((prev) => {
                        if (!prev) return null;
                        return { ...prev, pet: { ...prev.pet, avgDuration: e.target.value } };
                      })
                    }
                    className="w-full px-4 py-2 border border-outline-variant/40 rounded-full text-xs focus:outline-none focus:border-primary bg-background"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-outline-variant/15">
                <button
                  type="button"
                  onClick={() => setEditingPet(null)}
                  className="flex-1 py-3 border border-outline-variant/40 rounded-full font-sans text-xs font-bold hover:bg-background block text-center cursor-pointer text-on-surface"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-primary text-white rounded-full font-sans text-xs font-bold hover:opacity-90 block text-center cursor-pointer"
                >
                  {isSaving ? "Guardando..." : "Guardar Mascota"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
