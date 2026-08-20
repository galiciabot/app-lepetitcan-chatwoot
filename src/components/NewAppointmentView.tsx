import React, { useState } from "react";
import { AppointmentDraft } from "../types";

interface NewAppointmentViewProps {
  onSuccess: (draft: AppointmentDraft) => void;
}

export function NewAppointmentView({ onSuccess }: NewAppointmentViewProps) {
  const sizes = [
    { id: "Toy", sizeLabel: "Pequeño Diamante", weight: "< 4 kg", duration: "45 min", price: "desde 25€", tag: "TOY" },
    { id: "Mini", sizeLabel: "Pequeño", weight: "4 - 10 kg", duration: "60 min", price: "desde 35€", tag: "MINI" },
    { id: "Midi", sizeLabel: "Mediano", weight: "11 - 20 kg", duration: "90 min", price: "desde 45€", tag: "MIDI" },
    { id: "Maxi", sizeLabel: "Grande", weight: "21 - 35 kg", duration: "120 min", price: "desde 60€", tag: "MAXI" },
    { id: "Epic", sizeLabel: "Gigante", weight: "> 35 kg", duration: "150 min", price: "desde 80€", tag: "EPIC" },
  ];

  const [selectedId, setSelectedId] = useState<string>("Mini");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [successNotif, setSuccessNotif] = useState<string | null>(null);

  const selectedSize = sizes.find((s) => s.id === selectedId)!;

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
      if (currentStep === 1) {
        setSuccessNotif(`Paso 1 completado exitosamente: Seleccionado ${selectedSize.sizeLabel} (${selectedSize.id}).`);
        setTimeout(() => setSuccessNotif(null), 4000);
      }
    } else {
      // Complete drafts
      onSuccess({
        size: selectedSize.id as any,
        sizeLabel: selectedSize.sizeLabel,
        weight: selectedSize.weight,
        duration: selectedSize.duration,
        price: selectedSize.price,
      });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="w-full text-left">
      {/* Progress Indicator */}
      <div className="max-w-container-max mx-auto mt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-sans text-xs font-bold text-primary uppercase tracking-widest">
            Paso {currentStep} de 4
          </span>
          <span className="font-sans text-xs font-semibold text-outline">
            {currentStep === 1
              ? "Selección de Tamaño"
              : currentStep === 2
              ? "Ficha del Peludo & Dueño"
              : currentStep === 3
              ? "Servicios & Suplementos"
              : "Confirmación de Turno"}
          </span>
        </div>
        <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-container transition-all duration-500 ease-out"
            style={{ width: `${currentStep * 25}%` }}
          ></div>
        </div>
      </div>

      {successNotif && (
        <div className="mt-4 p-4 rounded-xl bg-secondary-container text-on-secondary-container font-sans text-xs font-bold flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{successNotif}</span>
        </div>
      )}

      {currentStep === 1 ? (
        <main className="max-w-container-max mx-auto mt-10 md:mt-16">
          <header className="mb-12">
            <h1 className="font-serif text-3xl md:text-5xl text-on-background font-bold mb-4">
              Nueva Cita
            </h1>
            <p className="font-sans text-base text-on-surface-variant max-w-2xl leading-relaxed">
              Selecciona el tamaño de tu compañero para que podamos asignar al estilista adecuado y calcular el tiempo perfecto para su cuidado.
            </p>
          </header>

          {/* Size Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
            {sizes.map((s) => {
              const isSelected = selectedId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`group relative flex flex-col text-left p-8 rounded-3xl transition-all duration-300 focus:outline-none border-2 cursor-pointer ${
                    isSelected
                      ? "bg-primary-container border-primary-container shadow-lg scale-102"
                      : "bg-surface-container-low border-transparent hover:border-outline-variant"
                  }`}
                >
                  <span
                    className={`absolute top-6 right-6 font-sans text-[10px] font-bold uppercase tracking-widest ${
                      isSelected ? "text-on-primary-container" : "text-warm-terracotta"
                    }`}
                  >
                    {s.tag}
                  </span>
                  <div className="mb-6">
                    <span
                      className={`material-symbols-outlined text-4xl ${
                        isSelected ? "text-on-primary-container" : "text-primary"
                      }`}
                    >
                      pets
                    </span>
                  </div>
                  <h3
                    className={`font-serif text-lg font-bold mb-1 ${
                      isSelected ? "text-on-primary-container" : "text-on-surface"
                    }`}
                  >
                    {s.sizeLabel}
                  </h3>
                  <p
                    className={`font-sans text-xs mb-6 ${
                      isSelected ? "text-on-primary-container/70" : "text-outline"
                    }`}
                  >
                    {s.weight}
                  </p>
                  <div className="mt-auto flex flex-col gap-2">
                    <div
                      className={`flex items-center gap-2 font-sans text-xs ${
                        isSelected ? "text-on-primary-container" : "text-on-surface-variant"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      <span className="font-semibold">{s.duration}</span>
                    </div>
                    <div
                      className={`font-serif text-lg font-bold ${
                        isSelected ? "text-on-primary-container" : "text-primary"
                      }`}
                    >
                      {s.price}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-on-primary-container text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter shadow-md">
                      Seleccionado
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Call to Action */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-outline-variant/30">
            <div className="flex items-center gap-4 text-left">
              <span className="material-symbols-outlined text-secondary text-2xl">info</span>
              <p className="font-sans text-xs md:text-sm text-on-surface-variant max-w-md">
                El precio final puede variar según el estado del manto y comportamiento del peludo.
              </p>
            </div>
            <button
              onClick={handleNextStep}
              className="w-full md:w-auto px-12 py-5 bg-primary text-white rounded-full font-serif text-lg font-bold shadow-xl hover:opacity-95 active:scale-95 transition-all cursor-pointer text-center"
            >
              Siguiente Paso
            </button>
          </div>
        </main>
      ) : (
        <main className="max-w-xl mx-auto mt-12 p-8 bg-white border border-outline-variant/20 rounded-[32px] shadow-sm text-center">
          <span className="material-symbols-outlined text-5xl text-secondary animate-bounce">
            {currentStep === 2
              ? "person_add"
              : currentStep === 3
              ? "checklist"
              : "verified_user"}
          </span>
          <h2 className="font-serif text-2xl font-bold text-primary mt-4 mb-2">
            {currentStep === 2
              ? "Paso 2: Detalles del Peludo"
              : currentStep === 3
              ? "Paso 3: Servicios Adicionales"
              : "Paso 4: Confirmación Final"}
          </h2>
          <p className="font-sans text-sm text-on-surface-variant mb-8">
            Aquí se despliega el formulario interactivo para completar el handoff de Stitch de manera limpia.
          </p>

          <div className="p-4 bg-ivory-base rounded-2xl text-left border border-outline-variant/20 mb-8 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-outline">Tamaño Selección:</span>
              <span className="text-primary">{selectedSize.sizeLabel} ({selectedSize.id})</span>
            </div>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-outline">Duración Base:</span>
              <span className="text-primary">{selectedSize.duration}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-outline">Precio Base:</span>
              <span className="text-primary">{selectedSize.price}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handlePrevStep}
              className="flex-1 py-4 border-2 border-primary text-primary rounded-full font-sans text-sm font-semibold hover:bg-ivory-base active:scale-95 transition-all cursor-pointer"
            >
              Atrás
            </button>
            <button
              onClick={handleNextStep}
              className="flex-grow py-4 bg-primary text-white rounded-full font-sans text-sm font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              {currentStep === 4 ? "Finalizar Turno" : "Continuar"}
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
