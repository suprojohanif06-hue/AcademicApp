"use client";

import { useState } from "react";

type Message = { role: "user" | "hermes"; text: string; time: string };

const suggestions = [
  "Buatkan rangkuman catatan K3 hari ini",
  "Apa saja tugas yang mendekati deadline?",
  "Tambahkan tugas: review MSDS Rabu depan",
  "Cek jadwal kuliah minggu ini",
];

const initialMessages: Message[] = [
  {
    role: "hermes",
    text: "Halo Hanif! Saya Hermes, asisten akademik AI kamu. Saya bisa membantu mencatat, merangkum materi K3, mengecek jadwal & tugas, atau membuat draft catatan di Google Drive kamu. Apa yang bisa saya bantu hari ini? 🎓",
    time: "sekarang",
  },
];

export default function HermesPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", text, time: "baru saja" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulated Hermes response
    setTimeout(() => {
      const hermesMsg: Message = {
        role: "hermes",
        text: `Baik! Saya sedang memproses permintaan: "${text}". Fitur ini akan aktif setelah koneksi ke Gemini API dikonfigurasi di .env.local. Saya siap membantu kapanpun! ⚡`,
        time: "baru saja",
      };
      setMessages((prev) => [...prev, hermesMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 flex flex-col" style={{ height: "calc(100dvh - 56px - 72px)" }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4 animate-slide-up">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)" }}
        >
          <span className="material-symbols-outlined icon-filled text-white" style={{ fontSize: "24px" }}>smart_toy</span>
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>Hermes</h2>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#22c55e" }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#22c55e" }} />
            </span>
            <span className="text-xs font-mono" style={{ color: "var(--color-on-surface-variant)" }}>Academic AI Sidekick • Online</span>
          </div>
        </div>

        {/* Capabilities chips */}
        <div className="ml-auto flex gap-1.5 flex-wrap justify-end">
          {["Voice", "Drive", "GCal"].map((cap) => (
            <span key={cap} className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold" style={{ background: "var(--color-surface-container)", color: "var(--color-on-surface-variant)", border: "1px solid var(--color-outline-variant)" }}>
              {cap}
            </span>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-2 animate-fade-in">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "hermes" && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mr-2 mt-1" style={{ background: "var(--color-primary)" }}>
                <span className="material-symbols-outlined icon-filled text-white" style={{ fontSize: "14px" }}>smart_toy</span>
              </div>
            )}
            <div
              className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
              style={{
                background: msg.role === "user" ? "var(--color-primary)" : "white",
                color: msg.role === "user" ? "var(--color-on-primary)" : "var(--color-on-surface)",
                border: msg.role === "hermes" ? "1px solid var(--color-outline-variant)" : "none",
                borderRadius: msg.role === "user" ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
              }}
            >
              {msg.text}
              <p className="text-[10px] mt-1.5 opacity-50 font-mono">{msg.time}</p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--color-primary)" }}>
              <span className="material-symbols-outlined icon-filled text-white" style={{ fontSize: "14px" }}>smart_toy</span>
            </div>
            <div className="px-4 py-3 rounded-2xl flex items-center gap-1" style={{ background: "white", border: "1px solid var(--color-outline-variant)" }}>
              {[0, 1, 2].map((d) => (
                <span key={d} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--color-on-surface-variant)", animationDelay: `${d * 150}ms` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick suggestion chips */}
      <div className="flex gap-2 overflow-x-auto py-2 mb-2 shrink-0">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => sendMessage(s)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all hover:opacity-80 active:scale-95"
            style={{ background: "var(--color-surface-container)", color: "var(--color-on-surface-variant)", border: "1px solid var(--color-outline-variant)" }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div
        className="flex items-center gap-2 p-2 rounded-2xl shrink-0"
        style={{ background: "white", border: "1px solid var(--color-outline-variant)", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
      >
        {/* Voice button */}
        <button
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all hover:opacity-80 active:scale-90"
          style={{ background: "var(--color-pastel-peach)", color: "var(--color-primary)" }}
          aria-label="Voice input"
        >
          <span className="material-symbols-outlined icon-filled" style={{ fontSize: "18px" }}>mic</span>
        </button>

        <input
          type="text"
          placeholder="Tanya Hermes sesuatu..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-sans)" }}
        />

        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim()}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all hover:opacity-90 active:scale-90 disabled:opacity-30"
          style={{ background: "var(--color-primary)", color: "var(--color-on-primary)" }}
          aria-label="Send"
        >
          <span className="material-symbols-outlined icon-filled" style={{ fontSize: "18px" }}>arrow_upward</span>
        </button>
      </div>
    </div>
  );
}
