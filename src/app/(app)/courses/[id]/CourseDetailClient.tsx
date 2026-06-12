"use client";

import { useState } from "react";
import Link from "next/link";
import { createMaterial, createNote, createTask, deleteMaterial, deleteNote, deleteTask } from "@/app/actions/academic-actions";

type ModalKind = "material" | "note" | "task" | null;

const primaryBtn = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all hover:opacity-90 active:scale-95";
const secondaryBtn = "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all hover:bg-gray-50";
const iconBtn = "inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-gray-600 hover:bg-gray-50";

function ShellModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>{title}</h3>
          <button className={iconBtn} onClick={onClose}><span className="material-symbols-outlined text-[18px]">close</span></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function MaterialModal({ courseId, onClose }: { courseId: string; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("PDF");
  const [source, setSource] = useState("Local");
  const [fileName, setFileName] = useState("");
  const [url, setUrl] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  return (
    <ShellModal title="Add Material" onClose={onClose}>
      <div className="grid gap-3">
        <input className="rounded-xl border p-3 text-sm outline-none" placeholder="Judul materi" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <select className="rounded-xl border p-3 text-sm outline-none" value={type} onChange={(e) => setType(e.target.value)}>
            <option>PDF</option><option>PPT</option><option>Journal</option><option>Handout</option>
          </select>
          <select className="rounded-xl border p-3 text-sm outline-none" value={source} onChange={(e) => setSource(e.target.value)}>
            <option>Local</option><option>Drive</option>
          </select>
        </div>
        <input className="rounded-xl border p-3 text-sm outline-none" placeholder="File name / path" value={fileName} onChange={(e) => setFileName(e.target.value)} />
        <input className="rounded-xl border p-3 text-sm outline-none" placeholder="URL/path opsional" value={url} onChange={(e) => setUrl(e.target.value)} />
        <input type="number" min={1} className="rounded-xl border p-3 text-sm outline-none" placeholder="Total pages" value={totalPages} onChange={(e) => setTotalPages(Number(e.target.value))} />
        <button className={primaryBtn} disabled={loading} style={{ background: "var(--color-primary)", color: "var(--color-on-primary)" }} onClick={async () => {
          if (!title.trim()) return;
          setLoading(true);
          const safeFile = fileName.trim() || `${title.trim().replace(/\s+/g, "-")}.pdf`;
          await createMaterial({
            courseId,
            title: title.trim(),
            type,
            fileName: safeFile,
            url: url.trim() || "/api/drive/file/placeholder",
            totalPages: Math.max(1, totalPages || 1),
            source
          });
          setLoading(false);
          onClose();
        }}>{loading ? "Saving..." : "Save Material"}</button>
      </div>
    </ShellModal>
  );
}

function NoteModal({ courseId, materials, onClose }: { courseId: string; materials: any[]; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [linkedMaterialId, setLinkedMaterialId] = useState("");
  const [template, setTemplate] = useState("blank");
  const [loading, setLoading] = useState(false);

  return (
    <ShellModal title="New Note" onClose={onClose}>
      <div className="grid gap-3">
        <input className="rounded-xl border p-3 text-sm outline-none" placeholder="Judul catatan" value={title} onChange={(e) => setTitle(e.target.value)} />
        <select className="rounded-xl border p-3 text-sm outline-none" value={linkedMaterialId} onChange={(e) => setLinkedMaterialId(e.target.value)}>
          <option value="">No linked material</option>
          {materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select className="rounded-xl border p-3 text-sm outline-none" value={template} onChange={(e) => setTemplate(e.target.value)}>
          <option value="blank">Blank</option><option value="summary">Ringkasan Materi</option><option value="report">Draft Laporan</option><option value="regulation">Analisis Peraturan</option>
        </select>
        <button className={primaryBtn} disabled={loading} style={{ background: "var(--color-primary)", color: "var(--color-on-primary)" }} onClick={async () => {
          if (!title.trim()) return;
          setLoading(true);
          const body = template === "blank" ? `# ${title}\n\n` : template === "summary" ? `# ${title}\n\n## Poin Penting\n\n## Ringkasan\n\n## Pertanyaan\n` : template === "report" ? `# ${title}\n\n## Latar Belakang\n\n## Analisis\n\n## Kesimpulan\n` : `# ${title}\n\n## Dasar Hukum\n\n## Pasal Penting\n\n## Implikasi\n`;
          await createNote({
            courseId,
            title: title.trim(),
            content: body
          });
          setLoading(false);
          onClose();
        }}>{loading ? "Creating..." : "Create Note"}</button>
      </div>
    </ShellModal>
  );
}

function TaskModal({ course, materials, notes, onClose }: { course: any; materials: any[]; notes: any[]; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("assignment");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("todo");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [linkedMaterialId, setLinkedMaterialId] = useState("");
  const [linkedDocId, setLinkedDocId] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <ShellModal title="New Task" onClose={onClose}>
      <div className="grid gap-3">
        <input className="rounded-xl border p-3 text-sm outline-none" placeholder="Judul tugas" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <select className="rounded-xl border p-3 text-sm outline-none" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="assignment">Assignment</option><option value="quiz">Quiz</option><option value="report">Report</option><option value="presentation">Presentation</option><option value="exam">Exam</option><option value="practicum">Practicum</option>
          </select>
          <select className="rounded-xl border p-3 text-sm outline-none" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select className="rounded-xl border p-3 text-sm outline-none" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="backlog">Backlog</option><option value="todo">To Do</option><option value="inprogress">Doing</option><option value="review">Review</option><option value="done">Done</option>
          </select>
          <input type="date" className="rounded-xl border p-3 text-sm outline-none" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <select className="rounded-xl border p-3 text-sm outline-none" value={linkedMaterialId} onChange={(e) => setLinkedMaterialId(e.target.value)}>
          <option value="">No linked material</option>
          {materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select className="rounded-xl border p-3 text-sm outline-none" value={linkedDocId} onChange={(e) => setLinkedDocId(e.target.value)}>
          <option value="">No linked note</option>
          {notes.map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
        </select>
        <button className={primaryBtn} disabled={loading} style={{ background: "var(--color-primary)", color: "var(--color-on-primary)" }} onClick={async () => {
          if (!title.trim()) return;
          setLoading(true);
          await createTask({
            courseId: course.id,
            title: title.trim(),
            type,
            status,
            priority,
            dueDate,
          });
          setLoading(false);
          onClose();
        }}>{loading ? "Creating..." : "Create Task"}</button>
      </div>
    </ShellModal>
  );
}

export default function CourseDetailClient({ course, materials, notes, tasks }: { course: any; materials: any[]; notes: any[]; tasks: any[] }) {
  const [modal, setModal] = useState<ModalKind>(null);

  const semester = course.semester;
  const openStudyBase = `/study?courseId=${course.id}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-20 md:px-8 md:py-8 animate-fade-in">
      {modal === "material" && <MaterialModal courseId={course.id} onClose={() => setModal(null)} />}
      {modal === "note" && <NoteModal courseId={course.id} materials={materials} onClose={() => setModal(null)} />}
      {modal === "task" && <TaskModal course={course} materials={materials} notes={notes} onClose={() => setModal(null)} />}

      <Link href="/courses" className="mb-6 flex items-center gap-1 text-sm" style={{ color: "var(--color-primary)" }}><span className="material-symbols-outlined text-[18px]">arrow_back</span>Back to Courses</Link>

      <div className="relative flex flex-col gap-4 overflow-hidden rounded-3xl border bg-white p-6 md:p-8" style={{ borderColor: "var(--color-outline-variant)" }}>
        <div className="absolute left-0 top-0 h-3 w-full" style={{ background: course.color }} />
        <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl" style={{ background: course.color }}><span className="material-symbols-outlined icon-filled text-[32px]" style={{ color: "var(--color-primary)" }}>{course.icon}</span></div>
            <div><p className="mb-1 font-mono text-xs" style={{ color: "var(--color-on-surface-variant)" }}>{semester?.name || "No Semester"} • {course.code}</p><h2 className="text-2xl font-bold md:text-3xl" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>{course.name}</h2></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={secondaryBtn} onClick={() => setModal("material")}>+ Material</button>
            <button className={secondaryBtn} onClick={() => setModal("note")}>+ Note</button>
            <button className={secondaryBtn} onClick={() => setModal("task")}>+ Task</button>
            <Link href={openStudyBase} className={primaryBtn} style={{ background: "var(--color-primary)", color: "var(--color-on-primary)" }}><span className="material-symbols-outlined icon-filled text-[18px]">menu_book</span>Open Study Workspace</Link>
          </div>
        </div>
        <div className="mt-2"><div className="mb-1.5 flex justify-between font-mono text-[10px]" style={{ color: "var(--color-on-surface-variant)" }}><span>PROGRESS MATERI</span><span className="font-bold" style={{ color: "var(--color-primary)" }}>{course.progress}%</span></div><div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--color-outline-variant)" }}><div className="h-full rounded-full" style={{ width: `${course.progress}%`, background: "var(--color-secondary)" }} /></div></div>
      </div>

      <div className="mt-8 flex flex-col gap-10">
        <section>
          <SectionHeader icon="picture_as_pdf" title="Materials" count={materials.length} action="+ Add Material" onAction={() => setModal("material")} />
          {materials.length ? <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{materials.map((m) => <ItemCard key={m.id} icon={m.type === "PDF" ? "picture_as_pdf" : "description"} title={m.name} meta={`${m.type} • ${m.source} • ${m.totalPages} pages`} href={`${openStudyBase}&materialId=${m.id}`} onDelete={() => deleteMaterial(m.id, course.id)} />)}</div> : <EmptyState text="Belum ada materi." cta="Tambah materi pertama" onClick={() => setModal("material")} />}
        </section>
        <section>
          <SectionHeader icon="description" title="Notes" count={notes.length} action="+ New Note" onAction={() => setModal("note")} />
          {notes.length ? <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{notes.map((n) => <ItemCard key={n.id} icon="description" title={n.title} meta={`Updated ${new Date(n.updatedAt).toLocaleDateString()}`} href={`${openStudyBase}&docId=${n.id}`} onDelete={() => deleteNote(n.id, course.id)} />)}</div> : <EmptyState text="Belum ada catatan." cta="Buat catatan pertama" onClick={() => setModal("note")} />}
        </section>
        <section>
          <SectionHeader icon="task_alt" title="Tasks" count={tasks.length} action="+ New Task" onAction={() => setModal("task")} />
          {tasks.length ? <div className="flex flex-col gap-3">{tasks.map((t) => <ItemCard key={t.id} icon={t.status === "done" ? "check_circle" : "radio_button_unchecked"} title={t.title} meta={`${t.status.toUpperCase()} • ${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "No due"} • ${t.priority}`} href={`${openStudyBase}&taskId=${t.id}`} onDelete={() => deleteTask(t.id, course.id)} wide />)}</div> : <EmptyState text="Tidak ada tugas aktif." cta="Tambah tugas pertama" onClick={() => setModal("task")} />}
        </section>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, count, action, onAction }: { icon: string; title: string; count: number; action: string; onAction: () => void }) {
  return <div className="mb-4 flex items-center gap-2"><span className="material-symbols-outlined icon-filled" style={{ color: "var(--color-secondary)" }}>{icon}</span><h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>{title}</h3><span className="flex h-6 min-w-6 items-center justify-center rounded-full px-2 font-mono text-[10px] font-bold" style={{ background: "var(--color-surface-container)", color: "var(--color-on-surface-variant)" }}>{count}</span><button className={`${secondaryBtn} ml-auto`} onClick={onAction}>{action}</button></div>;
}

function EmptyState({ text, cta, onClick }: { text: string; cta: string; onClick: () => void }) {
  return <div className="rounded-2xl border border-dashed p-8 text-center" style={{ borderColor: "var(--color-outline-variant)" }}><p className="mb-3 text-sm text-gray-500">{text}</p><button className={primaryBtn} style={{ background: "var(--color-primary)", color: "var(--color-on-primary)" }} onClick={onClick}>{cta}</button></div>;
}

function ItemCard({ icon, title, meta, href, onDelete, wide }: { icon: string; title: string; meta: string; href: string; onDelete: () => void; wide?: boolean }) {
  return <div className={`group relative rounded-2xl border bg-white p-4 ${wide ? "flex items-center gap-4" : ""}`} style={{ borderColor: "var(--color-outline-variant)" }}><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50"><span className="material-symbols-outlined text-[20px]" style={{ color: "var(--color-primary)" }}>{icon}</span></div><div><h4 className="text-sm font-bold leading-snug">{title}</h4><p className="mt-1 font-mono text-[10px] text-gray-500">{meta}</p></div></div><div className="mt-3 flex gap-2 md:absolute md:right-3 md:top-3 md:mt-0 md:opacity-0 md:transition-opacity md:group-hover:opacity-100"><Link href={href} className={iconBtn}><span className="material-symbols-outlined text-[16px]">open_in_new</span></Link><button className={iconBtn} onClick={onDelete}><span className="material-symbols-outlined text-[16px] text-red-500">delete</span></button></div></div>;
}
