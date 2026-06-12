"use client";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8 animate-fade-in">
      <div className="mb-8 animate-slide-up">
        <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
          System Configuration
        </p>
        <h2 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>Settings</h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-on-surface-variant)" }}>Konfigurasi aplikasi Academic OS Anda.</p>
      </div>

      <div className="p-6 rounded-2xl mb-6 flex flex-col gap-3" style={{ background: "var(--color-error-container)", border: "1px solid var(--color-error)" }}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined icon-filled" style={{ color: "var(--color-error)" }}>warning</span>
          <h3 className="font-bold text-base" style={{ color: "var(--color-error)" }}>Backend Disconnected (Prototype Mode)</h3>
        </div>
        <p className="text-sm text-red-900 leading-relaxed">
          Aplikasi sedang berjalan menggunakan <strong>LocalStorage (Mock DB)</strong> karena `.env.local` belum lengkap.
          Fungsi sinkronisasi Google Drive dan database Supabase dijeda. Anda masih bisa mencoba navigasi dan interaksi antarmuka (Add/Edit Tasks, Course, dll) secara lokal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="p-6 rounded-2xl" style={{ background: "white", border: "1px solid var(--color-outline-variant)" }}>
          <h3 className="font-bold mb-4" style={{ color: "var(--color-primary)" }}>Account</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ background: "var(--color-secondary)" }}>H</div>
            <div>
              <p className="font-bold text-sm">Hanif</p>
              <p className="text-xs text-gray-500">hanif@example.com</p>
            </div>
          </div>
        </section>

        <section className="p-6 rounded-2xl flex flex-col justify-center items-center text-center" style={{ background: "var(--color-surface-container-low)", border: "1px dashed var(--color-outline-variant)" }}>
           <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">construction</span>
           <p className="text-sm text-gray-500">More settings coming in Phase 3</p>
        </section>
      </div>
    </div>
  );
}
