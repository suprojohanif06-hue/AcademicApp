# 🎓 Academic OS — Master Plan (Level Edition)

Academic OS adalah **ekosistem belajar pribadi**: Obsidian-style knowledge linking + Google Docs-style editor + PDF++ citation + Course/Semester hub + Kanban tugas + Google Drive/Calendar sync + Regulations library + Hermes AI.

Target utama: semua workflow kuliah Bos jadi satu tempat.

```txt
Semester → Course → Materials / Notes / Tasks → Study Workspace
Regulations → Reading View → Cite/Open in Study
Tasks → Kanban → Google Calendar
Drive K324 → source file sync
Omnisearch → cari semua
Hermes → AI konteks akademik
```

---

## 1. Product Principles

- **Course = konteks akademik**
- **Study = ruang kerja/editor**
- **Tasks = manajemen kerja/deadline**
- **Regulations = perpustakaan hukum/referensi**
- **Drive = storage/source files**
- **Calendar = reminder deadline/jadwal**
- **Hermes = AI assistant yang tahu konteks**

UI style harus konsisten:
- rounded panels
- icon rail sidebar
- black active states
- green saved/status states
- yellow citation actions
- clean academic dashboard
- workspace feel ala SatuTim, tapi khusus akademik/K3

---

## 2. Core Domains

### 2.1 Semester
```ts
type Semester = {
  id: string;
  name: string; // "Semester 4"
  order: number;
  driveFolderId?: string;
}
```

### 2.2 Course / Matkul
```ts
type Course = {
  id: string;
  semesterId: string;
  name: string;
  code?: string;
  lecturer?: string;
  room?: string;
  credits?: number;
  color?: string;
  icon?: string;
  progress?: number;
  driveFolderId?: string;
}
```

### 2.3 Materials vs Regulations

**Materials** = bahan kuliah.
```txt
modul, PPT, jurnal, handout, lecture PDF, slide, reading
```

**Regulations** = dokumen hukum/referensi.
```txt
UU, PP, Permenaker, Kepmen, SNI, ISO, NFPA, ILO
```

Jangan dicampur. Regulations punya tab khusus nanti.

### 2.4 Material
```ts
type Material = {
  id: string;
  courseId: string;
  title: string;
  type: "pdf" | "ppt" | "journal" | "handout" | "link";
  source: "local" | "drive";
  url?: string;
  driveFileId?: string;
  totalPages?: number;
}
```

### 2.5 Regulation
```ts
type Regulation = {
  id: string;
  title: string;
  category: "K3 Umum" | "Ketenagakerjaan" | "Kebakaran" | "Lingkungan" | "Konstruksi" | "Listrik" | "B3" | "SMK3" | "ISO/SNI/NFPA";
  sourceType: "UU" | "PP" | "Permenaker" | "Kepmen" | "SNI" | "ISO" | "NFPA" | "ILO";
  year?: number;
  url?: string;
  driveFileId?: string;
  totalPages?: number;
}
```

### 2.6 Study Document
```ts
type StudyDocument = {
  id: string;
  courseId?: string;
  taskId?: string;
  materialId?: string;
  regulationId?: string;
  title: string;
  contentHtml: string;
  contentSource: string;
  citations: Citation[];
  updatedAt: string;
}
```

### 2.7 Citation
```ts
type Citation = {
  id: string;
  sourceId: string;
  sourceType: "material" | "regulation";
  page: number;
  label: string;
  wikilink: string; // [[file.pdf#page=5|Pasal 3]]
}
```

### 2.8 Task Entity
Tasks wajib first-class, bukan sekadar list.

```ts
type AcademicTask = {
  id: string;
  courseId: string;
  semesterId: string;
  title: string;
  type: "assignment" | "quiz" | "report" | "presentation" | "exam" | "practicum";
  status: "backlog" | "todo" | "doing" | "review" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  description?: string;
  linkedMaterialIds?: string[];
  linkedDocId?: string;
  googleCalendarEventId?: string;
}
```

Flow:
```txt
Course Task → Open in Study → Work on doc → Update status → Kanban → Google Calendar
```

---

## 3. Current Progress

### Phase 1 — Foundation ✅ DONE
Done:
- Next.js app shell
- sidebar/navigation
- dashboard shell
- Level Edition visual style
- basic pages/routes

### Phase 2 — Study Workspace / PDF++ Core ✅ DONE / POLISHING
Done:
- Mozilla PDF.js viewer
- PDF open/close
- stable CSS Grid split layout, no react-resizable-panels
- PDF jump via state/remount
- Source/Edit/Reading modes
- Word-like Tiptap toolbar in Edit
- raw wikilinks in Source
- clickable wikilinks in Edit/Reading
- citation insert at cursor
- citation chips hide/show
- label-only link display, page hidden visually
- PDF search via PDF.js toolbar

Need final polish:
- real autosave persistence
- duplicate citation handling
- better document title/context
- stable DB-backed documents

### Phase 2.5 — Course Hub + Study Context + Task Entity ✅ BASELINE DONE
Done:
- `/courses` semester/course hub
- `/courses/[id]` course detail
- Materials/Notes/Tasks sections
- shared mock data in `src/lib/academic-data.ts`
- localStorage consistency for custom courses/tasks
- Study query params:
  ```txt
  /study?courseId=...&docId=...&materialId=...&taskId=...&page=...
  ```
- basic `/tasks` Kanban

### Phase 2.5b — Course Workspace UX Polish ✅ IMPLEMENTED / USER TESTED
Done:
- Course detail section-level actions:
  - `+ Material`
  - `+ Note`
  - `+ Task`
- create modals for material/note/task
- localStorage keys:
  ```txt
  academic-materials
  academic-notes
  academic-tasks
  ```
- empty-state CTAs
- item cards with Open/Delete actions
- `/study` no-param now shows Study Dashboard first
- dashboard can open course/material/note/task workspace
- direct context URL still opens PDF/editor workspace
- Study editor/PDF behavior preserved

### Phase 2.5e — Stitch-inspired Study Word UI Polish ✅ IMPLEMENTED / NEEDS USER TEST
Done:
- Study top bar styled closer to Google Docs/Stitch reference:
  ```txt
  Academic OS | File | Insert | Format | Tools | pane toggles | Sync
  ```
- PDF and right context panes are independently collapsible with split-panel icons.
- Edge reopen buttons appear when PDF/context panes are closed.
- Desktop 3-pane grid uses stable CSS grid, not `react-resizable-panels`.
- PDF pane has material title, cite controls, and panel-close control.
- Right task pane has cleaner header and close control.
- Editor toolbar preserves existing features:
  - font/size/heading auto-detect
  - table insert/edit controls in main toolbar
  - callout dropdown
  - image upload/drag-drop
  - Source/Edit/Reading modes
  - citation chips and PDF jump

### Phase 2.8 — Prisma Database & Server Actions Integration ✅ DONE
Done:
- Migrated all `useLocalStorage` and mock data to SQLite/Prisma backend.
- Split monolithic pages (`Dashboard`, `Tasks`, `Library`, `Study Workspace`, `Courses`) into Server Components and interactive Client Components.
- Supported deeply nested KanBan checklists by adding `checklistData` field in Prisma `Task` model.
- Implemented `createNote`, `updateNote`, `createTask`, `updateTask`, `updateTaskStatus`, `createMaterial` server actions.
- Real-time save synchronization in the Study Workspace.

### Phase 2.9 — Background Sync & Optimistic UI ✅ DONE
Done:
- **Instant Backend Actions**: Implemented optimistic UI states for quick tasks creation, materials upload, and note creation. Cards and items appear instantly, closing modals without waiting for database roundtrips.
- **Tiptap Focus & Selection Stability**: Stabilized the editor key behavior in study workspace, blocking dynamic unmounting/remounting when temporary `new-` note IDs transition to real database IDs, avoiding selection/focus loss.
- **Autosave Race Prevention**: Prevented multiple concurrent database writes and duplicated notes under rapid typing via key lockouts on pending creations.
- **Unified Layouts & Aesthetics**: Cleaned up the study dashboard's backgrounds, removed clipped container borders on card hover, and restored full-screen visual canvas mapping.

---

## 4. Future Roadmap

### Phase 3 — Google Workspace Sync
Goal: connect real Google ecosystem.

Features:
- Google Drive K324 scan
- detect folder structure:
  ```txt
  K324/Semester/Course/Materi/Catatan/Tugas/Peraturan
  ```
- metadata cache in Supabase
- Google Calendar sync for task due dates
- Drive file open via app
- Drive upload/rename/move support

### Phase 3.5 — Regulations Library
Dedicated tab for legal/reference docs.

Routes:
```txt
/regulations
/regulations/[id]
```

Features:
- filter by category/source/year
- PDF-only reading view
- search title/pasal/content
- bookmark pasal
- cite/open in Study
- no editor by default

### Phase 4 — Omnisearch Global
Obsidian Omnisearch-style.

Search across:
- courses
- notes
- tasks
- materials
- regulations
- PDF text
- citations
- commands

Shortcut:
```txt
Ctrl + K
```

Example queries:
```txt
Pasal 14 APD
UU 1 1970
deadline ergonomi
laporan K3
HIRADC
```

### Phase 4.5 — Dashboard Widgets (SatuTim-inspired)
Adopt workspace UX from SatuTim, adapted for academic use.

Widgets:
- onboarding checklist
- calendar widget
- upcoming deadlines
- active courses
- recent study docs
- regulations bookmarks
- semester progress
- “Tanya Hermes” floating AI

Onboarding checklist:
```txt
- Hubungkan Google Drive K324
- Buat semester pertama
- Tambah matkul pertama
- Buka Study Workspace
- Buat task pertama
```

### Phase 5 — Docs Hub + Templates + Export
Features:
- `/docs` all notes/documents
- templates:
  - ringkasan materi
  - laporan praktikum
  - analisis peraturan
  - review jurnal
  - presentasi
- export:
  - DOCX
  - PDF
  - Markdown
  - citation list

### Phase 5.5 — K3 Forms & Checklists
SatuTim Forms-inspired, but for K3.

Forms:
- HIRADC
- JSA
- APD checklist
- Fire inspection
- Incident report
- Risk assessment
- SMK3 audit checklist

Outputs:
- save as structured form
- export Excel/PDF
- link to Course/Task/Study doc

### Phase 6 — Canvas / Whiteboard
SatuTim Whiteboard-inspired.

Use cases:
- mindmap materi
- flowchart K3
- fishbone diagram
- bowtie analysis
- hierarchy of control
- risk matrix
- accident causation model

Candidate libs:
```txt
tldraw
excalidraw
react-flow
```

### Phase 7 — Hermes Academic AI
Hermes must be context-aware.

Context examples:
```txt
course=K3 Industri
task=Laporan UU
doc=Draft Laporan
pdf=UU No.1/1970
page=10
```

Features:
- summarize PDF
- ask current document
- ask all notes
- find relevant regulation/pasal
- draft laporan
- generate study plan
- generate flashcards
- create checklist from regulation

### Phase 8 — Analytics / Study Load
SatuTim workload/timesheet-inspired.

Features:
- progress per course
- deadline risk
- time spent per course
- task completion
- semester report
- weak-topic detection

---

## 5. Route Map

Current/near-term:
```txt
/dashboard
/courses
/courses/[id]
/study
/tasks
/library
/settings
```

Future:
```txt
/regulations
/regulations/[id]
/docs
/forms
/canvas
/search
/calendar
/analytics
```

---

## 6. App Comparisons

### Obsidian
Take:
- wikilinks
- backlinks
- omnisearch
- PDF++ concepts

Academic OS advantage:
- native semester/course/task structure
- Word-style editor
- Drive/Calendar sync
- K3 regulations library

### Notion
Take:
- dashboard/cards/databases
- kanban
- templates

Academic OS advantage:
- stronger PDF citation
- K3-specific workflow
- source/edit/reading modes

### Zotero
Take:
- reference organization
- citation metadata
- PDF annotation ideas

Academic OS advantage:
- course/task/study integration
- regulations + lecture materials together

### SatuTim
Take:
- unified workspace UX
- More menu/feature hub
- dashboard onboarding
- calendar widget
- docs/forms/whiteboard inspiration
- contextual AI idea

Do NOT copy:
- team discussion/call/workspace collaboration first
- business/team management focus

Academic OS adaptation:
```txt
SatuTim = team project OS
Academic OS = personal academic OS
```

---

## 7. Implementation Rules

- Do not break Study Workspace.
- Do not reintroduce `react-resizable-panels` unless explicitly requested.
- Study layout uses CSS Grid.
- Keep current visual language.
- Shared data/types should live in:
  ```txt
  src/lib/academic-data.ts
  ```
- Query params must be additive and non-breaking.
- Regulations remain future tab; only prep types if helpful.
- Build required after changes:
  ```bash
  npm run build
  ```
- Lint optional; report pre-existing issues clearly.

---

## 8. Immediate Next Step

Proceed with:
```txt
Phase 2.5 — Course Hub + Study Context + Task Entity
```

Then:
```txt
Phase 3 — Google Workspace Sync
Phase 3.5 — Regulations Library
Phase 4 — Omnisearch Global
```
