import React, { useState, useRef, useEffect } from "react";
import { ChatThread, ChatMessage, MetaChannelConfig } from "../types";
import * as metaWhatsAppService from "../services/metaWhatsAppService";
import * as metaMessengerService from "../services/metaMessengerService";
import * as metaInstagramService from "../services/metaInstagramService";
import { useMetaChannels } from "../context/MetaChannelsContext";

// Audio Playback Player Component for playable audio note bubbles
export function AudioPlaybackWidget({ durationStr, isMe }: { durationStr: string; isMe: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 6;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="flex items-center gap-2.5 py-1 bg-transparent min-w-[180px] sm:min-w-[220px]">
      <button
        type="button"
        onClick={() => setIsPlaying(!isPlaying)}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer ${
          isMe ? "bg-white text-[#cf9681]" : "bg-[#cf9681] text-white"
        }`}
        title={isPlaying ? "Pausar" : "Reproducir nota de voz"}
      >
        <span className="material-symbols-outlined text-[18px]">
          {isPlaying ? "pause" : "play_arrow"}
        </span>
      </button>
      
      <div className="flex-1">
        {/* Equalizer-like wave-bars */}
        <div className="flex gap-[2px] items-center h-4 py-1">
          {[1.5, 3.2, 2.1, 4.2, 3.1, 1.8, 4.0, 1.5, 3.2, 4.5, 2.0, 3.6, 1.2, 3.5, 1.8].map((height, idx, arr) => {
            const barProgress = (idx / arr.length) * 100;
            const isFilled = progress >= barProgress;
            return (
              <span
                key={idx}
                className="w-[2.5px] rounded-full transition-all duration-150"
                style={{
                  height: `${height * 3}px`,
                  backgroundColor: isFilled
                    ? (isMe ? "rgba(255,255,255,1)" : "var(--color-primary)")
                    : (isMe ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.15)")
                }}
              />
            );
          })}
        </div>
        <div className="flex justify-between items-center text-[8px] mt-0.5 opacity-75 font-mono">
          <span>{isPlaying ? `0:0${Math.round((progress * parseFloat(durationStr.split(":")[1] || "5")) / 100)}` : "0:00"}</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[9px]">mic</span>
            {durationStr}
          </span>
        </div>
      </div>
    </div>
  );
}

interface MessagingViewProps {
  chatThreads: ChatThread[];
  onUpdateThreads: (updated: ChatThread[]) => void;
  activeChatId: string;
  setActiveChatId: (id: string | null) => void;
  clientChannelsConfig?: MetaChannelConfig;
}

export function MessagingView({
  chatThreads,
  onUpdateThreads,
  activeChatId,
  setActiveChatId,
  clientChannelsConfig,
}: MessagingViewProps) {
  const { metaChannelsConfig } = useMetaChannels();
  const [filter, setFilter] = useState<"Todos" | "WhatsApp" | "Instagram" | "Facebook" | "Web" | "Gmail" | string>("Todos");
  const [inputText, setInputText] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [isRetryingConnection, setIsRetryingConnection] = useState<boolean>(false);
  const [isMetaConnected, setIsMetaConnected] = useState<boolean>(true);
  const [showErrorBanner, setShowErrorBanner] = useState<boolean>(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice & Dictation States
  const [isDictating, setIsDictating] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [pulseCount, setPulseCount] = useState(0);
  const recordingTimerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  // Setup speech recognition for messages dictation
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "es-ES";

      rec.onstart = () => {
        setIsDictating(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText((prev) => prev ? prev + " " + transcript : transcript);
        }
      };

      rec.onerror = (e: any) => {
        console.warn("Message dictation error: fallback to typing simulation", e);
        handleSimulatedDictation();
      };

      rec.onend = () => {
        setIsDictating(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const handleSimulatedDictation = () => {
    setIsDictating(true);
    const mockPhrases = [
      "Hola, te confirmo el turno para el peinado de mañana.",
      "El servicio contratado incluye corte de uñas, deslanado profundo y perfumado.",
      "Tu mascota ya se encuentra lista para recoger en Atelier Canino.",
      "Muchas gracias por confiar en nuestro servicio premium de peluquería."
    ];
    const phrase = mockPhrases[Math.floor(Math.random() * mockPhrases.length)];
    setTimeout(() => {
      setInputText((prev) => prev ? prev + " " + phrase : phrase);
      setIsDictating(false);
    }, 2500);
  };

  const toggleDictate = () => {
    if (isDictating) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      } else {
        setIsDictating(false);
      }
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        handleSimulatedDictation();
      }
    } else {
      handleSimulatedDictation();
    }
  };

  // Timer for voice note recording
  useEffect(() => {
    if (isRecordingAudio) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
        setPulseCount((c) => (c + 1) % 4);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setRecordingSeconds(0);
      setPulseCount(0);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecordingAudio]);

  const startVoiceRecording = () => {
    setIsRecordingAudio(true);
  };

  const cancelVoiceRecording = () => {
    setIsRecordingAudio(false);
  };

  const dispatchSendMessage = async (thread: ChatThread, text: string, isAudio = false, audioDuration?: string) => {
    const ch = thread.channel.toLowerCase();
    let newMsg: ChatMessage;
    
    if (ch === "whatsapp") {
      newMsg = await metaWhatsAppService.sendMessage(metaChannelsConfig?.whatsapp, thread.id, { text, isAudio, audioDuration });
    } else if (ch === "facebook") {
      newMsg = await metaMessengerService.sendMessage(metaChannelsConfig?.facebook, thread.id, { text });
    } else if (ch === "instagram") {
      newMsg = await metaInstagramService.sendMessage(metaChannelsConfig?.instagram, thread.id, { text });
    } else {
      newMsg = {
        id: `m_sent_${Date.now()}`,
        sender: "me",
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAudio,
        audioDuration,
        channel: thread.channel
      };
    }
    return newMsg;
  };

  const sendVoiceRecording = async () => {
    if (!activeThread) return;
    const duration = recordingSeconds > 0 ? recordingSeconds : 5;
    const durationStr = `0:0${duration}`;

    try {
      const newVoiceMsg = await dispatchSendMessage(activeThread, "Nota de voz", true, durationStr);
      const updatedMessages = [...activeThread.messages, newVoiceMsg];
      
      let updatedThreads = chatThreads.map((t) => {
        if (t.id === activeThread.id) {
          return {
            ...t,
            messages: updatedMessages,
            lastMessageText: "🎵 Nota de voz",
            lastMessageTime: "Ahora mismo"
          };
        }
        return t;
      });
      onUpdateThreads(updatedThreads);
      setIsRecordingAudio(false);

      // Simulate Client Voice/Text Response after 1.5s
      setTimeout(() => {
        const isVoiceReply = Math.random() > 0.4;
        let replyMsg: ChatMessage;

        if (isVoiceReply) {
          replyMsg = {
            id: `m_rep_${Date.now() + 1}`,
            sender: "client",
            text: "Nota de voz recibida",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isAudio: true,
            audioDuration: "0:06",
            channel: activeThread.channel
          };
        } else {
          replyMsg = {
            id: `m_rep_${Date.now() + 1}`,
            sender: "client",
            text: "¡Qué bien suena! Muchas gracias por el audio con los detalles, nos vemos en un rato.",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            channel: activeThread.channel
          };
        }

        onUpdateThreads(
          updatedThreads.map((t) => {
            if (t.id === activeThread.id) {
              return {
                ...t,
                messages: [...updatedMessages, replyMsg],
                lastMessageText: isVoiceReply ? "🎵 Nota de voz" : replyMsg.text,
                lastMessageTime: "Hace 1 min",
              };
            }
            return t;
          })
        );
      }, 1800);
    } catch (err) {
      console.error("Error sending voice recording dispatch:", err);
    }
  };

  // Dynamically query listMessages from Meta services on activeThread selection
  useEffect(() => {
    if (!activeThread) return;
    
    const loadServiceMessages = async () => {
      try {
        let fetched: ChatMessage[] = [];
        const ch = activeThread.channel.toLowerCase();
        if (ch === "whatsapp") {
          fetched = await metaWhatsAppService.listMessages(metaChannelsConfig?.whatsapp, activeThread.id);
        } else if (ch === "facebook") {
          fetched = await metaMessengerService.listMessages(metaChannelsConfig?.facebook, activeThread.id);
        } else if (ch === "instagram") {
          fetched = await metaInstagramService.listMessages(metaChannelsConfig?.instagram, activeThread.id);
        }
        
        if (fetched.length > 0) {
          const threadMsgCount = activeThread.messages.length;
          const fetchedMsgCount = fetched.length;
          // Only update if there is a difference to avoid infinite render loops
          if (threadMsgCount !== fetchedMsgCount) {
            const updated = chatThreads.map((t) =>
              t.id === activeThread.id ? { ...t, messages: fetched } : t
            );
            onUpdateThreads(updated);
          }
        }
      } catch (err) {
        console.warn("[MessagingView] Error loading messages from integration services:", err);
      }
    };
    
    loadServiceMessages();
  }, [activeChatId]);

  // Filter threads by connection channels and search query
  const filteredThreads = chatThreads.filter((t) => {
    const matchesFilter = filter === "Todos" ? true : t.channel.toLowerCase() === filter.toLowerCase();
    const matchesSearch = searchQuery.trim() === "" ? true : (
      t.dogName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.lastMessageText.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesFilter && matchesSearch;
  });

  // Get active thread
  const activeThread = chatThreads.find((t) => t.id === activeChatId) || null;

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages]);

  // Mark active as read when opening
  useEffect(() => {
    if (activeThread && activeThread.unread) {
      const updated = chatThreads.map((t) =>
        t.id === activeThread.id ? { ...t, unread: false } : t
      );
      onUpdateThreads(updated);
    }
  }, [activeChatId, activeThread?.id]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeThread) return;

    const textToSend = inputText;
    setInputText("");

    try {
      const newMsg = await dispatchSendMessage(activeThread, textToSend);
      const updatedMessages = [...activeThread.messages, newMsg];
      
      // Update threads state
      let updatedThreads = chatThreads.map((t) => {
        if (t.id === activeThread.id) {
          return {
            ...t,
            messages: updatedMessages,
            lastMessageText: textToSend,
            lastMessageTime: "Ahora mismo",
          };
        }
        return t;
      });

      onUpdateThreads(updatedThreads);

      // Simulate auto-reply after 1.5 seconds
      setTimeout(() => {
        const replies = [
          "¡Excelente! Nos vemos pronto. ¡Y gracias por cuidar tan bien de mi mascota!",
          "Perfecto, gracias por confirmarnos tan rápido. Atelier Canino es de absoluta confianza.",
          "¡De acuerdo! Confiamos plenamente en el cuidado que le dan. Saludos.",
          "¡Estupendo! Saludos a todo el equipo."
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];

        const replyMsg: ChatMessage = {
          id: `m_${Date.now() + 1}`,
          sender: "client",
          text: randomReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          channel: activeThread.channel
        };

        onUpdateThreads(
          updatedThreads.map((t) => {
            if (t.id === activeThread.id) {
              return {
                ...t,
                messages: [...updatedMessages, replyMsg],
                lastMessageText: randomReply,
                lastMessageTime: "Hace 1 min",
              };
            }
            return t;
          })
        );
      }, 1500);
    } catch (err) {
      console.error("Error dispatching standard send:", err);
    }
  };

  const handleToggleResolve = () => {
    if (!activeThread) return;
    const updated = chatThreads.map((t) =>
      t.id === activeThread.id ? { ...t, resolved: !t.resolved } : t
    );
    onUpdateThreads(updated);
  };

  const retryWhatsAppConnection = () => {
    setIsRetryingConnection(true);
    setTimeout(() => {
      setIsRetryingConnection(false);
      setShowErrorBanner(false);
    }, 2000);
  };

  // Helper to get channel prefix / ID mapping
  const getThreadHashId = (id: string, channel: string) => {
    const num = id.replace(/\D/g, "") || "9872";
    const ch = channel.toLowerCase();
    if (ch === "whatsapp") return `#W-${num}`;
    if (ch === "instagram") return `#I-${num}`;
    if (ch === "facebook") return `#F-${num}`;
    if (ch === "gmail") return `#G-${num}`;
    return `#WB-${num}`;
  };

  // Calculate counters for chips
  const countByChannel = (channelName: string) => {
    if (channelName === "Todos") return chatThreads.length;
    return chatThreads.filter((t) => t.channel.toLowerCase() === channelName.toLowerCase()).length;
  };

  const handleCreateSimulatedChat = () => {
    const names = [
      { dog: "Kobe", owner: "Jesús Gómez", channel: "WhatsApp" as const, img: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=100" },
      { dog: "Milú", owner: "Laura Castro", channel: "Instagram" as const, img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=100" },
      { dog: "Dante", owner: "Carlos Peña", channel: "Facebook" as const, img: "https://images.unsplash.com/photo-1537151608828-ea2b117b62d1?auto=format&fit=crop&q=80&w=100" }
    ];
    const picked = names[Math.floor(Math.random() * names.length)];
    const newId = `ch_${Date.now()}`;
    const newThread: ChatThread = {
      id: newId,
      dogName: picked.dog,
      ownerName: picked.owner,
      channel: picked.channel,
      avatarUrl: picked.img,
      lastMessageText: "¡Hola! Quisiera agendar un servicio.",
      lastMessageTime: "Ahora mismo",
      unread: true,
      resolved: false,
      messages: [
        { id: `m_init_${Date.now()}`, sender: "client", text: `¡Hola! Quisiera agendar un servicio premium de peluquería para ${picked.dog}. ¿Tenéis disponibilidad?`, time: "Ahora mismo" }
      ]
    };

    onUpdateThreads([newThread, ...chatThreads]);
    setActiveChatId(newId);
  };

  return (
    <div className="h-[calc(100vh-160px)] max-w-container-max mx-auto flex overflow-hidden rounded-[2.5rem] border border-[#cf9681]/25 bg-stone-50 shadow-sm relative">
      
      {/* Dynamic Conversation Sidebar / Inbox */}
      <aside
        className={`${
          activeChatId ? "hidden md:flex" : "flex"
        } w-full md:w-[380px] flex-shrink-0 flex-col border-r border-[#cf9681]/15 bg-[#fbf9f6]`}
      >
        {/* Top Header matching exact brand system */}
        <header className="bg-white/85 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100"
              alt="Avatar Iliana"
              className="w-10 h-10 rounded-full object-cover border border-[#cf9681]/20"
              referrerPolicy="no-referrer"
            />
            <div className="text-left">
              <h1 className="font-serif text-lg font-bold text-stone-700 tracking-tight leading-tight">Le Petit Can</h1>
              <p className="text-[10px] font-sans text-stone-500 font-bold tracking-tight">Atelier Canino</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5">
            {/* Meta Connection Status Indicator */}
            <div className="bg-stone-100/80 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-stone-200" title="Estado del Servidor Meta">
              <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/>
              </svg>
              <span className={`w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] ${isMetaConnected ? "animate-pulse" : "bg-red-500"}`}></span>
            </div>
            
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-1 px-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800 rounded-full transition-colors cursor-pointer"
              title="Buscar hilos"
            >
              <span className="material-symbols-outlined text-lg">search</span>
            </button>
          </div>
        </header>

        {/* Optional Search panel */}
        {showSearch && (
          <div className="bg-white px-4 py-3 border-b border-stone-200/60 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 bg-stone-50 px-3 py-2 rounded-2xl border border-stone-200">
              <span className="material-symbols-outlined text-stone-400 text-sm">search</span>
              <input
                type="text"
                placeholder="Buscar por cliente o mascota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-sans text-stone-700 bg-transparent border-none focus:outline-none focus:ring-0 outline-none placeholder:text-stone-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-stone-400 hover:text-stone-700">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* WhatsApp Server Error connection banner */}
        {showErrorBanner && (
          <div className="p-4 bg-red-50/90 border-b border-red-100/60 flex items-center gap-3.5 animate-in slide-in-from-top duration-300">
            <div className="bg-red-100 p-2.5 rounded-2xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-red-600 text-base">cloud_off</span>
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-red-950 text-[11px] font-bold">Error de conexión con WhatsApp</p>
              <p className="text-red-700/80 text-[9px] font-medium truncate">Revisando estado de servidores n8n...</p>
            </div>
            <button
              onClick={retryWhatsAppConnection}
              disabled={isRetryingConnection}
              className="bg-white hover:bg-red-50 text-red-600 px-3.5 py-1.5 rounded-full text-[10px] font-black border border-red-100 shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
            >
              {isRetryingConnection ? "Cargando..." : "Reintentar"}
            </button>
          </div>
        )}

        {/* Omnichannel Channel Filters */}
        <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-stone-200/50 bg-white">
          {(["Todos", "WhatsApp", "Instagram", "Facebook", "Web", "Gmail"] as const).map((ch) => {
            const count = countByChannel(ch);
            const isSelected = filter === ch;
            return (
              <button
                key={ch}
                onClick={() => setFilter(ch)}
                className={`py-2 px-5 font-sans text-xs font-bold whitespace-nowrap transition-all rounded-full cursor-pointer ${
                  isSelected
                    ? "bg-stone-700 text-white shadow-xs font-bold"
                    : "bg-stone-100 text-stone-500 hover:bg-stone-200/60 font-semibold"
                }`}
              >
                {ch} {count > 0 ? `(${count})` : ""}
              </button>
            );
          })}
        </div>

        {/* Converstation List Section with 32px rounded style */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
          {filteredThreads.map((thread) => {
            const isSelected = activeChatId === thread.id;
            const threadHash = getThreadHashId(thread.id, thread.channel);
            
            return (
              <div
                key={thread.id}
                onClick={() => setActiveChatId(thread.id)}
                className={`group flex items-center p-4 rounded-[32px] cursor-pointer transition-all duration-300 border ${
                  isSelected
                    ? "bg-white border-[#cf9681]/45 shadow-[0_4px_20px_rgba(117,88,72,0.06)] scale-[0.99]"
                    : "bg-white/80 border-stone-100/80 shadow-[0_4px_15px_rgba(117,88,72,0.02)] hover:bg-white hover:border-stone-200/85 hover:shadow-[0_4px_20px_rgba(117,88,72,0.04)]"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    alt={thread.dogName}
                    className="w-14 h-14 rounded-2xl object-cover shadow-xs border border-stone-100"
                    src={thread.avatarUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=100"}
                    referrerPolicy="no-referrer"
                  />
                  {/* Channel icon absolute badget bottom right */}
                  <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-xs border border-stone-100 flex items-center justify-center">
                    {thread.channel.toLowerCase() === "whatsapp" ? (
                      <svg className="w-3.5 h-3.5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.514-2.961-2.628-.086-.114-.705-.938-.705-1.792 0-.853.447-1.273.605-1.446.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298l.541 1.316c.046.112.078.242.005.388-.073.146-.11.237-.217.363-.106.127-.221.282-.315.38-.106.11-.217.231-.093.442.124.211.549.905 1.176 1.464.808.72 1.488.943 1.698 1.049.211.106.332.088.456-.056.124-.144.534-.621.678-.832.144-.211.289-.177.487-.104l1.385.654c.198.093.33.14.373.213.044.073.044.419-.101.824z"/>
                      </svg>
                    ) : thread.channel.toLowerCase() === "instagram" ? (
                      <svg className="w-3.5 h-3.5 text-pink-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.058-1.69-.072-4.949-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    ) : thread.channel.toLowerCase() === "facebook" ? (
                      <svg className="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                      </svg>
                    ) : thread.channel.toLowerCase() === "gmail" ? (
                      <span className="material-symbols-outlined text-[12px] text-red-500 font-bold">mail</span>
                    ) : (
                      <span className="material-symbols-outlined text-[12px] text-zinc-600 font-bold">language</span>
                    )}
                  </div>
                </div>
                
                <div className="ml-4 flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-sans text-sm font-bold truncate pr-1 ${isSelected ? "text-stone-900" : "text-stone-700"}`}>
                      {thread.dogName} y {thread.ownerName.split(" ")[0]}
                    </h3>
                    <span className="text-[10px] text-stone-400 font-bold tracking-tight shrink-0">
                      {thread.lastMessageTime}
                    </span>
                  </div>
                  <p className={`text-stone-500 text-[12px] truncate leading-snug mb-1.5 ${thread.unread ? "font-semibold text-stone-800" : ""}`}>
                    {thread.lastMessageText}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-stone-100 text-[9px] font-mono font-bold text-stone-500 border border-stone-200">
                      {threadHash}
                    </span>
                    {thread.resolved && (
                      <span className="px-1.5 py-0.2 bg-green-50 text-green-600 border border-green-200 text-[8px] font-bold rounded">
                        Resuelto
                      </span>
                    )}
                  </div>
                </div>

                {/* Unread dot styled with exactly terracotta #cf9681 indicator */}
                {thread.unread && (
                  <div className="w-3 h-3 rounded-full bg-[#cf9681] shadow-xs shadow-[#cf9681]/40 shrink-0 ml-1"></div>
                )}
              </div>
            );
          })}

          {filteredThreads.length === 0 && (
            <div className="text-center py-10 px-4">
              <span className="material-symbols-outlined text-4xl text-stone-300">forum</span>
              <p className="text-xs text-stone-400 mt-2 font-medium">No se encontraron conversaciones con este filtro.</p>
            </div>
          )}
        </div>

        {/* Floating Action Button (FAB) matching terracotta #cf9681 theme */}
        <button
          onClick={handleCreateSimulatedChat}
          className="absolute bottom-5 left-[305px] w-12 h-12 bg-[#cf9681] text-white rounded-full shadow-md shadow-[#cf9681]/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center z-40 cursor-pointer"
          title="Simular nueva consulta entrante de cliente"
        >
          <span className="material-symbols-outlined text-xl">chat_bubble</span>
        </button>
      </aside>

      {/* Chat Thread Panel Section */}
      <section
        className={`${
          activeChatId ? "flex" : "hidden md:flex"
        } flex-1 flex-col bg-stone-50 relative overflow-hidden h-full`}
      >
        {activeThread ? (
          <>
            {/* Thread Navigation / Customer Header */}
            <div className="p-4 md:p-6 flex justify-between items-center bg-white/75 backdrop-blur-md z-10 border-b border-stone-200">
              <div className="flex items-center gap-4 text-left">
                {/* Back list button on mobile devices */}
                <button
                  onClick={() => setActiveChatId(null)}
                  className="md:hidden text-stone-700 p-1 hover:bg-stone-100 rounded-full cursor-pointer flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-xl font-bold">arrow_back</span>
                </button>
                
                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-stone-200 shadow-xs">
                  <img
                    alt={activeThread.dogName}
                    className="w-full h-full object-cover"
                    src={activeThread.avatarUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=100"}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h2 className="font-serif text-base md:text-lg font-bold text-stone-800 leading-none">
                    {activeThread.dogName} y {activeThread.ownerName}
                  </h2>
                  <span className="font-sans text-[10px] text-stone-500 flex items-center gap-1 mt-1 font-semibold">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse"></span>{" "}
                    En línea • canal {activeThread.channel}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleResolve}
                  className={`flex items-center gap-1 px-4 py-1.5 rounded-full font-sans text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer border ${
                    activeThread.resolved
                      ? "bg-green-600 text-white border-green-600 hover:bg-green-700"
                      : "bg-stone-100 text-stone-600 border-stone-300/60 hover:bg-stone-200/80"
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">
                    {activeThread.resolved ? "check_circle" : "radio_button_unchecked"}
                  </span>
                  <span>
                    {activeThread.resolved ? "Resuelto" : "Pendiente"}
                  </span>
                </button>
              </div>
            </div>

            {/* Conversation messages board */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 flex flex-col bg-[#fdfcfb]">
              <div className="flex justify-center my-2">
                <span className="px-4 py-1 bg-stone-100 rounded-full font-sans text-[9px] font-black text-stone-500 uppercase tracking-widest border border-stone-200/50">
                  Canal de entrada directo • {getThreadHashId(activeThread.id, activeThread.channel)}
                </span>
              </div>

              {activeThread.messages.map((msg) => {
                const isMe = msg.sender === "me";
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-[85%] sm:max-w-[70%] ${
                      isMe ? "self-end flex-row-reverse" : "self-start text-left"
                    }`}
                  >
                    <div className="flex-1">
                      <div
                        className={`p-4 rounded-[x2.5rem] text-xs sm:text-sm leading-relaxed text-left ${
                          isMe
                            ? "bg-[#cf9681] text-white rounded-[24px] rounded-br-[4px] shadow-xs"
                            : "bg-stone-100 text-stone-800 rounded-[24px] rounded-bl-[4px] shadow-3xs"
                        }`}
                      >
                        {msg.isAudio ? (
                          <AudioPlaybackWidget durationStr={msg.audioDuration || "0:05"} isMe={isMe} />
                        ) : (
                          msg.text
                        )}
                      </div>
                      <span
                        className={`font-sans text-[9px] text-stone-400 mt-1 block flex items-center gap-1 ${
                          isMe ? "justify-end mr-1" : "ml-1"
                        }`}
                      >
                        {msg.time}
                        {isMe && (
                          <span className="material-symbols-outlined text-[11px] text-[#cf9681] font-bold">
                            done_all
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Text entry / dictation space with dictation toggle */}
            <div className="p-4 bg-[#fbf9f6] border-t border-[#cf9681]/15">
              <div className="max-w-3xl mx-auto">
                {isRecordingAudio ? (
                  /* Audio Voice Recorder Modes active visual */
                  <div className="flex items-center justify-between bg-red-50 border border-red-200 p-2.5 rounded-[32px] px-5 animate-pulse select-none">
                    <div className="flex items-center gap-3">
                      <span className="flex h-3.5 w-3.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
                      </span>
                      <span className="font-sans text-xs font-bold text-red-900">
                        Nota de voz: {recordingSeconds < 10 ? `0:0${recordingSeconds}` : `0:${recordingSeconds}`}
                      </span>

                      {/* Equalizer inside voice recorder panel */}
                      <div className="flex gap-[2.5px] items-center h-4 px-1 shrink-0">
                        <span className={`w-[3px] bg-red-600 rounded transition-all duration-150 ${pulseCount === 0 ? "h-3" : "h-1.5"}`}></span>
                        <span className={`w-[3px] bg-red-600 rounded transition-all duration-150 ${pulseCount === 1 ? "h-4" : "h-2"}`}></span>
                        <span className={`w-[3px] bg-red-600 rounded transition-all duration-150 ${pulseCount === 2 ? "h-2.5" : "h-1"}`}></span>
                        <span className={`w-[3px] bg-red-600 rounded transition-all duration-150 ${pulseCount === 3 ? "h-3.5" : "h-1.5"}`}></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={cancelVoiceRecording}
                        className="px-4 py-1.5 rounded-full border border-red-300 text-red-700 hover:bg-white font-sans text-[11px] font-black transition-all active:scale-95 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      
                      <button
                        type="button"
                        onClick={sendVoiceRecording}
                        className="bg-[#cf9681] text-white hover:bg-[#b07865] w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 cursor-pointer"
                        title="Enviar Nota de Voz"
                      >
                        <span className="material-symbols-outlined text-xl">send</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Standard text writing / voice dictation triggers */
                  <div className="flex items-center gap-2 bg-white p-2 rounded-[32px] shadow-sm border border-stone-200 relative">
                    <button
                      type="button"
                      className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-stone-400 hover:text-[#cf9681] transition-colors cursor-pointer"
                      title="Adjuntar archivo o imagen"
                    >
                      <span className="material-symbols-outlined text-xl">add_circle</span>
                    </button>

                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      className="w-full border-none focus:outline-none focus:ring-0 font-sans text-xs sm:text-sm text-stone-700 py-2 px-1/2 bg-transparent placeholder:text-stone-400"
                      placeholder={isDictating ? "Escuchando tu voz..." : "Escribe tu respuesta aquí..."}
                      disabled={isDictating}
                    />

                    <div className="flex items-center gap-1.5 pr-1">
                      {/* Speech recognition dictation trigger */}
                      <button
                        type="button"
                        onClick={toggleDictate}
                        className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full transition-all active:scale-90 cursor-pointer ${
                          isDictating
                            ? "bg-red-500 text-white shadow-md animate-pulse"
                            : "text-stone-400 hover:text-[#cf9681] hover:bg-stone-50"
                        }`}
                        title={isDictating ? "Detener dictado por voz" : "Dictar respuesta"}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {isDictating ? "mic" : "settings_voice"}
                        </span>
                      </button>

                      {/* Voice Note recorder trigger */}
                      <button
                        type="button"
                        onClick={startVoiceRecording}
                        className="w-9 h-9 flex-shrink-0 flex items-center justify-center text-stone-400 hover:text-[#cf9681] hover:bg-stone-50 rounded-full transition-all active:scale-90 cursor-pointer"
                        title="Grabar nota de voz"
                      >
                        <span className="material-symbols-outlined text-[20px]">mic</span>
                      </button>

                      {/* Send text trigger */}
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputText.trim()}
                        className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full transition-all active:scale-90 cursor-pointer ${
                          inputText.trim() ? "bg-[#cf9681] text-white shadow-md" : "bg-stone-100 text-stone-300"
                        }`}
                        title="Enviar respuesta"
                      >
                        <span className="material-symbols-outlined text-lg">send</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-stone-400 bg-[#fdfcfb]">
            <span className="material-symbols-outlined text-5xl text-[#cf9681]/40 animate-bounce">forum</span>
            <p className="mt-4 font-serif text-base font-bold text-stone-700">Canal listado listo</p>
            <p className="text-[11px] text-stone-400 max-w-sm px-6 mt-1 text-center">Selecciona cualquier conversación de la bandeja omnicanal de Le Petit Can para gestionar citas, responder consultas y enviar notas de voz.</p>
          </div>
        )}
      </section>
    </div>
  );
}
