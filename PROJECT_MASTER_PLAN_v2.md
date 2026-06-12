# 🎓 ACADEMIC OS — PROFESSIONAL MASTER PLAN (v2.1)
**Project Name:** Academic OS (Elite Academic Workspace)
**Status:** Planning / Architecture Design
**Owner:** Hanif (Founder) | Hermes (CEO/Architect)

---

## 🏗️ 1. VISION & VALUE PROPOSITION
Membangun ekosistem akademik mandiri sebagai **Obsidian Replacement** yang sepenuhnya **Cloud-Native**.
- **Zero Storage on Mobile**: Tidak ada file lokal di HP; stream langsung dari Google Drive.
- **Bi-Directional Context**: Integrasi PDF Materi ↔ Catatan Kuliah via Smart Citation.
- **Agent-First**: Dikelola oleh Hermes (CEO) untuk tugas otomatis dan voice-notes.

---

## 🛠️ 2. CORE ARCHITECTURE (THE "OP" STACK)

| Layer | Technology | Key Implementation |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 16 (App Router) | Server Components untuk fetch GDrive metadata super cepat. |
| **Styling & UI** | Tailwind CSS + Shadcn UI | Dashboard premium, dark mode, mobile-responsive grid. |
| **Editor Engine** | TipTap (Pro) | Custom nodes untuk Wikilinks `[[ ]]` dan Citations. |
| **PDF Viewer** | React-PDF-Viewer | Mendukung deep-linking ke spesifik page/coordinate. |
| **Database (Metadata)** | Supabase (PostgreSQL) | Indexing file, folder structure, dan relasi tugas (Prisma ORM). |
| **File Storage** | Google Drive API (v3) | Penyimpanan primer berkas `.md` dan PDF. |
| **Backend Logic** | Next.js API Routes | Token management, GDrive proxy, dan OCR engine. |
| **Agent Bridge** | Hermes Telegram Gateway | Voice transcribing -> Markdown draf di GDrive. |

---

## 💎 3. KEY FEATURES (THE DIFFERENTIATORS)

### A. Side-by-Side Dual Engine
- Split-pane layout: **PDF Viewer (Kiri)** dan **Markdown Editor (Kanan)**.
- **Sync Scroll**: Fitur opsional untuk menautkan posisi bacaan dengan bagian catatan.

### B. Smart Citation System (Deep Linking)
- **Selection-to-Note**: Highlight teks di PDF -> Klik "Cite" -> Otomatis masuk ke Editor dengan format `[[PDF_NAME#page=12&text=pemeriksaan_K3]]`.
- **Active Navigation**: Klik link sitasi di catatan -> PDF viewer otomatis terbuka dan scroll ke halaman yang dirujuk.

### C. G-Drive Cloud VFS (Virtual File System)
- Folder `/Kuliah` di GDrive dipetakan sebagai navigasi sidebar.
- **On-the-fly Editor**: Edit file `.md` tanpa download/upload manual (Stream Buffer).

### D. Hermes Academic Sidekick
- **Voice-to-Note**: "Hermes, catat materi hari ini di folder K3: Penggunaan APD penting." -> Hermes menulis berkas `.md` baru di Drive.
- **Deadline Warden**: Auto-sync deadline tugas dari catatan `[ ]` ke Google Calendar.

---

## 🗄️ 4. DATA MODEL (PRISMA SCHEMA)

```prisma
model Course {
  id              String    @id @default(cuid())
  name            String    @unique
  lecturer        String
  gdriveFolderId  String?   // Root folder mata kuliah di Drive
  notes           Note[]
  materials       Material[] // Berkas PDF/PPT
  tasks           Task[]
}

model Note {
  id              String    @id @default(cuid())
  title           String
  gdriveFileId    String    @unique // Lokasi file .md
  courseId        String
  course          Course    @relation(fields: [courseId], references: [id])
  citations       Citation[]
}

model Material {
  id              String    @id @default(cuid())
  name            String
  type            String    // "PDF", "PPT", "DOCX"
  gdriveFileId    String    @unique
  courseId        String
  course          Course    @relation(fields: [courseId], references: [id])
}

model Citation {
  id              String    @id @default(cuid())
  noteId          String
  materialId      String
  pageNumber      Int
  highlightText   String?
  note            Note      @relation(fields: [noteId], references: [id])
}
```

---

## 🚀 5. EXECUTION ROADMAP

### Phase 1: Foundation (Day 1-3)
- [ ] Inisialisasi Next.js + Prisma + Supabase.
- [ ] Google OAuth Implementation (Drive + Calendar scopes).
- [ ] UI Shell: Navigasi Sidebar & File Explorer G-Drive.

### Phase 2: Professional Editor (Day 4-7)
- [ ] TipTap Editor Setup dengan Markdown support.
- [ ] Real-time Auto-save Engine (Next.js -> GDrive API).
- [ ] Implementasi Wikilinks `[[ ]]` logic.

### Phase 3: Citation Engine (Day 8-10)
- [ ] PDF Viewer Integration dengan streaming support.
- [ ] "Citation Tool": Capture coordinate/page dari PDF ke Editor.
- [ ] Navigation logic: Click link -> Open Material.

### Phase 4: PWA & Mobile Optimization (Day 11-12)
- [ ] Setup PWA (Manifest, Service Workers).
- [ ] Mobile-specific UI: Swipe navigation & Floating Action Buttons.
- [ ] Testing sinkronisasi Laptop ↔ HP.

---

## 🔒 6. GOVERNANCE & SECURITY
- **Auth**: Hanya akun Hanif yang bisa akses (Single User Mode).
- **Environment**: Semua keys disimpan di `.env.local` dan di-fetch lewat Server Actions (Aman).
- **Audit**: Aktivitas editing tercatat di Supabase untuk tracking progress harian.

---

✨ CEO Hermes
