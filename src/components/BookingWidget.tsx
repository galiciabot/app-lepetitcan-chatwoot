import React, { useState } from "react";
import { Appointment, Service, Owner } from "../types";
import { lookupZoneByZip } from "./ClientDetailView";

export const SPANISH_DOG_BREEDS = [
  "Otro",
  "Mestizo",
  "Bichón Maltés",
  "Bulldog Francés",
  "Caniche (Poodle)",
  "Chihuahua",
  "Cocker Spaniel",
  "Golden Retriever",
  "Labrador Retriever",
  "Pastor Alemán",
  "Yorkshire Terrier",
  "Beagle",
  "Bodeguero Andaluz",
  "Bóxer",
  "Bulldog Inglés",
  "Carlino (Pug)",
  "Galgo Español",
  "Husky Siberiano",
  "Mastín Español",
  "Perro de Agua Español",
  "Pomerania",
  "Rottweiler",
  "San Bernardo",
  "Schnauzer",
  "Shih Tzu",
  "Teckel (Dachshund)"
];

interface BookingWidgetProps {
  onAppointmentCreated?: (appointment: Appointment) => void;
  onNavigateBack?: () => void;
  services?: Service[];
  owners?: Owner[];
}

export function BookingWidget({ onAppointmentCreated, onNavigateBack, services, owners }: BookingWidgetProps) {
  // Booking Form wizard step state: 1: Service, 2: Date & Time, 3: Dog Info & Contact, 4: Success Receipt
  const [step, setStep] = useState<number>(1);

  // Available luxurious treatments with real prices from www.lepetitcan.es
  const DEFAULT_SERVICES = [
    {
      id: "baño",
      title: "Baño",
      desc: "Cosmética natural nutritiva adaptada, secado manual suave libre de estrés, limpieza de oídos y corte de uñas básico.",
      pricing: {
        "Toy": { priceDisp: "30,00 €", priceNum: 30, durationDisp: "90 min", durationMin: 90 },
        "Pequeño": { priceDisp: "35,00 €", priceNum: 35, durationDisp: "90 min", durationMin: 90 },
        "Mediano": { priceDisp: "40,00 €", priceNum: 40, durationDisp: "90 min", durationMin: 90 },
        "Grande": { priceDisp: "45,00 €", priceNum: 45, durationDisp: "120 min", durationMin: 120 },
        "Gigante": { priceDisp: "50,00 € / h (mín. 120')", priceNum: 50, durationDisp: "mín. 120 min", durationMin: 120, isHourly: true },
        "Pequeño Diamante": { priceDisp: "30,00 €", priceNum: 30, durationDisp: "90 min", durationMin: 90 }
      } as Record<string, { priceDisp: string; priceNum: number; durationDisp: string; durationMin: number; isHourly?: boolean }>
    },
    {
      id: "baño_arreglo",
      title: "Baño + Arreglo",
      desc: "Tratamiento higiénico completo con retoques en zonas clave: perfilado de carita, patas y zona higiénica.",
      pricing: {
        "Toy": { priceDisp: "35,00 €", priceNum: 35, durationDisp: "90 min", durationMin: 90 },
        "Pequeño": { priceDisp: "40,00 €", priceNum: 40, durationDisp: "90 min", durationMin: 90 },
        "Mediano": { priceDisp: "45,00 €", priceNum: 45, durationDisp: "90 min", durationMin: 90 },
        "Grande": { priceDisp: "50,00 € - 55,00 €", priceNum: 52, durationDisp: "120 min", durationMin: 120 },
        "Gigante": { priceDisp: "50,00 € / h (mín. 120')", priceNum: 50, durationDisp: "mín. 120 min", durationMin: 120, isHourly: true },
        "Pequeño Diamante": { priceDisp: "35,00 €", priceNum: 35, durationDisp: "90 min", durationMin: 90 }
      } as Record<string, { priceDisp: string; priceNum: number; durationDisp: string; durationMin: number; isHourly?: boolean }>
    },
    {
      id: "corte_mixto",
      title: "Corte Mixto",
      desc: "Estilismo higiénico combinado: máquina en zonas de confort y tijera para definición estética en patas y cabeza.",
      pricing: {
        "Toy": { priceDisp: "40,00 €", priceNum: 40, durationDisp: "120 min", durationMin: 120 },
        "Pequeño": { priceDisp: "45,00 €", priceNum: 45, durationDisp: "120 min", durationMin: 120 },
        "Mediano": { priceDisp: "50,00 €", priceNum: 50, durationDisp: "120 min", durationMin: 120 },
        "Grande": { priceDisp: "55,00 € - 60,00 €", priceNum: 57, durationDisp: "120 min", durationMin: 120 },
        "Gigante": { priceDisp: "50,00 € / h (mín. 120')", priceNum: 50, durationDisp: "mín. 120 min", durationMin: 120, isHourly: true },
        "Pequeño Diamante": { priceDisp: "40,00 €", priceNum: 40, durationDisp: "120 min", durationMin: 120 }
      } as Record<string, { priceDisp: string; priceNum: number; durationDisp: string; durationMin: number; isHourly?: boolean }>
    },
    {
      id: "corte_tijera",
      title: "Corte Tijera",
      desc: "Corte artesanal premium esculpido totalmente a tijera, ajustado a los estándares de raza de forma meticulosa.",
      pricing: {
        "Toy": { priceDisp: "50,00 €", priceNum: 50, durationDisp: "120 min", durationMin: 120 },
        "Pequeño": { priceDisp: "50,00 € - 60,00 €", priceNum: 55, durationDisp: "120 min", durationMin: 120 },
        "Mediano": { priceDisp: "60,00 €", priceNum: 60, durationDisp: "120 min", durationMin: 120 },
        "Grande": { priceDisp: "50,00 € / h (mín. 120')", priceNum: 50, durationDisp: "mín. 120 min", durationMin: 120, isHourly: true },
        "Gigante": { priceDisp: "50,00 € / h (mín. 120')", priceNum: 50, durationDisp: "mín. 120 min", durationMin: 120, isHourly: true },
        "Pequeño Diamante": { priceDisp: "50,00 €", priceNum: 50, durationDisp: "120 min", durationMin: 120 }
      } as Record<string, { priceDisp: string; priceNum: number; durationDisp: string; durationMin: number; isHourly?: boolean }>
    },
    {
      id: "strippin",
      title: "Strippin (Pelo Duro)",
      desc: "Técnica de arranque manual del pelo de cobertura maduro, protegiendo la salud capilar y los colores de la raza.",
      pricing: {
        "Toy": { priceDisp: "45,00 €", priceNum: 45, durationDisp: "120 min", durationMin: 120 },
        "Pequeño": { priceDisp: "55,00 €", priceNum: 55, durationDisp: "120 min", durationMin: 120 },
        "Mediano": { priceDisp: "60,00 €", priceNum: 60, durationDisp: "120 min", durationMin: 120 },
        "Grande": { priceDisp: "50,00 € / h (mín. 120')", priceNum: 50, durationDisp: "mín. 120 min", durationMin: 120, isHourly: true },
        "Gigante": { priceDisp: "50,00 € / h (mín. 120')", priceNum: 50, durationDisp: "mín. 120 min", durationMin: 120, isHourly: true },
        "Pequeño Diamante": { priceDisp: "45,00 €", priceNum: 45, durationDisp: "120 min", durationMin: 120 }
      } as Record<string, { priceDisp: string; priceNum: number; durationDisp: string; durationMin: number; isHourly?: boolean }>
    },
    {
      id: "deslanado",
      title: "Deslanado",
      desc: "Cepillado exhaustivo y oxigenado para razas de doble capa, retirando subpelo muerto sin cortar la cutícula natural.",
      pricing: {
        "Toy": { priceDisp: "40,00 € - 45,00 €", priceNum: 42, durationDisp: "120 min", durationMin: 120 },
        "Pequeño": { priceDisp: "45,00 € - 50,00 €", priceNum: 47, durationDisp: "120 min", durationMin: 120 },
        "Mediano": { priceDisp: "50,00 €", priceNum: 50, durationDisp: "120 min", durationMin: 120 },
        "Grande": { priceDisp: "50,00 € / h (mín. 120')", priceNum: 50, durationDisp: "mín. 120 min", durationMin: 120, isHourly: true },
        "Gigante": { priceDisp: "50,00 € / h (mín. 120')", priceNum: 50, durationDisp: "mín. 120 min", durationMin: 120, isHourly: true },
        "Pequeño Diamante": { priceDisp: "40,00 € - 45,00 €", priceNum: 42, durationDisp: "120 min", durationMin: 120 }
      } as Record<string, { priceDisp: string; priceNum: number; durationDisp: string; durationMin: number; isHourly?: boolean }>
    },
    {
      id: "uñas",
      title: "Uñas",
      desc: "Corte guiado de uñas higiénicas y limado suave.",
      pricing: {
        "Toy": { priceDisp: "5,00 €", priceNum: 5, durationDisp: "15 min", durationMin: 15 },
        "Pequeño": { priceDisp: "7,00 €", priceNum: 7, durationDisp: "15 min", durationMin: 15 },
        "Mediano": { priceDisp: "9,00 €", priceNum: 9, durationDisp: "15 min", durationMin: 15 },
        "Grande": { priceDisp: "10,00 €", priceNum: 10, durationDisp: "15 min", durationMin: 15 },
        "Gigante": { priceDisp: "15,00 €", priceNum: 15, durationDisp: "15 min", durationMin: 15 },
        "Pequeño Diamante": { priceDisp: "5,00 €", priceNum: 5, durationDisp: "15 min", durationMin: 15 }
      } as Record<string, { priceDisp: string; priceNum: number; durationDisp: string; durationMin: number; isHourly?: boolean }>
    }
  ];

  const activeServices = services && services.length > 0 ? services : DEFAULT_SERVICES;

  // Appointment user selection state
  const [selectedService, setSelectedService] = useState(activeServices[0]);

  React.useEffect(() => {
    if (services && services.length > 0) {
      const exists = services.find((s) => s.id === selectedService.id);
      if (!exists) {
        setSelectedService(services[0]);
      }
    }
  }, [services]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const start = new Date();
    let added = 0;
    for (let i = 0; i < 15 && added < 1; i++) {
      const current = new Date();
      current.setDate(start.getDate() + i);
      const dayOfWeek = current.getDay();
      if (dayOfWeek === 0) continue;
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, "0");
      const dayCode = String(current.getDate()).padStart(2, "0");
      return `${year}-${month}-${dayCode}`;
    }
    return "2026-06-20";
  });
  const [selectedTime, setSelectedTime] = useState<string>("10:45");
  const [dogName, setDogName] = useState<string>("");
  const [breed, setBreed] = useState<string>("Otro");
  const [customBreed, setCustomBreed] = useState<string>("");
  const [dogSize, setDogSize] = useState<"Toy" | "Pequeño" | "Mediano" | "Grande" | "Gigante" | "Pequeño Diamante">("Pequeño");

  // Optional supplements (from the spreadsheet)
  const [supplements, setSupplements] = useState({
    nudos: false,
    comportamiento: false,
    seniors: false,
    lazos: false
  });

  const [ownerFirstName, setOwnerFirstName] = useState<string>("");
  const [ownerLastName, setOwnerLastName] = useState<string>("");
  const [ownerPhone, setOwnerPhone] = useState<string>("");
  const [ownerPhone2, setOwnerPhone2] = useState<string>("");
  const [ownerPhone2Label, setOwnerPhone2Label] = useState<string>("Móvil");
  const [ownerEmail, setOwnerEmail] = useState<string>("");
  const [ownerCity, setOwnerCity] = useState<string>("");
  const [ownerZipCode, setOwnerZipCode] = useState<string>("");
  const [ownerInstagram, setOwnerInstagram] = useState<string>("");
  const [ownerFacebook, setOwnerFacebook] = useState<string>("");
  const [lopdChecked, setLopdChecked] = useState<boolean>(false);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [selectedPetIndex, setSelectedPetIndex] = useState<number>(-1);
  const [newPetName, setNewPetName] = useState<string>("");
  const [newPetBreed, setNewPetBreed] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // High-fidelity receipt state stored for display after creation
  const [createdReceipt, setCreatedReceipt] = useState<Appointment | null>(null);
  const [successBanner, setSuccessBanner] = useState<{ dogName: string; date: string; time: string; id: string } | null>(null);

  // Contact & pet selection handler when user picks an existing Odoo contact
  const handleSelectContact = (ownerId: string) => {
    setSelectedContactId(ownerId);
    setSelectedPetIndex(-1);
    setNewPetName("");
    setNewPetBreed("");
    if (!owners) return;
    const owner = owners.find(o => o.id === ownerId);
    if (!owner) return;
    setOwnerFirstName(owner.firstName || owner.name.split(" ")[0] || "");
    setOwnerLastName(owner.lastName || owner.name.split(" ").slice(1).join(" ") || "");
    setOwnerPhone(owner.phone || "");
    setOwnerPhone2(owner.phone2 || "");
    setOwnerEmail(owner.contact || "");
    setOwnerCity(owner.city || "");
    setOwnerZipCode(owner.zipCode || "");
  };

  // When a pet is selected from the contact's list
  const handleSelectPet = (index: number) => {
    setSelectedPetIndex(index);
    setNewPetName("");
    setNewPetBreed("");
    if (!owners) return;
    const owner = owners.find(o => o.id === selectedContactId);
    if (!owner || !owner.pets) return;
    const pet = owner.pets[index];
    if (!pet) return;
    setDogName(pet.name || "");
    setBreed(pet.breed || "Otro");
  };

  // Reset contact selection to manual entry
  const handleResetContact = () => {
    setSelectedContactId("");
    setSelectedPetIndex(-1);
    setOwnerFirstName("");
    setOwnerLastName("");
    setOwnerPhone("");
    setOwnerPhone2("");
    setOwnerEmail("");
    setOwnerCity("");
    setOwnerZipCode("");
    setDogName("");
    setBreed("Otro");
  };

  // Dynamic open booking days (upcoming 6 business days skipping Sundays)
  const getUpcomingDays = () => {
    const days = [];
    const weekdays = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const start = new Date();
    let added = 0;
    for (let i = 0; i < 15 && added < 6; i++) {
      const current = new Date();
      current.setDate(start.getDate() + i);
      const dayOfWeek = current.getDay();
      if (dayOfWeek === 0) continue; // Skip Sundays

      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, "0");
      const dayCode = String(current.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${dayCode}`;

      days.push({
        date: dateString,
        label: weekdays[dayOfWeek],
        num: String(current.getDate()),
        available: true
      });
      added++;
    }
    return days;
  };

  const UPCOMING_DAYS = getUpcomingDays();

  // Available reservation hour slots
  const TIME_SLOTS = ["09:30", "10:45", "11:30", "14:00", "15:15", "16:15", "17:30"];

  // Size pricing multipliers as configured with real Le Petit Can rules
  const getCalculatedPrice = (): number => {
    let sizeKey: string = dogSize;
    if (sizeKey === "Pequeño Diamante") sizeKey = "Toy";
    
    const pricingVal = selectedService.pricing[sizeKey] || selectedService.pricing["Pequeño"];
    let basePriceNum = pricingVal?.priceNum || 30;
    
    let finalAmount = basePriceNum;
    if (supplements.nudos) finalAmount += 30; // 30 € / h
    if (supplements.comportamiento) finalAmount += 15; // 15 € / 30 min extra
    if (supplements.seniors) {
      // Toy: 5,00 €, Pequeño: 10,00 €, Mediano: 10,00 €, Grande/Gigante: 15,00 €
      if (sizeKey === "Toy") finalAmount += 5;
      else if (sizeKey === "Pequeño" || sizeKey === "Mediano") finalAmount += 10;
      else finalAmount += 15;
    }
    if (supplements.lazos) finalAmount += 3;

    return finalAmount;
  };

  const getCalculatedPriceString = () => {
    let sizeKey: string = dogSize;
    if (sizeKey === "Pequeño Diamante") sizeKey = "Toy";
    
    const pricingVal = selectedService.pricing[sizeKey] || selectedService.pricing["Pequeño"];
    if (pricingVal?.isHourly) {
      // Calculate estimated total based on minimum 2 hours (120 min)
      const estimatedMinimum = pricingVal.priceNum * 2;
      let finalEst = estimatedMinimum;
      if (supplements.nudos) finalEst += 30;
      if (supplements.comportamiento) finalEst += 15;
      if (supplements.seniors) finalEst += 15;
      if (supplements.lazos) finalEst += 3;
      return `${pricingVal.priceDisp} (Est. mín: €${finalEst})`;
    }
    
    return `€${getCalculatedPrice()}`;
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation checks
    const finalBreed = breed === "Otro" ? customBreed.trim() : breed.trim();

    if (!dogName || !finalBreed || !ownerFirstName || !ownerPhone || !ownerEmail) {
      setErrorMsg("Por favor, rellene todos los campos obligatorios del formulario, incluida la raza del perro.");
      return;
    }

    setIsSubmitting(true);

    const generatedId = `booking_${Date.now()}`;
    const periodType = parseInt(selectedTime.split(":")[0]) < 12 ? "AM" : "PM";
    const fullName = `${ownerFirstName.trim()} ${ownerLastName.trim()}`.trim();

    const newAppointment: Appointment = {
      id: generatedId,
      time: selectedTime,
      period: periodType,
      dogName: dogName.trim(),
      breed: finalBreed,
      size: dogSize,
      ownerName: fullName,
      service: selectedService.title,
      status: "Pendiente",
      rawTime: selectedTime,
      date: selectedDate,
      ownerFirstName: ownerFirstName.trim(),
      ownerLastName: ownerLastName.trim(),
      ownerPhone: ownerPhone.trim(),
      ownerPhone2: ownerPhone2.trim(),
      ownerPhone2Label: ownerPhone2Label,
      ownerEmail: ownerEmail.trim(),
      ownerCity: ownerCity.trim(),
      ownerZipCode: ownerZipCode.trim(),
      ownerInstagram: ownerInstagram.trim(),
      ownerFacebook: ownerFacebook.trim(),
    };

    try {
      // Save to localStorage
      const existing = JSON.parse(localStorage.getItem("le_petit_can_appointments") || "[]");
      existing.push(newAppointment);
      localStorage.setItem("le_petit_can_appointments", JSON.stringify(existing));

      // Confirm success state
      setCreatedReceipt(newAppointment);
      setSuccessBanner({
        dogName: newAppointment.dogName,
        date: newAppointment.date || "",
        time: `${newAppointment.time} ${newAppointment.period}`,
        id: newAppointment.id
      });

      // Reset form variables to start screen/step 1 of creating appointments immediately
      setStep(1);
      setDogName("");
      setBreed("Otro");
      setCustomBreed("");
      setOwnerFirstName("");
      setOwnerLastName("");
      setOwnerPhone("");
      setOwnerPhone2("");
      setOwnerPhone2Label("Móvil");
      setOwnerEmail("");
      setOwnerCity("");
      setOwnerZipCode("");
      setOwnerInstagram("");
      setOwnerFacebook("");
      setLopdChecked(false);
      setSupplements({
        nudos: false,
        comportamiento: false,
        seniors: false,
        lazos: false
      });

      if (onAppointmentCreated) {
        onAppointmentCreated(newAppointment);
      }
    } catch (err) {
      console.error("Failed to save booking locally", err);
      setErrorMsg("Error al guardar la reserva. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="lepetitcan-booking-widget" className="w-full max-w-4xl mx-auto bg-ivory-base/45 rounded-[2.5rem] border border-outline-variant/30 p-6 md:p-8 space-y-6 text-left shadow-[0_15px_40px_rgba(117,88,72,0.03)] animate-in fade-in duration-300">
      
      {/* Brand Header representing current website style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant/20 pb-5 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping"></span>
            <span className="font-sans text-[10px] font-bold tracking-widest text-secondary uppercase">
              Widget Oficial de Reservas Directas
            </span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-extrabold text-primary">
            Reserva Tu Cita en Le Petit Can
          </h2>
          <p className="font-sans text-xs text-on-surface-variant">
            Peluquería Canina Boutique &amp; Alta Estética en Narón. Conexión en tiempo real con nuestra agenda interna.
          </p>
        </div>
        {onNavigateBack && (
          <button
            onClick={onNavigateBack}
            className="px-4 py-2 bg-white hover:bg-surface-container border border-outline-variant/30 text-primary font-sans text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-xs shrink-0 self-start md:self-center"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Volver a la App
          </button>
        )}
      </div>

      {/* Steps indicators resembling GoHighLevel wizard */}
      <div className="flex justify-between items-center bg-white/70 p-3.5 rounded-3xl border border-outline-variant/15 text-xs font-bold text-outline-variant">
        <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : ""}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono ${step >= 1 ? "bg-primary text-white" : "bg-outline/20 text-on-surface"}`}>1</span>
          <span className="hidden sm:inline">Tratamiento</span>
        </div>
        <div className="h-px bg-outline-variant/20 flex-grow mx-4"></div>
        <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : ""}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono ${step >= 2 ? "bg-primary text-white" : "bg-outline/20 text-on-surface"}`}>2</span>
          <span className="hidden sm:inline">Fecha y Hora</span>
        </div>
        <div className="h-px bg-outline-variant/20 flex-grow mx-4"></div>
        <div className={`flex items-center gap-2 ${step >= 3 ? "text-primary" : ""}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono ${step >= 3 ? "bg-primary text-white" : "bg-outline/20 text-on-surface"}`}>3</span>
          <span className="hidden sm:inline">Tus Datos</span>
        </div>
        <div className="h-px bg-outline-variant/20 flex-grow mx-4"></div>
        <div className={`flex items-center gap-2 ${step === 4 ? "text-secondary" : ""}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono ${step === 4 ? "bg-secondary text-white" : "bg-outline/20 text-on-surface"}`}>4</span>
          <span className="hidden sm:inline">Confirmado</span>
        </div>
      </div>

      {successBanner && (
        <div className="bg-[#e6f4ea] border border-[#34a853]/20 p-4.5 rounded-[1.5rem] flex items-start gap-3.5 text-left animate-in fade-in zoom-in-95 duration-200">
          <div className="w-8 h-8 rounded-full bg-[#34a853]/10 flex items-center justify-center shrink-0 text-[#137333]">
            <span className="material-symbols-outlined text-lg">check_circle</span>
          </div>
          <div className="flex-1 space-y-0.5 font-sans">
            <h4 className="text-[12px] font-extrabold text-[#137333] uppercase tracking-wider">¡Cita Registrada Correctamente!</h4>
            <p className="text-[11.5px] text-[#137333]/90 leading-tight">
              La cita de <strong>{successBanner.dogName}</strong> se ha guardado para el día <strong>{successBanner.date}</strong> a las <strong>{successBanner.time}</strong> (ID: {successBanner.id}). El sistema está listo para agendar la siguiente.
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-[#137333]/70 hover:text-[#137333] cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* STEP 1: SERVICE CHOICE */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-1.5">
            <h3 className="font-serif text-lg font-bold text-primary">1. Selecciona el servicio para tu peludo</h3>
            <p className="text-xs text-on-surface-variant">Cada servicio incluye cosmética premium ajustada a las necesidades dermo-capilares específicas de tu mascota.</p>
          </div>

          {/* Sizing Tabs at Top of Step 1 */}
          <div className="space-y-2.5 p-5 bg-white/70 rounded-3xl border border-outline-variant/15">
            <label className="text-xs font-extrabold text-[#755848] uppercase tracking-wider block pl-1">
              ¿Qué tamaño tiene tu perro? (Selecciona para ver tarifas y tiempos reales de Le Petit Can)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px]">
              {[
                { value: "Toy", label: "Toy (< 4 kg)", desc: "Ej: Chihuahua, Bichón baby" },
                { value: "Pequeño", label: "Pequeño (4-10 kg)", desc: "Ej: Pug, Maltés, Westie" },
                { value: "Mediano", label: "Mediano (11-20 kg)", desc: "Ej: Cocker, Beagle, Cocker" },
                { value: "Grande", label: "Grande (21-35 kg)", desc: "Ej: Labrador, Golden" },
                { value: "Gigante", label: "Gigante (+35 kg)", desc: "Ej: Mastín, S. Bernardo" }
              ].map((sz) => {
                const isSelected = dogSize === sz.value || (dogSize === "Pequeño Diamante" && sz.value === "Toy");
                return (
                  <button
                    key={sz.value}
                    type="button"
                    onClick={() => setDogSize(sz.value as any)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "bg-white border-outline-variant/20 hover:border-outline-variant/45 text-on-surface"
                    }`}
                  >
                    <span className="font-bold block text-xs">{sz.label}</span>
                    <span className={`text-[8.5px] block mt-1 leading-tight ${isSelected ? "text-white/80" : "text-outline"}`}>
                      {sz.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeServices.map((srv) => {
              const works = selectedService.id === srv.id;
              const sizeKey = dogSize === "Pequeño Diamante" ? "Toy" : dogSize;
              const priceInfo = srv.pricing[sizeKey] || srv.pricing["Pequeño"];
              return (
                <div
                  key={srv.id}
                  onClick={() => setSelectedService(srv)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer text-left space-y-3 relative group overflow-hidden ${
                    works 
                      ? "bg-white border-primary shadow-sm" 
                      : "bg-white/50 border-outline-variant/25 hover:border-outline-variant/60 hover:bg-white"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-serif text-[15px] font-bold text-primary leading-tight group-hover:text-secondary-fixed transition-colors">
                      {srv.title}
                    </h4>
                    <span className="text-xs font-bold text-primary font-mono bg-ivory-base px-2.5 py-1 rounded-full border border-outline-variant/15 shrink-0">
                      {priceInfo?.priceDisp}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed font-sans">{srv.desc}</p>
                  <div className="flex items-center gap-1 text-[10.5px] font-bold text-outline uppercase font-mono pl-0.5">
                    <span className="material-symbols-outlined text-xs">schedule</span>
                    <span>{priceInfo?.durationDisp} aprox.</span>
                  </div>
                  {works && (
                    <div className="absolute right-3 bottom-3 text-primary animate-pulse">
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              className="px-8 py-3.5 bg-primary text-white font-sans text-xs font-bold rounded-full hover:bg-primary/95 transition-all text-center tracking-widest uppercase cursor-pointer"
            >
              Continuar a Horarios
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: DATE & TIME CHOOSE */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-1.5">
            <h3 className="font-serif text-lg font-bold text-primary">2. Elige la fecha y hora disponible</h3>
            <p className="text-xs text-on-surface-variant">Pulse sobre el día y luego escoja una de las horas disponibles asignadas de forma segura.</p>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-primary uppercase tracking-wider block pl-2">
              Día de la Cita
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {UPCOMING_DAYS.map((day) => {
                const isActive = selectedDate === day.date;
                return (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDate(day.date)}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary border-primary text-white shadow-xs"
                        : "bg-white border-outline-variant/20 hover:border-outline-variant/50 text-on-surface"
                    }`}
                  >
                    <span className="text-[10px] uppercase tracking-wider font-sans font-bold opacity-80">{day.label}</span>
                    <span className="text-lg font-mono font-bold leading-none">{day.num}</span>
                    <span className="text-[8px] font-bold translate-y-0.5 uppercase tracking-widest text-[#79c35a]">Libre</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-primary uppercase tracking-wider block pl-2">
              Horas de reserva disponibles
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
              {TIME_SLOTS.map((time) => {
                const isSelected = selectedTime === time;
                return (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-3 px-1 rounded-full border text-center font-mono text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-secondary text-white border-secondary transform scale-102 font-bold"
                        : "bg-white border-outline-variant/15 hover:border-outline-variant/40 text-on-surface-variant"
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-outline-variant/10">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3.5 bg-white hover:bg-surface-container border border-outline-variant/30 text-primary font-sans text-xs font-bold rounded-full transition-all cursor-pointer"
            >
              Atrás
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-8 py-3.5 bg-primary text-white font-sans text-xs font-bold rounded-full hover:bg-primary/95 transition-all text-center tracking-widest uppercase cursor-pointer"
            >
              Datos del Peludo
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CONTACT & DOG INFORMATION */}
      {step === 3 && (
        <form onSubmit={handleCreateBooking} className="space-y-6">
          <div className="space-y-1.5">
            <h3 className="font-serif text-lg font-bold text-primary">3. Datos del cliente y su mascota</h3>
            
            {/* Contact Selector */}
            <div className="bg-white p-4 rounded-2xl border border-outline-variant/20 space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-[#cf9681]">person_search</span>
                <label className="text-xs font-extrabold text-on-surface uppercase tracking-wider">Buscar cliente existente</label>
              </div>
              <select
                value={selectedContactId}
                onChange={(e) => {
                  if (e.target.value) handleSelectContact(e.target.value);
                  else handleResetContact();
                }}
                className="w-full px-4 py-2.5 border border-outline-variant rounded-full text-xs text-on-surface bg-white focus:outline-none focus:border-primary"
              >
                <option value="">— Nuevo cliente (rellenar manualmente) —</option>
                {(owners || []).filter(o => o.name && o.name !== "My Company").map(owner => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name} {owner.phone ? `· ${owner.phone}` : ""}
                  </option>
                ))}
              </select>

              {/* Show pets when a contact is selected */}
              {selectedContactId && (() => {
                const sel = owners?.find(o => o.id === selectedContactId);
                const pets = sel?.pets || [];
                return (
                  <div className="pt-2 border-t border-outline-variant/10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-base text-[#cf9681]">pets</span>
                      <span className="text-[11px] font-extrabold text-on-surface uppercase tracking-wider">Mascotas registradas</span>
                    </div>
                    {pets.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {pets.map((pet, idx) => (
                          <button
                            type="button"
                            key={pet.id}
                            onClick={() => handleSelectPet(idx)}
                            className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                              selectedPetIndex === idx
                                ? "bg-secondary text-white border-secondary"
                                : "bg-white border-outline-variant/30 hover:border-primary/30"
                            }`}
                          >
                            <span className="font-bold block truncate">{pet.name}</span>
                            <span className="text-[10px] opacity-75 truncate">{pet.breed} · {pet.size}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-outline italic">Este cliente no tiene mascotas registradas.</p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Owner Section */}
            <div className="bg-white p-5 rounded-3xl border border-outline-variant/20 space-y-4 text-left">
              <h4 className="font-serif text-xs font-extrabold text-secondary tracking-wider uppercase border-b border-outline-variant/10 pb-2">
                Información del Propietario
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface pl-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Clara"
value={ownerFirstName}
                     disabled={!!selectedContactId}
                     onChange={(e) => setOwnerFirstName(e.target.value)}
                    className="w-full px-4 py-2 border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary focus:bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface pl-1">Apellidos</label>
                  <input
                    type="text"
                    placeholder="Ej. Maldonado Díaz"
value={ownerLastName}
                     disabled={!!selectedContactId}
                     onChange={(e) => setOwnerLastName(e.target.value)}
                    className="w-full px-4 py-2 border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary focus:bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface pl-1">Teléfono 1 *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej: +34 612901234"
value={ownerPhone}
                     disabled={!!selectedContactId}
                     onChange={(e) => setOwnerPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary focus:bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface pl-1">Teléfono 2 (Opcional)</label>
                  <input
                    type="tel"
                    placeholder="Ej: +34 912345678"
value={ownerPhone2}
                     disabled={!!selectedContactId}
                     onChange={(e) => setOwnerPhone2(e.target.value)}
                    className="w-full px-4 py-2 border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary focus:bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface pl-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="cliente@dominio.com"
value={ownerEmail}
                     disabled={!!selectedContactId}
                     onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary focus:bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface pl-1">Ciudad</label>
                  <input
                    type="text"
                    placeholder="Ej: Vigo"
value={ownerCity}
                     disabled={!!selectedContactId}
                     onChange={(e) => setOwnerCity(e.target.value)}
                    className="w-full px-4 py-2 border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary focus:bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface pl-1">Código Postal</label>
                  <input
                    type="text"
                    placeholder="Ej: 36201"
value={ownerZipCode}
                     disabled={!!selectedContactId}
                     onChange={(e) => setOwnerZipCode(e.target.value)}
                    className="w-full px-4 py-2 border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary focus:bg-background"
                  />
                  {ownerZipCode && (
                    <div className="mt-1 flex items-center gap-1 text-[9px] text-[#cf9681] font-bold bg-[#cf9681]/10 px-2 py-0.5 rounded-full w-fit">
                      <span className="material-symbols-outlined text-[10px]">location_on</span>
                      <span>{lookupZoneByZip(ownerZipCode)}</span>
                    </div>
                  )}
                </div>
              </div>

              </div>

            {/* Dog Section */}
            <div className="bg-white p-5 rounded-3xl border border-outline-variant/20 space-y-4 text-left">
              <h4 className="font-serif text-xs font-extrabold text-secondary tracking-wider uppercase border-b border-outline-variant/10 pb-2">
                Ficha del Peludo
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface pl-1">Nombre del Perro *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Max"
                    value={dogName}
                    onChange={(e) => setDogName(e.target.value)}
                    className="w-full px-4 py-2 border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary focus:bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface pl-1">Raza del Perro *</label>
                  <select
                    required
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    className="w-full px-4 py-2 border border-outline-variant rounded-full text-xs text-on-surface bg-white focus:outline-none focus:border-primary focus:bg-background"
                  >
                    {SPANISH_DOG_BREEDS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  {breed === "Otro" && (
                    <input
                      type="text"
                      required
                      placeholder="Escribe la raza de tu perro..."
                      value={customBreed}
                      onChange={(e) => setCustomBreed(e.target.value)}
                      className="w-full mt-1.5 px-4 py-2 border border-outline-variant rounded-full text-xs text-on-surface focus:outline-none focus:border-primary focus:bg-background transition-all animate-in fade-in slide-in-from-top-1 duration-200"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface pl-1">Tamaño Canino *</label>
                <select
                  value={dogSize}
                  onChange={(e) => setDogSize(e.target.value as any)}
                  className="w-full px-4 py-2 border border-outline-variant bg-white rounded-full text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="Toy">Toy (&lt; 4 kg)</option>
                  <option value="Pequeño">Pequeño (4-10 kg)</option>
                  <option value="Mediano">Mediano (11-20 kg)</option>
                  <option value="Grande">Grande (21-35 kg)</option>
                  <option value="Gigante">Gigante (+35 kg)</option>
                </select>
              </div>

              {/* Supplements Selection List */}
              <div className="space-y-2 pt-2 border-t border-outline-variant/10">
                <label className="text-[11px] font-bold text-primary uppercase tracking-wider block pl-1">
                  Suplementos Especiales (Opcional)
                </label>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <label className="flex items-center gap-2 p-2 bg-ivory-base/40 hover:bg-white border border-outline-variant/15 rounded-xl cursor-pointer select-none transition-colors">
                    <input
                      type="checkbox"
                      className="rounded border-outline-variant text-primary focus:ring-primary accent-primary h-3.5 w-3.5"
                      checked={supplements.nudos}
                      onChange={(e) => setSupplements(prev => ({ ...prev, nudos: e.target.checked }))}
                    />
                    <div>
                      <span className="font-bold text-on-surface block">Nudos</span>
                      <span className="text-outline">30€ / hora</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-ivory-base/40 hover:bg-white border border-outline-variant/15 rounded-xl cursor-pointer select-none transition-colors">
                    <input
                      type="checkbox"
                      className="rounded border-outline-variant text-primary focus:ring-primary accent-primary h-3.5 w-3.5"
                      checked={supplements.comportamiento}
                      onChange={(e) => setSupplements(prev => ({ ...prev, comportamiento: e.target.checked }))}
                    />
                    <div>
                      <span className="font-bold text-on-surface block">Comportamiento</span>
                      <span className="text-outline">15€ / 30min extra</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-ivory-base/40 hover:bg-white border border-outline-variant/15 rounded-xl cursor-pointer select-none transition-colors">
                    <input
                      type="checkbox"
                      className="rounded border-outline-variant text-primary focus:ring-primary accent-primary h-3.5 w-3.5"
                      checked={supplements.seniors}
                      onChange={(e) => setSupplements(prev => ({ ...prev, seniors: e.target.checked }))}
                    />
                    <div>
                      <span className="font-bold text-on-surface block">Seniors</span>
                      <span className="text-outline">
                        {dogSize === "Toy" ? "5€" : (dogSize === "Pequeño" || dogSize === "Mediano") ? "10€" : "15€"}
                      </span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-ivory-base/40 hover:bg-white border border-outline-variant/15 rounded-xl cursor-pointer select-none transition-colors">
                    <input
                      type="checkbox"
                      className="rounded border-outline-variant text-primary focus:ring-primary accent-primary h-3.5 w-3.5"
                      checked={supplements.lazos}
                      onChange={(e) => setSupplements(prev => ({ ...prev, lazos: e.target.checked }))}
                    />
                    <div>
                      <span className="font-bold text-on-surface block">Lazos boutique</span>
                      <span className="text-outline">3,00 €</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bg-ivory-base/65 p-3.5 rounded-2xl text-[11px] text-on-surface-variant flex flex-col gap-1.5 border border-outline-variant/15">
                <div className="flex justify-between items-center">
                  <span>Tratamiento base: <b className="text-primary">{selectedService.title}</b></span>
                  <span className="font-mono font-bold text-primary">
                    {selectedService.pricing[dogSize === "Pequeño Diamante" ? "Toy" : dogSize]?.priceDisp}
                  </span>
                </div>
                {(supplements.nudos || supplements.comportamiento || supplements.seniors || supplements.lazos) && (
                  <div className="flex flex-wrap gap-1 text-[9px] text-outline pt-1 pb-1 border-y border-outline-variant/10">
                    {supplements.nudos && <span className="bg-white/80 border px-1.5 py-0.5 rounded-md">Nudos (+30€)</span>}
                    {supplements.comportamiento && <span className="bg-white/80 border px-1.5 py-0.5 rounded-md">Comportamiento (+15€)</span>}
                    {supplements.seniors && (
                      <span className="bg-white/80 border px-1.5 py-0.5 rounded-md">
                        Seniors (+{dogSize === "Toy" ? 5 : (dogSize === "Pequeño" || dogSize === "Mediano") ? 10 : 15}€)
                      </span>
                    )}
                    {supplements.lazos && <span className="bg-white/80 border px-1.5 py-0.5 rounded-md">Lazos (+3€)</span>}
                  </div>
                )}
                <div className="flex justify-between items-center text-xs font-bold pt-1 text-secondary uppercase tracking-wider">
                  <span>Total Estimado:</span>
                  <span className="font-mono text-base font-extrabold text-[#d2543d]">{getCalculatedPriceString()}</span>
                </div>
              </div>
            </div>

          </div>

          {errorMsg && (
            <div className="text-xs font-semibold text-warm-terracotta bg-warm-terracotta/5 px-4 py-2.5 rounded-xl border border-warm-terracotta/15 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-outline-variant/10">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-3.5 bg-white hover:bg-surface-container border border-outline-variant/30 text-primary font-sans text-xs font-bold rounded-full transition-all cursor-pointer"
            >
              Atrás
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3.5 bg-secondary text-white font-sans text-xs font-bold rounded-full hover:bg-secondary/95 transition-all text-center tracking-widest uppercase cursor-pointer disabled:bg-outline flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">
                {isSubmitting ? "hourglass_empty" : "done"}
              </span>
              <span>{isSubmitting ? "Agendando..." : "Confirmar Cita Directa"}</span>
            </button>
          </div>
        </form>
      )}

      {/* STEP 4: SUCCESS RECEIPT */}
      {step === 4 && createdReceipt && (
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-outline-variant/20 shadow-sm space-y-6 text-center animate-in zoom-in duration-300">
          <div className="w-16 h-16 bg-[#e6f4ea] rounded-full mx-auto flex items-center justify-center text-primary-container">
            <span className="material-symbols-outlined text-3xl text-[#1e8fd4]">celebration</span>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-serif text-2xl font-bold text-primary">¡Tu cita ha sido confirmada con éxito!</h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              Se ha emitido tu volante de admisión y se encuentra registrado en nuestra agenda central del salón. Te esperamos con el café y mimos listos para tu can.
            </p>
          </div>

          <div className="max-w-md bg-ivory-base p-5 rounded-3xl mx-auto border border-outline-variant/25 space-y-3.5 text-xs text-on-surface-variant divide-y divide-outline-variant/20">
            <div className="flex justify-between items-center font-bold font-serif pb-2 text-primary">
              <span>Nº de Reserva:</span>
              <span className="font-mono text-xs">{createdReceipt.id}</span>
            </div>
            
            <div className="flex justify-between items-center pt-2">
              <span>Propietario / Dueño:</span>
              <span className="font-semibold text-on-surface">{createdReceipt.ownerName}</span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span>Nombre de Mascota:</span>
              <span className="font-semibold text-on-surface">{createdReceipt.dogName} ({createdReceipt.breed})</span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span>Tratamiento Reservado:</span>
              <span className="font-semibold text-on-surface">{createdReceipt.service}</span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span>Fecha y Hora de Cita:</span>
              <span className="font-mono font-bold text-primary">{selectedDate} a las {createdReceipt.time} {createdReceipt.period}</span>
            </div>

            <div className="flex justify-between items-center pt-2 font-bold text-on-surface">
              <span>Tarifa Estimada:</span>
              <span className="text-sm font-mono text-secondary">{getCalculatedPriceString()}</span>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => {
                // Reset to let another booking take place
                setStep(1);
                setDogName("");
                setBreed("Otro");
                setCustomBreed("");
                setOwnerFirstName("");
                setOwnerLastName("");
                setOwnerPhone("");
                setOwnerPhone2("");
                setOwnerPhone2Label("Móvil");
                setOwnerEmail("");
                setOwnerCity("");
                setOwnerZipCode("");
                setOwnerInstagram("");
                setOwnerFacebook("");
                setLopdChecked(false);
              }}
              className="px-6 py-3 bg-ivory-base hover:bg-surface-container border border-outline-variant/20 text-primary font-sans text-xs font-bold rounded-full transition-all cursor-pointer active:scale-95"
            >
              Agendar Otro Peludo
            </button>
            {onNavigateBack && (
              <button
                onClick={onNavigateBack}
                className="px-6 py-3 bg-primary text-white font-sans text-xs font-bold rounded-full hover:bg-primary/95 transition-all cursor-pointer active:scale-95"
              >
                Volver a la App
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
