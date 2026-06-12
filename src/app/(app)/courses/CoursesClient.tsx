"use client";

import { useState } from "react";
import Link from "next/link";
import { createCourse, createSemester, deleteCourse, updateCourse } from "@/app/actions/academic-actions";
import { useAcademicStore } from "@/store/useAcademicStore";

type SortKey = "name" | "progress" | "tasks";

// ── Semester Modal ──────────────────────────────────────────────
function SemesterModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await createSemester({ name: name.trim(), active: true });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="w-full max-w-sm p-6 rounded-2xl animate-slide-up" style={{ background: "var(--color-surface-container-lowest)" }} onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-serif)" }}>Add Semester</h3>
        <div>
          <label className="text-xs font-bold mb-1 block">Semester Name</label>
          <input type="text" className="w-full p-2 rounded-lg border outline-none text-sm" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Semester 5" />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: "var(--color-surface-container)", color: "var(--color-on-surface-variant)" }}>Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: "var(--color-primary)", color: "var(--color-on-primary)" }}>{loading ? "Saving..." : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Course Modal ────────────────────────────────────────────────
function CourseModal({ course, semesters, onClose }: { course?: any; semesters: any[]; onClose: () => void }) {
  const [formData, setFormData] = useState(() =>
    course || {
      semesterId: semesters[0]?.id || "",
      code: "",
      name: "",
      lecturer: "",
      room: "",
      credits: 2,
      color: "var(--color-pastel-peach)",
      icon: "school",
      schedule: "",
    }
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!formData.name || !formData.code || !formData.semesterId) return;
    setLoading(true);
    if (course) {
      await updateCourse(course.id, formData);
    } else {
      await createCourse(formData);
    }
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="w-full max-w-md p-6 rounded-2xl animate-slide-up max-h-[90vh] overflow-y-auto" style={{ background: "var(--color-surface-container-lowest)" }} onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-serif)" }}>{course ? "Edit Course" : "Add Course"}</h3>
        
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-bold mb-1 block">Semester</label>
            <select className="w-full p-2 rounded-lg border outline-none text-sm" value={formData.semesterId} onChange={e => setFormData({ ...formData, semesterId: e.target.value })}>
              {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="text-xs font-bold mb-1 block">Code</label>
              <input type="text" className="w-full p-2 rounded-lg border outline-none text-sm" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="K3 101" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold mb-1 block">Course Name</label>
              <input type="text" className="w-full p-2 rounded-lg border outline-none text-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Higiene Industri" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold mb-1 block">Lecturer</label>
              <input type="text" className="w-full p-2 rounded-lg border outline-none text-sm" value={formData.lecturer} onChange={e => setFormData({ ...formData, lecturer: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block">Room/Link</label>
              <input type="text" className="w-full p-2 rounded-lg border outline-none text-sm" value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold mb-1 block">Schedule (Notes)</label>
              <input type="text" className="w-full p-2 rounded-lg border outline-none text-sm" value={formData.schedule} onChange={e => setFormData({ ...formData, schedule: e.target.value })} placeholder="Senin 08:00" />
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block">Credits (SKS)</label>
              <input type="number" className="w-full p-2 rounded-lg border outline-none text-sm" value={formData.credits} onChange={e => setFormData({ ...formData, credits: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold mb-1 block">Theme Color</label>
            <div className="flex gap-2">
              {["var(--color-pastel-peach)", "var(--color-pastel-mint)", "var(--color-pastel-lavender)", "var(--color-pastel-yellow)", "var(--color-pastel-blue)"].map(color => (
                <button
                  key={color}
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? "border-gray-800" : "border-transparent"}`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: "var(--color-surface-container)", color: "var(--color-on-surface-variant)" }}>Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: "var(--color-primary)", color: "var(--color-on-primary)" }}>{loading ? "Saving..." : "Save Course"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────
export default function CoursesClient({ initialCourses, initialSemesters }: { initialCourses: any[]; initialSemesters: any[] }) {
  const { isHydrated, courses: storeCourses, semesters: storeSemesters } = useAcademicStore();
  
  const currentCourses = isHydrated ? storeCourses : initialCourses;
  const currentSemesters = isHydrated ? storeSemesters : initialSemesters;

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("all");
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [semesterModalOpen, setSemesterModalOpen] = useState(false);

  const filtered = currentCourses
    .filter((c) => selectedSemesterId === "all" || c.semesterId === selectedSemesterId)
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "progress") return b.progress - a.progress;
      if (sort === "tasks") return b.tasksCount - a.tasksCount;
      return a.name.localeCompare(b.name);
    });

  const handleDeleteCourse = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // prevent Link navigation
    if (confirm("Delete this course and all its data?")) {
      await deleteCourse(id);
    }
  };

  // Group by semester
  const groupedCourses = currentSemesters.map(sem => ({
    semester: sem,
    courses: filtered.filter(c => c.semesterId === sem.id)
  })).filter(g => g.courses.length > 0);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-20 md:pb-8 animate-fade-in">
      {semesterModalOpen && (
        <SemesterModal onClose={() => setSemesterModalOpen(false)} />
      )}

      {modalOpen && (
        <CourseModal
          course={editingCourse}
          semesters={currentSemesters}
          onClose={() => { setModalOpen(false); setEditingCourse(null); }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 animate-slide-up">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
            Academic Journey
          </p>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>
            My Courses
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSemesterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold self-start sm:self-auto transition-all hover:opacity-90 active:scale-95"
            style={{ background: "var(--color-surface-container-high)", color: "var(--color-on-surface)" }}
          >
            <span className="material-symbols-outlined icon-filled" style={{ fontSize: "18px" }}>domain_add</span>
            Add Semester
          </button>
          <button
            onClick={() => { setEditingCourse(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold self-start sm:self-auto transition-all hover:opacity-90 active:scale-95"
            style={{ background: "var(--color-primary)", color: "var(--color-on-primary)" }}
          >
            <span className="material-symbols-outlined icon-filled" style={{ fontSize: "18px" }}>add</span>
            Add Course
          </button>
        </div>
      </div>

      {/* Semester Filter Pills & Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          <button
            onClick={() => setSelectedSemesterId("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedSemesterId === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            All Semesters
          </button>
          {initialSemesters.map(sem => (
            <button
              key={sem.id}
              onClick={() => setSelectedSemesterId(sem.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedSemesterId === sem.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {sem.name}
            </button>
          ))}
        </div>

        <div className="flex gap-2 shrink-0">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: "var(--color-on-surface-variant)" }}>search</span>
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl text-sm outline-none w-full sm:w-48 transition-colors"
              style={{ background: "var(--color-surface-container-lowest)", border: "1px solid var(--color-outline-variant)" }}
            />
          </div>
          <select 
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="px-3 py-2 rounded-xl text-sm font-medium outline-none cursor-pointer"
            style={{ background: "var(--color-surface-container-lowest)", border: "1px solid var(--color-outline-variant)" }}
          >
            <option value="name">A-Z</option>
            <option value="progress">Progress</option>
            <option value="tasks">Tasks</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 animate-slide-up delay-100">
        {[
          { label: "Mata Kuliah", value: initialCourses.length, icon: "school" },
          { label: "Total SKS", value: initialCourses.reduce((a, c) => a + c.credits, 0), icon: "star" },
          { label: "Total Catatan", value: initialCourses.reduce((a, c) => a + c.notesCount, 0), icon: "description" },
          { label: "Pending Tasks", value: initialCourses.reduce((a, c) => a + c.tasksCount, 0), icon: "task_alt" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-2xl flex items-center gap-3 card-hover" style={{ background: "var(--color-surface-container-low)", border: "1px solid var(--color-outline-variant)" }}>
            <span className="material-symbols-outlined icon-filled" style={{ fontSize: "22px", color: "var(--color-secondary)" }}>{s.icon}</span>
            <div>
              <p className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>{s.value}</p>
              <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--color-on-surface-variant)" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 animate-slide-up delay-200">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "var(--color-surface-container-low)", border: "1px solid var(--color-outline-variant)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--color-on-surface-variant)" }}>search</span>
          <input
            type="text"
            placeholder="Cari mata kuliah..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-sans)" }}
          />
        </div>
        <div className="flex gap-2">
          {(["name", "progress", "tasks"] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className="px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all"
              style={{
                background: sort === key ? "var(--color-primary)" : "var(--color-surface-container)",
                color: sort === key ? "var(--color-on-primary)" : "var(--color-on-surface-variant)",
              }}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* Course Cards Grid by Semester */}
      <div className="flex flex-col gap-10 animate-slide-up delay-300">
        {groupedCourses.map(({ semester, courses }) => (
          <div key={semester.id}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>
              <span className="material-symbols-outlined icon-filled" style={{ fontSize: "20px" }}>school</span>
              {semester.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="block rounded-2xl overflow-hidden card-hover relative group"
                  style={{ border: "1px solid var(--color-outline-variant)" }}
                >
                  {/* Card color bar */}
                  <div className="h-2 w-full" style={{ background: course.color }} />

            <div className="p-5" style={{ background: "white" }}>
              {/* Action menu */}
              <div className="absolute top-4 right-4 hidden group-hover:flex gap-1 z-20">
                <button onClick={(e) => { e.preventDefault(); setEditingCourse(course); setModalOpen(true); }} className="w-7 h-7 rounded-lg flex items-center justify-center bg-white shadow-sm hover:bg-gray-50 text-gray-600 border border-gray-100">
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>edit</span>
                </button>
                <button onClick={(e) => handleDeleteCourse(course.id, e)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-white shadow-sm hover:bg-red-50 text-red-500 border border-gray-100">
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
                </button>
              </div>

              {/* Header */}
              <div className="flex items-start justify-between mb-3 relative z-10">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: course.color }}
                >
                  <span className="material-symbols-outlined icon-filled" style={{ fontSize: "24px", color: "var(--color-primary)" }}>{course.icon}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="xp-badge">{course.code}</span>
                  <span className="text-[10px] font-mono" style={{ color: "var(--color-on-surface-variant)" }}>{course.credits} SKS</span>
                </div>
              </div>

              <h3 className="font-bold text-base leading-snug mb-1 pr-16" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>
                {course.name}
              </h3>
              <p className="text-xs mb-1" style={{ color: "var(--color-on-surface-variant)" }}>{course.lecturer}</p>
              <p className="text-xs mb-4" style={{ color: "var(--color-on-surface-variant)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "12px", verticalAlign: "middle" }}>room</span>{" "}
                {course.room || "No Room"}
              </p>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-[10px] font-mono mb-1.5" style={{ color: "var(--color-on-surface-variant)" }}>
                  <span>PROGRESS MATERI</span>
                  <span className="font-bold" style={{ color: "var(--color-primary)" }}>{course.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-outline-variant)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${course.progress}%`, background: "var(--color-secondary)" }}
                  />
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 pt-3" style={{ borderTop: "1px solid var(--color-surface-variant)" }}>
                {[
                  { icon: "description", val: course.notesCount, label: "notes" },
                  { icon: "picture_as_pdf", val: course.materialsCount, label: "files" },
                  { icon: "check_circle", val: course.tasksCount, label: "tasks", urgent: course.tasksCount > 1 },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: "14px", color: s.urgent ? "var(--color-error)" : "var(--color-on-surface-variant)" }}>{s.icon}</span>
                    <span className="text-xs font-mono font-bold" style={{ color: s.urgent ? "var(--color-error)" : "var(--color-on-surface-variant)" }}>{s.val}</span>
                  </div>
                ))}
                <div className="ml-auto flex items-center gap-1">
                  <span className="material-symbols-outlined icon-filled" style={{ fontSize: "14px", color: "var(--color-tertiary)" }}>star</span>
                  <span className="text-xs font-mono font-bold" style={{ color: "var(--color-tertiary)" }}>Lvl {course.level}</span>
                </div>
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1" style={{ fontSize: "18px", color: "var(--color-outline)" }}>arrow_forward</span>
              </div>
            </div>
          </Link>
        ))}
          </div>
        </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-1 md:col-span-2 p-12 rounded-2xl flex flex-col items-center gap-3" style={{ border: "1.5px dashed var(--color-outline-variant)" }}>
             <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "var(--color-outline-variant)" }}>search_off</span>
             <p className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>Tidak ada mata kuliah ditemukan</p>
          </div>
        )}
      </div>
    </div>
  );
}
