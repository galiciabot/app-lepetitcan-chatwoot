import React, { useState, useEffect } from "react";
import { DesignTokens, ScreenList, AssetsList } from "./tokens";
import { Appointment, ClientProfile, ChatThread, AppointmentDraft, UserSession, UserRole, Service, Product, Owner, Pet } from "./types";

// Import view components
import { DashboardView } from "./components/DashboardView";
import { ClientDetailView } from "./components/ClientDetailView";
import { AnalyticsView } from "./components/AnalyticsView";
import { CalendarView } from "./components/CalendarView";
import { MessagingView } from "./components/MessagingView";
import { NewAppointmentView } from "./components/NewAppointmentView";
import { ActiveAppointmentView } from "./components/ActiveAppointmentView";
import { BreakConfigView } from "./components/BreakConfigView";
import { HandoffPanel } from "./components/HandoffPanel";
import { BookingWidget } from "./components/BookingWidget";
import { AdminManagementView } from "./components/AdminManagementView";

// Auth & SaaS Lock gate components
import { LoginView } from "./components/LoginView";
import { SuspendedView } from "./components/SuspendedView";
import { SaaSPaymentControl } from "./components/SaaSPaymentControl";
import { SecurityLopdView } from "./components/SecurityLopdView";

// Firebase imports — only Auth, no Firestore
import { auth, googleSignIn, logoutGoogle, initAuth } from "./firebase";
import * as odooService from "./services/odooService";

// Initial High-Fidelity Data for database seeding
const INITIAL_DEMO_APPOINTMENTS: Appointment[] = [
  {
    id: "a1",
    dogName: "Max",
    breed: "Bulldog",
    size: "Pequeño",
    ownerName: "Clara M.",
    service: "Baño & Spa",
    status: "Confirmada",
    period: "AM",
    time: "09:30",
    rawTime: "09:30",
    date: "2026-06-20",
  },
  {
    id: "a2",
    dogName: "Bella",
    breed: "Maltés",
    size: "Mediano",
    ownerName: "Luis R.",
    service: "Corte Boutique",
    status: "En camino",
    period: "AM",
    time: "11:15",
    rawTime: "11:15",
    date: "2026-06-20",
  },
  {
    id: "a3",
    dogName: "Cooper",
    breed: "Cocker",
    size: "Mediano",
    ownerName: "Ana G.",
    service: "Guardería",
    status: "Pendiente",
    period: "PM",
    time: "14:00",
    rawTime: "14:00",
    date: "2026-06-20",
  },
  {
    id: "a4",
    dogName: "Thor",
    breed: "Pastor Alemán",
    size: "Grande",
    ownerName: "Carlos Méndez",
    service: "Baño Terapéutico",
    status: "Confirmada",
    period: "AM",
    time: "11:30",
    rawTime: "11:30",
    date: "2026-06-20",
  },
  {
    id: "a5",
    dogName: "Luna",
    breed: "Golden Retriever",
    size: "Mediano",
    ownerName: "Elena Sanz",
    service: "Sesión Fotográfica Post-Corte",
    status: "Confirmada",
    period: "PM",
    time: "16:15",
    rawTime: "16:15",
    date: "2026-06-20",
  },
  {
    id: "appt_kovu_1",
    dogName: "Kovu",
    breed: "Bulldog Francés",
    size: "Pequeño",
    ownerName: "Hugo L.",
    service: "Ozonoterapia & Spa",
    status: "Finalizada",
    period: "AM",
    time: "10:00",
    rawTime: "10:00",
    date: "2026-01-12",
  },
  {
    id: "appt_linda_1",
    dogName: "Linda",
    breed: "Bichón Maltés",
    size: "Toy",
    ownerName: "Valeria M.",
    service: "Especial Cachorros",
    status: "Finalizada",
    period: "AM",
    time: "11:30",
    rawTime: "11:30",
    date: "2026-01-20",
  },
  {
    id: "appt_max_1",
    dogName: "Max",
    breed: "Bulldog",
    size: "Pequeño",
    ownerName: "Clara M.",
    service: "Corte de Uñas Express",
    status: "Finalizada",
    period: "PM",
    time: "15:00",
    rawTime: "15:00",
    date: "2026-02-05",
  },
  {
    id: "appt_bella_1",
    dogName: "Bella",
    breed: "Maltés",
    size: "Mediano",
    ownerName: "Luis R.",
    service: "Baño Terapéutico",
    status: "Finalizada",
    period: "AM",
    time: "09:00",
    rawTime: "09:00",
    date: "2026-02-14",
  },
  {
    id: "appt_cooper_1",
    dogName: "Cooper",
    breed: "Cocker",
    size: "Mediano",
    ownerName: "Ana G.",
    service: "Corte Boutique",
    status: "Finalizada",
    period: "PM",
    time: "16:00",
    rawTime: "16:00",
    date: "2026-03-03",
  },
  {
    id: "appt_thor_1",
    dogName: "Thor",
    breed: "Pastor Alemán",
    size: "Grande",
    ownerName: "Carlos Méndez",
    service: "Baño & Desparasitación",
    status: "Finalizada",
    period: "AM",
    time: "10:30",
    rawTime: "10:30",
    date: "2026-03-24",
  },
  {
    id: "appt_luna_1",
    dogName: "Luna",
    breed: "Golden Retriever",
    size: "Mediano",
    ownerName: "Elena Sanz",
    service: "Corte Tijera",
    status: "Finalizada",
    period: "AM",
    time: "11:00",
    rawTime: "11:00",
    date: "2026-04-10",
  },
  {
    id: "appt_kovu_2",
    dogName: "Kovu",
    breed: "Bulldog Francés",
    size: "Pequeño",
    ownerName: "Hugo L.",
    service: "Baño & Spa",
    status: "Finalizada",
    period: "PM",
    time: "14:30",
    rawTime: "14:30",
    date: "2026-04-22",
  },
  {
    id: "appt_linda_2",
    dogName: "Linda",
    breed: "Bichón Maltés",
    size: "Toy",
    ownerName: "Valeria M.",
    service: "Corte Higiénico",
    status: "Finalizada",
    period: "AM",
    time: "09:30",
    rawTime: "09:30",
    date: "2026-05-02",
  },
  {
    id: "appt_cooper_2",
    dogName: "Cooper",
    breed: "Cocker",
    size: "Mediano",
    ownerName: "Ana G.",
    service: "Baño Higiénico",
    status: "Finalizada",
    period: "PM",
    time: "17:00",
    rawTime: "17:00",
    date: "2026-05-18",
  },
  {
    id: "appt_max_2",
    dogName: "Max",
    breed: "Bulldog",
    size: "Pequeño",
    ownerName: "Clara M.",
    service: "Corte Completo",
    status: "Finalizada",
    period: "AM",
    time: "10:30",
    rawTime: "10:30",
    date: "2026-06-05",
  },
  {
    id: "appt_bella_2",
    dogName: "Bella",
    breed: "Maltés",
    size: "Mediano",
    ownerName: "Luis R.",
    service: "Baño & Hidratación",
    status: "Confirmada",
    period: "PM",
    time: "15:30",
    rawTime: "15:30",
    date: "2026-06-25",
  },
  {
    id: "appt_thor_2",
    dogName: "Thor",
    breed: "Pastor Alemán",
    size: "Grande",
    ownerName: "Carlos Méndez",
    service: "Mantenimiento Express",
    status: "Confirmada",
    period: "AM",
    time: "09:00",
    rawTime: "09:00",
    date: "2026-07-04",
  },
  {
    id: "appt_luna_2",
    dogName: "Luna",
    breed: "Golden Retriever",
    size: "Mediano",
    ownerName: "Elena Sanz",
    service: "Tratamiento de Manto",
    status: "Confirmada",
    period: "PM",
    time: "16:00",
    rawTime: "16:00",
    date: "2026-07-21",
  },
  {
    id: "appt_kovu_3",
    dogName: "Kovu",
    breed: "Bulldog Francés",
    size: "Pequeño",
    ownerName: "Hugo L.",
    service: "Ozonoterapia & Spa",
    status: "Confirmada",
    period: "AM",
    time: "11:30",
    rawTime: "11:30",
    date: "2026-08-11",
  },
  {
    id: "appt_linda_3",
    dogName: "Linda",
    breed: "Bichón Maltés",
    size: "Toy",
    ownerName: "Valeria M.",
    service: "Corte de Tijera Premium",
    status: "Confirmada",
    period: "AM",
    time: "10:00",
    rawTime: "10:00",
    date: "2026-09-15",
  },
  {
    id: "appt_max_3",
    dogName: "Max",
    breed: "Bulldog",
    size: "Pequeño",
    ownerName: "Clara M.",
    service: "Ozonoterapia Relajante",
    status: "Confirmada",
    period: "PM",
    time: "14:15",
    rawTime: "14:15",
    date: "2026-10-09",
  },
  {
    id: "appt_cooper_3",
    dogName: "Cooper",
    breed: "Cocker",
    size: "Mediano",
    ownerName: "Ana G.",
    service: "Corte Moderno",
    status: "Confirmada",
    period: "AM",
    time: "11:00",
    rawTime: "11:00",
    date: "2026-11-12",
  },
  {
    id: "appt_bella_3",
    dogName: "Bella",
    breed: "Maltés",
    size: "Mediano",
    ownerName: "Luis R.",
    service: "Baño Esenciales",
    status: "Confirmada",
    period: "PM",
    time: "15:00",
    rawTime: "15:00",
    date: "2026-12-05",
  },
  {
    id: "appt_luna_3",
    dogName: "Luna",
    breed: "Golden Retriever",
    size: "Mediano",
    ownerName: "Elena Sanz",
    service: "Baño Premium Navidad",
    status: "Confirmada",
    period: "AM",
    time: "10:30",
    rawTime: "10:30",
    date: "2026-12-23",
  }
];

const INITIAL_DEMO_SERVICES: Service[] = [
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
  }
];

const INITIAL_DEMO_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Champú de Caléndula 500ml",
    category: "Cosmética",
    price: 15.50,
    stock: 8,
    description: "Champú hidratante orgánico para pieles delicadas."
  },
  {
    id: "p2",
    name: "Bálsamo Almohadillas Reparador",
    category: "Farmacia",
    price: 12.00,
    stock: 15,
    description: "Nutre y protege las almohadillas plantares del frío y calor."
  },
  {
    id: "p3",
    name: "Perfume Baby Can 100ml",
    category: "Cosmética",
    price: 18.00,
    stock: 2,
    description: "Fragancia suave y duradera libre de alcohol."
  },
  {
    id: "p4",
    name: "Peine Desenredante de Acero",
    category: "Accesorios",
    price: 22.00,
    stock: 5,
    description: "Peine profesional con púas redondeadas de doble longitud."
  },
  {
    id: "p5",
    name: "Pienso Hipoalergénico Salmón 2kg",
    category: "Alimentación",
    price: 29.90,
    stock: 4,
    description: "Fórmula de salmón y patata para digestiones sensibles."
  }
];

const INITIAL_DEMO_OWNERS: Owner[] = [
  {
    id: "o1",
    name: "Clara Maldonado",
    firstName: "Clara",
    lastName: "Maldonado",
    contact: "clara.m@gmail.com",
    phone: "+34 612 901 234",
    phone2: "+34 912 345 678",
    phone2Label: "Casa",
    city: "Madrid",
    zipCode: "28001",
    instagram: "claram_lifestyle",
    facebook: "clara.maldonado.fb",
    since: "Oct 2023",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    pets: [
      {
        id: "pet_max",
        name: "Max",
        breed: "Bulldog",
        size: "Pequeño",
        behavior: "Tranquilo",
        birthDate: "2024-03-20",
        avatarUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=150&auto=format&fit=crop&q=80",
        avgDuration: "1h 30min",
        status: "ACTIVO",
        lastVisitDate: "Excelente",
        lastVisitService: "Baño & Spa",
        history: [
          {
            id: "h_101",
            date: "2026-06-18",
            serviceTitle: "Baño & Spa",
            duration: "1h 30min",
            status: "Completo",
            services: ["Baño de ozono", "Champú nutritivo", "Corte de uñas"],
            notes: "Max se portó excelente en su baño termal.",
            employeeName: "Iliana",
            pricePaid: 45
          },
          {
            id: "h_102",
            date: "2026-05-15",
            serviceTitle: "Corte Higiénico",
            duration: "1h 00min",
            status: "Completo",
            services: ["Limpieza de oídos", "Zona sanitaria"],
            notes: "Muy dócil y receptivo.",
            employeeName: "Marco",
            pricePaid: 35
          }
        ]
      }
    ]
  },
  {
    id: "o2",
    name: "Luis Rodríguez",
    firstName: "Luis",
    lastName: "Rodríguez",
    contact: "luis.r@gmail.com",
    phone: "+34 634 567 890",
    phone2: "+34 986 554 321",
    phone2Label: "Trabajo",
    city: "Vigo",
    zipCode: "36201",
    instagram: "luis_rodriguez_vigo",
    facebook: "luis.rodriguez.vigo",
    since: "Nov 2023",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    pets: [
      {
        id: "pet_bella",
        name: "Bella",
        breed: "Bichón Maltés",
        size: "Toy",
        behavior: "Mimoso",
        birthDate: "2025-05-10",
        avatarUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80",
        avgDuration: "1h 30min",
        status: "ACTIVO",
        lastVisitDate: "Perfecta",
        lastVisitService: "Corte Boutique",
        history: [
          {
            id: "h_201",
            date: "2026-06-12",
            serviceTitle: "Corte Boutique",
            duration: "1h 30min",
            status: "Completo",
            services: ["Corte a tijera coreano", "Fragancia deluxe"],
            notes: "Bella quedó espectacular y oliendo exquisito.",
            employeeName: "Sofía",
            pricePaid: 65
          },
          {
            id: "h_202",
            date: "2026-04-10",
            serviceTitle: "Baño Hidratante",
            duration: "1h 15min",
            status: "Completo",
            services: ["Champú biotina", "Arreglo de cara"],
            notes: "Disfrutó mucho del masaje capilar.",
            employeeName: "Iliana",
            pricePaid: 40
          }
        ]
      }
    ]
  },
  {
    id: "o3",
    name: "Ana García",
    firstName: "Ana",
    lastName: "García",
    contact: "ana.g@gmail.com",
    phone: "+34 656 789 012",
    phone2: "+34 699 888 777",
    phone2Label: "Móvil",
    city: "A Coruña",
    zipCode: "15001",
    instagram: "ana_garcia_pettravel",
    facebook: "ana.garcia.pettravel",
    since: "Jul 2023",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    pets: [
      {
        id: "pet_cooper",
        name: "Cooper",
        breed: "Cocker Spaniel",
        size: "Mediano",
        behavior: "Tranquilo",
        birthDate: "2024-02-15",
        avatarUrl: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=150&auto=format&fit=crop&q=80",
        avgDuration: "1h 45min",
        status: "ACTIVO",
        lastVisitDate: "Excelente",
        lastVisitService: "Baño + Arreglo",
        history: [
          {
            id: "h_301",
            date: "2026-06-10",
            serviceTitle: "Baño + Arreglo",
            duration: "1h 45min",
            status: "Completo",
            services: ["Vaciado de glándulas", "Arreglo de faldones", "Stripping parcial"],
            notes: "Cooper adora venir al spa. Gran paciencia.",
            employeeName: "Iliana",
            pricePaid: 55
          },
          {
            id: "h_302",
            date: "2026-05-02",
            serviceTitle: "Baño + Cepillado",
            duration: "1h 15min",
            status: "Completo",
            services: ["Masaje relajante", "Limpieza ocular"],
            notes: "Eliminación de lanas viejas.",
            employeeName: "Marco",
            pricePaid: 45
          }
        ]
      }
    ]
  },
  {
    id: "o4",
    name: "Carlos Méndez",
    contact: "carlos.m@gmail.com",
    phone: "+34 699 123 456",
    since: "May 2023",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    pets: [
      {
        id: "pet_thor",
        name: "Thor",
        breed: "Pastor Alemán",
        size: "Grande",
        behavior: "Inquieto",
        birthDate: "2023-01-10",
        avatarUrl: "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=150&auto=format&fit=crop&q=80",
        avgDuration: "2h 00min",
        status: "ACTIVO",
        lastVisitDate: "Excelente",
        lastVisitService: "Baño Terapéutico",
        history: [
          {
            id: "h_401",
            date: "2026-06-14",
            serviceTitle: "Baño Terapéutico",
            duration: "2h 00min",
            status: "Completo",
            services: ["Champú antiprurito", "Secado alta potencia", "Deslanado profundo"],
            notes: "Se soltó mucho pelo muerto. Requiere cepillado semanal.",
            employeeName: "Marco",
            pricePaid: 85
          },
          {
            id: "h_402",
            date: "2026-03-24",
            serviceTitle: "Baño e Higiene",
            duration: "1h 45min",
            status: "Completo",
            services: ["Corte de uñas", "Limpieza de oídos profunda"],
            notes: "Un poco nervioso con el expulsor.",
            employeeName: "Sofía",
            pricePaid: 75
          }
        ]
      }
    ]
  },
  {
    id: "o5",
    name: "Elena Sanz",
    contact: "elena.s@gmail.com",
    phone: "+34 677 889 900",
    since: "Oct 2023",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    pets: [
      {
        id: "pet_luna",
        name: "Luna",
        breed: "Golden Retriever",
        size: "Mediano",
        behavior: "Muy juguetón",
        birthDate: "2024-04-12",
        avatarUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=150&auto=format&fit=crop&q=80",
        avgDuration: "1h 30min",
        status: "ACTIVO",
        lastVisitDate: "Excelente",
        lastVisitService: "Sesión Fotográfica Post-Corte",
        history: [
          {
            id: "h_501",
            date: "2026-06-15",
            serviceTitle: "Corte a Tijera",
            duration: "1h 30min",
            status: "Completo",
            services: ["Baño aromático", "Corte a tijera raza", "Sesión de fotos"],
            notes: "Retratos increíbles, Luna posó de maravilla.",
            employeeName: "Sofía",
            pricePaid: 80
          },
          {
            id: "h_502",
            date: "2026-05-10",
            serviceTitle: "Baño + Hidratación",
            duration: "1h 15min",
            status: "Completo",
            services: ["Mascarilla nutritiva caviar"],
            notes: "Brillo increíble del manto de oro.",
            employeeName: "Iliana",
            pricePaid: 60
          }
        ]
      }
    ]
  },
  {
    id: "o6",
    name: "Andrés V.",
    contact: "andres.v@gmail.com",
    phone: "+34 612 112 233",
    since: "Jan 2024",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80&index=2",
    pets: [
      {
        id: "pet_rocco",
        name: "Rocco",
        breed: "Caniche",
        size: "Pequeño",
        behavior: "Inquieto / Nervioso",
        birthDate: "2023-03-12",
        avatarUrl: "https://images.unsplash.com/photo-1512446816042-444d641267d4?w=150&auto=format&fit=crop&q=80",
        avgDuration: "2h 00min",
        status: "ACTIVO",
        lastVisitDate: "Antier",
        lastVisitService: "Corte a Tijera",
        history: [
          {
            id: "h_601",
            date: "2026-06-18",
            serviceTitle: "Corte a Tijera",
            duration: "2h 00min",
            status: "Completo",
            services: ["Corte caniche clásico", "Baño relajante lavanda"],
            notes: "Un poco inquieto al inicio, pero terminó relajado.",
            employeeName: "Iliana",
            pricePaid: 75
          },
          {
            id: "h_602",
            date: "2026-05-20",
            serviceTitle: "Baño de Mantenimiento",
            duration: "1h 15min",
            status: "Completo",
            services: ["Champú avena", "Desanudado"],
            notes: "Pelo muy sedoso tras el desanudado.",
            employeeName: "Marco",
            pricePaid: 45
          }
        ]
      }
    ]
  },
  {
    id: "o7",
    name: "Sofía T.",
    contact: "sofia.t@gmail.com",
    phone: "+34 622 334 455",
    since: "Feb 2024",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80&index=3",
    pets: [
      {
        id: "pet_kira",
        name: "Kira",
        breed: "Yorkshire Terrier",
        size: "Toy",
        behavior: "Tranquilo / Sociable",
        birthDate: "2022-09-01",
        avatarUrl: "https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=150&auto=format&fit=crop&q=80",
        avgDuration: "1h 30min",
        status: "ACTIVO",
        lastVisitDate: "Hace una semana",
        lastVisitService: "Baño & Spa",
        history: [
          {
            id: "h_701",
            date: "2026-06-13",
            serviceTitle: "Baño & Spa",
            duration: "1h 30min",
            status: "Completo",
            services: ["Baño relax burbujas", "Peinado fantasía", "Limpieza de lagrimales"],
            notes: "Kira estuvo muy tranquila, casi se duerme en la tina.",
            employeeName: "Sofía",
            pricePaid: 50
          },
          {
            id: "h_702",
            date: "2026-04-18",
            serviceTitle: "Arreglo de Puntas",
            duration: "1h 00min",
            status: "Completo",
            services: ["Corte higiénico", "Limado de uñas"],
            notes: "Excelente temperamento.",
            employeeName: "Marco",
            pricePaid: 35
          }
        ]
      }
    ]
  },
  {
    id: "o8",
    name: "Marta L.",
    contact: "marta.l@outlook.com",
    phone: "+34 688 990 011",
    since: "Dec 2023",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80&index=4",
    pets: [
      {
        id: "pet_milu",
        name: "Milú",
        breed: "Pomerania",
        size: "Toy",
        behavior: "Miedoso / Asustadizo",
        birthDate: "2024-02-14",
        avatarUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=150&auto=format&fit=crop&q=80",
        avgDuration: "1h 45min",
        status: "ACTIVO",
        lastVisitDate: "Hace 10 días",
        lastVisitService: "Spa & Hidratación",
        history: [
          {
            id: "h_801",
            date: "2026-06-10",
            serviceTitle: "Spa & Hidratación",
            duration: "1h 45min",
            status: "Completo",
            services: ["Mascarilla de Aloe Vera pura", "Masaje antiestrés", "Cepillado meticuloso"],
            notes: "Asustadizo al inicio con los ruidos, requiere terapia de sonido suave.",
            employeeName: "Sofía",
            pricePaid: 60
          },
          {
            id: "h_802",
            date: "2026-05-02",
            serviceTitle: "Baño Suave",
            duration: "1h 15min",
            status: "Completo",
            services: ["Champú hipoalergénico"],
            notes: "Se usó secador silencioso para no asustarle.",
            employeeName: "Iliana",
            pricePaid: 45
          }
        ]
      }
    ]
  },
  {
    id: "o9",
    name: "Javier P.",
    contact: "javier.p@yahoo.es",
    phone: "+34 677 121 212",
    since: "Mar 2024",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80&index=5",
    pets: [
      {
        id: "pet_simba",
        name: "Simba",
        breed: "Golden Retriever",
        size: "Grande",
        behavior: "Juguetón / Hiperactivo",
        birthDate: "2021-11-20",
        avatarUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=150&auto=format&fit=crop&q=80&index=1",
        avgDuration: "2h 15min",
        status: "ACTIVO",
        lastVisitDate: "Ayer",
        lastVisitService: "Deslanado Pro",
        history: [
          {
            id: "h_901",
            date: "2026-06-19",
            serviceTitle: "Deslanado Pro",
            duration: "2h 15min",
            status: "Completo",
            services: ["Baño deslanado intensivo", "Soplado de alta velocidad", "Cepillado con rastrillo profesional"],
            notes: "Simba es súper feliz pero con muchísima energía. Suelta montañas de pelo.",
            employeeName: "Marco",
            pricePaid: 95
          },
          {
            id: "h_902",
            date: "2026-04-15",
            serviceTitle: "Baño Estándar",
            duration: "1h 45min",
            status: "Completo",
            services: ["Champú acondicionador", "Secado estándar"],
            notes: "Muy cariñoso en el trato.",
            employeeName: "Iliana",
            pricePaid: 70
          }
        ]
      }
    ]
  },
  {
    id: "o10",
    name: "Laura K.",
    contact: "laura.k@gmail.com",
    phone: "+34 611 222 333",
    since: "Apr 2024",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80&index=6",
    pets: [
      {
        id: "pet_coco",
        name: "Coco",
        breed: "Bulldog",
        size: "Pequeño",
        behavior: "Tranquilo / Sociable",
        birthDate: "2023-07-28",
        avatarUrl: "https://images.unsplash.com/photo-1477884213360-7e9d7dcd1e48?w=150&auto=format&fit=crop&q=80",
        avgDuration: "1h 15min",
        status: "ACTIVO",
        lastVisitDate: "Hace 4 días",
        lastVisitService: "Baño & Spa",
        history: [
          {
            id: "h_1001",
            date: "2026-06-16",
            serviceTitle: "Baño & Spa",
            duration: "1h 15min",
            status: "Completo",
            services: ["Limpieza de arrugas faciales", "Hidratación de almohadillas", "Champú dermoprotector"],
            notes: "Excelente comportamiento. Sus arrugas faciales se limpiaron minuciosamente.",
            employeeName: "Iliana",
            pricePaid: 45
          },
          {
            id: "h_1002",
            date: "2026-05-11",
            serviceTitle: "Corte de Uñas e Higiene",
            duration: "0h 45min",
            status: "Completo",
            services: ["Vaciado de glándulas anales", "Perfume sin alcohol"],
            notes: "Muy dócil.",
            employeeName: "Marco",
            pricePaid: 25
          }
        ]
      }
    ]
  },
  {
    id: "o11",
    name: "Roberto G.",
    contact: "roberto.g@terra.es",
    phone: "+34 600 998 877",
    since: "Jun 2023",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80&index=7",
    pets: [
      {
        id: "pet_nala",
        name: "Nala",
        breed: "Cocker Spaniel",
        size: "Mediano",
        behavior: "Manso / Cariñoso",
        birthDate: "2019-05-15",
        avatarUrl: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=150&auto=format&fit=crop&q=80",
        avgDuration: "1h 45min",
        status: "ACTIVO",
        lastVisitDate: "Hace 2 semanas",
        lastVisitService: "Baño + Arreglo",
        history: [
          {
            id: "h_1101",
            date: "2026-06-06",
            serviceTitle: "Baño + Arreglo",
            duration: "1h 45min",
            status: "Completo",
            services: ["Champú queratina", "Corte de faldones y orejas", "Vaciado ótico"],
            notes: "Nala es una Cocker mayor muy entrañable. Orejas limpias con esmero para evitar otitis.",
            employeeName: "Sofía",
            pricePaid: 60
          },
          {
            id: "h_1102",
            date: "2026-04-20",
            serviceTitle: "Baño Estándar",
            duration: "1h 30min",
            status: "Completo",
            services: ["Mascarilla suavizante", "Higiene ocular"],
            notes: "Portamiento de oro puro.",
            employeeName: "Marco",
            pricePaid: 50
          }
        ]
      }
    ]
  },
  {
    id: "o12",
    name: "Carmen S.",
    contact: "carmen.segura@gmail.com",
    phone: "+34 656 321 987",
    since: "Jan 2024",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80&index=8",
    pets: [
      {
        id: "pet_toby",
        name: "Toby",
        breed: "Bichón Maltés",
        size: "Toy",
        behavior: "Tranquilo / Sociable",
        birthDate: "2024-01-10",
        avatarUrl: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=150&auto=format&fit=crop&q=80",
        avgDuration: "1h 30min",
        status: "ACTIVO",
        lastVisitDate: "Hace 5 días",
        lastVisitService: "Corte Boutique",
        history: [
          {
            id: "h_1201",
            date: "2026-06-15",
            serviceTitle: "Corte Boutique",
            duration: "1h 30min",
            status: "Completo",
            services: ["Corte a tijera estilo cachorro (carita redonda)", "Baño aromaterapia fresa"],
            notes: "Toby quedó monísimo, el perfume de fresa es muy dulce.",
            employeeName: "Iliana",
            pricePaid: 65
          },
          {
            id: "h_1202",
            date: "2026-05-18",
            serviceTitle: "Baño Hidratación profunda",
            duration: "1h 15min",
            status: "Completo",
            services: ["Champú nutritivo", "Acondicionador de coco"],
            notes: "Deshaciendo pequeños nudos iniciales.",
            employeeName: "Sofía",
            pricePaid: 45
          }
        ]
      }
    ]
  },
  {
    id: "o13",
    name: "Daniel F.",
    contact: "dan.fer@live.com",
    phone: "+34 622 776 554",
    since: "May 2024",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80&index=9",
    pets: [
      {
        id: "pet_bruno",
        name: "Bruno",
        breed: "Caniche",
        size: "Grande",
        behavior: "Juguetón / Hiperactivo",
        birthDate: "2018-12-05",
        avatarUrl: "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=150&auto=format&fit=crop&q=80",
        avgDuration: "2h 30min",
        status: "ACTIVO",
        lastVisitDate: "Hace 12 días",
        lastVisitService: "Corte a Tijera",
        history: [
          {
            id: "h_1301",
            date: "2026-06-08",
            serviceTitle: "Corte a Tijera",
            duration: "2h 30min",
            status: "Completo",
            services: ["Corte Caniche Gigante", "Baño e hidratación profunda antiodor"],
            notes: "Bruno es grande pero súper mimoso. Le encanta comer chuches de recompensa.",
            employeeName: "Sofía",
            pricePaid: 110
          },
          {
            id: "h_1302",
            date: "2026-04-12",
            serviceTitle: "Baño Regular",
            duration: "1h 45min",
            status: "Completo",
            services: ["Champú nutritivo", "Vaciado de glándulas"],
            notes: "Mucho desmote previo.",
            employeeName: "Iliana",
            pricePaid: 75
          }
        ]
      }
    ]
  },
  {
    id: "o14",
    name: "Mateo S.",
    contact: "mateo.sanz@gmail.com",
    phone: "+34 633 445 566",
    since: "Jul 2024",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    pets: [
      {
        id: "pet_rocky",
        name: "Rocky",
        breed: "Border Collie",
        size: "Mediano",
        behavior: "Inquieto / Inteligente",
        birthDate: "2022-10-05",
        avatarUrl: "https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?w=150&auto=format&fit=crop&q=80",
        avgDuration: "1h 45min",
        status: "ACTIVO",
        lastVisitDate: "Hace 2 días",
        lastVisitService: "Deslanado Pro",
        history: [
          {
            id: "h_1401",
            date: "2026-06-18",
            serviceTitle: "Deslanado Pro",
            duration: "1h 45min",
            status: "Completo",
            services: ["Baño deslanado intensivo", "Secador de alta potencia", "Peinado profundo"],
            notes: "Llegó un poco embarrado tras una tarde en la montaña. Comportamiento inteligentísimo.",
            employeeName: "Marco",
            pricePaid: 65
          },
          {
            id: "h_1402",
            date: "2026-05-11",
            serviceTitle: "Baño Regular",
            duration: "1h 30min",
            status: "Completo",
            services: ["Champú nutritivo", "Limpieza ocular"],
            notes: "Se portó estupendamente. Le encanta jugar con el agua templada.",
            employeeName: "Iliana",
            pricePaid: 45
          }
        ]
      }
    ]
  },
  {
    id: "o15",
    name: "Elena R.",
    contact: "elena.r@gmail.com",
    phone: "+34 655 123 456",
    since: "Sep 2024",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    pets: [
      {
        id: "pet_bella_ch",
        name: "Bella",
        breed: "Chihuahua",
        size: "Toy",
        behavior: "Miedoso / Mimado",
        birthDate: "2024-11-12",
        avatarUrl: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=150&auto=format&fit=crop&q=80",
        avgDuration: "1h 00min",
        status: "ACTIVO",
        lastVisitDate: "Ayer",
        lastVisitService: "Baño & Spa",
        history: [
          {
            id: "h_1501",
            date: "2026-06-19",
            serviceTitle: "Baño & Spa",
            duration: "1h 00min",
            status: "Completo",
            services: ["Champú avena calmante", "Masaje relajante en bañera"],
            notes: "Vino temblando por el aire de la calle, pero se relajó totalmente arropada en las toallas calientes de algodón egipcio.",
            employeeName: "Sofía",
            pricePaid: 40
          },
          {
            id: "h_1502",
            date: "2026-04-22",
            serviceTitle: "Higiene Express",
            duration: "0h 30min",
            status: "Completo",
            services: ["Corte de uñas", "Limpieza de lagrimales"],
            notes: "Sesión corta para evitar el estrés del animal.",
            employeeName: "Marco",
            pricePaid: 20
          }
        ]
      }
    ]
  },
  {
    id: "o16",
    name: "Carlos B.",
    contact: "carlos.b@outlook.es",
    phone: "+34 644 987 654",
    since: "Oct 2024",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    pets: [
      {
        id: "pet_zeus",
        name: "Zeus",
        breed: "Siberian Husky",
        size: "Grande",
        behavior: "Inquieto / Aullador",
        birthDate: "2021-06-25",
        avatarUrl: "https://images.unsplash.com/photo-1531804055935-76f44d7c3621?w=150&auto=format&fit=crop&q=80",
        avgDuration: "2h 30min",
        status: "ACTIVO",
        lastVisitDate: "Hace 6 días",
        lastVisitService: "Baño Terapéutico",
        history: [
          {
            id: "h_1601",
            date: "2026-06-14",
            serviceTitle: "Baño Terapéutico",
            duration: "2h 30min",
            status: "Completo",
            services: ["Champú biotina especial muda", "Vaciado profundo de subpelo", "Higiene plantar"],
            notes: "Se comunicó con aullidos cómicos durante todo el proceso de soplado. Espléndido deslanado.",
            employeeName: "Marco",
            pricePaid: 90
          },
          {
            id: "h_1602",
            date: "2026-05-03",
            serviceTitle: "Baño Regular",
            duration: "2h 00min",
            status: "Completo",
            services: ["Champú dermoprotector", "Perfume herbal sin alcohol"],
            notes: "Tenía algunos nudos en los pantalones traseros que se resolvieron con spray acondicionador y paciencia.",
            employeeName: "Iliana",
            pricePaid: 75
          }
        ]
      }
    ]
  },
  {
    id: "o17",
    name: "Julia M.",
    contact: "julia.marti@gmail.com",
    phone: "+34 666 554 433",
    since: "Nov 2024",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    pets: [
      {
        id: "pet_lola_teckel",
        name: "Lola",
        breed: "Teckel",
        size: "Pequeño",
        behavior: "Tranquilo / Curioso",
        birthDate: "2023-01-18",
        avatarUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=150&auto=format&fit=crop&q=80",
        avgDuration: "1h 15min",
        status: "ACTIVO",
        lastVisitDate: "Hace 4 días",
        lastVisitService: "Baño & Spa",
        history: [
          {
            id: "h_1701",
            date: "2026-06-16",
            serviceTitle: "Baño & Spa",
            duration: "1h 15min",
            status: "Completo",
            services: ["Baño relajante de ozono", "Mascarilla hidratante de seda", "Crema de almohadillas"],
            notes: "Lola adora el jacuzzi de burbujas. Almohadillas tratadas para asfalto caliente.",
            employeeName: "Iliana",
            pricePaid: 45
          },
          {
            id: "h_1702",
            date: "2026-05-18",
            serviceTitle: "Corte de Uñas",
            duration: "0h 45min",
            status: "Completo",
            services: ["Limado con torno silencioso", "Limpieza auricular profunda"],
            notes: "Muy dócil y tranquila, una clienta ideal.",
            employeeName: "Sofía",
            pricePaid: 35
          }
        ]
      }
    ]
  },
  {
    id: "o18",
    name: "Pedro G.",
    contact: "pedro.gomez@yahoo.es",
    phone: "+34 601 223 344",
    since: "Dec 2024",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    pets: [
      {
        id: "pet_simba_shih",
        name: "Simba",
        breed: "Shih Tzu",
        size: "Pequeño",
        behavior: "Mimoso / Tranquilo",
        birthDate: "2020-03-30",
        avatarUrl: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=150&auto=format&fit=crop&q=80",
        avgDuration: "1h 45min",
        status: "ACTIVO",
        lastVisitDate: "Hace 5 días",
        lastVisitService: "Corte Boutique",
        history: [
          {
            id: "h_1801",
            date: "2026-06-15",
            serviceTitle: "Corte Boutique",
            duration: "1h 45min",
            status: "Completo",
            services: ["Corte estilo osito a tijera", "Arreglo higiénico", "Moño de gala con elástico pastel"],
            notes: "Un caballero educado. El corte estilo cachorro redondea perfectamente sus rasgos.",
            employeeName: "Sofía",
            pricePaid: 60
          },
          {
            id: "h_1802",
            date: "2026-05-14",
            serviceTitle: "Baño Regular",
            duration: "1h 15min",
            status: "Completo",
            services: ["Champú intensificador blanco", "Mascarilla desenredante"],
            notes: "Tenía nudos leves en la zona de las orejas que se abrieron con cepillo de mantequilla.",
            employeeName: "Iliana",
            pricePaid: 40
          }
        ]
      }
    ]
  },
  {
    id: "o19",
    name: "Patricia H.",
    contact: "patricia.h@terra.es",
    phone: "+34 612 887 766",
    since: "Jan 2025",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    pets: [
      {
        id: "pet_thor_boxer",
        name: "Thor",
        breed: "Boxer",
        size: "Mediano",
        behavior: "Juguetón / Inquieto",
        birthDate: "2022-02-14",
        avatarUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80",
        avgDuration: "1h 30min",
        status: "ACTIVO",
        lastVisitDate: "Hace una semana",
        lastVisitService: "Baño e Higiene",
        history: [
          {
            id: "h_1901",
            date: "2026-06-13",
            serviceTitle: "Baño e Higiene",
            duration: "1h 30min",
            status: "Completo",
            services: ["Baño desodorizante con árbol de té", "Masaje muscular estimulante", "Corte higiénico de uñas"],
            notes: "Thor es pura alegría desbordante. El masaje muscular ayudó a calmar su hiperactividad durante el secado.",
            employeeName: "Marco",
            pricePaid: 55
          },
          {
            id: "h_1902",
            date: "2026-04-18",
            serviceTitle: "Higiene Básica",
            duration: "1h 00min",
            status: "Completo",
            services: ["Limpieza auricular con gel antiséptico", "Limado de uñas"],
            notes: "Un poco reacio al cortauñas manual, preferimos usar lima de fricción rotativa suave.",
            employeeName: "Iliana",
            pricePaid: 35
          }
        ]
      }
    ]
  },
  {
    id: "o20",
    name: "Miguel A.",
    contact: "miguel.angel@outlook.com",
    phone: "+34 699 111 222",
    since: "Feb 2025",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    pets: [
      {
        id: "pet_coco_beagle",
        name: "Coco",
        breed: "Beagle",
        size: "Mediano",
        behavior: "Curioso / Inquieto",
        birthDate: "2023-09-09",
        avatarUrl: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=150&auto=format&fit=crop&q=80",
        avgDuration: "1h 15min",
        status: "ACTIVO",
        lastVisitDate: "Hace 10 días",
        lastVisitService: "Baño Regular",
        history: [
          {
            id: "h_2001",
            date: "2026-06-10",
            serviceTitle: "Baño Regular",
            duration: "1h 15min",
            status: "Completo",
            services: ["Champú acondicionador", "Higiene ocular y ótica"],
            notes: "Olfateó minuciosamente cada rincón del spa. Muy dócil y simpático.",
            employeeName: "Iliana",
            pricePaid: 45
          },
          {
            id: "h_2002",
            date: "2026-04-30",
            serviceTitle: "Baño & Spa",
            duration: "1h 30min",
            status: "Completo",
            services: ["Baño aromático de lavanda", "Ozonoterapia"],
            notes: "Buscaba galletas de premio constantemente. El baño de ozonoterapia alivió una alergia cutánea leve.",
            employeeName: "Marco",
            pricePaid: 55
          }
        ]
      }
    ]
  },
  {
    id: "o21",
    name: "Isabel C.",
    contact: "isabel.clares@gmail.com",
    phone: "+34 688 223 344",
    since: "Mar 2025",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    pets: [
      {
        id: "pet_luke_lab",
        name: "Luke",
        breed: "Labrador",
        size: "Grande",
        behavior: "Tranquilo",
        birthDate: "2021-04-12",
        avatarUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=150&auto=format&fit=crop&q=80",
        avgDuration: "1h 45min",
        status: "ACTIVO",
        lastVisitDate: "Hace 2 días",
        lastVisitService: "Deslanado Especial",
        history: [
          {
            id: "h_2101",
            date: "2026-06-18",
            serviceTitle: "Deslanado Especial",
            duration: "1h 45min",
            status: "Completo",
            services: ["Champú de arrastre de muda", "Soplador de alta potencia", "Masaje con cepillo con zoomgrom"],
            notes: "Retiramos una cantidad ingente de subpelo de primavera. Luke disfrutó mucho del agua templada.",
            employeeName: "Marco",
            pricePaid: 80
          },
          {
            id: "h_2102",
            date: "2026-05-10",
            serviceTitle: "Baño Regular",
            duration: "1h 30min",
            status: "Completo",
            services: ["Champú camomila para brillo de manto claro", "Corte de uñas higiénico"],
            notes: "Un perrazo modelo, calmado e increíblemente noble.",
            employeeName: "Sofía",
            pricePaid: 65
          }
        ]
      }
    ]
  },
  {
    id: "o22",
    name: "Hugo L.",
    contact: "hugo.l@gmail.com",
    phone: "+34 688 777 666",
    since: "Mar 2026",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    pets: [
      {
        id: "pet_kovu_french",
        name: "Kovu",
        breed: "Bulldog Francés",
        size: "Pequeño",
        behavior: "Inquieto / Nervioso",
        birthDate: "2024-08-12",
        avatarUrl: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=150&auto=format&fit=crop&q=80",
        avgDuration: "1h 15min",
        status: "ACTIVO",
        lastVisitDate: "2026-06-05",
        lastVisitService: "Ozonoterapia & Spa",
        history: [
          {
            id: "h_kovu_1",
            date: "2026-03-10",
            serviceTitle: "Corte Mixto",
            duration: "1h 30min",
            status: "Completo",
            services: ["Corte a tijera en faldones", "Baño higiénico de aloe vera"],
            notes: "Estuvo un poco nervioso con el secador, pero pudimos finalizar el corte mixto con paciencia.",
            employeeName: "Sofía",
            pricePaid: 45
          },
          {
            id: "h_kovu_2",
            date: "2026-04-15",
            serviceTitle: "Baño & Spa",
            duration: "1h 15min",
            status: "Completo",
            services: ["Champú dermoprotector", "Mascarilla nutritiva", "Limpieza auricular"],
            notes: "Mucho más tranquilo hoy. Le encantó el masaje capilar.",
            employeeName: "Iliana",
            pricePaid: 35
          },
          {
            id: "h_kovu_3",
            date: "2026-06-05",
            serviceTitle: "Ozonoterapia & Spa",
            duration: "1h 15min",
            status: "Completo",
            services: ["Baño de burbujas con ozono", "Sérum sedoso de hidratación"],
            notes: "Excelente respuesta en piel para su dermatitis habitual.",
            employeeName: "Iliana",
            pricePaid: 40
          }
        ]
      }
    ]
  },
  {
    id: "o23",
    name: "Valeria M.",
    contact: "valeria.m@gmail.com",
    phone: "+34 655 444 333",
    since: "Feb 2026",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    pets: [
      {
        id: "pet_linda_bichon",
        name: "Linda",
        breed: "Bichón Maltés",
        size: "Toy",
        behavior: "Tranquilo / Sociable",
        birthDate: "2025-10-01",
        avatarUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80",
        avgDuration: "1h 30min",
        status: "ACTIVO",
        lastVisitDate: "2026-05-25",
        lastVisitService: "Corte Tijera",
        history: [
          {
            id: "h_linda_1",
            date: "2026-02-14",
            serviceTitle: "Especial Cachorros",
            duration: "1h 15min",
            status: "Completo",
            services: ["Primer baño adaptativo", "Recorte higiénico de almohadillas"],
            notes: "Un encanto absoluto. Muy curiosa con los juguetes y el agua.",
            employeeName: "Iliana",
            pricePaid: 30
          },
          {
            id: "h_linda_2",
            date: "2026-04-02",
            serviceTitle: "Mantenimiento Express",
            duration: "45min",
            status: "Completo",
            services: ["Baño rápido de mantenimiento", "Corte de uñas"],
            notes: "Rápido y limpio.",
            employeeName: "Marco",
            pricePaid: 18
          },
          {
            id: "h_linda_3",
            date: "2026-05-25",
            serviceTitle: "Corte Tijera",
            duration: "1h 30min",
            status: "Completo",
            services: ["Corte estructurado a tijera", "Recorte de cejas boutique"],
            notes: "Ficha estilista perfecta. Linda es una perrita modelo.",
            employeeName: "Sofía",
            pricePaid: 50
          }
        ]
      }
    ]
  }
];


export default function App() {
  // Session Persistent state via localStorage
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem("le_petit_can_session");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Clear old demo data from localStorage on first load with this version
  useEffect(() => {
    const version = localStorage.getItem("le_petit_can_version");
    if (version !== "2") {
      localStorage.removeItem("le_petit_can_owners");
      localStorage.removeItem("le_petit_can_appointments");
      localStorage.removeItem("le_petit_can_services");
      localStorage.removeItem("le_petit_can_products");
      localStorage.setItem("le_petit_can_version", "2");
    }
  }, []);

  // SaaS Remote Suspend state persistent via localStorage
  const [isSuspended, setIsSuspended] = useState<boolean>(() => {
    return localStorage.getItem("le_petit_can_suspended") === "true";
  });

  // LOPD Compliant Idle autolock state (600s = 10 minutes)
  const [idleCountdown, setIdleCountdown] = useState<number>(600);

  const [currentView, setView] = useState<string>(() => {
    // If logged in as admin, default to saas_control, otherwise to dashboard
    try {
      const saved = localStorage.getItem("le_petit_can_session");
      if (saved) {
        const u = JSON.parse(saved) as UserSession;
        if (u.role === "administrador") return "saas_control";
      }
    } catch {}
    return "dashboard";
  });

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    localStorage.setItem("le_petit_can_session", JSON.stringify(newSession));
    setIdleCountdown(600); // Reset timer
    if (newSession.role === "administrador") {
      setView("saas_control");
    } else {
      setView("dashboard");
    }
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem("le_petit_can_session");
    setView("dashboard");
  };

  // Safe idle timer event observer
  useEffect(() => {
    if (!session) return;

    // Tick down
    const interval = setInterval(() => {
      setIdleCountdown((prev) => {
        if (prev <= 1) {
          handleLogout();
          return 600;
        }
        return prev - 1;
      });
    }, 1000);

    // Reset countdown on client-side interaction
    const resetTimer = () => {
      setIdleCountdown(600);
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("mousedown", resetTimer);
    window.addEventListener("touchstart", resetTimer);

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("mousedown", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
    };
  }, [session]);

  const handleToggleSuspension = (val: boolean) => {
    setIsSuspended(val);
    localStorage.setItem("le_petit_can_suspended", val ? "true" : "false");
  };


  // All data is stored locally via localStorage.
  // On mount, try to load fresh data from Odoo via n8n.
  useEffect(() => {
    async function loadFromOdoo() {
      try {
        const contacts = await odooService.getContacts();
        console.log("[Odoo] Contacts loaded:", contacts?.length, "items");
        if (contacts?.length) {
          const owners = contacts.map(odooService.partnerToOwner);
          setOwners(owners);
          localStorage.setItem("le_petit_can_owners", JSON.stringify(owners));
        }
      } catch (err) {
        console.warn("[Odoo] Contacts load failed:", err);
      }
      try {
        const appts = await odooService.getAppointments();
        console.log("[Odoo] Appointments loaded:", appts?.length, "items");
        if (appts?.length) {
          const appointments = appts.map(odooService.appointmentToAppointment);
          setAppointments(appointments);
          localStorage.setItem("le_petit_can_appointments", JSON.stringify(appointments));
        }
      } catch (err) {
        console.warn("[Odoo] Appointments load failed:", err);
      }
    }
    loadFromOdoo();
  }, []);

  // Real-time state synchronized via localStorage (cache).
  // When n8n/Odoo endpoints are ready, these will be fetched from there.

  // Local state initialized with demo data and cached in localStorage.
  // When Odoo via n8n is ready, these will be fetched from the API.
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const cached = localStorage.getItem("le_petit_can_appointments");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [services, setServices] = useState<Service[]>(() => {
    try {
      const cached = localStorage.getItem("le_petit_can_services");
      return cached ? JSON.parse(cached) : INITIAL_DEMO_SERVICES;
    } catch {
      return INITIAL_DEMO_SERVICES;
    }
  });
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem("le_petit_can_products");
      return cached ? JSON.parse(cached) : INITIAL_DEMO_PRODUCTS;
    } catch {
      return INITIAL_DEMO_PRODUCTS;
    }
  });
  const [owners, setOwners] = useState<Owner[]>(() => {
    try {
      const cached = localStorage.getItem("le_petit_can_owners");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  // Administrative action handlers with localStorage persistence
  const handleSaveService = async (srv: Service) => {
    setServices((prev) => {
      const copy = [...prev];
      const idx = copy.findIndex((item) => item.id === srv.id);
      if (idx > -1) {
        copy[idx] = srv;
      } else {
        copy.push(srv);
      }
      localStorage.setItem("le_petit_can_services", JSON.stringify(copy));
      return copy;
    });
  };

  const handleDeleteService = async (id: string) => {
    setServices((prev) => {
      const copy = prev.filter((item) => item.id !== id);
      localStorage.setItem("le_petit_can_services", JSON.stringify(copy));
      return copy;
    });
  };

  const handleResetServicesToDefault = async () => {
    if (window.confirm("¿Estás seguro de que deseas restablecer todos los servicios a los 7 modelos estándar de Le Petit Can? Se sobreescribirán las modificaciones de estos 7 servicios.")) {
      setServices(INITIAL_DEMO_SERVICES);
      localStorage.setItem("le_petit_can_services", JSON.stringify(INITIAL_DEMO_SERVICES));
      alert("¡Tarifas y servicios originales restablecidos con éxito!");
    }
  };

  const handleSaveProduct = async (prod: Product) => {
    setProducts((prev) => {
      const copy = [...prev];
      const idx = copy.findIndex((item) => item.id === prod.id);
      if (idx > -1) {
        copy[idx] = prod;
      } else {
        copy.push(prod);
      }
      localStorage.setItem("le_petit_can_products", JSON.stringify(copy));
      return copy;
    });
  };

  const handleDeleteProduct = async (id: string) => {
    setProducts((prev) => {
      const copy = prev.filter((item) => item.id !== id);
      localStorage.setItem("le_petit_can_products", JSON.stringify(copy));
      return copy;
    });
  };

  const handleSaveOwner = async (owner: Owner) => {
    setOwners((prev) => {
      const copy = [...prev];
      const idx = copy.findIndex((item) => item.id === owner.id);
      if (idx > -1) {
        copy[idx] = owner;
      } else {
        copy.push(owner);
      }
      localStorage.setItem("le_petit_can_owners", JSON.stringify(copy));
      return copy;
    });
    const isOdooContact = /^\d+$/.test(owner.id);
    try {
      const payload = {
        name: owner.name,
        email: owner.contact || undefined,
        phone: owner.phone || undefined,
        mobile: owner.phone2 || undefined,
        city: owner.city || undefined,
        zip: owner.zipCode || undefined,
      };
      if (isOdooContact) {
        await odooService.updateContact(owner.id, payload);
      } else {
        await odooService.createContact(payload);
      }
    } catch (err) {
      console.warn("[App] Odoo save/update failed (local save ok):", err);
    }
  };

  const handleDeleteOwner = async (id: string) => {
    setOwners((prev) => {
      const copy = prev.filter((item) => item.id !== id);
      localStorage.setItem("le_petit_can_owners", JSON.stringify(copy));
      return copy;
    });
    try {
      await odooService.deleteContact(id);
    } catch (err) {
      console.warn("[App] Odoo delete failed (local delete ok):", err);
    }
  };

  const handleBookingCreated = async (appointment: Appointment) => {
    setAppointments((prev) => {
      const updated = [...prev, appointment];
      localStorage.setItem("le_petit_can_appointments", JSON.stringify(updated));
      return updated;
    });
    try {
      const dateStr = appointment.date || new Date().toISOString().slice(0, 10);
      const timeStr = appointment.rawTime || appointment.time || "09:00";
      const start = `${dateStr} ${timeStr}`;
      const endHour = String(Math.min(23, parseInt(timeStr.split(":")[0]) + 2)).padStart(2, "0");
       const end = `${dateStr} ${endHour}:${timeStr.split(":")[1] || "00"}`;
      await odooService.createAppointment({
        name: `${appointment.dogName} — ${appointment.service}`,
        start,
        stop: end,
        duration: 90,
        partner_id: appointment.ownerPhone ? undefined : undefined,
        description: `Cliente: ${appointment.ownerName} | Tel: ${appointment.ownerPhone || ""} | Email: ${appointment.ownerEmail || ""}`,
      });
    } catch (err) {
      console.warn("[App] Odoo appointment creation failed (local save ok):", err);
    }
  };

  // Selected owner/pet focus context states for ClientDetailView
  const [selectedOwnerIdForDetail, setSelectedOwnerIdForDetail] = useState<string | undefined>(undefined);
  const [selectedPetIdForDetail, setSelectedPetIdForDetail] = useState<string | undefined>(undefined);

  const handleSelectClientDetail = (ownerName: string, dogName: string) => {
    // Find owner by case-insensitive name match
    const foundOwner = owners.find((o) => o.name.toLowerCase() === ownerName.toLowerCase());
    if (foundOwner) {
      setSelectedOwnerIdForDetail(foundOwner.id);
      const foundPet = foundOwner.pets?.find((p) => p.name.toLowerCase() === dogName.toLowerCase());
      if (foundPet) {
        setSelectedPetIdForDetail(foundPet.id);
      } else if (foundOwner.pets && foundOwner.pets.length > 0) {
        setSelectedPetIdForDetail(foundOwner.pets[0].id);
      }
      setView("client_detail");
    } else {
      // Fallback: look for dog name
      const ownerOfDog = owners.find((o) => o.pets?.some((p) => p.name.toLowerCase() === dogName.toLowerCase()));
      if (ownerOfDog) {
        setSelectedOwnerIdForDetail(ownerOfDog.id);
        const petObj = ownerOfDog.pets.find((p) => p.name.toLowerCase() === dogName.toLowerCase());
        setSelectedPetIdForDetail(petObj?.id);
        setView("client_detail");
      }
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    setAppointments((prev) => {
      const updated = prev.map((a) =>
        a.id === appointmentId ? { ...a, status: newStatus } : a
      );
      localStorage.setItem("le_petit_can_appointments", JSON.stringify(updated));
      return updated;
    });
  };


  const [clientLuna] = useState<ClientProfile>({
    id: "c1",
    name: "Luna",
    breed: "Golden Retriever",
    size: "Mediano",
    behavior: "Tranquilo",
    birthDate: "15 May 2021",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCUIWGD2R213a1OenjCraZmuoyfbvs4paKI6Lmb7BECCdzw9DPxc2ctTn_1rrXZnwZnTR-eAUDsqaYX1XYlyaPfAtuAN3gvxcsKbcCoROrdimYxD2xYTsGRwx4taIuB1YjxUFAy5xd-lId3I5dkT7i4ToFSofxh5-ZV9VYSM64SBj-sp7PcAN_9MVVS9RmMXrgamw621kFsIeo8XSIkN7Wp5O_zQemax0DVmxdth4_tovOhvNP_QVyTNjwo069dadJxOfYt9tY8LT0",
    avgDuration: "1h 30min",
    status: "ACTIVO",
    lastVisitDate: "12 Octubre",
    lastVisitService: "Baño de Seda + Corte Higiénico",
    history: [
      {
        id: "h1",
        date: "12 Oct 2023",
        serviceTitle: "Sesión Premium SPA",
        duration: "1h 45min",
        status: "Completado",
        services: ["Baño de Seda Natural", "Mascarilla Nutritiva Coco", "Limpieza Auricular Profunda"],
        notes: "Luna se portó excelente. Disfrutó mucho del masaje con la mascarilla. El pelaje está en óptimas condiciones, muy brillante.",
      },
      {
        id: "h2",
        date: "05 Sep 2023",
        serviceTitle: "Mantenimiento Mensual",
        duration: "45min",
        status: "Completado",
        services: ["Baño Desenredante", "Corte de Uñas"],
        notes: "Llegó con algunos nudos en las orejas, pero se retiraron con facilidad usando el acondicionador de aloe.",
      },
      {
        id: "h3",
        date: "18 Jul 2023",
        serviceTitle: "Corte de Temporada",
        duration: "1h 15min",
        status: "Completado",
        services: ["Deslanado Completo", "Spray Brillo Final"],
        notes: "Preparada para el calor. Mucha muda de pelo retirada con éxito.",
      }
    ]
  });

  const [chatThreads, setChatThreads] = useState<ChatThread[]>([
    {
      id: "ch1",
      dogName: "Sofía y Rocky",
      ownerName: "Sofía Larrea",
      channel: "Web",
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAWQ0TP2GwJweHEQOk-oElvihstkjIhq8Whku_Gf23AYuRj5bFJCACUtHC2t0SXuNbShOEx8hpydKwsXl9HmAQt5S2kBHQivyAlKav2VsNDSui9GuCCrSjSot2PY7LGn5aO7C_BRy2kbLjKOmTrNeR3WPBihi99pQFiMjGDNYPXmwkmeXOL2ERvtN8-SSdj19oyqXg167sA84R4PAy6gH14DOIAnSe0U2vVOyVzOYBQvehjScIX2MyXXv7v0vf3arf-jjQXwEe6Beo",
      lastMessageText: "¿Podemos confirmar el baño para mañana?",
      lastMessageTime: "10:45",
      unread: true,
      resolved: false,
      messages: [
        { id: "m1", sender: "client", text: "Hola! Disculpa la molestia, queríamos confirmar si Rocky tiene cupo para el baño mañana a las 10am.", time: "10:42" },
        { id: "m2", sender: "me", text: "¡Hola Sofía! Claro que sí, tenemos el espacio reservado para Rocky a las 10:00. ¿Le hacemos el corte habitual de las puntas también?", time: "10:44" },
        { id: "m3", sender: "client", text: "¡Genial! Sí, por favor, el corte igual que la vez pasada. ¿Podemos confirmar el baño para mañana?", time: "10:45" }
      ]
    },
    {
      id: "ch2",
      dogName: "Marco y Luna",
      ownerName: "Marco Sanz",
      channel: "WhatsApp",
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDX-Jco14qHQpxRyCk4Ekx0E2ogvHq88fBjKIkyxOluhF2ivq39QgBs0NqoHhWnMYwZMFVMEfOm6U9bhCkeSbp4E0QfdkXogG6g0AV99RKu-MjFgKrAXh5W0yE8ivKVGCX6Hd5dMevsfUYV5xmgvN7lIzvpHyOESpcf03vP5-aeIaT6euizi8XgaYZFyt9AkopvTB_OVwx4okzX4jnoFNDt01x_bs_VYRKdTYaoLLmV-9cNCYiIuPr-mRxVh3A2zVkRnu76Xu8sV4I",
      lastMessageText: "Gracias por las fotos, quedó divina.",
      lastMessageTime: "Ayer",
      unread: false,
      resolved: false,
      messages: [
        { id: "m_l1", sender: "client", text: "Hola, ¿cómo va la sesión de Luna?", time: "Ayer 15:30" },
        { id: "m_l2", sender: "me", text: "¡Hola Marco! Acaba de salir de la hidromasaje y está súper tranquila. En breve te enviamos fotos.", time: "Ayer 15:35" },
        { id: "m_l3", sender: "client", text: "Gracias por las fotos, quedó divina.", time: "Ayer 16:00" }
      ]
    },
    {
      id: "ch3",
      dogName: "Lucía y Nube",
      ownerName: "Lucía Rivas",
      channel: "Instagram",
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCiZgzSTpUft2MZCSLr9oiENrEiLA9Ghyo_4nwUrd4vgFxoV7wdrOMLU_-nKelIfmcboAGNXJqV4I-h9sZgPN3Rv4QGe7IWMLZQWgjS1qIXLZwl9bEAIXln0gr_lhbLXFay33mYfhfhvio9tnw0PpDIjeldpbhjAqTqNISoO4O83ncqoq8ijqgRe4LTtHK9HuXNPviJGUA1KokUZ0qnkL7ydKQQ-JJIZodaD-0G53wB1TTdaVAFTsXyOR1mL8WYN2zD9kSCDWkalFQ",
      lastMessageText: "¿Tienen cupos para guardería?",
      lastMessageTime: "Lunes",
      unread: false,
      resolved: false,
      messages: [
        { id: "m_n1", sender: "client", text: "Buenas tardes, ¿tienen cupos para guardería la próxima semana?", time: "Lunes 12:15" }
      ]
    },
    {
      id: "ch4",
      dogName: "Andrés y Bongo",
      ownerName: "Andrés Larraín",
      channel: "Facebook",
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCYyMQyeg5r9m1wZefAOM7IbnxMHdTj2nHflHBYxjlcaEnoixXzWUC5W5mCyjf0gF3t8ty9I-3054680_ev1x4Jg_I2sBbB12H_LS8puAGtZvkNxh5Rr2wo8ghUfBIYafn0RODme3rAcEyrROUAyCvobb08i0iMqfCPkE0aOuAo4ItfybdIP0KMPWseUqr29Y3NEfp8pAA8278c-UZmK5Sfji-HOCWs07-xYDfbO0jgbfPj3jP0m8V2LvaTit_8wFN3oHn_A2dIGjE",
      lastMessageText: "Bongo ya está listo para su paseo.",
      lastMessageTime: "20 Oct",
      unread: false,
      resolved: true,
      messages: [
        { id: "m_b1", sender: "client", text: "¡Hola! Confirmando que Bongo ya está listo para su paseo.", time: "20 Oct 10:10" }
      ]
    }
  ]);

  const [activeChatId, setActiveChatId] = useState<string | null>("ch1");

  const handleOpenChatFromDashboard = (chatId: string) => {
    setActiveChatId(chatId);
    setView("messaging");
  };

  const handleNewAppointmentSuccess = async (draft: AppointmentDraft) => {
    const generatedId = `a_${Date.now()}`;
    const now = new Date();
    const startStr = `${now.toISOString().slice(0, 10)}T17:30:00`;
    const endStr = `${now.toISOString().slice(0, 10)}T19:00:00`;

    const newApp: Appointment = {
      id: generatedId,
      dogName: "Compañero",
      breed: "Sin Registrar",
      size: "Pequeño",
      ownerName: "Cliente Nuevo",
      service: `Grooming Estilo (${draft.duration})`,
      status: "Pendiente",
      period: "PM",
      time: "17:30",
      rawTime: "17:30",
      date: now.toISOString().slice(0, 10),
    };

    setAppointments((prev) => {
      const updated = [...prev, newApp];
      localStorage.setItem("le_petit_can_appointments", JSON.stringify(updated));
      return updated;
    });

    try {
      await odooService.createAppointment({
        name: newApp.service,
        start: startStr,
        stop: endStr,
        duration: 90,
        description: `Cita para ${newApp.ownerName}`,
      });
    } catch (err) {
      console.warn("[App] Odoo appointment creation failed (local save ok):", err);
    }
    setView("calendar");
  };

  if (!session) {
    return <LoginView onLoginSuccess={handleLoginSuccess} isSuspended={isSuspended} />;
  }

  if (isSuspended && session.role !== "administrador") {
    return <SuspendedView onLogout={handleLogout} businessOwnerName={session.name} />;
  }

  // Filter available menus by active session credentials
  const desktopSidebarItems = [
    ...(session.role === "administrador"
      ? [
          { id: "saas_control", name: "Hospedaje SaaS", icon: "payments" },
        ]
      : []),
    { id: "dashboard", name: "Dashboard", icon: "dashboard" },
    { id: "messaging", name: "Mensajes", icon: "chat" },
    { id: "calendar", name: "Calendario", icon: "calendar_today" },
    { id: "booking_widget", name: "Crear Citas", icon: "calendar_add_on" },
    { id: "active_appointment", name: "Cita en Curso", icon: "pending_actions" },
    ...(session.role !== "empleado"
      ? [{ id: "break_config", name: "Descansos", icon: "coffee" }]
      : []),
    { id: "client_detail", name: "Clientes", icon: "group" },
    ...(session.role !== "empleado"
      ? [{ id: "analytics", name: "Analíticas", icon: "analytics" }]
      : []),
    { id: "security_lopd", name: "Seguridad & LOPD", icon: "shield" },
    ...(session.role !== "empleado"
      ? [{ id: "admin_management", name: "Servicios & Productos", icon: "admin_panel_settings" }]
      : []),
  ];

  const mobileNavItems = [
    ...(session.role === "administrador"
      ? [
          { id: "saas_control", label: "SaaS", icon: "payments" },
        ]
      : []),
    { id: "dashboard", label: "Inicio", icon: "dashboard" },
    { id: "messaging", label: "Mensajes", icon: "chat" },
    { id: "calendar", label: "Calendario", icon: "calendar_today" },
    { id: "booking_widget", label: "Crear Citas", icon: "calendar_add_on" },
    { id: "active_appointment", label: "En Curso", icon: "pending_actions" },
    { id: "security_lopd", label: "LOPD", icon: "shield" },
  ];

  return (
    <div className="min-h-screen bg-background relative flex flex-col pt-3 lg:pt-0">
      {/* Dynamic Navigation Drawer (Desktop Layout Side rail) */}
      <div className="flex-grow flex lg:gap-10 md:gap-6 max-w-container-max w-full mx-auto relative px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-5 md:py-6 lg:py-0">
        {/* Navigation Drawer (Desktop only sidebar with current active user state) */}
        <aside className="hidden lg:flex flex-col gap-2 p-5 h-[calc(100vh-90px)] w-64 bg-surface-container-low rounded-[2rem] shadow-sm sticky top-16 shrink-0 z-20 text-left mt-8">
          <div className="mb-4 px-2.5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-secondary shrink-0">
              <img
                alt={session.name}
                className="w-full h-full object-cover animate-in fade-in"
                src={session.avatar}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0">
              <p className="font-serif text-sm font-bold text-primary truncate leading-tight">{session.name}</p>
              <span className="text-[9px] text-on-surface-variant font-sans font-semibold uppercase tracking-wider block mt-0.5">
                {session.role === "administrador" 
                  ? "SaaS Admin" 
                  : session.role === "propietario" 
                    ? "Propietaria / Owner" 
                    : "Empleado / Staff"}
              </span>
            </div>
          </div>
          <nav className="flex flex-col gap-1 flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-primary/10 [&::-webkit-scrollbar-thumb]:rounded-full">
            {desktopSidebarItems.map((btn) => {
              const isActive = currentView === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => setView(btn.id)}
                  className={`flex items-center gap-2.5 px-4.5 py-2 rounded-full font-sans text-xs font-bold transition-all text-left cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-secondary text-white font-extrabold shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container-highest/60"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{btn.icon}</span>
                  <span className="truncate">{btn.name}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-4 border-t border-outline-variant/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4.5 py-2 rounded-full font-sans text-xs font-bold text-warm-terracotta hover:bg-warm-terracotta/10 transition-all text-left cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* Global Application Workframe Area */}
        <div className="flex-grow flex flex-col min-w-0">
          {/* Main Top AppBar */}
          <header className="w-full bg-background shrink-0 z-40 sticky top-0 md:relative">
            <div className="flex justify-between items-center py-4 bg-background">
              <div className="flex items-center gap-3 text-left">
                {/* Brand icon representation */}
                <div className="w-9 h-9 rounded-full overflow-hidden border border-secondary bg-surface-container flex items-center justify-center shrink-0">
                  <img
                    alt="Atelier Logo"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLzUSxs7NGmfEtqZukEMn1yIx9tQj9kzko0kAcmwtL29zYLG1VzvfNQGEOk-jMSkIFCZY1TEcL8fw-l0bJz2kPCccMMoh04od8VtSTR6Y8N20SgO13et-BXYfGn27uxYucKhgVtc7P97BEVjaehJyyMogmDRrgSAzOmHpn7mVmyrB1q_QHNvjIUQvhtYzpC7hQGReM6dHXB2_m1XquMkX0SS_i8VWTy5jxRye-tQQNTlwU3SKMH8HS4_p2q5r9PljBNKb-5J6UInU"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h1 className="font-serif text-lg font-bold text-primary leading-none italic">
                    Le Petit Can
                  </h1>
                  {session.role === "administrador" && (
                    <span className="text-[9px] text-warm-terracotta font-bold tracking-widest font-sans uppercase">
                      Admin Mode
                    </span>
                  )}
                </div>
              </div>

              {/* Status and search profile */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  className="text-warm-terracotta bg-warm-terracotta/5 px-3 py-1.5 rounded-full font-sans text-[10px] font-bold hover:bg-warm-terracotta/10 transition-all cursor-pointer flex items-center gap-1.5"
                  title="Cerrar Sesión"
                >
                  <span className="material-symbols-outlined text-xs">logout</span>
                  <span className="hidden sm:inline">Salir</span>
                </button>
                <button className="text-on-surface-variant p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer select-none">
                  <span className="material-symbols-outlined text-lg">search</span>
                </button>
                <button
                  onClick={() => {
                    if (session.role !== "empleado") {
                      setView("break_config");
                    }
                  }}
                  className="relative text-on-surface-variant p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer select-none"
                >
                  <span className="material-symbols-outlined text-lg">notifications</span>
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-warm-terracotta rounded-full"></span>
                </button>
              </div>
            </div>
          </header>

          {/* Active Layout Component switch loader */}
          <main className="flex-1 py-4 pb-28 lg:pb-12 text-on-surface">
            {currentView === "saas_control" && (
              <SaaSPaymentControl
                isSuspended={isSuspended}
                onToggleSuspension={handleToggleSuspension}
                onLogout={handleLogout}
                adminName={session.name}
              />
            )}

            {currentView === "dashboard" && (
              <DashboardView
                onNavigate={setView}
                onOpenChat={handleOpenChatFromDashboard}
                appointments={appointments}
                chatThreads={chatThreads}
                userName={session.name}
                onSelectClientDetail={handleSelectClientDetail}
                onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
              />
            )}

            {currentView === "client_detail" && (
              <ClientDetailView
                client={clientLuna}
                owners={owners}
                onSaveOwner={handleSaveOwner}
                onDeleteOwner={handleDeleteOwner}
                onBack={() => setView("dashboard")}
                appointments={appointments}
                initialOwnerId={selectedOwnerIdForDetail}
                initialPetId={selectedPetIdForDetail}
                onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
              />
            )}

            {currentView === "analytics" && (
              session.role === "empleado" ? (
                <div className="bg-white rounded-[2.5rem] p-8 border border-outline-variant/30 font-sans text-center max-w-md mx-auto space-y-4 shadow-sm">
                  <span className="material-symbols-outlined text-4xl text-warm-terracotta">lock</span>
                  <p className="font-serif text-lg font-bold">Falta de Rango</p>
                  <p className="text-xs text-on-surface-variant">Estas analíticas de facturación son sensibles y requieren rango de Propietario.</p>
                </div>
              ) : (
                <AnalyticsView owners={owners} />
              )
            )}

            {currentView === "calendar" && (
              <CalendarView
                appointments={appointments}
                onNavigate={setView}
                userRole={session.role}
                onSelectClientDetail={handleSelectClientDetail}
                onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
              />
            )}

            {currentView === "messaging" && (() => {
              const currentActiveId = activeChatId || "ch1";
              const thread = chatThreads.find((t) => t.id === currentActiveId);
              const ownerObj = thread ? owners.find((o) => o.name.toLowerCase() === thread.ownerName.toLowerCase()) : undefined;
              return (
                <MessagingView
                  chatThreads={chatThreads}
                  onUpdateThreads={setChatThreads}
                  activeChatId={currentActiveId}
                  setActiveChatId={setActiveChatId}
                  clientChannelsConfig={ownerObj?.channels}
                />
              );
            })()}

            {currentView === "new_appointment" && (
              <BookingWidget
                services={services}
                owners={owners}
                onNavigateBack={() => setView("dashboard")}
                onAppointmentCreated={handleBookingCreated}
              />
            )}

            {currentView === "active_appointment" && <ActiveAppointmentView />}

            {currentView === "break_config" && (
              session.role === "empleado" ? (
                <div className="bg-white rounded-[2.5rem] p-8 border border-outline-variant/30 font-sans text-center max-w-md mx-auto space-y-4 shadow-sm">
                  <span className="material-symbols-outlined text-4xl text-warm-terracotta">lock</span>
                  <p className="font-serif text-lg font-bold">Configuración Protegida</p>
                  <p className="text-xs text-on-surface-variant">La modificación de horarios de descanso del personal está asignada únicamente al Propietario.</p>
                </div>
              ) : (
                <BreakConfigView />
              )
            )}

            {currentView === "booking_widget" && (
              <BookingWidget
                services={services}
                owners={owners}
                onNavigateBack={() => setView("dashboard")}
onAppointmentCreated={handleBookingCreated}
              />
            )}

            {currentView === "admin_management" && (
              session.role === "empleado" ? (
                <div className="bg-white rounded-[2.5rem] p-8 border border-outline-variant/30 font-sans text-center max-w-md mx-auto space-y-4 shadow-sm">
                  <span className="material-symbols-outlined text-4xl text-warm-terracotta">lock</span>
                  <p className="font-serif text-lg font-bold">Falta de Rango</p>
                  <p className="text-xs text-on-surface-variant">La modificación de tarifas de servicios o stock de productos requiere rol de Administrador o Propietario.</p>
                </div>
              ) : (
                <AdminManagementView
                  services={services}
                  onSaveService={handleSaveService}
                  onDeleteService={handleDeleteService}
                  onResetServicesToDefault={handleResetServicesToDefault}
                  products={products}
                  onSaveProduct={handleSaveProduct}
                  onDeleteProduct={handleDeleteProduct}
                  owners={owners}
                  onSaveOwner={handleSaveOwner}
                  onDeleteOwner={handleDeleteOwner}
                  onNavigateBack={() => setView("dashboard")}
                  userRole={session.role}
                />
              )
            )}

            {currentView === "security_lopd" && (
              <SecurityLopdView
                userRole={session.role}
                userName={session.name}
                onLogout={handleLogout}
                idleCountdown={idleCountdown}
              />
            )}
          </main>
        </div>
      </div>

      {/* Global Brand Bottom NavBar for Mobile representation */}
      <nav className="fixed bottom-0 left-0 w-full z-45 lg:hidden flex justify-around items-center px-4 pb-6 pt-3 bg-surface-container-low dark:bg-surface-container-low shadow-[0_-4px_20px_rgba(117,88,72,0.05)] rounded-t-3xl border-t border-outline-variant/10">
        {mobileNavItems.map((btn) => {
          const isActive = currentView === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => setView(btn.id)}
              className={`flex flex-col items-center justify-center font-sans tracking-wide cursor-pointer transition-all ${
                isActive
                  ? "bg-primary-container text-on-primary-container rounded-full px-5 py-2 shadow-sm transform scale-98 shrink-0 font-bold"
                  : "text-on-surface-variant hover:text-primary active:scale-90"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{btn.icon}</span>
              <span className="text-[10px] font-semibold mt-1">{btn.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Floater specs Handoff Panel for Antigravity & developer continuous iteration */}
      <HandoffPanel currentView={currentView} setView={setView} />
    </div>
  );
}

