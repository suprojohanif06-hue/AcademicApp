export default function ResearchPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
          Phase 5 Cycle
        </p>
        <h2 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>
          Research Hub
        </h2>
        <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">
          Citation Manager + Zotero Sync — Phase 5
        </p>
      </div>

      <div className="flex flex-col items-center justify-center h-64 gap-4 animate-slide-up delay-100">
        <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "var(--color-outline)" }}>science</span>
        <p style={{ color: "var(--color-on-surface-variant)" }}>Research Workspace features coming soon</p>
      </div>
    </div>
  );
}
