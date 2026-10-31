import React, { useState, useRef, useEffect } from "react";
import { ChatThread, ChatMessage, ConversationStatus, ConversationPriority } from "../types";
import * as chatwootService from "../services/chatwootService";

const CHANNEL_COLORS: Record<string, string> = {
  WhatsApp: "bg-green-100 text-green-700",
  Instagram: "bg-pink-100 text-pink-700",
  Facebook: "bg-blue-100 text-blue-700",
  Web: "bg-stone-200 text-stone-700",
  Gmail: "bg-red-100 text-red-600",
};

const STATUS_LABELS: Record<ConversationStatus, string> = {
  open: "Abierta",
  pending: "Pendiente",
  resolved: "Resuelta",
  snoozed: "Pospuesta",
};

const STATUS_STYLES: Record<ConversationStatus, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-green-50 text-green-700 border-green-200",
  snoozed: "bg-violet-50 text-violet-700 border-violet-200",
};

const PRIORITY_LABELS: Record<ConversationPriority, string> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

const PRIORITY_DOT: Record<ConversationPriority, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-400",
};

function getInitial(name?: string): string {
  const trimmed = (name || "C").trim();
  return trimmed.charAt(0).toUpperCase();
}

function channelKey(channel: string): keyof typeof CHANNEL_COLORS {
  const lower = channel.toLowerCase();
  if (lower === "whatsapp") return "WhatsApp";
  if (lower === "instagram") return "Instagram";
  if (lower === "facebook") return "Facebook";
  if (lower === "gmail") return "Gmail";
  return "Web";
}

function ContactAvatar({
  name,
  avatarUrl,
  channel,
  size = "md",
}: {
  name?: string;
  avatarUrl?: string;
  channel: string;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "w-12 h-12 text-base" : "w-14 h-14 text-lg";
  if (avatarUrl) {
    return (
      <img
        alt={name || "contacto"}
        className={`${sizeClass} rounded-2xl object-cover shadow-xs border border-stone-100`}
        src={avatarUrl}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div
      className={`${sizeClass} rounded-2xl flex items-center justify-center shadow-xs border border-stone-100 font-serif font-bold ${CHANNEL_COLORS[channelKey(channel)] || CHANNEL_COLORS.Web}`}
    >
      {getInitial(name)}
    </div>
  );
}

interface MessagingViewProps {
  chatThreads: ChatThread[];
  onUpdateThreads: React.Dispatch<React.SetStateAction<ChatThread[]>>;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
}

function messagesEqual(a: ChatMessage[], b: ChatMessage[]) {
  if (a.length !== b.length) return false;
  return a.every((m, i) => m.id === b[i].id && m.text === b[i].text);
}

export function MessagingView({
  chatThreads,
  onUpdateThreads,
  activeChatId,
  setActiveChatId,
}: MessagingViewProps) {
  const [filter, setFilter] = useState<"Todos" | "WhatsApp" | "Instagram" | "Facebook" | "Web" | "Gmail" | string>("Todos");
  const [statusFilters, setStatusFilters] = useState<ConversationStatus[]>([]);
  const [priorityFilters, setPriorityFilters] = useState<ConversationPriority[]>([]);
  const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string>("");
  const [openMenu, setOpenMenu] = useState<null | "status" | "priority" | "snooze">(null);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [customSnooze, setCustomSnooze] = useState<string>("");
  const [cannedResponses, setCannedResponses] = useState<chatwootService.CannedResponse[]>([]);
  const [isSendingAttachment, setIsSendingAttachment] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeChatIdRef = useRef<string | null>(activeChatId);
  activeChatIdRef.current = activeChatId;

  // Close menus on outside click
  useEffect(() => {
    if (!openMenu) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setConfirmDelete(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [openMenu]);

  // Close filter popup on outside click
  useEffect(() => {
    if (!showFilters) return;
    const onDoc = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [showFilters]);

  // Load canned responses once on mount
  useEffect(() => {
    let active = true;
    chatwootService.listCannedResponses().then((items) => {
      if (active) setCannedResponses(items);
    });
    return () => {
      active = false;
    };
  }, []);

  // Inbox poll: refresh conversation list every 10s, preserving loaded messages.
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const incoming = await chatwootService.listConversations();
        if (!active) return;
        onUpdateThreads((prev) => {
          const prevById = new Map<string, ChatThread>();
          prev.forEach((t) => prevById.set(t.id, t));
          return incoming.map((t) => {
            const prevThread = prevById.get(t.id);
            const isOpen = activeChatIdRef.current === t.id;
            return {
              ...t,
              unread: isOpen ? false : t.unread,
              messages: prevThread && prevThread.messages.length > 0 ? prevThread.messages : t.messages,
            };
          });
        });
      } catch (err) {
        console.warn("[MessagingView] Inbox poll failed:", err);
      }
    };
    load();
    const interval = setInterval(load, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [onUpdateThreads]);

  const activeThread = chatThreads.find((t) => t.id === activeChatId) || null;

  // Active conversation messages poll: refresh every 3s while a thread is open.
  useEffect(() => {
    if (!activeChatId) return;
    let active = true;
    const load = async () => {
      try {
        const fetched = await chatwootService.listMessages(activeChatId);
        if (!active) return;
        onUpdateThreads((prev) =>
          prev.map((t) => {
            if (t.id !== activeChatId) return t;
            if (messagesEqual(t.messages, fetched)) return t;
            return { ...t, messages: fetched };
          })
        );
      } catch (err) {
        console.warn("[MessagingView] Messages poll failed:", err);
      }
    };
    load();
    const interval = setInterval(load, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [activeChatId, onUpdateThreads]);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages]);

  // Mark active thread as read locally when opening
  useEffect(() => {
    if (!activeThread || !activeThread.unread) return;
    onUpdateThreads((prev) =>
      prev.map((t) => (t.id === activeThread.id ? { ...t, unread: false } : t))
    );
  }, [activeChatId]);

  const filteredThreads = chatThreads.filter((t) => {
    const matchesChannel = filter === "Todos" ? true : t.channel.toLowerCase() === filter.toLowerCase();
    const matchesStatus = statusFilters.length === 0 ? true : statusFilters.includes(t.status as ConversationStatus);
    const matchesPriority = priorityFilters.length === 0 ? true : !!t.priority && priorityFilters.includes(t.priority);
    const matchesUnread = showUnreadOnly ? t.unread : true;
    const contact = t.contactName || t.ownerName || "";
    const matchesSearch =
      searchQuery.trim() === ""
        ? true
        : contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.lastMessageText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChannel && matchesStatus && matchesPriority && matchesUnread && matchesSearch;
  });

  const countByChannel = (channelName: string) => {
    if (channelName === "Todos") return chatThreads.length;
    return chatThreads.filter((t) => t.channel.toLowerCase() === channelName.toLowerCase()).length;
  };

  const activeFilterCount =
    statusFilters.length + priorityFilters.length + (showUnreadOnly ? 1 : 0);

  const unreadCount = chatThreads.filter((t) => t.unread).length;

  const toggleStatusFilter = (s: ConversationStatus) => {
    setStatusFilters((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };
  const togglePriorityFilter = (p: ConversationPriority) => {
    setPriorityFilters((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };
  const clearFilters = () => {
    setStatusFilters([]);
    setPriorityFilters([]);
    setShowUnreadOnly(false);
  };

  const getThreadHashId = (id: string, channel: string) => {
    const num = id.replace(/\D/g, "") || "0";
    const ch = channel.toLowerCase();
    if (ch === "whatsapp") return `#W-${num}`;
    if (ch === "instagram") return `#I-${num}`;
    if (ch === "facebook") return `#F-${num}`;
    if (ch === "gmail") return `#G-${num}`;
    return `#WB-${num}`;
  };

  const handleSendMessage = async () => {
    const textToSend = inputText.trim();
    if (!textToSend || !activeThread || isSending) return;

    setInputText("");
    setIsSending(true);
    setSendError("");
    try {
      await chatwootService.sendMessage(activeThread.id, textToSend);
      const fetched = await chatwootService.listMessages(activeThread.id);
      onUpdateThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? { ...t, messages: fetched, lastMessageText: textToSend, lastMessageTime: "Ahora" }
            : t
        )
      );
    } catch (err) {
      console.error("[MessagingView] Error sending message:", err);
      setInputText(textToSend);
      setSendError(err instanceof Error ? err.message : "No se pudo enviar el mensaje.");
    } finally {
      setIsSending(false);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file || !activeThread || isSendingAttachment) return;
    setIsSendingAttachment(true);
    try {
      await chatwootService.sendAttachment(activeThread.id, file);
      const fetched = await chatwootService.listMessages(activeThread.id);
      onUpdateThreads((prev) =>
        prev.map((t) => (t.id === activeThread.id ? { ...t, messages: fetched } : t))
      );
    } catch (err) {
      console.error("[MessagingView] Error sending attachment:", err);
      setSendError(err instanceof Error ? err.message : "No se pudo enviar el archivo.");
    } finally {
      setIsSendingAttachment(false);
    }
  };

  const insertCanned = (content: string) => {
    setInputText(content);
    setSendError("");
  };

  const updateStatus = async (status: ConversationStatus, snoozedUntil?: number) => {
    if (!activeThread) return;
    setOpenMenu(null);
    try {
      await chatwootService.updateConversationStatus(activeThread.id, status, snoozedUntil);
      onUpdateThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? { ...t, status, resolved: status === "resolved", snoozedUntil: snoozedUntil ? String(snoozedUntil) : null }
            : t
        )
      );
    } catch (err) {
      console.error("[MessagingView] Error updating status:", err);
    }
  };

  const updatePriority = async (priority: ConversationPriority | null) => {
    if (!activeThread) return;
    setOpenMenu(null);
    try {
      await chatwootService.updateConversationPriority(activeThread.id, priority);
      onUpdateThreads((prev) =>
        prev.map((t) => (t.id === activeThread.id ? { ...t, priority } : t))
      );
    } catch (err) {
      console.error("[MessagingView] Error updating priority:", err);
    }
  };

  const handleDelete = async () => {
    if (!activeThread) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      window.setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    try {
      await chatwootService.deleteConversation(activeThread.id);
      onUpdateThreads((prev) => prev.filter((t) => t.id !== activeThread.id));
      setActiveChatId(null);
      setConfirmDelete(false);
      setOpenMenu(null);
    } catch (err) {
      console.error("[MessagingView] Error deleting conversation:", err);
      setConfirmDelete(false);
    }
  };

  const snoozePresets = (): { label: string; value: number | undefined }[] => {
    const now = new Date();
    return [
      { label: "Hasta la siguiente respuesta", value: undefined },
      {
        label: "Hasta mañana",
        value: Math.floor(
          (() => {
            const d = new Date(now);
            d.setDate(d.getDate() + 1);
            d.setHours(9, 0, 0, 0);
            return d.getTime();
          })() / 1000
        ),
      },
      {
        label: "Próxima semana",
        value: Math.floor(
          (() => {
            const d = new Date(now);
            d.setDate(d.getDate() + 7);
            return d.getTime();
          })() / 1000
        ),
      },
      {
        label: "Próximo mes",
        value: Math.floor(
          (() => {
            const d = new Date(now);
            d.setMonth(d.getMonth() + 1);
            return d.getTime();
          })() / 1000
        ),
      },
    ];
  };

  const applyCustomSnooze = async () => {
    if (!customSnooze) return;
    const ts = Math.floor(new Date(customSnooze).getTime() / 1000);
    await updateStatus("snoozed", ts);
    setCustomSnooze("");
  };

  return (
    <div className="h-[calc(100vh-160px)] max-w-container-max mx-auto flex overflow-hidden rounded-[2.5rem] border border-[#cf9681]/25 bg-stone-50 shadow-sm relative">
      {/* Conversation sidebar / inbox */}
      <aside
        className={`${
          activeChatId ? "hidden md:flex" : "flex"
        } w-full md:w-[380px] flex-shrink-0 flex-col border-r border-[#cf9681]/15 bg-[#fbf9f6]`}
      >
        <header className="bg-white/85 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#cf9681] text-white font-serif text-lg font-bold">
              L
            </div>
            <div className="text-left">
              <h1 className="font-serif text-lg font-bold text-stone-700 tracking-tight leading-tight">Le Petit Can</h1>
              <p className="text-[10px] font-sans text-stone-500 font-bold tracking-tight">Bandeja omnicanal</p>
            </div>
          </div>

          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-1 px-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800 rounded-full transition-colors cursor-pointer"
            title="Buscar conversaciones"
          >
            <span className="material-symbols-outlined text-lg">search</span>
          </button>
        </header>

        {showSearch && (
          <div className="bg-white px-4 py-3 border-b border-stone-200/60">
            <div className="flex items-center gap-2 bg-stone-50 px-3 py-2 rounded-2xl border border-stone-200">
              <span className="material-symbols-outlined text-stone-400 text-sm">search</span>
              <input
                type="text"
                placeholder="Buscar por contacto o mensaje..."
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

        {/* Filter button + popup */}
        <div className="px-4 py-2 border-b border-stone-200/50 bg-white relative" ref={filterRef}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-sans text-xs font-bold transition-all cursor-pointer border ${
              activeFilterCount > 0
                ? "bg-[#cf9681] text-white border-[#cf9681]"
                : "bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200/60"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">filter_list</span>
            Filtrar
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-[#cf9681] flex items-center justify-center text-[9px] font-black">
                {activeFilterCount}
              </span>
            )}
          </button>

          {showFilters && (
            <div className="absolute left-4 top-full mt-2 w-64 bg-white rounded-2xl border border-stone-200 shadow-xl z-50 p-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-2">Estado</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(["open", "pending", "snoozed", "resolved"] as ConversationStatus[]).map((st) => {
                  const active = statusFilters.includes(st);
                  return (
                    <button
                      key={st}
                      onClick={() => toggleStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-full font-sans text-[11px] font-bold border transition-all cursor-pointer ${
                        active ? "bg-stone-700 text-white border-stone-700" : "bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100"
                      }`}
                    >
                      {STATUS_LABELS[st]}
                    </button>
                  );
                })}
              </div>

              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-2">Urgencia</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(Object.keys(PRIORITY_LABELS) as ConversationPriority[]).map((p) => {
                  const active = priorityFilters.includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => togglePriorityFilter(p)}
                      className={`px-2.5 py-1 rounded-full font-sans text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        active ? "bg-stone-700 text-white border-stone-700" : "bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[p]}`} />
                      {PRIORITY_LABELS[p]}
                    </button>
                  );
                })}
              </div>

              <label
                className={`flex items-center gap-2 cursor-pointer select-none rounded-xl border px-3 py-2 ${
                  showUnreadOnly ? "bg-[#cf9681]/5 border-[#cf9681]/40" : "border-stone-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={showUnreadOnly}
                  onChange={(e) => setShowUnreadOnly(e.target.checked)}
                  className="accent-[#cf9681]"
                />
                <span className="font-sans text-[11px] font-semibold text-stone-700">
                  Solo no leídos {unreadCount > 0 ? `(${unreadCount})` : ""}
                </span>
              </label>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-3 w-full py-1.5 rounded-lg text-[11px] font-bold text-stone-500 hover:bg-stone-100 cursor-pointer"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
          {filteredThreads.map((thread) => {
            const isSelected = activeChatId === thread.id;
            const threadHash = getThreadHashId(thread.id, thread.channel);
            const status = thread.status || "open";

            return (
              <div
                key={thread.id}
                onClick={() => setActiveChatId(thread.id)}
                className={`group flex items-center p-4 rounded-[32px] cursor-pointer transition-all duration-300 border ${
                  isSelected
                    ? "bg-white border-[#cf9681]/45 shadow-[0_4px_20px_rgba(117,88,72,0.06)] scale-[0.99]"
                    : "bg-white/80 border-stone-100/80 shadow-[0_4px_15px_rgba(117,88,72,0.02)] hover:bg-white hover:border-stone-200/85"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <ContactAvatar
                    name={thread.contactName || thread.ownerName}
                    avatarUrl={thread.avatarUrl}
                    channel={thread.channel}
                  />
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
                      {thread.contactName || thread.ownerName}
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
                    <span className={`px-1.5 py-0.2 border text-[8px] font-bold rounded ${STATUS_STYLES[status]}`}>
                      {STATUS_LABELS[status]}
                    </span>
                    {thread.priority && (
                      <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[thread.priority]}`} title={`Prioridad ${PRIORITY_LABELS[thread.priority]}`} />
                    )}
                  </div>
                </div>

                {thread.unread && (
                  <div className="w-3 h-3 rounded-full bg-[#cf9681] shadow-xs shadow-[#cf9681]/40 shrink-0 ml-1"></div>
                )}
              </div>
            );
          })}

          {filteredThreads.length === 0 && (
            <div className="text-center py-10 px-4">
              <span className="material-symbols-outlined text-4xl text-stone-300">forum</span>
              <p className="text-xs text-stone-400 mt-2 font-medium">
                {chatThreads.length === 0
                  ? "No hay conversaciones todavía."
                  : "No se encontraron conversaciones con este filtro."}
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Chat thread panel */}
      <section
        className={`${
          activeChatId ? "flex" : "hidden md:flex"
        } flex-1 flex-col bg-stone-50 relative overflow-hidden h-full`}
      >
        {activeThread ? (
          <>
            <div className="p-4 md:p-6 flex justify-between items-center bg-white/75 backdrop-blur-md z-10 border-b border-stone-200">
              <div className="flex items-center gap-4 text-left">
                <button
                  onClick={() => setActiveChatId(null)}
                  className="md:hidden text-stone-700 p-1 hover:bg-stone-100 rounded-full cursor-pointer flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-xl font-bold">arrow_back</span>
                </button>

                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-stone-200 shadow-xs">
                  <ContactAvatar
                    name={activeThread.contactName || activeThread.ownerName}
                    avatarUrl={activeThread.avatarUrl}
                    channel={activeThread.channel}
                    size="sm"
                  />
                </div>
                <div>
                  <h2 className="font-serif text-base md:text-lg font-bold text-stone-800 leading-none">
                    {activeThread.contactName || activeThread.ownerName}
                  </h2>
                  <span className="font-sans text-[10px] text-stone-500 flex items-center gap-1 mt-1 font-semibold">
                    Canal {activeThread.channel} • {STATUS_LABELS[activeThread.status || "open"]}
                    {activeThread.priority && (
                      <>
                        {" "}• <span className={`inline-block w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[activeThread.priority]}`} /> {PRIORITY_LABELS[activeThread.priority]}
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Conversation actions */}
              <div className="flex items-center gap-2 relative" ref={menuRef}>
                <button
                  onClick={() => setOpenMenu(openMenu === "status" ? null : "status")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-sans text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer border ${
                    (activeThread.status || "open") === "resolved"
                      ? "bg-stone-100 text-stone-600 border-stone-300/60 hover:bg-stone-200/80"
                      : `bg-stone-100 text-stone-600 border-stone-300/60 hover:bg-stone-200/80`
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">label</span>
                  <span>Estado: {STATUS_LABELS[activeThread.status || "open"]}</span>
                </button>

                <button
                  onClick={() => setOpenMenu(openMenu === "priority" ? null : "priority")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full font-sans text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer border bg-stone-100 text-stone-600 border-stone-300/60 hover:bg-stone-200/80"
                >
                  <span className="material-symbols-outlined text-[13px]">flag</span>
                  <span>Urgencia: {activeThread.priority ? PRIORITY_LABELS[activeThread.priority] : "Ninguna"}</span>
                </button>

                <button
                  onClick={handleDelete}
                  className={`flex items-center justify-center w-9 h-9 rounded-full transition-all cursor-pointer border ${
                    confirmDelete ? "bg-red-600 text-white border-red-600" : "bg-stone-100 text-stone-500 border-stone-200 hover:text-red-600"
                  }`}
                  title={confirmDelete ? "¿Confirmar borrado permanente?" : "Eliminar conversación"}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {confirmDelete ? "warning" : "delete"}
                  </span>
                </button>

                {openMenu === "status" && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl border border-stone-200 shadow-xl z-50 p-1.5">
                    {(["open", "pending", "resolved"] as ConversationStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => updateStatus(st)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-stone-50 text-left font-sans text-xs font-semibold text-stone-700 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px] text-stone-400">
                          {st === "open" ? "chat" : st === "pending" ? "hourglass_top" : "check_circle"}
                        </span>
                        {STATUS_LABELS[st]}
                      </button>
                    ))}
                    <div className="my-1 border-t border-stone-100" />
                    <button
                      onClick={() => setOpenMenu("snooze")}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-stone-50 text-left font-sans text-xs font-semibold text-stone-700 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[15px] text-violet-500">snooze</span>
                        Posponer
                      </span>
                      <span className="material-symbols-outlined text-[15px] text-stone-300">chevron_right</span>
                    </button>
                  </div>
                )}

                {openMenu === "snooze" && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-stone-200 shadow-xl z-50 p-1.5">
                    <p className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-stone-400">Posponer hasta</p>
                    {snoozePresets().map((p) => (
                      <button
                        key={p.label}
                        onClick={() => updateStatus("snoozed", p.value)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-stone-50 text-left font-sans text-xs font-semibold text-stone-700 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px] text-stone-400">schedule</span>
                        {p.label}
                      </button>
                    ))}
                    <div className="my-1 border-t border-stone-100 px-3 pt-2">
                      <input
                        type="datetime-local"
                        value={customSnooze}
                        onChange={(e) => setCustomSnooze(e.target.value)}
                        className="w-full text-[11px] font-sans border border-stone-200 rounded-lg px-2 py-1.5 text-stone-600 focus:outline-none focus:border-[#cf9681]"
                      />
                      <button
                        onClick={applyCustomSnooze}
                        disabled={!customSnooze}
                        className={`mt-1.5 w-full py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                          customSnooze ? "bg-[#cf9681] text-white" : "bg-stone-100 text-stone-300"
                        }`}
                      >
                        Posponer
                      </button>
                    </div>
                  </div>
                )}

                {openMenu === "priority" && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl border border-stone-200 shadow-xl z-50 p-1.5">
                    {(Object.keys(PRIORITY_LABELS) as ConversationPriority[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => updatePriority(p)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-stone-50 text-left font-sans text-xs font-semibold text-stone-700 cursor-pointer"
                      >
                        <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[p]}`} />
                        {PRIORITY_LABELS[p]}
                      </button>
                    ))}
                    <div className="my-1 border-t border-stone-100" />
                    <button
                      onClick={() => updatePriority(null)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-stone-50 text-left font-sans text-xs font-semibold text-stone-500 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px] text-stone-400">block</span>
                      Sin prioridad
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 flex flex-col bg-[#fdfcfb]">
              <div className="flex justify-center my-2">
                <span className="px-4 py-1 bg-stone-100 rounded-full font-sans text-[9px] font-black text-stone-500 uppercase tracking-widest border border-stone-200/50">
                  Canal de entrada directo • {getThreadHashId(activeThread.id, activeThread.channel)}
                </span>
              </div>

              {activeThread.messages.map((msg) => {
                if (msg.sender === "system") {
                  return (
                    <div key={msg.id} className="flex justify-center my-1">
                      <span className="max-w-[85%] px-3 py-1.5 rounded-full bg-stone-100/80 text-stone-400 text-[10px] font-semibold text-center border border-stone-200/50">
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                const isMe = msg.sender === "me";
                const isDeleted = !!msg.deleted;
                const isFailed = !!msg.failed && !isDeleted;

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-[85%] sm:max-w-[70%] ${
                      isMe ? "self-end flex-row-reverse" : "self-start text-left"
                    }`}
                  >
                    <div className="flex-1">
                      <div
                        className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed text-left ${
                          isDeleted
                            ? "bg-stone-50 text-stone-400 border border-dashed border-stone-300 rounded-br-[4px]"
                            : isMe
                            ? "bg-[#cf9681] text-white rounded-br-[4px] shadow-xs"
                            : "bg-stone-100 text-stone-800 rounded-bl-[4px] shadow-3xs"
                        }`}
                      >
                        {isDeleted ? (
                          <span className="italic flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">delete_outline</span>
                            {msg.text || "Este mensaje se ha eliminado"}
                          </span>
                        ) : msg.stickerUrl ? (
                          <img src={msg.stickerUrl} alt="sticker" className="max-w-[140px] rounded-none" />
                        ) : (
                          <>
                            {msg.imageUrl && !msg.attachments?.length ? (
                              <img src={msg.imageUrl} alt="" className="rounded-xl max-w-[220px] object-cover" />
                            ) : null}
                            {msg.text ? <span className="whitespace-pre-wrap break-words">{msg.text}</span> : null}
                            {(msg.attachments || []).map((a, i) =>
                              a.fileType === "image" ? (
                                <img key={i} src={a.dataUrl} alt="" className={`rounded-xl max-w-[220px] object-cover ${msg.text ? "mt-1.5" : ""}`} />
                              ) : a.fileType === "video" ? (
                                <video key={i} src={a.dataUrl} controls className={`rounded-xl max-w-[220px] ${msg.text ? "mt-1.5" : ""}`} />
                              ) : a.fileType === "audio" ? (
                                <audio key={i} src={a.dataUrl} controls className={`mt-1.5 max-w-[220px]`} />
                              ) : a.fileType === "file" && a.dataUrl ? (
                                <a
                                  key={i}
                                  href={a.dataUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`flex items-center gap-2 underline ${isMe ? "text-white" : "text-[#cf9681]"} ${msg.text ? "mt-1.5" : ""}`}
                                >
                                  <span className="material-symbols-outlined text-[16px]">download</span>
                                  Descargar archivo
                                </a>
                              ) : null
                            )}
                          </>
                        )}
                      </div>
                      <span
                        className={`font-sans text-[9px] text-stone-400 mt-1 block ${
                          isMe ? "text-right mr-1" : "text-left ml-1"
                        }`}
                      >
                        {msg.time}
                        {isFailed && (
                          <span
                            className="ml-1.5 inline-flex items-center gap-0.5 text-red-500 font-bold"
                            title={msg.externalError || "El envío falló"}
                          >
                            <span className="material-symbols-outlined text-[11px]">error</span>
                            No enviado
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
              {activeThread.messages.length === 0 && (
                <p className="text-center text-xs text-stone-400 py-8">No hay mensajes todavía en esta conversación.</p>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-[#fbf9f6] border-t border-[#cf9681]/15">
              <div className="max-w-3xl mx-auto">
                {cannedResponses.length > 0 && (
                  <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
                    {cannedResponses.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => insertCanned(c.content)}
                        title={c.shortCode}
                        className="shrink-0 px-3 py-1.5 rounded-full bg-white border border-stone-200 text-[11px] font-semibold text-stone-600 hover:border-[#cf9681] hover:text-[#cf9681] transition-colors cursor-pointer"
                      >
                        {c.shortCode}
                      </button>
                    ))}
                  </div>
                )}
                {activeThread.canReply === false && (
                  <div className="mb-2 flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-2">
                    <span className="material-symbols-outlined text-base">schedule</span>
                    <p className="text-[11px] leading-snug">
                      Fuera de la ventana de 24 h de {activeThread.channel}. Es posible que el mensaje no se entregue a menos que utilices una plantilla.
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
                />
                <div className="flex items-center gap-2 bg-white p-2 rounded-[32px] shadow-sm border border-stone-200">
                  <button
                    onClick={handleAttachClick}
                    disabled={isSendingAttachment}
                    className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-stone-400 hover:text-[#cf9681] hover:bg-stone-50 rounded-full transition-colors cursor-pointer disabled:opacity-40"
                    title="Adjuntar archivo"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {isSendingAttachment ? "hourglass_top" : "add_circle"}
                    </span>
                  </button>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      if (sendError) setSendError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendMessage();
                    }}
                    className="w-full border-none focus:outline-none focus:ring-0 font-sans text-xs sm:text-sm text-stone-700 py-2 px-2 bg-transparent placeholder:text-stone-400"
                    placeholder="Escribe tu respuesta aquí..."
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() || isSending}
                    className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full transition-all active:scale-90 cursor-pointer ${
                      inputText.trim() && !isSending
                        ? "bg-[#cf9681] text-white shadow-md"
                        : "bg-stone-100 text-stone-300"
                    }`}
                    title="Enviar respuesta"
                  >
                    <span className="material-symbols-outlined text-lg">send</span>
                  </button>
                </div>
                {sendError && (
                  <p className="text-[11px] text-red-600 mt-2 px-2 text-left">{sendError}</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-stone-400 bg-[#fdfcfb]">
            <span className="material-symbols-outlined text-5xl text-[#cf9681]/40 animate-bounce">forum</span>
            <p className="mt-4 font-serif text-base font-bold text-stone-700">Bandeja omnicanal</p>
            <p className="text-[11px] text-stone-400 max-w-sm px-6 mt-1 text-center">
              Selecciona una conversación para ver y responder los mensajes reales de tus clientes.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}