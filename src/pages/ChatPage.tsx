import { useState, useRef, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import { MessageCircle, Send, User, Globe, Users, Clock, Shield } from "lucide-react";

const countryOptions = [
  { value: "", label: "No flag" },
  { value: "Czechia", label: "Czechia" },
  { value: "Slovakia", label: "Slovakia" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "Germany", label: "Germany" },
  { value: "Netherlands", label: "Netherlands" },
  { value: "Other", label: "Other" },
];

const countryCodes: Record<string, string> = {
  "Czechia": "CZ", "Slovakia": "SK", "United Kingdom": "UK",
  "Germany": "DE", "Netherlands": "NL", "Other": "??",
};
const countryColors: Record<string, string> = {
  "Czechia": "text-blue-700 bg-blue-50",
  "Slovakia": "text-sky-700 bg-sky-50",
  "United Kingdom": "text-indigo-700 bg-indigo-50",
  "Germany": "text-amber-700 bg-amber-50",
  "Netherlands": "text-orange-700 bg-orange-50",
  "Other": "text-slate-600 bg-slate-100",
};

export default function ChatPage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [userCountry, setUserCountry] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, refetch } = trpc.chat.list.useQuery({ limit: 100 });
  const sendMutation = trpc.chat.send.useMutation({
    onSuccess: () => { setMessage(""); refetch(); },
  });

  useEffect(() => {
    const interval = setInterval(() => refetch(), 5000);
    return () => clearInterval(interval);
  }, [refetch]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [data?.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && message.trim()) {
      sendMutation.mutate({ displayName: name.trim(), message: message.trim(), country: userCountry || undefined });
    }
  };

  const formatTime = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  type ChatMsg = { id: number; displayName: string; message: string; country: string | null; sentAt: Date | null };
  const grouped: { date: string; items: ChatMsg[] }[] = [];
  if (data?.messages) {
    let currentDate = "", currentGroup: ChatMsg[] = [];
    for (const msg of data.messages) {
      const d = new Date(msg.sentAt || 0);
      const today = new Date();
      const label = d.toDateString() === today.toDateString() ? "Today" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      if (label !== currentDate) {
        if (currentGroup.length) grouped.push({ date: currentDate, items: currentGroup });
        currentDate = label; currentGroup = [msg as ChatMsg];
      } else { currentGroup.push(msg as ChatMsg); }
    }
    if (currentGroup.length) grouped.push({ date: currentDate, items: currentGroup });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-amber-600" />
          <h1 className="text-lg font-bold text-slate-900">Alert Chat</h1>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{data?.total || 0} msgs</span>
          <span className="hidden sm:inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" style={{ animationDuration: "3s" }} />Live</span>
        </div>
      </div>

      <div className="flex-1 glass-card overflow-y-auto mb-4 p-4 scrollbar-light">
        {isLoading ? (
          <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" /></div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Shield className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm text-slate-600">Chat room is empty. Be the first to share a warning.</p>
            <p className="text-xs text-slate-400 mt-1">All messages are public and real-time.</p>
          </div>
        ) : (
          grouped.map((group, gi) => (
            <div key={gi}>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{group.date}</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              {group.items.map((msg) => (
                <div key={msg.id} className="flex gap-3 mb-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-slate-200 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">{msg.displayName}</span>
                      {msg.country && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 ${countryColors[msg.country] || "text-slate-600 bg-slate-100"}`}>
                          {countryCodes[msg.country] || msg.country}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">{formatTime(msg.sentAt)}</span>
                    </div>
                    <div className="bg-slate-100 px-3 py-2">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{msg.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex-shrink-0 glass-card p-3">
        <div className="flex gap-2 mb-2">
          <div className="relative flex-1">
            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required
              className="w-full pl-8 pr-3 py-2 glass-input outline-none text-slate-900 text-sm placeholder:text-slate-400" />
          </div>
          <div className="relative w-40">
            <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select value={userCountry} onChange={(e) => setUserCountry(e.target.value)}
              className="w-full pl-8 pr-2 py-2 glass-input outline-none text-slate-900 text-sm appearance-none bg-white/60">
              {countryOptions.map((c) => <option key={c.value || "none"} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <input type="text" value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Share a warning, ask a question..." required
            className="flex-1 px-3 py-2 glass-input outline-none text-slate-900 text-sm placeholder:text-slate-400" />
          <button type="submit" disabled={sendMutation.isPending || !name.trim() || !message.trim()}
            className="bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-semibold px-4 py-2 flex items-center gap-1.5 text-sm transition-all">
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
      </form>
    </div>
  );
}
