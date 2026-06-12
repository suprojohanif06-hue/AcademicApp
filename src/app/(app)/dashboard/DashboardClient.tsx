"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { updateTaskStatus as updateTaskStatusDB } from "@/app/actions/academic-actions";
import { useAcademicStore } from "@/store/useAcademicStore";

// ── Helper ─────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Selamat Pagi";
  if (h < 18) return "Selamat Siang";
  return "Selamat Malam";
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 2) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  if (hrs < 24) return `${hrs} jam lalu`;
  return `${days} hari lalu`;
}

/** Hitung streak hari berturut dengan notes baru (1 note per hari = 1 hari streak) */
function calcStreak(notes: any[]): number {
  if (!notes.length) return 0;
  const days = new Set(notes.map((n) => new Date(n.updatedAt).toISOString().slice(0, 10)));
  const sorted = [...days].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  let streak = 0;
  let cur = new Date(today);
  for (const d of sorted) {
    const expect = cur.toISOString().slice(0, 10);
    if (d === expect) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// ── Upload Modal ───────────────────────────────────────────────────────
function UploadModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = () => {
    if (!file) return;
    alert(`Upload material currently managed via Course Detail.`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 animate-slide-up"
        style={{ background: "var(--color-surface-container-lowest)", border: "1px solid var(--color-outline-variant)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-pastel-blue)", color: "var(--color-primary)" }}>
            <span className="material-symbols-outlined icon-filled" style={{ fontSize: "22px" }}>upload_file</span>
          </div>
          <div>
            <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>Upload PDF Material</h3>
            <p className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>Buka tab Course untuk upload</p>
          </div>
          <button onClick={onClose} className="ml-auto" style={{ color: "var(--color-on-surface-variant)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
          </button>
        </div>

        <button
          className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
          style={{ background: "var(--color-surface-container)", color: "var(--color-on-surface)" }}
          onClick={onClose}
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

// ── Dashboard Client Component ─────────────────────────────────────────
export default function DashboardClient({
  courses,
  tasks,
  notes,
  materials,
}: {
  courses: any[];
  tasks: any[];
  notes: any[];
  materials: any[];
}) {
  const [showUpload, setShowUpload] = useState(false);
  const [hermesVisible, setHermesVisible] = useState(true);
  
  const { 
    isHydrated, setInitialData, 
    tasks: storeTasks, 
    courses: storeCourses, 
    notes: storeNotes, 
    materials: storeMaterials,
    updateTaskStatus
  } = useAcademicStore();

  useEffect(() => {
    // Only set initial data once to allow optimistic updates to persist across tabs
    if (!isHydrated) {
      setInitialData({ courses, tasks, notes, materials });
    }
  }, [courses, tasks, notes, materials, isHydrated, setInitialData]);

  // Use store data if hydrated, otherwise fallback to server data
  const currentTasks = isHydrated ? storeTasks : tasks;
  const currentCourses = isHydrated ? storeCourses : courses;
  const currentNotes = isHydrated ? storeNotes : notes;
  const currentMaterials = isHydrated ? storeMaterials : materials;

  const toggleTask = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "todo" : "done";
    updateTaskStatus(id, newStatus);
    await updateTaskStatusDB(id, newStatus);
  };

  // ── Derived stats ──────────────────────────────────────────────────
  const streak = useMemo(() => calcStreak(currentNotes), [currentNotes]);
  const totalNotes = currentNotes.length;
  const totalCredits = currentCourses.reduce((a, c) => a + c.credits, 0);
  const maxLevel = currentCourses.length > 0 ? Math.max(...currentCourses.map((c) => c.level)) : 1;
  const totalXP = currentCourses.reduce((a, c) => a + c.xp, 0);
  const xpToNextLevel = Math.ceil(totalXP / 1000) * 1000 || 1000;
  const xpProgress = Math.min(100, Math.round((totalXP / xpToNextLevel) * 100));

  const pendingTasks = useMemo(
    () => currentTasks.filter((t) => t.status !== "done" && t.dueDate).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5),
    [currentTasks]
  );

  const recentNotes = useMemo(
    () => currentNotes.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 3),
    [currentNotes]
  );

  const quickStats = [
    { label: "STREAK", value: `${streak} 🔥` },
    { label: "CATATAN", value: `${totalNotes}` },
    { label: "TOTAL SKS", value: `${totalCredits}` },
    { label: "LEVEL", value: `${maxLevel} ⭐` },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}

      <div className="flex flex-col gap-6 md:gap-8 animate-fade-in">

        {/* ── Header Area ── */}
        <section className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="animate-slide-up">
            <p className="text-xs md:text-sm uppercase tracking-widest mb-1" style={{ color: "var(--color-on-surface-variant)", fontFamily: "var(--font-mono)" }}>
              {getGreeting()},
            </p>
            <h2 className="text-2xl md:text-4xl font-bold leading-tight" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>
              Scholar.
            </h2>
            <p className="mt-1 text-sm md:text-base" style={{ color: "var(--color-on-surface-variant)" }}>
              Perjalanan ilmumu berlanjut hari ini.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/courses" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold shadow-sm transition-all hover:opacity-90 active:scale-95" style={{ background: "var(--color-primary)", color: "var(--color-on-primary)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>school</span>
                Courses
              </Link>
            </div>
          </div>

          {/* XP Progress Card */}
          <div
            className="w-full lg:w-96 p-4 md:p-5 rounded-2xl shadow-lg card-hover animate-slide-up delay-100 shrink-0"
            style={{ background: "var(--color-primary)", color: "var(--color-on-primary)" }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] md:text-xs uppercase tracking-widest opacity-60" style={{ fontFamily: "var(--font-mono)" }}>
                DAILY QUEST PROGRESS
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] md:text-xs font-mono font-bold" style={{ background: "var(--color-tertiary-container)", color: "var(--color-on-tertiary-container)" }}>
                Level {maxLevel}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.15)" }}>
              <div className="h-full rounded-full relative overflow-hidden" style={{ width: `${xpProgress}%`, background: "var(--color-secondary-container)" }}>
                <div className="absolute inset-0 animate-pulse-glow" style={{ background: "rgba(255,255,255,0.3)" }} />
              </div>
            </div>
            <div className="flex justify-between text-[10px] md:text-xs opacity-70" style={{ fontFamily: "var(--font-mono)" }}>
              <span>{totalXP.toLocaleString()} XP</span>
              <span>{xpToNextLevel.toLocaleString()} XP → Lvl {maxLevel + 1}</span>
            </div>
          </div>
        </section>

        {/* ── Quick Stats Row ── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 animate-slide-up delay-150">
          {quickStats.map((stat) => (
            <div key={stat.label} className="p-4 rounded-2xl flex items-center justify-between card-hover" style={{ background: "white", border: "1px solid var(--color-outline-variant)" }}>
              <span className="text-[10px] md:text-xs uppercase tracking-widest font-mono font-bold" style={{ color: "var(--color-on-surface-variant)" }}>{stat.label}</span>
              <span className="text-lg md:text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>{stat.value}</span>
            </div>
          ))}
        </section>

        {/* ── Main Content Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">

          {/* ── Left Column (main) ── */}
          <div className="col-span-1 lg:col-span-8 flex flex-col gap-6 md:gap-8">

            {/* Today's Classes */}
            <section className="animate-slide-up delay-200">
              <div className="flex justify-between items-center mb-3 md:mb-4">
                <h3 className="text-lg md:text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>
                  Mata Kuliah
                </h3>
                <Link href="/courses" className="flex items-center gap-1 text-[11px] md:text-xs uppercase tracking-wider transition-opacity hover:opacity-70" style={{ color: "var(--color-on-surface-variant)", fontFamily: "var(--font-mono)" }}>
                  LIHAT SEMUA <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>arrow_forward</span>
                </Link>
              </div>
              <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-4 overflow-x-auto pb-2 md:overflow-x-visible md:pb-0 snap-x snap-mandatory">
                {currentCourses.length > 0 ? currentCourses.slice(0, 3).map((cls) => (
                  <Link href={`/courses/${cls.id}`} key={cls.id} className="p-4 md:p-5 rounded-2xl relative overflow-hidden card-hover cursor-pointer shrink-0 w-[72vw] sm:w-64 md:w-auto snap-start" style={{ background: cls.color }}>
                    <span className="material-symbols-outlined absolute top-2 right-2 opacity-10 pointer-events-none" style={{ fontSize: "64px", color: "var(--color-primary)" }}>{cls.icon || "school"}</span>
                    <div className="flex justify-between items-start mb-3 relative z-10">
                      <div className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center font-bold text-sm md:text-base shadow-sm" style={{ background: "white", color: "var(--color-primary)" }}>
                        {cls.code.charAt(0)}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="px-2 py-1 rounded-lg text-[10px] md:text-[11px] font-mono font-bold" style={{ background: "rgba(255,255,255,0.65)", color: "var(--color-on-surface)" }}>{cls.room || "TBD"}</span>
                        <span className="text-[10px] font-mono font-bold" style={{ color: "var(--color-tertiary)", background: "rgba(255,255,255,0.5)", padding: "1px 6px", borderRadius: "999px" }}>+{cls.xp} XP</span>
                      </div>
                    </div>
                    <div className="relative z-10">
                      <h4 className="font-bold text-sm md:text-base leading-tight mb-1" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>{cls.name}</h4>
                      <p className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>{cls.credits} SKS • {cls.lecturer}</p>
                    </div>
                  </Link>
                )) : (
                  <div className="col-span-3 rounded-2xl border border-dashed px-4 py-8 text-center" style={{ borderColor: "var(--color-outline-variant)", background: "var(--color-surface-container-low)" }}>
                    <p className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>Belum ada mata kuliah</p>
                    <Link href="/courses" className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold" style={{ background: "var(--color-primary)", color: "var(--color-on-primary)" }}>
                      Tambah Kelas
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {/* Recent Notes */}
            <section className="animate-slide-up delay-300">
              <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>
                Catatan Terbaru
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {recentNotes.length > 0 ? recentNotes.map((note, idx) => {
                  const course = courses.find((c) => c.id === note.courseId);
                  return (
                    <Link
                      href={`/study?courseId=${note.courseId}&docId=${note.id}`}
                      key={note.id}
                      className={`p-4 md:p-5 rounded-2xl card-hover cursor-pointer flex flex-col justify-between min-h-[140px]${idx === 0 ? " md:col-span-2" : ""}`}
                      style={{ background: course?.color ?? "white", border: "1px solid var(--color-outline-variant)" }}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-2" style={{ color: "var(--color-secondary)" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>description</span>
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider">{course?.code || "GENERAL"}</span>
                        </div>
                        <h4 className="font-bold text-sm md:text-base leading-snug mb-1" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>{note.title}</h4>
                      </div>
                      <span className="text-[11px] mt-3 font-mono" style={{ color: "var(--color-outline)" }}>{formatRelative(note.updatedAt)}</span>
                    </Link>
                  );
                }) : (
                  <div className="md:col-span-3 p-4 rounded-2xl text-center" style={{ border: "1.5px dashed var(--color-outline-variant)" }}>
                    <p className="text-sm font-bold" style={{ color: "var(--color-on-surface-variant)" }}>Belum ada catatan. Mulai belajar!</p>
                  </div>
                )}

              </div>
            </section>
          </div>

          {/* ── Right Column (sidebar) ── */}
          <div className="col-span-1 lg:col-span-4 flex flex-col gap-4 md:gap-6">

            {/* Critical Quests */}
            <section className="p-4 md:p-5 rounded-2xl animate-slide-up delay-200" style={{ background: "white", border: "1px solid var(--color-outline-variant)" }}>
              <div className="flex items-center gap-2 mb-4 md:mb-5">
                <span className="material-symbols-outlined icon-filled" style={{ color: "var(--color-error)", fontSize: "20px" }}>campaign</span>
                <h3 className="font-bold text-base md:text-lg" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>Critical Quests</h3>
              </div>
              <div className="flex flex-col gap-3 md:gap-4">
                {pendingTasks.length > 0 ? pendingTasks.map((task, i) => {
                  const done = task.status === "done";
                  const dueDateStr = task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })
                    : "-";
                  const course = courses.find((c) => c.id === task.courseId);
                  return (
                    <div key={task.id}>
                      <label className="flex items-start gap-3 group cursor-pointer">
                        <input
                          type="checkbox"
                          checked={done}
                          onChange={() => toggleTask(task.id, task.status)}
                          className="mt-1 w-4 h-4 cursor-pointer"
                          style={{ accentColor: "var(--color-secondary)" }}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold transition-all" style={{ color: done ? "var(--color-on-surface-variant)" : "var(--color-on-surface)", textDecoration: done ? "line-through" : "none", opacity: done ? 0.5 : 1 }}>
                            {task.title}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono font-bold uppercase" style={{ color: "var(--color-on-surface-variant)" }}>{dueDateStr}</span>
                            {course && (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full" style={{ background: course.color, color: "var(--color-on-surface)" }}>{course.code}</span>
                            )}
                          </div>
                        </div>
                      </label>
                      {i < pendingTasks.length - 1 && <div className="mt-3 h-px" style={{ background: "var(--color-surface-variant)" }} />}
                    </div>
                  );
                }) : (
                  <div className="rounded-xl border border-dashed px-4 py-6 text-center" style={{ borderColor: "var(--color-outline-variant)", background: "var(--color-surface-container-low)" }}>
                    <p className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>Tidak ada deadline urgent</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--color-on-surface-variant)" }}>Santai dulu, tambah task kalau ada.</p>
                  </div>
                )}
              </div>
              <Link href="/tasks" className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95" style={{ background: "var(--color-primary)", color: "var(--color-on-primary)" }}>
                <span className="material-symbols-outlined icon-filled" style={{ fontSize: "18px" }}>checklist</span>
                Open Task Board
              </Link>
            </section>

            {/* K3 Toolbox */}
            <section className="p-4 md:p-5 rounded-2xl animate-slide-up delay-400" style={{ background: "white", border: "1px solid var(--color-outline-variant)" }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined icon-filled" style={{ color: "var(--color-secondary)", fontSize: "20px" }}>health_and_safety</span>
                <h3 className="font-bold text-base md:text-lg" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>Study Toolbox</h3>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between p-3 rounded-lg mt-2" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined icon-filled" style={{ color: "#16a34a", fontSize: "18px" }}>shield</span>
                    <span className="text-xs font-bold" style={{ color: "#15803d" }}>Safe Study Days</span>
                  </div>
                  <span className="text-sm font-mono font-bold" style={{ color: "#15803d" }}>{streak} Days</span>
                </div>
              </div>
            </section>

            {/* Hermes Tip Card */}
            {hermesVisible && (
              <div className="rounded-2xl overflow-hidden animate-slide-up delay-400" style={{ border: "1px solid var(--color-outline-variant)" }}>
                <div className="flex items-center gap-2 px-4 py-3" style={{ background: "var(--color-primary)" }}>
                  <span className="material-symbols-outlined icon-filled text-white" style={{ fontSize: "16px" }}>smart_toy</span>
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">Hermes</span>
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>LIVE</span>
                  <button onClick={() => setHermesVisible(false)} className="ml-auto opacity-60 hover:opacity-100 transition-opacity" aria-label="Dismiss">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: "16px" }}>close</span>
                  </button>
                </div>
                <div className="p-4" style={{ background: "linear-gradient(135deg, var(--color-surface-container-lowest) 0%, var(--color-pastel-peach) 100%)" }}>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-on-surface)" }}>
                    📅 Kamu punya <strong>{pendingTasks[0]?.title || "tugas"}</strong> yang perlu diselesaikan. Buka di workspace sekarang?
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Link href={`/study${pendingTasks[0] ? `?courseId=${pendingTasks[0].courseId}` : ""}`} className="px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:opacity-90 active:scale-95" style={{ background: "var(--color-primary)", color: "var(--color-on-primary)" }}>
                      Buka Study
                    </Link>
                    <button onClick={() => setHermesVisible(false)} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-80" style={{ background: "var(--color-surface-container)", color: "var(--color-on-surface-variant)" }}>
                      Nanti saja
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
