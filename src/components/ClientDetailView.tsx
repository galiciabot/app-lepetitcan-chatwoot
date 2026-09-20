import React, { useState, useEffect } from "react";
import { ClientProfile, Owner, Pet, Appointment, VisitHistory } from "../types";

const PRESET_OWNER_AVATARS = [
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
];

const PRESET_PET_AVATARS = [
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1552053831-71594a27632d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=150&auto=format&fit=crop&q=80"
];

const SPANISH_DOG_BREEDS = [
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
  "Pomerania",
  "Schnauzer",
  "Shih Tzu",
  "Teckel (Dachshund)",
  "Otro"
];

const BEHAVIOR_PRESETS = [
  "Manso / Cariñoso",
  "Tranquilo / Sociable",
  "Inquieto / Nervioso",
  "Miedoso / Asustadizo",
  "Agresivo / Reactivo",
  "Juguetón / Hiperactivo"
];

const SPANISH_MONTHS = [
  { value: "01", name: "Enero" },
  { value: "02", name: "Febrero" },
  { value: "03", name: "Marzo" },
  { value: "04", name: "Abril" },
  { value: "05", name: "Mayo" },
  { value: "06", name: "Junio" },
  { value: "07", name: "Julio" },
  { value: "08", name: "Agosto" },
  { value: "09", name: "Septiembre" },
  { value: "10", name: "Octubre" },
  { value: "11", name: "Noviembre" },
  { value: "12", name: "Diciembre" }
];

export function lookupZoneByZip(zip: string): string {
  if (!zip) return "";
  const code = zip.trim();
  if (code.startsWith("28")) return "Zona Centro-Madrid";
  if (code.startsWith("08")) return "Zona Metropolitana-Barcelona";
  if (code.startsWith("36") || code.startsWith("15") || code.startsWith("32") || code.startsWith("27")) {
    if (code.startsWith("362")) return "Zona Centro (Vigo)";
    if (code.startsWith("36")) return "Zona Sur (Galicia)";
    if (code.startsWith("150")) return "Zona Centro (A Coruña)";
    if (code.startsWith("15")) return "Zona Norte (Galicia)";
    return "Zona Galicia Interior";
  }
  if (code.startsWith("41")) return "Zona Sur-Sevilla";
  if (code.startsWith("46")) return "Zona Este-Valencia";
  if (code.startsWith("48")) return "Zona Norte-Vizcaya";
  
  const digit = parseInt(code.charAt(0)) || 0;
  if (digit % 3 === 0) return "Zona Centro";
  if (digit % 3 === 1) return "Zona Periferia";
  return "Zona Metropolitana";
}

function calculateAgeFromDateStr(dayStr: string, monthStr: string, yearStr: string): string {
  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return "Fecha no válida";

  const birth = new Date(year, month - 1, day);
  const today = new Date();
  
  if (birth > today) return "Nace en el futuro";

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years === 0) {
    if (months === 0) {
      return "Recién nacido";
    }
    return `${months} ${months === 1 ? "mes" : "meses"}`;
  } else {
    if (months === 0) {
      return `${years} ${years === 1 ? "año" : "años"}`;
    }
    return `${years} ${years === 1 ? "año" : "años"} y ${months} ${months === 1 ? "mes" : "meses"}`;
  }
}

function formatPetDisplayBirthdate(birthDateStr: string): string {
  if (!birthDateStr) return "-";
  const regexIso = /^(\d{4})-(\d{2})-(\d{2})$/;
  const regexSlash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  
  let year = 0, month = 0, day = 0;
  let parsed = false;

  const matchIso = birthDateStr.match(regexIso);
  if (matchIso) {
    year = parseInt(matchIso[1], 10);
    month = parseInt(matchIso[2], 10);
    day = parseInt(matchIso[3], 10);
    parsed = true;
  } else {
    const matchSlash = birthDateStr.match(regexSlash);
    if (matchSlash) {
      day = parseInt(matchSlash[1], 10);
      month = parseInt(matchSlash[2], 10);
      year = parseInt(matchSlash[3], 10);
      parsed = true;
    }
  }

  if (parsed) {
    const birth = new Date(year, month - 1, day);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();
    if (days < 0) months--;
    if (months < 0) {
      years--;
      months += 12;
    }
    
    const dStr = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
    if (years === 0) {
      const mLabel = months === 1 ? "mes" : "meses";
      return `${dStr} (${months > 0 ? `${months} ${mLabel}` : "Recién nacido"})`;
    } else {
      const yLabel = years === 1 ? "año" : "años";
      if (months === 0) {
        return `${dStr} (${years} ${yLabel})`;
      }
      const mLabel = months === 1 ? "mes" : "meses";
      return `${dStr} (${years} ${yLabel} y ${months} ${mLabel})`;
    }
  }

  return birthDateStr;
}

function parseExistingBirthDate(birthDateStr: string) {
  let day = "15";
  let month = "06";
  let year = "2024";

  if (!birthDateStr) return { day, month, year };

  const regexIso = /^(\d{4})-(\d{2})-(\d{2})$/;
  const regexSlash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

  const matchIso = birthDateStr.match(regexIso);
  if (matchIso) {
    year = matchIso[1];
    month = matchIso[2];
    day = matchIso[3];
  } else {
    const matchSlash = birthDateStr.match(regexSlash);
    if (matchSlash) {
      day = String(parseInt(matchSlash[1], 10)).padStart(2, "0");
      month = String(parseInt(matchSlash[2], 10)).padStart(2, "0");
      year = matchSlash[3];
    } else {
      const numMatch = birthDateStr.match(/(\d+)\s*año/i);
      const monthMatch = birthDateStr.match(/(\d+)\s*mes/i);
      const currentYearValue = new Date().getFullYear();
      
      let yearsOffset = 2;
      let monthsOffset = 0;
      
      if (numMatch) {
        yearsOffset = parseInt(numMatch[1], 10);
      }
      if (monthMatch) {
        monthsOffset = parseInt(monthMatch[1], 10);
      }
      
      const birthDate = new Date();
      birthDate.setFullYear(currentYearValue - yearsOffset);
      birthDate.setMonth(birthDate.getMonth() - monthsOffset);
      
      day = String(birthDate.getDate()).padStart(2, "0");
      month = String(birthDate.getMonth() + 1).padStart(2, "0");
      year = String(birthDate.getFullYear());
    }
  }
  return { day, month, year };
}

function parseDurationStr(durationStr: string) {
  let hours = "1";
  let minutes = "30";
  if (!durationStr) return { hours, minutes };

  const hMatch = durationStr.match(/(\d+)\s*h/);
  const mMatch = durationStr.match(/(\d+)\s*min/);

  if (hMatch) hours = hMatch[1];
  else if (durationStr.includes("min") && !durationStr.includes("h")) {
    hours = "0";
  }

  if (mMatch) minutes = mMatch[1];
  else minutes = "00";

  return { hours, minutes };
}

interface ClientDetailViewProps {
  onBack?: () => void;
  client?: ClientProfile;
  owners?: Owner[];
  onSaveOwner?: (owner: Owner) => void | Promise<void>;
  onDeleteOwner?: (id: string) => void | Promise<void>;
  appointments?: Appointment[];
  initialOwnerId?: string;
  initialPetId?: string;
  onUpdateAppointmentStatus?: (appointmentId: string, status: string) => void;
}

export function ClientDetailView({
  onBack,
  owners,
  onSaveOwner,
  onDeleteOwner,
  appointments,
  initialOwnerId,
  initialPetId,
  onUpdateAppointmentStatus,
}: ClientDetailViewProps) {
  // Static high-fidelity fallback dataset
  const FALLBACK_OWNERS = [
    {
      id: "o1",
      name: "Elena Sanz",
      contact: "elena.sanz@gmail.com",
      phone: "+34 612 345 678",
      since: "Ene 2023",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      pets: [
        {
          id: "p1_1",
          name: "Luna",
          breed: "Golden Retriever",
          size: "Mediano" as const,
          behavior: "Tranquilo / Sociable",
          birthDate: "15 May 2021",
          avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCUIWGD2R213a1OenjCraZmuoyfbvs4paKI6Lmb7BECCdzw9DPxc2ctTn_1rrXZnwZnTR-eAUDsqaYX1XYlyaPfAtuAN3gvxcsKbcCoROrdimYxD2xYTsGRwx4taIuB1YjxUFAy5xd-lId3I5dkT7i4ToFSofxh5-ZV9VYSM64SBj-sp7PcAN_9MVVS9RmMXrgamw621kFsIeo8XSIkN7Wp5O_zQemax0DVmxdth4_tovOhvNP_QVyTNjwo069dadJxOfYt9tY8LT0",
          avgDuration: "1h 30min",
          status: "ACTIVO" as const,
          lastVisitDate: "12 Octubre",
          lastVisitService: "Baño de Seda + Corte Higiénico",
          history: [
            {
              id: "h1_1",
              date: "12 Oct 2023",
              serviceTitle: "Sesión Premium SPA",
              duration: "1h 45min",
              status: "Completado",
              services: ["Baño de Seda Natural", "Mascarilla Nutritiva", "Limpieza Auricular Profunda"],
              notes: "Luna se portó excelente. Disfrutó mucho del masaje con la mascarilla. El pelaje está en óptimas condiciones, muy brillante.",
            },
            {
              id: "h1_2",
              date: "05 Sep 2023",
              serviceTitle: "Mantenimiento Mensual",
              duration: "45min",
              status: "Completado",
              services: ["Baño Desenredante", "Corte de Uñas"],
              notes: "Llegó con algunos nudos en las orejas, pero se retiraron con facilidad usando el acondicionador de aloe.",
            }
          ]
        }
      ]
    }
  ];

  const ACTUAL_OWNERS = owners || [];
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>(() => initialOwnerId || ACTUAL_OWNERS[0]?.id || "");
  const [selectedPetId, setSelectedPetId] = useState<string>(() => initialPetId || ACTUAL_OWNERS[0]?.pets?.[0]?.id || "");

  // Keep selected state in sync with props changes (e.g. from appointment click)
  useEffect(() => {
    if (initialOwnerId) {
      setSelectedOwnerId(initialOwnerId);
    }
    if (initialPetId) {
      setSelectedPetId(initialPetId);
    }
  }, [initialOwnerId, initialPetId]);

  const [filterActive, setFilterActive] = useState<boolean>(false);
  const [reportOpen, setReportOpen] = useState<boolean>(false);
  const [historyLimit, setHistoryLimit] = useState<number>(3);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals view controllers
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [ownerModalMode, setOwnerModalMode] = useState<"create" | "edit">("create");
  const [ownerForm, setOwnerForm] = useState({
    firstName: "",
    lastName: "",
    contact: "",
    phone: "",
    phone2: "",
    phone2Label: "Móvil",
    city: "",
    zipCode: "",
    instagram: "",
    facebook: "",
    avatar: PRESET_OWNER_AVATARS[0]
  });

  // Photo capture, file upload, & paste handlers
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === "string") {
        setOwnerForm((prev) => ({ ...prev, avatar: e.target.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePasteEvent = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          handleImageFile(file);
        }
      }
    }
  };

  const handleDropEvent = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleImageFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageFile(files[0]);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400, facingMode: "user" } });
      setCameraStream(stream);
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera access failed", err);
      alert("No se pudo acceder a la cámara. Asegúrate de dar los permisos correspondientes.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 400;
      canvas.height = video.videoHeight || 400;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setOwnerForm((prev) => ({ ...prev, avatar: dataUrl }));
        stopCamera();
      }
    }
  };

  useEffect(() => {
    if (!ownerModalOpen) {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
      setIsCameraActive(false);
    }
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [ownerModalOpen]);

  const [petModalOpen, setPetModalOpen] = useState(false);
  const [isPetCameraActive, setIsPetCameraActive] = useState(false);
  const [petCameraStream, setPetCameraStream] = useState<MediaStream | null>(null);
  const videoPetRef = React.useRef<HTMLVideoElement | null>(null);

  const handlePetImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === "string") {
        setPetForm((prev) => ({ ...prev, avatarUrl: e.target.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePetPasteEvent = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          handlePetImageFile(file);
        }
      }
    }
  };

  const handlePetDropEvent = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handlePetImageFile(files[0]);
    }
  };

  const handlePetFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handlePetImageFile(files[0]);
    }
  };

  const startPetCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400, facingMode: "user" } });
      setPetCameraStream(stream);
      setIsPetCameraActive(true);
      setTimeout(() => {
        if (videoPetRef.current) {
          videoPetRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Pet camera access failed", err);
      alert("No se pudo acceder a la cámara. Asegúrate de dar los permisos correspondientes.");
    }
  };

  const stopPetCamera = () => {
    if (petCameraStream) {
      petCameraStream.getTracks().forEach((track) => track.stop());
      setPetCameraStream(null);
    }
    setIsPetCameraActive(false);
  };

  const capturePetPhoto = () => {
    if (videoPetRef.current) {
      const video = videoPetRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 400;
      canvas.height = video.videoHeight || 400;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setPetForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
        stopPetCamera();
      }
    }
  };

  useEffect(() => {
    if (!petModalOpen) {
      if (petCameraStream) {
        petCameraStream.getTracks().forEach((track) => track.stop());
        setPetCameraStream(null);
      }
      setIsPetCameraActive(false);
    }
    return () => {
      if (petCameraStream) {
        petCameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [petModalOpen]);
  const [petModalMode, setPetModalMode] = useState<"create" | "edit">("create");
  const [petForm, setPetForm] = useState({
    name: "",
    breed: "Mestizo",
    size: "Pequeño" as "Toy" | "Pequeño" | "Mediano" | "Grande" | "Gigante" | "Pequeño Diamante",
    behavior: "Manso / Cariñoso",
    birthDate: "2 Años",
    avatarUrl: PRESET_PET_AVATARS[0],
    avgDuration: "1h 15min",
    status: "ACTIVO" as "ACTIVO" | "INACTIVO"
  });

  const [birthDay, setBirthDay] = useState<string>("15");
  const [birthMonth, setBirthMonth] = useState<string>("06");
  const [birthYear, setBirthYear] = useState<string>("2024");

  const [durationHours, setDurationHours] = useState<string>("1");
  const [durationMinutes, setDurationMinutes] = useState<string>("15");

  const [behaviorSelect, setBehaviorSelect] = useState<string>("Manso / Cariñoso");
  const [behaviorCustom, setBehaviorCustom] = useState<string>("");

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareAlert, setShareAlert] = useState<string | null>(null);

  // Auto calibrate selected items if database deletes/changes
  useEffect(() => {
    if (ACTUAL_OWNERS.length > 0) {
      const exists = ACTUAL_OWNERS.some((o) => o.id === selectedOwnerId);
      if (!exists) {
        setSelectedOwnerId(ACTUAL_OWNERS[0].id);
        if (ACTUAL_OWNERS[0].pets && ACTUAL_OWNERS[0].pets.length > 0) {
          setSelectedPetId(ACTUAL_OWNERS[0].pets[0].id);
        }
      } else {
        // Validate if selected pet belongs to current owner
        const currentOwnerObj = ACTUAL_OWNERS.find((o) => o.id === selectedOwnerId);
        const petExists = currentOwnerObj?.pets?.some((p) => p.id === selectedPetId);
        if (!petExists && currentOwnerObj?.pets && currentOwnerObj.pets.length > 0) {
          setSelectedPetId(currentOwnerObj.pets[0].id);
        }
      }
    }
  }, [owners, ACTUAL_OWNERS, selectedOwnerId, selectedPetId]);

  const matchesQuery = (target: string, query: string) => {
    const normTarget = (target || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const normQuery = (query || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return normTarget.includes(normQuery);
  };

  const filteredOwners = ACTUAL_OWNERS.filter((owner) => {
    if (!searchQuery) return true;
    if (matchesQuery(owner.name, searchQuery)) return true;
    if (matchesQuery(owner.phone, searchQuery)) return true;
    if (matchesQuery(owner.contact, searchQuery)) return true;
    const hasMatchingPet = owner.pets && owner.pets.some((pet) => 
      matchesQuery(pet.name, searchQuery) || matchesQuery(pet.breed, searchQuery)
    );
    if (hasMatchingPet) return true;
    return false;
  });

  const currentOwner = (filteredOwners.find((o) => o.id === selectedOwnerId) ||
    ACTUAL_OWNERS.find((o) => o.id === selectedOwnerId) ||
    filteredOwners[0] ||
    ACTUAL_OWNERS[0]) as Owner;

  const currentPet = (currentOwner?.pets?.find((p) => p.id === selectedPetId) ||
    currentOwner?.pets?.[0] || {
      id: "",
      name: "Sin Mascota",
      breed: "-",
      size: "Pequeño",
      behavior: "-",
      birthDate: "-",
      avatarUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80",
      avgDuration: "-",
      status: "INACTIVO",
      lastVisitDate: "-",
      lastVisitService: "-",
      history: []
    }) as Pet;

  const handleSelectOwner = (ownerId: string) => {
    setSelectedOwnerId(ownerId);
    const ownerObj = ACTUAL_OWNERS.find((o) => o.id === ownerId);
    if (ownerObj?.pets && ownerObj.pets.length > 0) {
      setSelectedPetId(ownerObj.pets[0].id);
    } else {
      setSelectedPetId("");
    }
    setHistoryLimit(3);
  };

  // CLIENT CRUD LOGIC
  const openCreateOwner = () => {
    setOwnerForm({
      firstName: "",
      lastName: "",
      contact: "",
      phone: "",
      phone2: "",
      phone2Label: "Móvil",
      city: "",
      zipCode: "",
      instagram: "",
      facebook: "",
      avatar: PRESET_OWNER_AVATARS[0]
    });
    setOwnerModalMode("create");
    setOwnerModalOpen(true);
  };

  const openEditOwner = () => {
    if (!currentOwner) return;
    setOwnerForm({
      firstName: currentOwner.firstName || currentOwner.name.split(" ")[0] || "",
      lastName: currentOwner.lastName || currentOwner.name.split(" ").slice(1).join(" ") || "",
      contact: currentOwner.contact,
      phone: currentOwner.phone,
      phone2: currentOwner.phone2 || "",
      phone2Label: currentOwner.phone2Label || "Móvil",
      city: currentOwner.city || "",
      zipCode: currentOwner.zipCode || "",
      instagram: currentOwner.instagram || "",
      facebook: currentOwner.facebook || "",
      avatar: currentOwner.avatar || PRESET_OWNER_AVATARS[0]
    });
    setOwnerModalMode("edit");
    setOwnerModalOpen(true);
  };

  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerForm.firstName.trim() || !ownerForm.contact.trim() || !ownerForm.phone.trim()) {
      alert("Por favor, rellene todos los campos obligatorios.");
      return;
    }

    const fullName = `${ownerForm.firstName.trim()} ${ownerForm.lastName.trim()}`.trim();

    if (ownerModalMode === "create") {
      const generatedId = `owner_${Date.now()}`;
      const newOwner: Owner = {
        id: generatedId,
        name: fullName,
        firstName: ownerForm.firstName.trim(),
        lastName: ownerForm.lastName.trim(),
        contact: ownerForm.contact.trim(),
        phone: ownerForm.phone.trim(),
        phone2: ownerForm.phone2.trim(),
        phone2Label: ownerForm.phone2Label,
        city: ownerForm.city.trim(),
        zipCode: ownerForm.zipCode.trim(),
        instagram: ownerForm.instagram.trim(),
        facebook: ownerForm.facebook.trim(),
        since: "Jun 2026",
        avatar: ownerForm.avatar,
        pets: []
      };
      if (onSaveOwner) {
        await onSaveOwner(newOwner);
      }
      setSelectedOwnerId(generatedId);
    } else {
      if (!currentOwner) return;
      const updatedOwner: Owner = {
        ...currentOwner,
        name: fullName,
        firstName: ownerForm.firstName.trim(),
        lastName: ownerForm.lastName.trim(),
        contact: ownerForm.contact.trim(),
        phone: ownerForm.phone.trim(),
        phone2: ownerForm.phone2.trim(),
        phone2Label: ownerForm.phone2Label,
        city: ownerForm.city.trim(),
        zipCode: ownerForm.zipCode.trim(),
        instagram: ownerForm.instagram.trim(),
        facebook: ownerForm.facebook.trim(),
        avatar: ownerForm.avatar
      };
      if (onSaveOwner) {
        await onSaveOwner(updatedOwner);
      }
    }
    setOwnerModalOpen(false);
  };

  const handleRemoveOwner = async () => {
    if (!currentOwner) return;
    const confirmDelete = window.confirm(
      `¿Desea eliminar de forma permanente a ${currentOwner.name} y todas sus mascotas registradas de la base de datos de Le Petit Can?`
    );
    if (confirmDelete && onDeleteOwner) {
      await onDeleteOwner(currentOwner.id);
      // Select next available
      const remaining = ACTUAL_OWNERS.filter((o) => o.id !== currentOwner.id);
      if (remaining.length > 0) {
        handleSelectOwner(remaining[0].id);
      }
    }
  };

  // PET CRUD LOGIC
  const openCreatePet = () => {
    setPetForm({
      name: "",
      breed: "Mestizo",
      size: "Pequeño",
      behavior: "Tranquilo / Sociable",
      birthDate: "2024-06-15",
      avatarUrl: PRESET_PET_AVATARS[0],
      avgDuration: "1h 15min",
      status: "ACTIVO"
    });
    setBirthDay("15");
    setBirthMonth("06");
    setBirthYear("2024");
    setDurationHours("1");
    setDurationMinutes("15");
    setBehaviorSelect("Tranquilo / Sociable");
    setBehaviorCustom("");
    setPetModalMode("create");
    setPetModalOpen(true);
  };

  const openEditPet = () => {
    if (!currentPet || currentPet.name === "Sin Mascota") return;
    setPetForm({
      name: currentPet.name,
      breed: currentPet.breed || "Mestizo",
      size: currentPet.size || "Pequeño",
      behavior: currentPet.behavior || "Tranquilo",
      birthDate: currentPet.birthDate || "2024-06-15",
      avatarUrl: currentPet.avatarUrl || PRESET_PET_AVATARS[0],
      avgDuration: currentPet.avgDuration || "1h 15min",
      status: currentPet.status || "ACTIVO"
    });

    const parsedDate = parseExistingBirthDate(currentPet.birthDate);
    setBirthDay(parsedDate.day);
    setBirthMonth(parsedDate.month);
    setBirthYear(parsedDate.year);

    const parsedDur = parseDurationStr(currentPet.avgDuration);
    setDurationHours(parsedDur.hours);
    setDurationMinutes(parsedDur.minutes);

    const exists = BEHAVIOR_PRESETS.includes(currentPet.behavior);
    if (exists) {
      setBehaviorSelect(currentPet.behavior);
      setBehaviorCustom("");
    } else {
      setBehaviorSelect("OTRO");
      setBehaviorCustom(currentPet.behavior || "");
    }

    setPetModalMode("edit");
    setPetModalOpen(true);
  };

  const handlePetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petForm.name.trim() || !petForm.breed.trim()) {
      alert("Por favor, rellene el nombre y la raza de la mascota.");
      return;
    }
    if (!currentOwner) return;

    const computedBirthDate = `${birthYear}-${birthMonth}-${birthDay}`;
    const computedDuration = `${durationHours}h ${durationMinutes}min`;
    const computedBehavior = behaviorSelect === "OTRO" ? behaviorCustom.trim() : behaviorSelect;

    if (!computedBehavior) {
      alert("Por favor, rellene la descripción del comportamiento personalizado.");
      return;
    }

    if (petModalMode === "create") {
      const gId = `pet_${Date.now()}`;
      const newPet: Pet = {
        id: gId,
        name: petForm.name,
        breed: petForm.breed,
        size: petForm.size,
        behavior: computedBehavior,
        birthDate: computedBirthDate,
        avatarUrl: petForm.avatarUrl,
        avgDuration: computedDuration,
        status: petForm.status,
        lastVisitDate: "Hoy",
        lastVisitService: "Apertura de ficha boutique",
        history: [
          {
            id: `h_${Date.now()}`,
            date: "Hoy",
            serviceTitle: "Alta de Ficha Técnica",
            duration: computedDuration,
            status: "Completo",
            services: ["Revisión del manto inicial", "Inspección de nudos iniciales"],
            notes: `Ficha veterinaria-estética de ${petForm.name} registrada con éxito. Comportamiento catalogado como: ${computedBehavior}.`
          }
        ]
      };
      const updatedOwner: Owner = {
        ...currentOwner,
        pets: [...(currentOwner.pets || []), newPet]
      };
      if (onSaveOwner) {
        await onSaveOwner(updatedOwner);
      }
      setSelectedPetId(gId);
    } else {
      if (!currentPet) return;
      const updatedPet: Pet = {
        ...currentPet,
        name: petForm.name,
        breed: petForm.breed,
        size: petForm.size,
        behavior: computedBehavior,
        birthDate: computedBirthDate,
        avatarUrl: petForm.avatarUrl,
        avgDuration: computedDuration,
        status: petForm.status
      };
      const updatedOwner: Owner = {
        ...currentOwner,
        pets: currentOwner.pets.map((p) => (p.id === currentPet.id ? updatedPet : p))
      };
      if (onSaveOwner) {
        await onSaveOwner(updatedOwner);
      }
    }
    setPetModalOpen(false);
  };

  const handleRemovePet = async () => {
    if (!currentOwner || !currentPet || currentPet.name === "Sin Mascota") return;
    const confirmDel = window.confirm(
      `¿Está absolutamente seguro de que desea eliminar la ficha de la mascota ${currentPet.name}?`
    );
    if (confirmDel) {
      const updatedOwner: Owner = {
        ...currentOwner,
        pets: currentOwner.pets.filter((p) => p.id !== currentPet.id)
      };
      if (onSaveOwner) {
        await onSaveOwner(updatedOwner);
      }
      if (updatedOwner.pets.length > 0) {
        setSelectedPetId(updatedOwner.pets[0].id);
      } else {
        setSelectedPetId("");
      }
    }
  };

  // EXPORT DOSSIER AS JSON FILE
  const handleExportJson = () => {
    if (!currentOwner) return;
    const dossier = {
      empresa: "Le Petit Can Peluquería Boutique",
      exportado_el: new Date().toLocaleString(),
      propietario: {
        id: currentOwner.id,
        nombre: currentOwner.name,
        contacto: currentOwner.contact,
        telefono: currentOwner.phone,
        cliente_desde: currentOwner.since
      },
      mascotas: currentOwner.pets.map((p) => ({
        nombre: p.name,
        raza: p.breed,
        tamano: p.size,
        comportamiento: p.behavior,
        nacimiento: p.birthDate,
        duracion_promedio: p.avgDuration,
        estado: p.status,
        historial_visitas: p.history || []
      }))
    };

    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dossier, null, 2));
    const exportAnchor = document.createElement("a");
    exportAnchor.setAttribute("href", dataUri);
    exportAnchor.setAttribute(
      "download",
      `lpc_ficha_tecnica_${currentOwner.name.toLowerCase().replace(/\s+/g, "_")}.json`
    );
    document.body.appendChild(exportAnchor);
    exportAnchor.click();
    exportAnchor.remove();
  };

  // SHARE ACTION CHANNELS
  const handleCopyClipboardDossier = () => {
    if (!currentOwner) return;
    let dossierStr = `💈 LPC Atellier - FICHA DE CLIENTE 💈\n`;
    dossierStr += `👤 Propietario: ${currentOwner.name}\n`;
    dossierStr += `📞 Teléfono: ${currentOwner.phone} | ✉️ Correo: ${currentOwner.contact}\n`;
    dossierStr += `─────────────────────────\n`;

    if (currentOwner.pets && currentOwner.pets.length > 0) {
      currentOwner.pets.forEach((pet, i) => {
        dossierStr += `🐾 Mascota #${i + 1}: ${pet.name} (${pet.breed})\n`;
        dossierStr += `   • Tamaño: ${pet.size} | Comportamiento: ${pet.behavior}\n`;
        dossierStr += `   • Última sesión: ${pet.lastVisitDate} - ${pet.lastVisitService}\n`;
        if (pet.history && pet.history.length > 0) {
          dossierStr += `   • Observaciones de cabina: "${pet.history[0].notes}"\n`;
        }
      });
    } else {
      dossierStr += `❌ Sin mascotas asociadas.\n`;
    }

    navigator.clipboard.writeText(dossierStr);
    setShareAlert("¡Resumen de ficha técnica formateado y copiado con éxito al portapapeles! Listo para enviar.");
    setTimeout(() => setShareAlert(null), 4000);
  };

  const handleSimulateWhatsApp = () => {
    if (!currentOwner) return;
    const bodyText = `Hola ${currentOwner.name}, te escribimos desde Le Petit Can. Queriamos compartir contigo el resumen de la ficha técnica de tus mascotas. Puedes descargar los recomendados de alimentación e hidratación en este enlace.`;
    const encoded = encodeURIComponent(bodyText);
    window.open(`https://api.whatsapp.com/send?phone=${currentOwner.phone.replace(/\s+/g, "")}&text=${encoded}`, "_blank");
    setShareAlert("Abriendo simulación de WhatsApp Web con la plantilla de cliente cargada.");
    setTimeout(() => setShareAlert(null), 4000);
  };

  const handleSimulateEmail = () => {
    if (!currentOwner) return;
    const subject = encodeURIComponent("Ficha Técnica Digital - Le Petit Can");
    const body = encodeURIComponent(
      `Estimado/a ${currentOwner.name},\n\nLe enviamos adjunto el resumen técnico e informe de estilismo de su mascota registrado en nuestro atelier.\n\nAtentamente,\nLe Petit Can`
    );
    window.open(`mailto:${currentOwner.contact}?subject=${subject}&body=${body}`);
  };

  // Map our dynamic appointments to VisitHistory interface
  const matchingAppointments = (appointments || []).filter(
    (ap) =>
      currentPet &&
      currentOwner &&
      currentPet.name &&
      currentOwner.name &&
      ap.dogName.toLowerCase() === currentPet.name.toLowerCase() &&
      ap.ownerName.toLowerCase() === currentOwner.name.toLowerCase()
  );

  const mappedAppts = matchingAppointments.map((ap) => {
    return {
      id: ap.id,
      date: ap.date || "2026-06-21",
      serviceTitle: ap.service,
      duration: "1h 30min",
      status: ap.status,
      services: [ap.service],
      notes: `Cita registrada para el ${ap.date || "2026-06-21"} a las ${ap.time} ${ap.period}.`,
      employeeName: "Iliana",
      pricePaid: 45,
      isGlobalAppointment: true,
    };
  });

  const combinedHistory: any[] = [];
  const addedIds = new Set<string>();

  for (const item of mappedAppts) {
    if (!addedIds.has(item.id)) {
      combinedHistory.push(item);
      addedIds.add(item.id);
    }
  }

  for (const item of (currentPet.history || [])) {
    if (!addedIds.has(item.id)) {
      combinedHistory.push(item);
      addedIds.add(item.id);
    }
  }

  const displayedHistory = filterActive
    ? combinedHistory.filter((h) => h.serviceTitle.toLowerCase().includes("spa") || h.serviceTitle.toLowerCase().includes("premium"))
    : combinedHistory.slice(0, historyLimit);

  return (
    <div className="w-full space-y-6">
      
      {/* Search and Top Panel actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-primary font-sans text-sm font-semibold hover:opacity-85 active:scale-95 cursor-pointer mb-2"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Volver a Dashboard
            </button>
          )}
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-bold">
            Fichas de Clientes
          </h2>
          <p className="font-sans text-xs text-on-surface-variant">
            Administración completa de propietarios, edición de rangos, eliminación de base de datos y compartir fichas.
          </p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={openCreateOwner}
            className="flex-1 md:flex-initial bg-primary hover:bg-primary-dark text-white px-5 py-3 rounded-full font-sans text-xs font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-transform duration-200 hover:scale-102"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>Añadir Cliente</span>
          </button>
        </div>
      </div>

      {shareAlert && (
        <div className="p-4 rounded-xl bg-secondary-container text-on-secondary-container font-sans text-xs font-bold flex items-center gap-2 animate-pulse shadow-xs">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{shareAlert}</span>
        </div>
      )}

      {/* Grid Layout splits 12 cols */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT PANEL: Client list switcher */}
        <section className="lg:col-span-4 bg-ivory-base p-5 rounded-[2.5rem] border border-outline-variant/30 flex flex-col justify-between space-y-4 self-stretch lg:h-full">
          <div className="space-y-4 flex flex-col flex-1 min-h-0">
            <div className="flex justify-between items-center px-1 shrink-0">
              <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-primary">
                Propietarios ({filteredOwners.length})
              </h3>
            </div>

            {/* Search bar inside ClientDetailView */}
            <div className="relative mx-1 shrink-0">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar por cliente, teléfono, mascota o raza..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border border-outline-variant/40 rounded-full text-xs text-on-surface bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary active:scale-95 cursor-pointer flex items-center"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
            </div>

            <div className="space-y-3.5 flex-1 min-h-[300px] lg:max-h-[820px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredOwners.map((owner) => {
              const isSelected = owner.id === selectedOwnerId;
              return (
                <button
                  key={owner.id}
                  onClick={() => handleSelectOwner(owner.id)}
                  className={`w-full text-left p-4 rounded-3xl border transition-all flex items-center gap-3.5 cursor-pointer ${
                    isSelected
                      ? "bg-secondary text-white border-secondary shadow-md scale-[0.99]"
                      : "bg-white text-on-surface border-outline-variant/20 hover:border-primary/20 hover:bg-surface-container-lowest shadow-sm"
                  }`}
                >
                  <img
                    src={owner.avatar}
                    alt={owner.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-sans text-sm font-bold truncate leading-tight">
                      {owner.name}
                    </h4>
                    <p className={`text-[10px] truncate ${isSelected ? "text-white/80" : "text-outline"}`}>
                      {owner.phone} • {owner.contact}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[11px]">pets</span>
                      <span className="text-[10px] font-bold">
                        {owner.pets ? owner.pets.length : 0} {owner.pets && owner.pets.length === 1 ? "mascota" : "mascotas"}
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-base shrink-0">
                    {isSelected ? "radio_button_checked" : "chevron_right"}
                  </span>
                </button>
              );
            })}

            {filteredOwners.length === 0 && (
              <p className="text-xs text-outline italic text-center py-6">
                No se encontraron propietarios o mascotas.
              </p>
            )}
          </div>
          </div>
          
          <div className="p-4 bg-white/50 rounded-2xl text-[10px] leading-relaxed text-on-surface-variant font-sans border border-outline-variant/10">
            <span className="font-bold text-primary block mb-0.5">💡 Administrar Base de Datos:</span>
            Usa el botón superior para añadir clientes, y el panel derecho para editar, eliminar, descargar el historial del cliente o compartirlo por canales.
          </div>
        </section>

        {/* RIGHT PANEL: Active Owner / Pet visualizers */}
        <div className="lg:col-span-8 space-y-6">
          
          {currentOwner ? (
            <>
              {/* OWNER HEADER CARD WITH FULL CONTROL */}
              <section className="bg-white rounded-[2.5rem] p-6 border border-outline-variant/30 shadow-[0_4px_25px_rgba(117,88,72,0.02)]">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                  <img
                    src={currentOwner.avatar}
                    alt={currentOwner.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">
                        Ficha de Propietario/a
                      </span>
                      <span className="text-[9px] bg-ivory-base border border-outline-variant/25 px-2 py-0.5 rounded-full text-outline font-sans">
                        ID: {currentOwner.id}
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-primary mb-1">
                      {currentOwner.name}
                    </h3>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">mail</span>
                        {currentOwner.contact}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">call</span>
                        {currentOwner.phone}
                      </span>
                      {currentOwner.phone2 && (
                        <span className="flex items-center gap-1 text-[11px] font-sans">
                          <span className="material-symbols-outlined text-xs text-[#cf9681]">phone_android</span>
                          <strong>Teléfono 2:</strong> {currentOwner.phone2}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">calendar_today</span>
                        Registro: {currentOwner.since}
                      </span>
                    </div>

                    {/* Meta Channels integrations and Zone assignment info */}
                    <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                      {currentOwner.city || currentOwner.zipCode ? (
                        <div className="flex items-center gap-1 text-[11px] font-sans bg-[#cf9681]/10 border border-[#cf9681]/20 px-2.5 py-1 rounded-full text-primary">
                          <span className="material-symbols-outlined text-xs">location_on</span>
                          <span>
                            {currentOwner.city ? currentOwner.city : ""}{" "}
                            {currentOwner.zipCode ? `(${currentOwner.zipCode})` : ""}
                          </span>
                          {currentOwner.zipCode && (
                            <span className="ml-1 bg-white text-secondary px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border border-outline-variant/30 uppercase">
                              {lookupZoneByZip(currentOwner.zipCode)}
                            </span>
                          )}
                        </div>
                      ) : null}

                      {currentOwner.instagram && (
                        <div className="flex items-center gap-1 text-[11px] font-sans bg-pink-500/5 text-pink-600 border border-pink-500/20 px-2.5 py-1 rounded-full animate-fade-in" title="Cuenta de Instagram vinculada para mensajería">
                          <span className="material-symbols-outlined text-xs text-pink-500">alternate_email</span>
                          <span>Instagram: @{currentOwner.instagram.replace(/^@/, '')}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                        </div>
                      )}

                      {currentOwner.facebook && (
                        <div className="flex items-center gap-1 text-[11px] font-sans bg-blue-500/5 text-blue-700 border border-blue-500/20 px-2.5 py-1 rounded-full animate-fade-in" title="Facebook Messenger de la sección de mensajes">
                          <span className="material-symbols-outlined text-[14px] text-blue-500 font-bold">chat_bubble</span>
                          <span>FB: {currentOwner.facebook}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Administrative Client Actions */}
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <button
                      onClick={openEditOwner}
                      className="w-9 h-9 rounded-full bg-secondary/10 hover:bg-secondary/20 text-secondary flex items-center justify-center transition-all active:scale-92"
                      title="Modificar Datos Cliente"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      onClick={handleExportJson}
                      className="w-9 h-9 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-all active:scale-92"
                      title="Descargar Ficha Completa (JSON)"
                    >
                      <span className="material-symbols-outlined text-base">download</span>
                    </button>
                    <button
                      onClick={() => setShareModalOpen(true)}
                      className="w-9 h-9 rounded-full bg-green-500/10 hover:bg-green-500/20 text-green-700 flex items-center justify-center transition-all active:scale-92"
                      title="Compartir o Enviar Ficha"
                    >
                      <span className="material-symbols-outlined text-base">share</span>
                    </button>
                    <button
                      onClick={handleRemoveOwner}
                      className="w-9 h-9 rounded-full bg-warm-terracotta/10 hover:bg-warm-terracotta/20 text-warm-terracotta flex items-center justify-center transition-all active:scale-92"
                      title="Eliminar de la Base de Datos"
                    >
                      <span className="material-symbols-outlined text-base font-bold">delete</span>
                    </button>
                  </div>
                </div>

                {/* Multiple Pets switcher belonging to active owner */}
                <div className="mt-6 pt-5 border-t border-outline-variant/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <p className="font-sans text-xs font-bold uppercase tracking-widest text-outline text-left">
                      Mascotas de {currentOwner.name} ({currentOwner.pets ? currentOwner.pets.length : 0}):
                    </p>
                    <button
                      onClick={openCreatePet}
                      className="px-3.5 py-1.5 border border-primary text-primary hover:bg-primary hover:text-white rounded-full font-sans text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 self-start"
                    >
                      <span className="material-symbols-outlined text-xs font-extrabold">add</span>
                      <span>Registrar Mascota</span>
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2.5">
                    {currentOwner.pets && currentOwner.pets.map((pet) => {
                      const isSelected = pet.id === selectedPetId;
                      return (
                        <button
                          key={pet.id}
                          onClick={() => setSelectedPetId(pet.id)}
                          className={`px-4 py-2.5 rounded-full border transition-all flex items-center gap-2 cursor-pointer text-left ${
                            isSelected
                              ? "bg-primary text-white border-primary shadow-sm scale-102"
                              : "bg-surface-container-low text-on-surface border-outline-variant/15 hover:bg-surface-container"
                          }`}
                        >
                          <div className="w-7 h-7 rounded-full overflow-hidden border border-white shrink-0">
                            <img
                              src={pet.avatarUrl}
                              alt={pet.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <p className="font-sans text-xs font-bold leading-none">{pet.name}</p>
                            <p className={`text-[9px] mt-0.5 leading-none ${isSelected ? "text-white/80" : "text-outline"}`}>
                              {pet.breed}
                            </p>
                          </div>
                          {isSelected && (
                            <span className="material-symbols-outlined text-xs ml-1">check_circle</span>
                          )}
                        </button>
                      );
                    })}

                    {(!currentOwner.pets || currentOwner.pets.length === 0) && (
                      <p className="text-xs text-outline italic py-2 pl-1">Sin mascotas de compañía registradas para este propietario.</p>
                    )}
                  </div>
                </div>
              </section>

              {/* PET FILE HIGHLIGHT */}
              {currentPet && currentPet.name !== "Sin Mascota" ? (
                <section className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-outline-variant/30 shadow-[0_4px_25px_rgba(117,88,72,0.02)] space-y-6">
                  
                  {/* Pet Info layout */}
                  <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 text-center md:text-left">
                    <div className="relative shrink-0">
                      <div className="w-36 h-36 md:w-40 md:h-40 p-1 bg-gradient-to-tr from-primary-container to-secondary-container rounded-full">
                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg">
                          <img
                            src={currentPet.avatarUrl}
                            alt={currentPet.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                      <div className="absolute bottom-1 right-1 bg-secondary text-white px-3 py-1 rounded-full text-[9px] font-extrabold shadow-md uppercase">
                        {currentPet.status}
                      </div>
                    </div>

                    <div className="flex-1 space-y-4 min-w-0">
                      <div>
                        <h3 className="font-serif text-3xl font-extrabold text-primary leading-tight">
                          {currentPet.name}
                        </h3>
                        <p className="font-sans text-sm text-on-surface-variant font-medium mt-0.5">
                          {currentPet.breed} • Ficha Estilo &amp; Veterinaria
                        </p>
                      </div>

                      <div className="flex flex-wrap justify-center md:justify-start gap-2">
                        <span className="bg-surface-container-low border border-outline-variant/20 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-medium text-on-surface shadow-xs">
                          <span className="material-symbols-outlined text-primary text-sm">straighten</span>
                          <span>{currentPet.size}</span>
                        </span>
                        <span className="bg-surface-container-low border border-outline-variant/20 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-medium text-on-surface shadow-xs">
                          <span className="material-symbols-outlined text-primary text-sm">psychology</span>
                          <span>{currentPet.behavior}</span>
                        </span>
                        <span className="bg-surface-container-low border border-outline-variant/20 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-medium text-on-surface shadow-xs">
                          <span className="material-symbols-outlined text-primary text-sm">cake</span>
                          <span>{formatPetDisplayBirthdate(currentPet.birthDate)}</span>
                        </span>
                        <span className="bg-primary/5 border border-primary/20 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold text-primary shadow-xs">
                          <span className="material-symbols-outlined text-primary text-sm animate-pulse-slow">schedule</span>
                          <span>Promedio: {currentPet.avgDuration}</span>
                        </span>
                      </div>

                      {/* Pet Admin Actions - Side-by-side, clean, responsive, and secure against wrapping/overflow */}
                      <div className="flex flex-row items-center gap-2 justify-center md:justify-start pt-2">
                        <button
                          onClick={openEditPet}
                          className="px-3.5 py-1.5 bg-secondary/10 hover:bg-secondary/20 text-secondary text-[11px] font-sans font-bold rounded-full border border-secondary/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                        >
                          <span className="material-symbols-outlined text-xs">edit</span>
                          <span>Editar<span className="hidden sm:inline"> Mascota</span></span>
                        </button>
                        <button
                          onClick={handleRemovePet}
                          className="px-3.5 py-1.5 bg-warm-terracotta/10 hover:bg-warm-terracotta/20 text-warm-terracotta text-[11px] font-sans font-bold rounded-full border border-warm-terracotta/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                        >
                          <span className="material-symbols-outlined text-xs font-bold">delete</span>
                          <span>Eliminar<span className="hidden sm:inline"> Mascota</span></span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* LAST VISIT STATS */}
                  <div className="bg-primary-container/20 border border-primary-container text-on-primary-container rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden group">
                    <div className="z-10 text-left space-y-0.5">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-primary opacity-80">
                        ÚLTIMO RECONOCIMIENTO
                      </p>
                      <h4 className="font-serif text-lg font-bold text-anthracite-grey leading-tight">
                        {currentPet.lastVisitDate}
                      </h4>
                      <p className="font-sans text-xs text-on-surface-variant">{currentPet.lastVisitService}</p>
                    </div>
                    <button
                      onClick={() => setReportOpen(true)}
                      className="z-10 shrink-0 bg-primary text-white hover:opacity-92 px-5 py-2.5 rounded-full font-sans text-xs font-bold active:scale-95 transition-all cursor-pointer shadow-sm"
                    >
                      Ver Informe de Cabina
                    </button>
                  </div>

                  {/* CLINIC AND STYLE HISTORY RECORDS */}
                  <div className="text-left pt-2 space-y-4">
                    <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                      <h4 className="font-serif text-lg font-bold text-primary">
                        Historial de Cabina y Estilo
                      </h4>
                      <button
                        onClick={() => setFilterActive(!filterActive)}
                        className={`font-sans text-xs font-bold flex items-center gap-1.5 hover:underline cursor-pointer transition-colors ${
                          filterActive ? "text-secondary" : "text-primary"
                        }`}
                      >
                        {filterActive ? "Mostrar Todos" : "Filtrar por SPA/Premium"}
                        <span className="material-symbols-outlined text-sm">
                          {filterActive ? "close" : "tune"}
                        </span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {displayedHistory.map((item) => (
                        <div
                          key={item.id}
                          className="bg-ivory-base border border-outline-variant/30 rounded-2xl p-4.5 hover:bg-white transition-all duration-200 shadow-xs"
                        >
                          <div className="flex justify-between items-start mb-2.5">
                            <div>
                              <p className="text-[9px] font-bold text-warm-terracotta uppercase tracking-wider">
                                {item.date}
                              </p>
                              <h5 className="font-sans text-sm font-bold text-anthracite-grey">
                                {item.serviceTitle} {item.duration ? `• ${item.duration}` : ""}
                              </h5>
                            </div>
                            <select
                              value={item.status}
                              onChange={(e) => {
                                if (onUpdateAppointmentStatus) {
                                  onUpdateAppointmentStatus(item.id, e.target.value);
                                }
                              }}
                              className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border-0 outline-none cursor-pointer focus:ring-1 focus:ring-primary ${
                                item.status.toLowerCase().includes("confirm")
                                  ? "bg-tertiary-container text-on-tertiary-container"
                                  : item.status.toLowerCase().includes("camino")
                                    ? "bg-secondary-container text-on-secondary-container"
                                    : item.status.toLowerCase().includes("anul")
                                      ? "bg-red-100 text-red-800"
                                      : item.status.toLowerCase().includes("final")
                                        ? "bg-stone-200 text-stone-800"
                                        : "bg-primary-container text-on-primary-container"
                              }`}
                            >
                              <option value="Pendiente">Pendiente</option>
                              <option value="Confirmada">Confirmada</option>
                              <option value="En camino">En Camino</option>
                              <option value="En Proceso">En Proceso</option>
                              <option value="Finalizada">Finalizada</option>
                              <option value="Anulada">Anulada</option>
                            </select>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            <div>
                              <p className="text-[8.5px] text-outline mb-1 font-bold uppercase tracking-wider">
                                Tratamientos Aplicados
                              </p>
                              <ul className="space-y-0.5">
                                {item.services && item.services.map((srv, idx) => (
                                  <li key={idx} className="flex items-center gap-1.5 text-xs text-on-surface">
                                    <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0"></span>{" "}
                                    {srv}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="bg-surface-container/60 p-3 rounded-lg border-l-4 border-primary/20">
                              <p className="text-[8.5px] text-outline mb-1 font-bold uppercase tracking-wider">
                                Observaciones de Peluquería
                              </p>
                              <p className="text-[10.5px] italic text-on-surface-variant leading-relaxed">
                                "{item.notes}"
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {displayedHistory.length === 0 && (
                        <p className="text-xs text-outline text-center py-4 italic">
                          No hay registros que coincidan con la búsqueda.
                        </p>
                      )}
                    </div>

                    {!filterActive && historyLimit < (currentPet.history ? currentPet.history.length : 0) && (
                      <div className="pt-2 text-center">
                        <button
                          onClick={() => setHistoryLimit((l) => l + 2)}
                          className="border border-primary text-primary px-6 py-2.5 rounded-full font-sans text-xs font-bold hover:bg-primary hover:text-white transition-all active:scale-95 cursor-pointer shadow-xs"
                        >
                          Cargar historial completo
                        </button>
                      </div>
                    )}
                  </div>

                </section>
              ) : null}
            </>
          ) : (
            <div className="bg-white rounded-[2.5rem] p-12 border border-outline-variant/30 text-center space-y-3 shadow-xs">
              <span className="material-symbols-outlined text-4xl text-outline">group</span>
              <p className="font-serif text-lg font-bold">Sin Propietarios Registrados</p>
              <p className="text-xs text-outline max-w-sm mx-auto">
                No hay ningún cliente o mascota en la lista que coincida con los criterios. Utiliza el botón añadir superior para crear tu primer cliente.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* MODAL: ADD / EDIT OWNER */}
      {ownerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-[2rem] max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-outline-variant/30 text-left relative animate-in zoom-in-95 duration-150 scrollbar-thin">
            <button
              onClick={() => setOwnerModalOpen(false)}
              className="absolute top-5 right-5 text-outline hover:text-primary active:scale-90 cursor-pointer"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
            <div className="mb-4">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-0.5">
                BASE DE DATOS ATELIER
              </span>
              <h3 className="font-serif text-xl font-bold text-primary">
                {ownerModalMode === "create" ? "Registrar Nuevo Cliente" : "Modificar Datos de Propietario"}
              </h3>
            </div>

             <form onSubmit={handleOwnerSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Nombre *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Elena"
                    value={ownerForm.firstName}
                    onChange={(e) => setOwnerForm({ ...ownerForm, firstName: e.target.value })}
                    className="w-full px-4 py-2 text-xs border border-outline-variant/40 rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Apellidos</label>
                  <input
                    type="text"
                    placeholder="Ej: Sanz Pérez"
                    value={ownerForm.lastName}
                    onChange={(e) => setOwnerForm({ ...ownerForm, lastName: e.target.value })}
                    className="w-full px-4 py-2 text-xs border border-outline-variant/40 rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Teléfono 1 (Principal) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+34 600000000"
                    value={ownerForm.phone}
                    onChange={(e) => setOwnerForm({ ...ownerForm, phone: e.target.value })}
                    className="w-full px-4 py-2 text-xs border border-outline-variant/40 rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Teléfono 2 (Opcional)</label>
                  <input
                    type="tel"
                    placeholder="Ej: +34 912345678"
                    value={ownerForm.phone2}
                    onChange={(e) => setOwnerForm({ ...ownerForm, phone2: e.target.value })}
                    className="w-full px-4 py-2 text-xs border border-outline-variant/40 rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="cliente@dominio.com"
                  value={ownerForm.contact}
                  onChange={(e) => setOwnerForm({ ...ownerForm, contact: e.target.value })}
                  className="w-full px-4 py-2 text-xs border border-outline-variant/40 rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Ciudad</label>
                  <input
                    type="text"
                    placeholder="Ej: Vigo"
                    value={ownerForm.city}
                    onChange={(e) => setOwnerForm({ ...ownerForm, city: e.target.value })}
                    className="w-full px-4 py-2 text-xs border border-outline-variant/40 rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Código Postal</label>
                  <input
                    type="text"
                    placeholder="Ej: 36201"
                    value={ownerForm.zipCode}
                    onChange={(e) => setOwnerForm({ ...ownerForm, zipCode: e.target.value })}
                    className="w-full px-4 py-2 text-xs border border-outline-variant/40 rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  {ownerForm.zipCode && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-[#cf9681] font-bold bg-[#cf9681]/15 px-2.5 py-0.5 rounded-full w-fit">
                      <span className="material-symbols-outlined text-[11px]">location_on</span>
                      <span>{lookupZoneByZip(ownerForm.zipCode)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[#cf9681]/5 rounded-3xl p-4 border border-[#cf9681]/15 space-y-3">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#cf9681] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs">forum</span>
                  <span>Vincular Canales de Mensajería</span>
                </p>
                <p className="text-[9px] text-outline leading-normal mb-1">
                  Introduce los usuarios de redes sociales de este propietario para emparejar automáticamente sus hilos de mensajería.
                </p>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-pink-600 font-bold">alternate_email</span>
                      <span>Usuario Instagram</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: @elena.sanz"
                      value={ownerForm.instagram}
                      onChange={(e) => setOwnerForm({ ...ownerForm, instagram: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-outline-variant/40 rounded-full focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-blue-600 font-bold">contact_mail</span>
                      <span>FB Messenger User</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: elena.sanz.fb"
                      value={ownerForm.facebook}
                      onChange={(e) => setOwnerForm({ ...ownerForm, facebook: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-outline-variant/40 rounded-full focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                  Foto de Perfil del Cliente
                </label>
                
                {/* Preset Avatars Selection */}
                <div className="space-y-1">
                  <span className="text-[9px] text-outline block">Elegir un avatar predefinido:</span>
                  <div className="flex gap-2">
                    {PRESET_OWNER_AVATARS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setOwnerForm({ ...ownerForm, avatar: url })}
                        className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                          ownerForm.avatar === url ? "border-primary scale-110 shadow-sm" : "border-transparent opacity-70"
                        }`}
                      >
                        <img src={url} alt={`owner preset ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Upload, Camera and Paste container */}
                <div className="mt-2 text-left">
                  <span className="text-[9px] text-outline block mb-1">O sube/captura una foto personalizada:</span>
                  
                  {isCameraActive ? (
                    <div className="border border-outline-variant/40 rounded-2xl p-3 bg-neutral-900 flex flex-col items-center space-y-2.5 relative">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline
                        className="w-full max-w-[240px] aspect-square rounded-xl object-cover bg-black"
                      />
                      <div className="flex gap-2 w-full justify-center">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="px-4 py-1.5 bg-[#cf9681] text-white font-sans text-xs font-bold rounded-full cursor-pointer hover:bg-[#b07d6a] active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-sm">photo_camera</span>
                          <span>Tomar Foto</span>
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="px-3 py-1.5 border border-white/20 text-white font-sans text-xs rounded-full cursor-pointer hover:bg-white/10 active:scale-95 transition-all"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onDragOver={(e) => { e.preventDefault(); }}
                      onDrop={handleDropEvent}
                      onPaste={handlePasteEvent}
                      tabIndex={0}
                      className="border border-dashed border-outline-variant/60 hover:border-primary/50 focus:border-primary/50 rounded-2xl p-4 bg-background transition-all outline-none flex flex-col items-center justify-center text-center cursor-pointer group"
                      onClick={() => document.getElementById("owner-photo-file-input")?.click()}
                      title="Haz clic para subir, arrastra un archivo o pulsa Ctrl+V para pegar"
                    >
                      <input 
                        type="file"
                        id="owner-photo-file-input"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      
                      <div className="flex gap-4 items-center w-full justify-between">
                        {/* Current/New preview */}
                        <div className="w-14 h-14 rounded-full overflow-hidden border border-outline-variant/30 flex-shrink-0 bg-white">
                          <img 
                            src={ownerForm.avatar || PRESET_OWNER_AVATARS[0]} 
                            alt="Preview avatar" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="text-left flex-1 space-y-0.5">
                          <p className="text-[11px] font-bold text-on-surface group-hover:text-primary transition-all">
                            Sube, saca o pega una foto
                          </p>
                          <p className="text-[9px] text-outline leading-tight">
                            Arrastra aquí, pulsa <b>Ctrl+V</b> para pegar, o haz clic para buscar.
                          </p>
                        </div>

                        {/* Interactive Buttons, clicking these will handle specific actions */}
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startCamera();
                            }}
                            className="p-1 px-2.5 bg-primary/10 hover:bg-primary/25 text-primary rounded-full font-sans text-[10px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xs">videocam</span>
                            <span>Cámara</span>
                          </button>
                          <span className="text-[8px] text-outline text-center">O Buscar</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setOwnerModalOpen(false)}
                  className="flex-1 py-2.5 border border-outline text-outline rounded-full font-sans text-xs font-bold hover:bg-surface-container active:scale-95 transition-all text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-white rounded-full font-sans text-xs font-bold hover:opacity-92 active:scale-95 transition-all text-center"
                >
                  {ownerModalMode === "create" ? "Registrar" : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PET */}
      {petModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-[2rem] max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-outline-variant/30 text-left relative animate-in zoom-in-95 duration-150 scrollbar-thin">
            <button
              onClick={() => setPetModalOpen(false)}
              className="absolute top-5 right-5 text-outline hover:text-primary active:scale-90 cursor-pointer"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
            <div className="mb-4">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-0.5">
                FICHA DE COMPAÑÍA
              </span>
              <h3 className="font-serif text-xl font-bold text-primary">
                {petModalMode === "create"
                  ? `Registrar Mascota para ${currentOwner?.name}`
                  : `Modificar Mascota ${currentPet?.name}`}
              </h3>
            </div>

            <form onSubmit={handlePetSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Nombre de Mascota</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Max"
                    value={petForm.name}
                    onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                    className="w-full px-4 py-2 text-xs border border-outline-variant/40 rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Raza del Perro</label>
                  <select
                    value={petForm.breed}
                    onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-outline-variant/40 rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                  >
                    {SPANISH_DOG_BREEDS.map((breed) => (
                      <option key={breed} value={breed}>
                        {breed}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Tamaño del Perro</label>
                  <select
                    value={petForm.size}
                    onChange={(e) => setPetForm({ ...petForm, size: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-outline-variant/40 rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                  >
                    <option value="Toy">Toy (&lt; 4kg)</option>
                    <option value="Pequeño">Pequeño (4-10kg)</option>
                    <option value="Mediano">Mediano (11-20kg)</option>
                    <option value="Grande">Grande (21-35kg)</option>
                    <option value="Gigante">Gigante (&gt; 35kg)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Fecha de Nacimiento</label>
                  <div className="grid grid-cols-3 gap-1">
                    <select
                      value={birthDay}
                      onChange={(e) => setBirthDay(e.target.value)}
                      className="px-1 py-2 text-[11px] border border-outline-variant/40 rounded-full focus:outline-none focus:border-primary bg-white text-center"
                      title="Día de nacimiento"
                    >
                      {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")).map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <select
                      value={birthMonth}
                      onChange={(e) => setBirthMonth(e.target.value)}
                      className="px-1 py-2 text-[10px] border border-outline-variant/40 rounded-full focus:outline-none focus:border-primary bg-white"
                      title="Mes de nacimiento"
                    >
                      {SPANISH_MONTHS.map((m) => (
                        <option key={m.value} value={m.value}>{m.name.substring(0, 4)}.</option>
                      ))}
                    </select>
                    <select
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      className="px-1 py-2 text-[11px] border border-outline-variant/40 rounded-full focus:outline-none focus:border-primary bg-white text-center"
                      title="Año de nacimiento"
                    >
                      {Array.from({ length: 27 }, (_, i) => String(2026 - i)).map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Dynamic Calculated Age Feedback under size/birthdate */}
              <div className="bg-ivory-base/40 p-2.5 rounded-xl border border-outline-variant/20 flex items-center gap-1.5 text-[10px] font-sans text-secondary font-bold">
                <span className="material-symbols-outlined text-xs">cake</span>
                <span>Edad Calculada: {calculateAgeFromDateStr(birthDay, birthMonth, birthYear)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-primary">Comportamiento</label>
                  <select
                    value={behaviorSelect}
                    onChange={(e) => setBehaviorSelect(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-outline-variant/40 rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                  >
                    {BEHAVIOR_PRESETS.map((preset) => (
                      <option key={preset} value={preset}>
                        {preset}
                      </option>
                    ))}
                    <option value="OTRO">+ Añadir otro comportamiento...</option>
                  </select>
                  
                  {behaviorSelect === "OTRO" && (
                    <div className="mt-1.5 animate-in slide-in-from-top-1 duration-150">
                      <input
                        type="text"
                        required
                        placeholder="Describir comportamiento..."
                        value={behaviorCustom}
                        onChange={(e) => setBehaviorCustom(e.target.value)}
                        className="w-full px-4 py-1.5 text-xs border border-outline-variant rounded-full focus:outline-none focus:border-primary"
                      />
                    </div>
                  )}
                </div>

                </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                  Fotografía del Peludo
                </label>
                
                {/* Preset Avatars Selection */}
                <div className="space-y-1">
                  <span className="text-[9px] text-outline block">Elegir un avatar predefinido:</span>
                  <div className="flex gap-2">
                    {PRESET_PET_AVATARS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPetForm({ ...petForm, avatarUrl: url })}
                        className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                          petForm.avatarUrl === url ? "border-primary scale-110 shadow-sm" : "border-transparent opacity-70"
                        }`}
                      >
                        <img src={url} alt={`pet preset ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Upload, Camera and Paste container */}
                <div className="mt-2 text-left">
                  <span className="text-[9px] text-outline block mb-1">O sube/captura una foto personalizada:</span>
                  
                  {isPetCameraActive ? (
                    <div className="border border-outline-variant/40 rounded-2xl p-3 bg-neutral-900 flex flex-col items-center space-y-2.5 relative">
                      <video 
                        ref={videoPetRef} 
                        autoPlay 
                        playsInline
                        className="w-full max-w-[240px] aspect-square rounded-xl object-cover bg-black"
                      />
                      <div className="flex gap-2 w-full justify-center">
                        <button
                          type="button"
                          onClick={capturePetPhoto}
                          className="px-4 py-1.5 bg-[#cf9681] text-white font-sans text-xs font-bold rounded-full cursor-pointer hover:bg-[#b07d6a] active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-sm">photo_camera</span>
                          <span>Tomar Foto</span>
                        </button>
                        <button
                          type="button"
                          onClick={stopPetCamera}
                          className="px-3 py-1.5 border border-white/20 text-white font-sans text-xs rounded-full cursor-pointer hover:bg-white/10 active:scale-95 transition-all"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onDragOver={(e) => { e.preventDefault(); }}
                      onDrop={handlePetDropEvent}
                      onPaste={handlePetPasteEvent}
                      tabIndex={0}
                      className="border border-dashed border-outline-variant/60 hover:border-primary/50 focus:border-primary/50 rounded-2xl p-4 bg-background transition-all outline-none flex flex-col items-center justify-center text-center cursor-pointer group"
                      onClick={() => document.getElementById("pet-photo-file-input")?.click()}
                      title="Haz clic para subir, arrastra un archivo o pulsa Ctrl+V para pegar"
                    >
                      <input 
                        type="file"
                        id="pet-photo-file-input"
                        accept="image/*"
                        onChange={handlePetFileChange}
                        className="hidden"
                      />
                      
                      <div className="flex gap-4 items-center w-full justify-between">
                        {/* Current/New preview */}
                        <div className="w-14 h-14 rounded-full overflow-hidden border border-outline-variant/30 flex-shrink-0 bg-white">
                          <img 
                            src={petForm.avatarUrl || PRESET_PET_AVATARS[0]} 
                            alt="Preview avatar" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="text-left flex-1 space-y-0.5">
                          <p className="text-[11px] font-bold text-on-surface group-hover:text-primary transition-all">
                            Sube, saca o pega una foto del peludo
                          </p>
                          <p className="text-[9px] text-outline leading-tight">
                            Arrastra aquí, pulsa <b>Ctrl+V</b> para pegar, o haz clic para buscar.
                          </p>
                        </div>

                        {/* Interactive Buttons, clicking these will handle specific actions */}
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startPetCamera();
                            }}
                            className="p-1 px-2.5 bg-primary/10 hover:bg-primary/25 text-primary rounded-full font-sans text-[10px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xs">videocam</span>
                            <span>Cámara</span>
                          </button>
                          <span className="text-[8px] text-outline text-center">O Buscar</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPetModalOpen(false)}
                  className="flex-1 py-2.5 border border-outline text-outline rounded-full font-sans text-xs font-bold hover:bg-surface-container active:scale-95 transition-all text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-white rounded-full font-sans text-xs font-bold hover:opacity-92 active:scale-95 transition-all text-center"
                >
                  {petModalMode === "create" ? "Registrar Mascota" : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SHARE / CHANNELS DIRECT */}
      {shareModalOpen && currentOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-[2rem] max-w-sm w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-outline-variant/30 text-left relative animate-in zoom-in-95 duration-150 scrollbar-thin">
            <button
              onClick={() => setShareModalOpen(false)}
              className="absolute top-5 right-5 text-outline hover:text-primary active:scale-90 cursor-pointer"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
            <div className="mb-4">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-0.5">
                COMPARTIR FICHA BOUTIQUE
              </span>
              <h3 className="font-serif text-xl font-bold text-primary">
                Canales e Integraciones
              </h3>
              <p className="text-[11px] text-outline mt-0.5">Propietario: {currentOwner.name}</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  handleSimulateWhatsApp();
                  setShareModalOpen(false);
                }}
                className="w-full p-3.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-emerald-800 rounded-2xl flex items-center gap-3 transition-all active:scale-[0.99] text-left cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">message</span>
                <div className="text-xs">
                  <p className="font-bold">Notificación de WhatsApp</p>
                  <p className="text-[9.5px] text-emerald-700/80">Ejecutar webhook e interconectar con agenda.</p>
                </div>
              </button>

              <button
                onClick={() => {
                  handleCopyClipboardDossier();
                  setShareModalOpen(false);
                }}
                className="w-full p-3.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary rounded-2xl flex items-center gap-3 transition-all active:scale-[0.99] text-left cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">content_copy</span>
                <div className="text-xs">
                  <p className="font-bold">Copiar Resumen para Canales</p>
                  <p className="text-[9.5px] text-outline">Formatear historial y nota de cabina al portapapeles.</p>
                </div>
              </button>

              <button
                onClick={() => {
                  handleSimulateEmail();
                  setShareModalOpen(false);
                }}
                className="w-full p-3.5 bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 text-secondary rounded-2xl flex items-center gap-3 transition-all active:scale-[0.99] text-left cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">mail</span>
                <div className="text-xs">
                  <p className="font-bold">Enviar Informe por correo</p>
                  <p className="text-[9.5px] text-outline">Pre-configurar correo con notas del Atelier.</p>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShareModalOpen(false)}
              className="mt-5 w-full py-2.5 bg-surface-container hover:bg-surface-container-highest text-on-surface rounded-full font-sans text-xs font-bold transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL: TECHNICAL ACTIVE REPORT VIEW */}
      {reportOpen && currentPet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-[2rem] max-w-lg w-full max-h-[90vh] overflow-y-auto p-7 shadow-2xl border border-outline-variant/30 text-left relative animate-in zoom-in-95 duration-150 scrollbar-thin">
            <button
              onClick={() => setReportOpen(false)}
              className="absolute top-5 right-5 text-outline hover:text-primary active:scale-90 cursor-pointer"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
            <div className="mb-4">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-0.5">
                INFORME DEL ATELIER
              </span>
              <h3 className="font-serif text-xl font-bold text-primary">
                Sesión técnica de {currentPet.name}
              </h3>
              <p className="text-xs text-outline">{currentPet.breed} • Propietario/a: {currentOwner?.name}</p>
            </div>

            <div className="space-y-3.5 border-t border-b border-outline-variant/20 py-4 mb-5 max-h-[350px] overflow-y-auto">
              <div>
                <h4 className="text-[11px] font-bold text-black uppercase tracking-wider mb-0.5">
                  Servicio de Tratamiento
                </h4>
                <p className="text-xs text-on-surface-variant">
                  {currentPet.lastVisitService || "Cuidado de Estilo general"} con cosmética dermo-protectora orgánica libre de sulfatos para su tipo de piel.
                </p>
              </div>
              <div>
                <h4 className="text-[11px] font-bold text-black uppercase tracking-wider mb-0.5">
                  Estado Corporal y Comportamiento
                </h4>
                <p className="text-xs text-on-surface-variant">
                  {currentPet.behavior}. Libre de parásitos. Manto deslanado e hidratado. Canales auditivos limpios.
                </p>
              </div>
              <div>
                <h4 className="text-[11px] font-bold text-black uppercase tracking-wider mb-0.5">
                  Recomendación del Estilista
                </h4>
                <p className="text-xs text-on-surface-variant">
                  Mantener pautas de cepillado intermedio en seco. Programar siguiente servicio en 4 o 6 semanas para evitar apelmazados de subpelo.
                </p>
              </div>
            </div>

            <button
              onClick={() => setReportOpen(false)}
              className="w-full py-3 bg-primary text-white hover:opacity-92 rounded-full font-sans text-xs font-bold active:scale-95 transition-all cursor-pointer text-center"
            >
              Cerrar Informe de Cabina
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
