export interface Semester {
  id: string;
  name: string;
  active: boolean;
}

export interface CourseData {
  id: string;
  semesterId: string;
  code: string;
  name: string;
  lecturer: string;
  room: string;
  credits: number;
  color: string;
  icon: string;
  progress: number;
  notes: number;
  materials: number;
  tasks: number;
  schedule: string;
  level: number;
  xp: number;
}

export type Priority = "high" | "medium" | "low";
export type Status = "todo" | "inprogress" | "done" | "backlog" | "review";
export type TaskType = "assignment" | "quiz" | "report" | "presentation" | "exam" | "practicum";

export interface TaskChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  linkedNoteId?: string;
  linkedMaterialIds?: string[];
  subtasks?: TaskChecklistItem[];
}

export interface AcademicTask {
  id: string;
  courseId: string;
  semesterId: string;
  title: string;
  type: TaskType;
  status: Status;
  priority: Priority;
  dueDate?: string;
  description?: string;
  linkedMaterialIds?: string[];
  linkedDocId?: string;
  googleCalendarEventId?: string;
  xp: number;
  checklist?: TaskChecklistItem[];
}

export interface AcademicMaterial {
  id: string;
  courseId: string; // "general" if not linked to a specific course
  title: string;
  type: "PDF" | "PPT" | "Journal" | "Handout" | "DOC" | "URL";
  fileName: string;
  url: string;
  totalPages: number;
  source: "Local" | "Drive";
  category?: string; // Optional custom category from Library upload
}

export interface AcademicNote {
  id: string;
  courseId: string;
  title: string;
  updatedAt: string;
  linkedMaterialId?: string;
  content: string;
}

// ── Mock Data ────────────────────────────────────────────────────────

export const MOCK_SEMESTERS: Semester[] = [
  { id: "s-ganjil-2025", name: "Semester Ganjil 2025/2026", active: true },
  { id: "s-genap-2024", name: "Semester Genap 2024/2025", active: false },
];

export const MOCK_COURSES: CourseData[] = [
  {
    id: "k3-101", semesterId: "s-ganjil-2025", code: "K3 101", name: "Dasar Keselamatan & Kesehatan Kerja", lecturer: "Dr. Pratiwi", room: "Lab K3 • R.101", credits: 3,
    color: "var(--color-pastel-peach)", icon: "health_and_safety", progress: 72, notes: 14, materials: 8, tasks: 2, schedule: "Senin & Rabu • 08:00–09:40", level: 12, xp: 3200,
  },
  {
    id: "hig-201", semesterId: "s-ganjil-2025", code: "HIG 201", name: "Higiene Industri", lecturer: "Prof. Rahardjo", room: "R.204 • Online", credits: 2,
    color: "var(--color-pastel-mint)", icon: "science", progress: 58, notes: 9, materials: 5, tasks: 3, schedule: "Selasa • 10:30–12:10", level: 8, xp: 2100,
  },
  {
    id: "erg-301", semesterId: "s-ganjil-2025", code: "ERG 301", name: "Ergonomi", lecturer: "Ir. Budiman", room: "Aula C", credits: 2,
    color: "var(--color-pastel-blue)", icon: "accessibility", progress: 40, notes: 5, materials: 4, tasks: 1, schedule: "Rabu • 13:00–14:40", level: 5, xp: 1200,
  },
  {
    id: "rm-201", semesterId: "s-ganjil-2025", code: "RM 201", name: "Manajemen Risiko", lecturer: "Dr. Sanjaya", room: "R.102", credits: 3,
    color: "var(--color-pastel-yellow)", icon: "analytics", progress: 30, notes: 4, materials: 3, tasks: 2, schedule: "Kamis • 08:00–10:30", level: 4, xp: 900,
  },
  {
    id: "aud-401", semesterId: "s-ganjil-2025", code: "AUD 401", name: "Audit K3", lecturer: "Ir. Susanto", room: "Aula B", credits: 2,
    color: "var(--color-pastel-lavender)", icon: "fact_check", progress: 10, notes: 2, materials: 2, tasks: 0, schedule: "Jumat • 09:00–10:40", level: 2, xp: 400,
  },
  {
    id: "fire-101", semesterId: "s-ganjil-2025", code: "FS 101", name: "Fire Safety", lecturer: "Dr. Anugrah", room: "Lab APAR", credits: 2,
    color: "var(--color-error-container)", icon: "local_fire_department", progress: 85, notes: 12, materials: 6, tasks: 1, schedule: "Senin • 13:00–14:40", level: 15, xp: 4500,
  }
];

export const MOCK_MATERIALS: AcademicMaterial[] = [
  { id: "uu-1-1970", courseId: "k3-101", title: "UU No. 1 Tahun 1970", type: "PDF", fileName: "UU-No-1-Tahun-1970.pdf", url: "/materials/UU-No-1-Tahun-1970.pdf", totalPages: 12, source: "Local" },
  { id: "safety-manual", courseId: "k3-101", title: "Safety Manual Dasar", type: "PDF", fileName: "Safety-Manual.pdf", url: "/api/drive/file/placeholder", totalPages: 100, source: "Drive" },
  { id: "hig-ppt-1", courseId: "hig-201", title: "Pengantar Higiene Industri", type: "PPT", fileName: "Pengantar-Higiene.pdf", url: "/api/drive/file/placeholder", totalPages: 45, source: "Drive" },
  { id: "rm-journal-1", courseId: "rm-201", title: "Jurnal Penilaian Risiko", type: "Journal", fileName: "Risk-Assessment.pdf", url: "/api/drive/file/placeholder", totalPages: 15, source: "Drive" },
];

export const MOCK_NOTES: AcademicNote[] = [
  { id: "note-1", courseId: "k3-101", title: "Ringkasan UU Keselamatan Kerja", updatedAt: "2026-06-05T10:00:00Z", linkedMaterialId: "uu-1-1970", content: "# Ringkasan UU No. 1 Tahun 1970\\n\\nUU No. 1 Tahun 1970 menjadi dasar utama keselamatan kerja di Indonesia." },
  { id: "note-2", courseId: "hig-201", title: "Catatan Kuliah Minggu 1", updatedAt: "2026-06-06T14:30:00Z", linkedMaterialId: "hig-ppt-1", content: "# Minggu 1: Higiene\\n\\nFokus pada antisipasi, rekognisi, evaluasi, dan kontrol bahaya di tempat kerja." },
];

export const MOCK_TASKS: AcademicTask[] = [
  { id: "t1", courseId: "hig-201", semesterId: "s-ganjil-2025", title: "UTS Higiene Industri", type: "exam", dueDate: "2026-06-10", xp: 1200, priority: "high", status: "todo", linkedMaterialIds: ["hig-ppt-1"], checklist: [{id: "c1", text: "Bab 1-3", completed: false}, {id: "c2", text: "Latihan Soal", completed: false}] },
  { id: "t2", courseId: "k3-101", semesterId: "s-ganjil-2025", title: "Makalah APD", type: "assignment", dueDate: "2026-06-15", xp: 2000, priority: "high", status: "todo" },
  { id: "t3", courseId: "hig-201", semesterId: "s-ganjil-2025", title: "Laporan Praktikum Higiene", type: "report", dueDate: "2026-06-12", xp: 750, priority: "medium", status: "inprogress" },
  { id: "t4", courseId: "k3-101", semesterId: "s-ganjil-2025", title: "Resume Bab 4 Manajemen K3", type: "assignment", dueDate: "2026-06-20", xp: 300, priority: "low", status: "inprogress" },
  { id: "t5", courseId: "rm-201", semesterId: "s-ganjil-2025", title: "Presentasi Studi Kasus MSDS", type: "presentation", dueDate: "2026-06-01", xp: 500, priority: "medium", status: "done" },
];
