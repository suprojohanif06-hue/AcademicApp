"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export function HermesButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "hermes"; text: string }[]>([
    { role: "hermes", text: "Halo, Scholar! Ada yang bisa Hermes bantu hari ini?" },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isTyping, open]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const msg = inputText.trim();
    setInputText("");
    setChatHistory((prev) => [...prev, { role: "user", text: msg }]);
    setIsTyping(true);

    const lowerMsg = msg.toLowerCase();

    setTimeout(() => {
      setIsTyping(false);
      
      const jumpMatch = lowerMsg.match(/(?:jump to|buka|ke) (?:page|halaman) (\d+)/i);
      
      if (jumpMatch) {
        const page = jumpMatch[1];
        setChatHistory((prev) => [
          ...prev,
          { role: "hermes", text: `Jumping to page ${page}...` },
        ]);
        setTimeout(() => {
          setOpen(false);
          router.push(`/study?page=${page}`);
        }, 1000);
      } else if (lowerMsg.includes("uu 1/1970") && lowerMsg.includes("halaman 5")) {
        setChatHistory((prev) => [
          ...prev,
          { role: "hermes", text: "Membuka UU No. 1 Tahun 1970 Halaman 5..." },
        ]);
        setTimeout(() => {
          setOpen(false);
          router.push("/study?material=uu-1-1970&page=5");
        }, 1000);
      } else {
        setChatHistory((prev) => [
          ...prev,
          { role: "hermes", text: `Baik, saya telah memproses perintah: "${msg}". Draft dokumen telah diperbarui!` },
        ]);
      }
    }, 1200);
  };

  const handleActionClick = (label: string) => {
    if (label === "New Note") {
      setOpen(false);
      router.push("/study");
    } else if (label === "Add Task") {
      setOpen(false);
      router.push("/tasks?action=new");
    } else if (label === "Check Schedule") {
      setOpen(false);
      router.push("/courses");
    } else if (label === "Voice Note") {
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        setInputText("Tolong buatkan ringkasan materi K3 dari PDF bab 2");
      }, 2000);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        id="hermes-fab"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-90 hover:scale-105"
        style={{
          background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
          color: "var(--color-on-primary)",
          boxShadow: "0 8px 32px rgba(28,28,26,0.25)",
        }}
        aria-label="Ask Hermes"
      >
        <span className="material-symbols-outlined icon-filled" style={{ fontSize: "26px" }}>smart_toy</span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center animate-fade-in"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg mx-4 mb-4 md:mb-0 rounded-2xl p-6 animate-slide-up flex flex-col"
            style={{ background: "var(--color-surface-container-lowest)", border: "1px solid var(--color-outline-variant)", maxHeight: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 shrink-0">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)" }}
              >
                <span className="material-symbols-outlined icon-filled text-white" style={{ fontSize: "20px" }}>smart_toy</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-bold truncate" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>Hermes</h3>
                <p className="text-xs truncate" style={{ color: "var(--color-on-surface-variant)" }}>Academic AI Sidekick • Online</p>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto shrink-0 transition-opacity hover:opacity-70" style={{ color: "var(--color-on-surface-variant)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 mb-4 shrink-0">
              {[
                { icon: "edit_note", label: "New Note", color: "var(--color-pastel-mint)" },
                { icon: "task_alt", label: "Add Task", color: "var(--color-pastel-peach)" },
                { icon: "event", label: "Check Schedule", color: "var(--color-pastel-lavender)" },
                { icon: "mic", label: "Voice Note", color: "var(--color-pastel-yellow)" },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleActionClick(action.label)}
                  className="flex items-center gap-2 p-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80 active:scale-95"
                  style={{ background: action.color, color: "var(--color-primary)" }}
                >
                  <span className={`material-symbols-outlined ${isListening && action.label === "Voice Note" ? "animate-pulse text-red-500" : ""}`} style={{ fontSize: "18px" }}>
                    {isListening && action.label === "Voice Note" ? "graphic_eq" : action.icon}
                  </span>
                  {isListening && action.label === "Voice Note" ? "Listening..." : action.label}
                </button>
              ))}
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2 scrollbar-thin">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                    style={{
                      background: msg.role === "user" ? "var(--color-primary)" : "var(--color-surface-container-high)",
                      color: msg.role === "user" ? "var(--color-on-primary)" : "var(--color-on-surface)",
                      border: msg.role === "hermes" ? "1px solid var(--color-outline-variant)" : "none"
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div
                    className="p-3 rounded-2xl text-sm rounded-tl-sm"
                    style={{ background: "var(--color-surface-container-high)", border: "1px solid var(--color-outline-variant)" }}
                  >
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div
              className="flex items-center gap-2 p-2 rounded-2xl shrink-0"
              style={{ background: "var(--color-surface-container-low)", border: "1px solid var(--color-outline-variant)" }}
            >
              <input
                type="text"
                placeholder="Ask Hermes anything..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 bg-transparent outline-none text-sm px-2"
                style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-sans)" }}
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all active:scale-90 disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}
                aria-label="Send"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_upward</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
