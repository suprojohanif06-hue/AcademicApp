import Link from "next/link";

export default function OnboardingPage() {
  return (
    <div className="bg-level min-h-screen text-on-surface overflow-x-hidden">
      {/* Header */}
      <header
        className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-12 h-20"
        style={{
          background: "rgba(249,249,247,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(28,28,26,0.06)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: "var(--color-primary)" }}
          >
            A
          </div>
          <span
            className="font-bold text-lg tracking-tight"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}
          >
            Academic OS
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button
            className="text-sm font-medium hidden md:block transition-colors hover:opacity-70"
            style={{ color: "var(--color-on-surface-variant)", fontFamily: "var(--font-sans)" }}
          >
            Documentation
          </button>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-widest"
            style={{
              background: "var(--color-surface-container)",
              color: "var(--color-on-surface-variant)",
              border: "1px solid var(--color-outline-variant)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>verified</span>
            Level Edition v2.0
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="relative pt-32 pb-20 px-6 flex flex-col items-center justify-center min-h-screen overflow-hidden">

        {/* Floating background blobs */}
        <div
          className="absolute top-20 left-1/4 w-96 h-96 rounded-full pointer-events-none opacity-30 blur-3xl"
          style={{ background: "var(--color-pastel-peach)" }}
        />
        <div
          className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full pointer-events-none opacity-25 blur-3xl"
          style={{ background: "var(--color-pastel-lavender)" }}
        />

        {/* Hero Text */}
        <div className="relative z-10 text-center max-w-2xl animate-slide-up">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-mono font-bold uppercase tracking-widest"
            style={{
              background: "rgba(28,28,26,0.06)",
              border: "1px solid rgba(28,28,26,0.1)",
              color: "var(--color-on-surface)",
            }}
          >
            <span className="material-symbols-outlined icon-filled" style={{ fontSize: "14px", color: "var(--color-tertiary)" }}>
              star
            </span>
            Your Academic Superpower, Unlocked
          </div>

          <h1
            className="text-5xl md:text-7xl mb-6 tracking-tight leading-[1.1]"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-on-surface)" }}
          >
            Your knowledge,{" "}
            <br />
            <span className="italic" style={{ color: "var(--color-secondary)" }}>
              elevated.
            </span>
          </h1>

          <p
            className="text-lg mb-10 max-w-md mx-auto leading-relaxed"
            style={{ color: "var(--color-on-surface-variant)", fontFamily: "var(--font-sans)" }}
          >
            A unified environment for deep research, PDF citation management,
            structured note-taking, and gamified academic progress.
            Built for the serious K3 scholar.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              id="open-workspace-btn"
              className="flex items-center gap-2 px-10 py-4 rounded-full text-base font-bold shadow-xl transition-all hover:opacity-90 active:scale-95 w-full md:w-auto justify-center"
              style={{
                background: "var(--color-primary)",
                color: "var(--color-on-primary)",
                boxShadow: "0 12px 40px rgba(28,28,26,0.18)",
              }}
            >
              <span className="material-symbols-outlined icon-filled" style={{ fontSize: "20px" }}>rocket_launch</span>
              Open Workspace
            </Link>
            <button
              className="flex items-center gap-2 px-10 py-4 rounded-full text-base font-medium transition-all hover:opacity-80 active:scale-95 w-full md:w-auto justify-center"
              style={{
                background: "white",
                border: "1px solid rgba(28,28,26,0.1)",
                color: "var(--color-on-surface)",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>play_circle</span>
              Watch Demo
            </button>
          </div>
        </div>

        {/* Floating Preview Cards */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">

          {/* Notes Card — top left — pastel green */}
          <div
            className="absolute top-[18%] left-[4%] md:left-[10%] animate-float soft-tile p-5 rounded-3xl w-56 md:w-64"
            style={{ background: "var(--color-pastel-mint)", transform: "rotate(-4deg)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined" style={{ color: "var(--color-primary)" }}>description</span>
              <span className="xp-badge">XP +420</span>
            </div>
            <div className="space-y-2 opacity-50 mb-4">
              <div className="h-2 w-full rounded-full" style={{ background: "var(--color-on-surface)" }} />
              <div className="h-2 w-4/5 rounded-full" style={{ background: "var(--color-on-surface)" }} />
              <div className="h-2 w-full rounded-full" style={{ background: "var(--color-on-surface)" }} />
            </div>
            <div className="flex gap-2 flex-wrap">
              <span
                className="px-2 py-1 text-[10px] rounded-full font-mono font-bold"
                style={{
                  background: "white",
                  color: "var(--color-on-surface)",
                  border: "1px solid rgba(28,28,26,0.1)",
                }}
              >
                UU-1/1970
              </span>
              <span
                className="px-2 py-1 text-[10px] rounded-full font-mono font-bold"
                style={{
                  background: "white",
                  color: "var(--color-on-surface)",
                  border: "1px solid rgba(28,28,26,0.1)",
                }}
              >
                ISO-45001
              </span>
            </div>
          </div>

          {/* PDF Reader Card — bottom left — pastel blue */}
          <div
            className="absolute bottom-[12%] left-[6%] md:left-[13%] animate-float-delayed soft-tile p-5 rounded-3xl w-64 md:w-72"
            style={{ background: "var(--color-pastel-blue)", transform: "rotate(3deg)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ color: "var(--color-primary)" }}>picture_as_pdf</span>
                <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-serif)" }}>Read List</span>
              </div>
              <span className="text-[10px] font-mono font-bold" style={{ color: "var(--color-on-surface-variant)" }}>84%</span>
            </div>
            <div className="h-1.5 w-full rounded-full mb-3 overflow-hidden" style={{ background: "rgba(28,28,26,0.08)" }}>
              <div className="h-full rounded-full" style={{ width: "84%", background: "var(--color-primary)" }} />
            </div>
            <div className="rounded-xl overflow-hidden h-20 flex items-center justify-center" style={{ background: "rgba(28,28,26,0.06)" }}>
              <span className="material-symbols-outlined opacity-30" style={{ fontSize: "40px" }}>article</span>
            </div>
          </div>

          {/* Tasks Card — top right — pastel lavender */}
          <div
            className="absolute top-[20%] right-[4%] md:right-[10%] animate-float-delayed soft-tile p-5 rounded-3xl w-56 md:w-64"
            style={{ background: "var(--color-pastel-lavender)", transform: "rotate(5deg)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined" style={{ color: "var(--color-primary)" }}>check_circle</span>
              <span className="xp-badge">Level 14</span>
            </div>
            <ul className="space-y-3">
              {[
                { text: "Review APD Protocol", done: false },
                { text: "Literature Review", done: true },
                { text: "Archive MSDS Reports", done: false },
              ].map((item) => (
                <li key={item.text} className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--color-on-surface-variant)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "14px", opacity: item.done ? 1 : 0.4 }}>
                    {item.done ? "check_circle" : "radio_button_unchecked"}
                  </span>
                  <span className={item.done ? "line-through opacity-50" : ""}>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Citations Card — bottom right — pastel yellow */}
          <div
            className="absolute bottom-[18%] right-[5%] md:right-[16%] animate-float soft-tile p-5 rounded-3xl w-72 md:w-80"
            style={{ background: "var(--color-pastel-yellow)", transform: "rotate(-2deg)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined" style={{ color: "var(--color-primary)" }}>format_quote</span>
              <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-serif)" }}>Smart Citation</span>
            </div>
            <div
              className="text-[11px] p-3 rounded-2xl"
              style={{
                fontFamily: "var(--font-mono)",
                background: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(28,28,26,0.08)",
                color: "var(--color-on-surface-variant)",
              }}
            >
              <span style={{ color: "var(--color-secondary)", fontWeight: 700 }}>[[</span>UU-1/1970
              <span style={{ color: "var(--color-tertiary)" }}>#page=5</span>&text=pasal_3
              <span style={{ color: "var(--color-secondary)", fontWeight: 700 }}>]]</span>
            </div>
            <div className="mt-3 flex justify-end">
              <span
                className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-40"
                style={{ color: "var(--color-on-surface)" }}
              >
                Jump to Source ↗
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Stats footer */}
      <footer
        className="relative z-10 w-full max-w-5xl mx-auto pb-12 px-6"
        style={{ borderTop: "1px solid var(--color-outline-variant)" }}
      >
        <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "100%", label: "Cloud-Native" },
            { value: "0 MB", label: "Mobile Storage" },
            { value: "AES-256", label: "Encryption" },
            { value: "PWA", label: "Works Offline" },
          ].map((stat) => (
            <div key={stat.label} className="text-center md:text-left">
              <div
                className="text-2xl font-bold"
                style={{ fontFamily: "var(--font-serif)", color: "var(--color-on-surface)" }}
              >
                {stat.value}
              </div>
              <div
                className="text-sm mt-1 opacity-60"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
