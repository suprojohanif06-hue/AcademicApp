"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { PdfViewerHandle } from "@/components/PdfViewer";
import { StudyEditorPane, StudyEditorPaneHandle } from "@/components/StudyEditorPane";
import { updateTask as updateTaskDB, createNote as createNoteDB, updateNote as updateNoteDB } from "@/app/actions/academic-actions";
import { useAcademicStore } from "@/store/useAcademicStore";

const PdfViewer = dynamic(() => import("@/components/PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-white">
      <div className="h-10 w-10 animate-spin rounded-full border-4" style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
      <p className="font-mono text-xs" style={{ color: "var(--color-on-surface-variant)" }}>Memuat viewer...</p>
    </div>
  ),
});

import { MOCK_COURSES, MOCK_MATERIALS, MOCK_NOTES, MOCK_TASKS, AcademicMaterial, AcademicNote, AcademicTask, CourseData } from "@/lib/academic-data";

type MobileTab = "pdf" | "editor";
type PdfCitation = { id: string; materialId: string; materialTitle: string; fileName: string; page: number; selectedText: string; quote?: string; wikilink: string };

const SEED_CONTENT = `# Ringkasan UU No. 1 Tahun 1970 — Keselamatan Kerja

UU No. 1 Tahun 1970 menjadi dasar utama keselamatan kerja di Indonesia. Ruang lingkupnya mencakup tempat kerja di darat, air, udara, maupun di dalam tanah.

Syarat keselamatan kerja diatur pada [[UU-No-1-Tahun-1970.pdf#page=5|Pasal 3 — Syarat K3]]. Pasal ini menekankan pencegahan kecelakaan, pemadaman kebakaran, pencegahan peledakan, jalur evakuasi, pertolongan kecelakaan, dan penyediaan APD.

Kewajiban pengurus untuk pembinaan pekerja dapat dikaitkan dengan [[UU-No-1-Tahun-1970.pdf#page=8|Pasal 9 — Pembinaan K3]].

Kewajiban menyediakan APD dan memasang aturan tertulis terkait K3 juga dijelaskan pada [[UU-No-1-Tahun-1970.pdf#page=10|Pasal 14 — Kewajiban Pengurus]].
`;

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 1800);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed bottom-6 right-4 z-50 flex max-w-xs items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-2xl" style={{ background: "var(--color-primary)", color: "var(--color-on-primary)" }}>
      <span className="material-symbols-outlined icon-filled text-base">check_circle</span>{message}
    </div>
  );
}

function sanitizeLabel(text: string) {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (!oneLine) return "";
  const pasal = oneLine.match(/Pasal\s+\d+[A-Za-z]?/i)?.[0];
  return (pasal || oneLine).slice(0, 60);
}

function StudyWorkspaceContent({ 
  initialCourses, 
  initialMaterials, 
  initialNotes, 
  initialTasks 
}: { 
  initialCourses: any[]; 
  initialMaterials: any[]; 
  initialNotes: any[]; 
  initialTasks: any[]; 
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("pdf");
  const [citations, setCitations] = useState<PdfCitation[]>([]);
  const [editorContent, setEditorContent] = useState(SEED_CONTENT);
  const [toast, setToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [checklistFocusId, setChecklistFocusId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeMaterial, setActiveMaterial] = useState<any>(initialMaterials[0] || null);
  
  const {
    isHydrated, setInitialData,
    tasks: storeTasks, courses: storeCourses, materials: storeMaterials, notes: storeNotes,
    addNote, updateNote, updateTask
  } = useAcademicStore();

  useEffect(() => {
    if (!isHydrated) {
      setInitialData({
        courses: initialCourses,
        materials: initialMaterials,
        notes: initialNotes,
        tasks: initialTasks.map(t => ({
          ...t,
          checklist: t.checklistData ? JSON.parse(t.checklistData) : [],
          attachments: t.attachmentsData ? JSON.parse(t.attachmentsData) : [],
        }))
      });
    }
  }, [isHydrated, initialTasks, initialCourses, initialMaterials, initialNotes, setInitialData]);

  const storedTasks = isHydrated ? storeTasks : initialTasks.map(t => ({
    ...t,
    checklist: t.checklistData ? JSON.parse(t.checklistData) : [],
    attachments: t.attachmentsData ? JSON.parse(t.attachmentsData) : [],
  }));
  const storedCourses = isHydrated ? storeCourses : initialCourses;
  const storedMaterials = isHydrated ? storeMaterials : initialMaterials;
  const storedNotes = isHydrated ? storeNotes : initialNotes;
  
  const [workspaceStarted, setWorkspaceStarted] = useState(false);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [courseContext, setCourseContext] = useState<CourseData | null>(null);
  const [taskContext, setTaskContext] = useState<AcademicTask | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [targetPage, setTargetPage] = useState(1);
  const [jumpNonce, setJumpNonce] = useState(0);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [isRightPaneOpen, setIsRightPaneOpen] = useState(true);
  const [pdfWidth, setPdfWidth] = useState(360);
  const [taskWidth, setTaskWidth] = useState(340);
  const [citePage, setCitePage] = useState(1);
  const [citeLabel, setCiteLabel] = useState("");
  const [rightPaneTab, setRightPaneTab] = useState<"assistant" | "outline" | "checklist">("assistant");
  const editorRef = useRef<StudyEditorPaneHandle>(null);
  const pdfViewerRef = useRef<PdfViewerHandle>(null);

  useEffect(() => setIsMounted(true), []);
  const showToast = useCallback((msg: string) => setToast(msg), []);

  const handleSave = useCallback(async (opts?: { quiet?: boolean }) => {
    const lines = editorContent.trim().split('\n');
    let title = "Untitled Note";
    const h1Match = lines.find(l => l.startsWith('# '));
    if (h1Match) title = h1Match.replace('# ', '').trim();

    const now = new Date().toISOString();
    
    if (currentNoteId && !currentNoteId.startsWith('new-')) {
      // Optimistic update
      updateNote(currentNoteId, { content: editorContent, title, updatedAt: now });
      // DB Action in background
      updateNoteDB(currentNoteId, { content: editorContent, title })
        .then(() => {
          if (!opts?.quiet) showToast("Note updated successfully");
        })
        .catch(err => {
          console.error("Failed to update note in DB:", err);
        });
    } else if (currentNoteId && currentNoteId.startsWith('new-')) {
      // Creation in progress. Just update store locally.
      updateNote(currentNoteId, { content: editorContent, title, updatedAt: now });
    } else {
      const newId = `new-${Date.now()}`;
      const newNote = {
        id: newId,
        title,
        content: editorContent,
        updatedAt: now,
        courseId: courseContext?.id || (storedCourses.length > 0 ? storedCourses[0].id : "")
      };
      
      // Optimistic create
      addNote(newNote);
      setCurrentNoteId(newId);
      
      // DB Action in background
      if (newNote.courseId) {
        createNoteDB({ courseId: newNote.courseId, title, content: editorContent })
          .then((createdNote) => {
            useAcademicStore.getState().updateNote(newId, createdNote);
            setCurrentNoteId(createdNote.id);
            if (!opts?.quiet) showToast("New note saved successfully");
          })
          .catch((err) => {
            console.error("Failed to create note in DB:", err);
            useAcademicStore.getState().deleteNote(newId);
            setCurrentNoteId(null);
            alert("Failed to save note to database.");
          });
      }
    }
  }, [editorContent, currentNoteId, courseContext, storedCourses, showToast, updateNote, addNote]);

  useEffect(() => {
    if (!currentNoteId) return;
    const timeout = setTimeout(() => {
      handleSave({ quiet: true });
    }, 2000);
    return () => clearTimeout(timeout);
  }, [editorContent, currentNoteId, handleSave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "PDF_SELECTION") {
        const label = sanitizeLabel(String(event.data.text || ""));
        if (event.data.page) setCitePage(Number(event.data.page));
        if (label) setCiteLabel(label);
      }
      if (event.data?.type === "PDF_PAGE_CHANGE") {
        const page = Number(event.data.page);
        if (page > 0) {
          setCitePage(page);
          setCurrentPage(page);
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    let urlChanged = false;
    const u = new URL(window.location.href);
    const hasDirectWorkspace = Boolean(searchParams.get("materialId") || searchParams.get("material") || searchParams.get("docId") || searchParams.get("taskId") || searchParams.get("page") || searchParams.get("workspace"));
    if (hasDirectWorkspace) setWorkspaceStarted(true);

    let activeDocId = searchParams.get("docId");
    let activeMaterialId = searchParams.get("materialId") ?? searchParams.get("material");

    // Context processing
    const courseId = searchParams.get("courseId");
    if (courseId) {
      const c = storedCourses.find((x) => x.id === courseId);
      if (c) setCourseContext(c);
      u.searchParams.delete("courseId");
      urlChanged = true;
    }

    const taskId = searchParams.get("taskId");
    const checklistId = searchParams.get("checklistId");
    if (taskId) {
      const t = storedTasks.find((x) => x.id === taskId);
      if (t) {
        setTaskContext(t);
        setIsRightPaneOpen(true);
        // ALWAYS default to checklist tab if taskId exists
        setRightPaneTab("checklist");
        
        if (checklistId) {
          setChecklistFocusId(checklistId);
          u.searchParams.delete("checklistId");
        }

        const c = storedCourses.find((x) => x.id === t.courseId);
        if (c) setCourseContext(c);

        // Auto-open task materials if none specified in URL
        if (!activeDocId && !activeMaterialId) {
          if (t.linkedDocId) {
            activeDocId = t.linkedDocId;
          } else if (t.linkedMaterialIds && t.linkedMaterialIds.length > 0) {
            activeMaterialId = t.linkedMaterialIds[0];
          }
        }
      }
      u.searchParams.delete("taskId");
      urlChanged = true;
    }

    if (activeDocId) {
      const n = storedNotes.find((x) => x.id === activeDocId);
      if (n) {
        setEditorContent(n.content);
        setCurrentNoteId(n.id);
      }
      u.searchParams.delete("docId");
      urlChanged = true;
    }

    if (activeMaterialId) {
      const m = storedMaterials.find((x) => x.id === activeMaterialId);
      if (m) {
        setActiveMaterial(m);
        setIsPdfOpen(true);
        setMobileTab("pdf");
      }
      u.searchParams.delete("materialId");
      u.searchParams.delete("material");
      urlChanged = true;
    }

    // Page jump processing
    const rawPage = Number.parseInt(searchParams.get("page") || "", 10);
    const maxPage = activeMaterial?.totalPages || 999;
    const page = Number.isFinite(rawPage) ? Math.max(1, Math.min(maxPage, rawPage)) : 0;
    if (page > 0) {
      setIsPdfOpen(true);
      setMobileTab("pdf");
      setTargetPage(page);
      setJumpNonce((n) => n + 1);
      setCurrentPage(page);
      setCitePage(page);
      showToast(`Opened page ${page}`);
      u.searchParams.delete("page");
      urlChanged = true;
    }

    if (urlChanged) {
      const qs = u.searchParams.toString();
      router.replace(`/study${qs ? `?${qs}` : ""}`, { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (checklistFocusId && rightPaneTab === "checklist") {
      const el = document.getElementById(`chk-${checklistFocusId}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [checklistFocusId, rightPaneTab]);

  const handleCite = useCallback(() => {
    const page = Math.max(1, Math.min((activeMaterial?.totalPages || 999) || 999, citePage || currentPage || 1));
    const label = sanitizeLabel(citeLabel) || `Halaman ${page}`;
    const wikilink = `[[${activeMaterial.fileName}#page=${page}|${label}]]`;
    const cit: PdfCitation = { id: `c${Date.now()}`, materialId: activeMaterial?.id || "m-0", materialTitle: activeMaterial?.title || "Unknown", fileName: activeMaterial?.fileName || "document.pdf", page, selectedText: label, wikilink };
    setCitations((prev) => [...prev, cit]);
    editorRef.current?.insertWikilink(wikilink);
    setMobileTab("editor");
    showToast(`Citation inserted — p.${page}`);
  }, [activeMaterial, citeLabel, citePage, currentPage, showToast]);

  const handleChipClick = useCallback((wikilink: string) => {
    const match = wikilink.match(/\[\[([^#|\]]+\.pdf)(?:#page=(\d+))?(?:\|([^\]]+))?\]\]/);
    if (!match) return;
    const mat = storedMaterials.find((m) => m.fileName === match[1]);
    const page = Number(match[2] || 1);
    if (mat) setActiveMaterial(mat);
    setIsPdfOpen(true);
    setMobileTab("pdf");
    setTargetPage(page);
    setJumpNonce((n) => n + 1);
    setCurrentPage(page);
    setCitePage(page);
    showToast(`Opened page ${page}`);
  }, [showToast, storedMaterials]);

  const materialOptions = storedMaterials;

  const openWorkspace = useCallback((opts?: { courseId?: string; materialId?: string; docId?: string; taskId?: string; initialContent?: string }) => {
    let finalDocId = opts?.docId;
    let finalMaterialId = opts?.materialId;
    let initialTaskContent = opts?.initialContent;

    if (opts?.courseId) {
      const c = storedCourses.find((x) => x.id === opts.courseId);
      if (c) setCourseContext(c);
    }
    if (opts?.taskId) {
      const t = storedTasks.find((x) => x.id === opts.taskId);
      if (t) {
        setTaskContext(t);
        setIsRightPaneOpen(true);
        setRightPaneTab("checklist");
        if (t.linkedMaterialIds && t.linkedMaterialIds.length > 0 && !finalMaterialId) {
          finalMaterialId = t.linkedMaterialIds[0];
        }
        if (t.linkedDocId && !finalDocId) {
          finalDocId = t.linkedDocId;
        } else if (!finalDocId) {
          initialTaskContent = `# ${t.title}\n\nStart your task draft here...`;
        }
      }
    }
    if (finalDocId) {
      const n = storedNotes.find((x) => x.id === finalDocId);
      if (n) {
        setEditorContent(n.content);
        setCurrentNoteId(n.id);
      }
    } else if (!finalDocId && !finalMaterialId && !opts?.taskId) {
      setEditorContent(opts?.initialContent !== undefined ? opts.initialContent : "# New Study Note\n\nStart typing your analysis here...");
      setCurrentNoteId(null);
    } else if (opts?.taskId && !finalDocId) {
      setEditorContent(initialTaskContent || "# New Study Note\n\nStart typing your analysis here...");
      setCurrentNoteId(null);
    }
    if (finalMaterialId) {
      const m = storedMaterials.find((x) => x.id === finalMaterialId);
      if (m) { setActiveMaterial(m); setIsPdfOpen(true); setTargetPage(1); setJumpNonce((v) => v + 1); }
    }
    setWorkspaceStarted(true);
  }, []);

  const handleUpdateTask = useCallback(async (updates: Partial<any>) => {
    if (!taskContext) return;
    const updated = { ...taskContext, ...updates };
    setTaskContext(updated);
    updateTask(updated.id, updates);
    
    // DB Update
    const dbUpdates = { ...updates };
    if (updates.checklist) {
      dbUpdates.checklistData = JSON.stringify(updates.checklist);
      delete dbUpdates.checklist;
    }
    await updateTaskDB(taskContext.id, dbUpdates);
  }, [taskContext, updateTask]);

  const startPdfResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = pdfWidth;
    const onMove = (mv: MouseEvent) => {
      const newW = Math.max(250, Math.min(600, startW + (mv.clientX - startX)));
      setPdfWidth(newW);
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); document.body.style.cursor = 'default'; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
  }, [pdfWidth]);

  const startTaskResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = taskWidth;
    const onMove = (mv: MouseEvent) => {
      const newW = Math.max(250, Math.min(500, startW - (mv.clientX - startX)));
      setTaskWidth(newW);
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); document.body.style.cursor = 'default'; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
  }, [taskWidth]);

  if (!isMounted) return <div className="flex h-screen items-center justify-center text-xs font-mono text-gray-500">Loading Study Workspace...</div>;

  if (!workspaceStarted) {
    const visibleCourses = storedCourses;
    const scopedMaterials = courseContext ? storedMaterials.filter((m) => m.courseId === courseContext.id) : storedMaterials;
    const scopedNotes = courseContext ? storedNotes.filter((n) => n.courseId === courseContext.id) : storedNotes;
    const scopedTasks = courseContext ? storedTasks.filter((t) => t.courseId === courseContext.id) : storedTasks;
    return <StudyDashboard courses={visibleCourses} materials={scopedMaterials} notes={scopedNotes} tasks={scopedTasks} courseContext={courseContext} onStart={openWorkspace} />;
  }


  const pdfPane = (
    <div className="flex h-full flex-col overflow-hidden bg-[#525659]">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-2" style={{ background: "var(--color-surface-container-lowest)", borderColor: "var(--color-outline-variant)" }}>
        <div className="flex min-w-0 items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">description</span>
          <select className="min-w-0 max-w-[190px] truncate bg-transparent text-xs font-bold outline-none" value={activeMaterial?.id || ""} onChange={(e) => { const mat = materialOptions.find((m) => m.id === e.target.value) || materialOptions[0]; setActiveMaterial(mat); setTargetPage(1); setJumpNonce((n) => n + 1); }}>
            {materialOptions.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input value={citeLabel} onChange={(e) => setCiteLabel(e.target.value)} placeholder="label" className="w-24 rounded-full border px-2 py-1 text-[10px]" />
          <input type="number" value={citePage} onChange={(e) => setCitePage(Number(e.target.value) || 1)} className="w-12 rounded-full border px-2 py-1 text-[10px]" title="Page number" />
          <button onClick={handleCite} className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-bold text-orange-900 shadow-sm hover:bg-orange-200"><span className="material-symbols-outlined align-middle text-[13px]">format_quote</span> Cite</button>
          <button onClick={() => setIsPdfOpen(false)} className="rounded p-1 hover:bg-gray-200" title="Close PDF"><span className="material-symbols-outlined text-[18px]">left_panel_close</span></button>
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden p-2 bg-[#e5e7eb]">
        <PdfViewer ref={pdfViewerRef} url={activeMaterial?.url || "/api/drive/file/placeholder"} page={targetPage} key={`${activeMaterial?.id || "pdf"}-${targetPage}-${jumpNonce}`} />
      </div>
    </div>
  );

  const taskPane = (
    <div className="flex h-full flex-col overflow-hidden border-l bg-[#fafafa]" style={{ borderColor: "var(--color-outline-variant)" }}>
      {/* Header Tabs */}
      <div className="flex shrink-0 items-center border-b px-2 py-2 bg-white gap-1" style={{ borderColor: "var(--color-outline-variant)" }}>
        <button onClick={() => setRightPaneTab("assistant")} className={`flex-1 rounded px-2 py-1.5 text-xs font-bold transition-colors ${rightPaneTab === "assistant" ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-100"}`}>AI Assistant</button>
        <button onClick={() => setRightPaneTab("outline")} className={`flex-1 rounded px-2 py-1.5 text-xs font-bold transition-colors ${rightPaneTab === "outline" ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-100"}`}>Outline</button>
        {taskContext && <button onClick={() => setRightPaneTab("checklist")} className={`flex-1 rounded px-2 py-1.5 text-xs font-bold transition-colors ${rightPaneTab === "checklist" ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-100"}`}>Task</button>}
        <button onClick={() => setIsRightPaneOpen(false)} className="rounded p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-800 transition-colors shrink-0 ml-1" title="Close"><span className="material-symbols-outlined text-[18px]">close</span></button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {rightPaneTab === "assistant" && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="bg-white border rounded-xl p-3 shadow-sm text-sm text-gray-700" style={{ borderColor: "var(--color-outline-variant)" }}>
                Halo! Saya Hermes AI. Anda bisa memblok teks di editor atau PDF, lalu ketik pertanyaan di bawah ini untuk berdiskusi.
              </div>
            </div>
            <div className="mt-4 shrink-0 relative">
              <input type="text" placeholder="Tanya sesuatu..." className="w-full bg-white border rounded-full pl-4 pr-10 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 transition-colors" style={{ borderColor: "var(--color-outline-variant)" }} />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"><span className="material-symbols-outlined text-[16px]">arrow_upward</span></button>
            </div>
          </div>
        )}

        {rightPaneTab === "outline" && (
          <div>
            <h4 className="font-bold text-xs tracking-wide text-gray-500 uppercase mb-3">Document Outline</h4>
            <div className="text-sm text-gray-400 italic bg-white border p-3 rounded-xl border-dashed" style={{ borderColor: "var(--color-outline-variant)" }}>
              Daftar isi akan otomatis terbuat dari Heading (H1, H2, H3) di dalam dokumen.
            </div>
          </div>
        )}

        {rightPaneTab === "checklist" && taskContext && (
          <div className="flex flex-col gap-4">
            <div className="bg-white border rounded-xl p-4 shadow-sm" style={{ borderColor: "var(--color-outline-variant)" }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm tracking-wide text-gray-800 uppercase">{taskContext.title || "Study Session Checklist"}</h4>
                <span className="px-2.5 py-0.5 rounded-full bg-gray-200 text-gray-700 text-[10px] font-bold tracking-widest">LVL 04</span>
              </div>
              
              {taskContext.checklist && taskContext.checklist.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {taskContext.checklist.map(item => (
                    <label id={`chk-${item.id}`} key={item.id} className={`flex items-start gap-3 cursor-pointer group p-2 rounded-lg transition-colors ${checklistFocusId === item.id ? 'bg-yellow-100 ring-2 ring-yellow-400' : 'hover:bg-gray-50'}`}>
                      <div className="relative flex items-center justify-center w-4 h-4 mt-0.5 shrink-0">
                        <input 
                          type="checkbox" 
                          checked={item.completed}
                          onChange={(e) => {
                            const newChecklist = taskContext.checklist!.map((c: any) => c.id === item.id ? { ...c, completed: e.target.checked } : c);
                            handleUpdateTask({ checklist: newChecklist });
                          }}
                          className="peer absolute opacity-0 w-full h-full cursor-pointer"
                        />
                        <div className="w-4 h-4 border-2 rounded-sm border-gray-300 peer-checked:bg-black peer-checked:border-black transition-colors flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-[12px] opacity-0 peer-checked:opacity-100 font-bold">check</span>
                        </div>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-sm font-bold transition-colors ${item.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.text}</span>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">Tidak ada checklist spesifik untuk tugas ini.</div>
              )}
            </div>

            <div className="bg-white border rounded-xl p-4 shadow-sm" style={{ borderColor: "var(--color-outline-variant)" }}>
              <h4 className="font-bold text-xs tracking-wide text-gray-500 uppercase mb-3">Study Progress</h4>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-gray-700">Document Completion</span>
                <span className="text-sm font-bold text-gray-900">68%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-green-500 rounded-full" style={{ width: "68%" }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const desktopColumns = isPdfOpen && isRightPaneOpen
    ? `${pdfWidth}px minmax(0, 1fr) ${taskWidth}px`
    : isPdfOpen
      ? `${pdfWidth}px minmax(0, 1fr)`
      : isRightPaneOpen
        ? `minmax(0, 1fr) ${taskWidth}px`
        : "minmax(0, 1fr)";

  return (
    <div className="fixed inset-0 z-[200] flex flex-col overflow-hidden bg-white animate-fade-in">
      
      {/* Omnisearch (Command Palette) */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[250] flex items-start justify-center pt-20 px-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setIsSearchOpen(false)}>
          <div className="w-full max-w-xl rounded-2xl shadow-2xl p-4 animate-slide-up" style={{ background: "var(--color-surface-container-highest)", border: "1px solid var(--color-outline)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-3 py-2 border-b border-outline-variant mb-4">
              <span className="material-symbols-outlined text-gray-400">search</span>
              <input 
                autoFocus 
                className="bg-transparent outline-none flex-1 text-sm" 
                placeholder="Search everything (notes, PDFs, commands)..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <span className="text-[10px] font-bold text-gray-400 border px-1.5 py-0.5 rounded">ESC</span>
            </div>
            <div className="max-h-60 overflow-y-auto flex flex-col gap-1">
              <p className="text-[10px] uppercase font-bold text-gray-400 px-3 py-1">Recent Results</p>
              {editorContent.toLowerCase().includes(searchQuery.toLowerCase()) && searchQuery.length > 2 && (
                 <div className="p-3 hover:bg-white/10 rounded-xl cursor-pointer flex items-center gap-3 transition-colors">
                   <span className="material-symbols-outlined text-blue-400">description</span>
                   <div>
                     <p className="text-xs font-bold">In current note: "{searchQuery}"</p>
                     <p className="text-[10px] opacity-60">Snippet: ...{editorContent.slice(editorContent.toLowerCase().indexOf(searchQuery.toLowerCase()) - 20, editorContent.toLowerCase().indexOf(searchQuery.toLowerCase()) + 40)}...</p>
                   </div>
                 </div>
              )}
              {materialOptions.map(m => (
                <div key={m.id} onClick={() => { setActiveMaterial(m); setMobileTab("pdf"); setTargetPage(1); setJumpNonce(n=>n+1); setIsPdfOpen(true); setIsSearchOpen(false); }} className="p-3 hover:bg-white/10 rounded-xl cursor-pointer transition-colors flex items-center gap-3 group">
                  <span className="material-symbols-outlined text-red-400 group-hover:scale-110 transition-transform">picture_as_pdf</span>
                  <div>
                    <p className="text-xs font-bold">{m.title}</p>
                    <p className="text-[10px] opacity-60">{m.fileName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      <div className="flex h-14 shrink-0 items-center gap-4 border-b px-4 animate-slide-up" style={{ background: "var(--color-surface)", borderColor: "var(--color-outline-variant)" }}>
        <div className="flex items-center gap-1">
          <button onClick={() => setWorkspaceStarted(false)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-200 transition-colors mr-1" title="Back to Study Dashboard">
            <span className="material-symbols-outlined text-[20px] text-gray-700">arrow_back</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-gray-700">menu_book</span>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest leading-none text-gray-500 mb-0.5">ACADEMIC WORKSPACE</p>
              <h1 className="font-serif text-base font-bold text-black leading-none">Study Workspace</h1>
            </div>
          </div>
        </div>
        <div className="hidden h-6 w-px bg-gray-300 md:block" />
        <nav className="hidden items-center gap-2 text-sm md:flex z-[100]">
          {/* FILE MENU */}
          <div className="relative group">
            <button className="font-bold text-black px-2 py-1.5 rounded hover:bg-gray-100">File</button>
            <div className="absolute left-0 top-full hidden w-48 flex-col rounded-xl border bg-white p-1 shadow-xl group-hover:flex z-50" style={{ borderColor: "var(--color-outline-variant)" }}>
              <button onClick={() => { setEditorContent("# New Study Note\n\nStart typing your analysis here..."); setCurrentNoteId(null); setCourseContext(null); setTaskContext(null); }} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm hover:bg-gray-100">
                <span className="material-symbols-outlined text-[16px] text-gray-500">note_add</span> New Note
              </button>
              <button onClick={() => handleSave()} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm hover:bg-gray-100">
                <span className="material-symbols-outlined text-[16px] text-gray-500">save</span> Save
              </button>
              <div className="my-1 h-px bg-gray-200 mx-2"></div>
              <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm hover:bg-gray-100">
                <span className="material-symbols-outlined text-[16px] text-gray-500">picture_as_pdf</span> Export as PDF
              </button>
            </div>
          </div>

          {/* INSERT MENU */}
          <div className="relative group">
            <button className="text-gray-600 hover:text-black px-2 py-1.5 rounded hover:bg-gray-100">Insert</button>
            <div className="absolute left-0 top-full hidden w-48 flex-col rounded-xl border bg-white p-1 shadow-xl group-hover:flex z-50" style={{ borderColor: "var(--color-outline-variant)" }}>
              <button onClick={() => editorRef.current?.editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm hover:bg-gray-100">
                <span className="material-symbols-outlined text-[16px] text-gray-500">table_chart</span> Table
              </button>
              <button onClick={() => {
                const url = window.prompt("Image URL:");
                if (url) editorRef.current?.editor?.chain().focus().setImage({ src: url }).run();
              }} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm hover:bg-gray-100">
                <span className="material-symbols-outlined text-[16px] text-gray-500">image</span> Image
              </button>
              <button onClick={() => {
                editorRef.current?.editor?.chain().focus().insertContent(`<div data-callout="INFO"><p>New Callout</p></div>`).run();
              }} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm hover:bg-gray-100">
                <span className="material-symbols-outlined text-[16px] text-gray-500">info</span> Callout
              </button>
              <button onClick={() => editorRef.current?.editor?.chain().focus().toggleTaskList().run()} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm hover:bg-gray-100">
                <span className="material-symbols-outlined text-[16px] text-gray-500">checklist</span> Task List
              </button>
            </div>
          </div>

          {/* FORMAT MENU */}
          <div className="relative group">
            <button className="text-gray-600 hover:text-black px-2 py-1.5 rounded hover:bg-gray-100">Format</button>
            <div className="absolute left-0 top-full hidden w-48 flex-col rounded-xl border bg-white p-1 shadow-xl group-hover:flex z-50" style={{ borderColor: "var(--color-outline-variant)" }}>
              <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Text</div>
              <button onClick={() => editorRef.current?.editor?.chain().focus().toggleBold().run()} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm hover:bg-gray-100">
                <span className="material-symbols-outlined text-[16px] text-gray-500">format_bold</span> Bold
              </button>
              <button onClick={() => editorRef.current?.editor?.chain().focus().toggleItalic().run()} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm hover:bg-gray-100">
                <span className="material-symbols-outlined text-[16px] text-gray-500">format_italic</span> Italic
              </button>
              <div className="my-1 h-px bg-gray-200 mx-2"></div>
              <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Paragraph</div>
              <button onClick={() => editorRef.current?.editor?.chain().focus().setHeading({ level: 1 }).run()} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm hover:bg-gray-100">
                <span className="material-symbols-outlined text-[16px] text-gray-500">title</span> Heading 1
              </button>
              <button onClick={() => editorRef.current?.editor?.chain().focus().setTextAlign('center').run()} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm hover:bg-gray-100">
                <span className="material-symbols-outlined text-[16px] text-gray-500">format_align_center</span> Align Center
              </button>
            </div>
          </div>

          {/* TOOLS MENU */}
          <div className="relative group">
            <button className="text-gray-600 hover:text-black px-2 py-1.5 rounded hover:bg-gray-100">Tools</button>
            <div className="absolute left-0 top-full hidden w-48 flex-col rounded-xl border bg-white p-1 shadow-xl group-hover:flex z-50" style={{ borderColor: "var(--color-outline-variant)" }}>
              <button onClick={() => {
                const words = editorRef.current?.editor?.storage.characterCount.words();
                const chars = editorRef.current?.editor?.storage.characterCount.characters();
                alert(`Word Count: ${words} words\nCharacters: ${chars}`);
              }} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm hover:bg-gray-100">
                <span className="material-symbols-outlined text-[16px] text-gray-500">pin_invoke</span> Word count
              </button>
              <button onClick={() => {
                setIsPdfOpen(false);
                setIsRightPaneOpen(false);
              }} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm hover:bg-gray-100">
                <span className="material-symbols-outlined text-[16px] text-gray-500">fullscreen</span> Focus Mode
              </button>
            </div>
          </div>
        </nav>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <select 
            value={courseContext?.id || ""} 
            onChange={(e) => {
              const c = storedCourses.find(c => c.id === e.target.value);
              setCourseContext(c || null);
            }}
            className="ml-auto hidden shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-mono font-bold md:flex outline-none cursor-pointer hover:opacity-80 transition-opacity" 
            style={{ background: courseContext ? courseContext.color : "#f1f5f9", color: "var(--color-primary)", border: "none" }}
          >
            <option value="">+ Assign Course</option>
            {storedCourses.map(c => (
              <option key={c.id} value={c.id}>{c.code}</option>
            ))}
          </select>
          {taskContext && (
            <button onClick={() => setIsRightPaneOpen(!isRightPaneOpen)} className={`hidden shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-mono font-bold transition-colors md:flex ${isRightPaneOpen ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`} style={{ background: "var(--color-error-container)", color: "var(--color-error)" }}>
              <span className="material-symbols-outlined text-[12px]">task_alt</span>
              DUE {taskContext.dueDate ? new Date(taskContext.dueDate).toLocaleDateString() : "No Date"}
            </button>
          )}
        </div>
        <div className="hidden items-center gap-1 rounded-full border bg-white px-2 py-1 md:flex" style={{ borderColor: "var(--color-outline-variant)" }}>
          <button onClick={() => setIsPdfOpen((v) => !v)} className="rounded-full p-1 hover:bg-gray-100" title={isPdfOpen ? "Close PDF pane" : "Open PDF pane"}>
            <span className="material-symbols-outlined text-[18px] opacity-80">{isPdfOpen ? "left_panel_close" : "left_panel_open"}</span>
          </button>
          <button onClick={() => setIsRightPaneOpen((v) => !v)} className="rounded-full p-1 hover:bg-gray-100" title={isRightPaneOpen ? "Close right pane" : "Open right pane"}>
            <span className="material-symbols-outlined text-[18px] opacity-80">{isRightPaneOpen ? "right_panel_close" : "right_panel_open"}</span>
          </button>
        </div>
        <span className="hidden rounded-full px-2 py-0.5 text-[9px] font-bold md:inline-flex" style={{ background: "var(--color-pastel-mint)", color: "var(--color-primary)" }}>PDF++</span>
        <button className="rounded-lg bg-black px-3 py-1.5 text-xs font-bold text-white">Sync</button>
      </div>

      <div className="flex shrink-0 md:hidden">
        {(["pdf", "editor"] as const).map((t) => <button key={t} onClick={() => setMobileTab(t)} className="flex-1 py-3 text-xs font-bold uppercase" style={{ background: mobileTab === t ? "var(--color-primary)" : "transparent", color: mobileTab === t ? "var(--color-on-primary)" : "var(--color-on-surface-variant)" }}>{t}</button>)}
      </div>

      <div className="relative hidden flex-1 overflow-hidden bg-[#f8f9fb] md:block">
        {!isPdfOpen && (
          <button onClick={() => setIsPdfOpen(true)} className="absolute left-3 top-1/2 z-30 flex -translate-y-1/2 items-center gap-1 rounded-full bg-[#0b1020] px-2 py-2 text-white shadow-lg" title="Open PDF pane">
            <span className="material-symbols-outlined text-[18px]">left_panel_open</span>
          </button>
        )}
        {!isRightPaneOpen && (
          <button onClick={() => setIsRightPaneOpen(true)} className="absolute right-3 top-1/2 z-30 flex -translate-y-1/2 items-center gap-1 rounded-full bg-[#0b1020] px-2 py-2 text-white shadow-lg" title="Open context pane">
            <span className="material-symbols-outlined text-[18px]">right_panel_open</span>
          </button>
        )}
        {isPdfOpen && (
          <div
            onMouseDown={startPdfResize}
            className="absolute top-0 z-40 h-full w-2 cursor-col-resize hover:bg-blue-400/30 active:bg-blue-500/40"
            style={{ left: `${pdfWidth - 4}px` }}
            title="Drag to resize PDF pane"
          />
        )}
        {isRightPaneOpen && (
          <div
            onMouseDown={startTaskResize}
            className="absolute top-0 z-40 h-full w-2 cursor-col-resize hover:bg-blue-400/30 active:bg-blue-500/40"
            style={{ right: `${taskWidth - 4}px` }}
            title="Drag to resize context pane"
          />
        )}
        <div className="grid h-full transition-[grid-template-columns] duration-150" style={{ gridTemplateColumns: desktopColumns }}>
          {isPdfOpen && (
            <div className="h-full overflow-hidden border-r animate-slide-up delay-100" style={{ borderColor: "var(--color-outline-variant)" }}>
              {pdfPane}
            </div>
          )}
          <div className="h-full min-w-0 overflow-hidden bg-[#f1f3f6] animate-slide-up delay-150">
            <StudyEditorPane key="desktop-editor" noteId={currentNoteId || "new"} ref={editorRef} citations={citations} onRemoveCitation={(id) => setCitations((prev) => prev.filter((c) => c.id !== id))} onChipClick={handleChipClick} editorContent={editorContent} setEditorContent={setEditorContent} isPdfOpen={isPdfOpen} setIsPdfOpen={setIsPdfOpen} />
          </div>
          {isRightPaneOpen && (
            <div className="h-full min-w-0 overflow-hidden animate-slide-up delay-200">
              {taskPane}
            </div>
          )}
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden md:hidden">
        <div className="absolute inset-0" style={{ display: mobileTab === "pdf" ? "block" : "none" }}>{pdfPane}<div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1.5 font-mono text-[10px] font-bold text-white">Pg. {currentPage}</div></div>
        <div className="absolute inset-0" style={{ display: mobileTab === "editor" ? "block" : "none" }}><StudyEditorPane key="mobile-editor" noteId={currentNoteId || "new-mobile"} ref={editorRef} citations={citations} onRemoveCitation={(id) => setCitations((prev) => prev.filter((c) => c.id !== id))} onChipClick={handleChipClick} editorContent={editorContent} setEditorContent={setEditorContent} isPdfOpen={true} setIsPdfOpen={() => {}} /></div>
      </div>
    </div>
  );
}


function StudyDashboard({ courses, materials, notes, tasks, courseContext, onStart }: { courses: any[]; materials: any[]; notes: any[]; tasks: any[]; courseContext: any | null; onStart: (opts?: { courseId?: string; materialId?: string; docId?: string; taskId?: string; initialContent?: string }) => void }) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courseContext?.id || "all");
  const [docType, setDocType] = useState<string>("all");
  const [dashSearch, setDashSearch] = useState("");

  const templates = [
    { id: "blank", name: "Dokumen kosong", subtitle: "A4", icon: "add", color: "var(--color-primary)", bg: "var(--color-surface-container-lowest)", isBlank: true, type: "note", content: "" },
    { id: "rangkuman", name: "Rangkuman UTS", subtitle: "Struktur K3", icon: "list_alt", color: "#16a34a", bg: "#f0fdf4", type: "summary", content: "<h1>Rangkuman UTS</h1><p><br/></p><h2>Poin Penting</h2><ul data-type=\"bulletList\"><li><p></p></li></ul><h2>Penjelasan Detail</h2><p><br/></p>" },
    { id: "jsa", name: "Analisis JSA", subtitle: "Tabel risiko", icon: "table", color: "#0284c7", bg: "#f0f9ff", type: "report", content: "<h1>Job Safety Analysis (JSA)</h1><p><strong>Pekerjaan:</strong> </p><p><strong>Tanggal:</strong> </p><p><br/></p><table><tbody><tr><th><p>Langkah Kerja</p></th><th><p>Potensi Bahaya</p></th><th><p>Tindakan Pengendalian</p></th></tr><tr><td><p>1.</p></td><td><p></p></td><td><p></p></td></tr><tr><td><p>2.</p></td><td><p></p></td><td><p></p></td></tr></tbody></table>" },
    { id: "audit", name: "Laporan Audit", subtitle: "Resmi", icon: "shield", color: "#b91c1c", bg: "#fef2f2", type: "report", content: "<h1>Laporan Audit K3</h1><p><strong>Tanggal Audit:</strong> </p><p><strong>Auditor:</strong> </p><p><br/></p><h2>1. Temuan Positif</h2><ul data-type=\"bulletList\"><li><p></p></li></ul><h2>2. Area Peningkatan (Ketidaksesuaian)</h2><ul data-type=\"bulletList\"><li><p></p></li></ul><h2>3. Rekomendasi</h2><ul data-type=\"bulletList\"><li><p></p></li></ul>" },
    { id: "tugas", name: "Tugas Makalah", subtitle: "Koral", icon: "article", color: "#7e22ce", bg: "#faf5ff", type: "assignment", content: "<h1>Tugas Makalah</h1><p><br/></p><h2>BAB I Pendahuluan</h2><p><br/></p><h2>BAB II Pembahasan</h2><p><br/></p><h2>BAB III Penutup</h2><p><br/></p>" },
  ];

  const filteredNotes = notes.filter((n) => {
    const courseOk = selectedCourseId === "all" || n.courseId === selectedCourseId;
    const searchOk = dashSearch === "" || n.title.toLowerCase().includes(dashSearch.toLowerCase()) || n.content.toLowerCase().includes(dashSearch.toLowerCase());
    return courseOk && searchOk;
  });
  
  const filteredMaterials = materials.filter((m) => {
    const courseOk = selectedCourseId === "all" || m.courseId === selectedCourseId;
    const searchOk = dashSearch === "" || m.title.toLowerCase().includes(dashSearch.toLowerCase()) || m.fileName.toLowerCase().includes(dashSearch.toLowerCase());
    return courseOk && searchOk;
  });

  const filteredTasks = tasks.filter((t) => {
    const courseOk = selectedCourseId === "all" || t.courseId === selectedCourseId;
    const searchOk = dashSearch === "" || t.title.toLowerCase().includes(dashSearch.toLowerCase());
    return courseOk && searchOk && t.status !== "done";
  });

  const activeCourse = courses.find((c) => c.id === selectedCourseId);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-transparent animate-fade-in">
      <div className="flex-1 overflow-y-auto pb-20 md:pb-8">
        {/* Header */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-6 md:pt-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 animate-slide-up">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
              Study Space & Documents
            </p>
            <h2 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>
              Study Workspace
            </h2>
          </div>
          
          {/* Search & Course Filter */}
          <div className="flex gap-2 items-center shrink-0">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: "var(--color-on-surface-variant)" }}>search</span>
              <input 
                type="text" 
                placeholder="Search notes..." 
                value={dashSearch}
                onChange={(e) => setDashSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl text-sm outline-none w-full sm:w-48 transition-colors"
                style={{ background: "var(--color-surface-container-lowest)", border: "1px solid var(--color-outline-variant)" }}
              />
            </div>
            <select 
              className="rounded-xl border bg-white px-3 py-2 text-sm font-medium outline-none cursor-pointer" 
              style={{ borderColor: "var(--color-outline-variant)", color: "var(--color-primary)" }}
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
            >
              <option value="all">Semua Mata Kuliah</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>
        {/* Template Gallery */}
        <div className="bg-transparent pb-8 pt-6 animate-slide-up delay-100">
          <div className="mx-auto max-w-5xl px-4 md:px-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--color-on-surface-variant)" }}>Mulai Petualangan</p>
                <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>Pilih Template Laporan</h2>
              </div>
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1 rounded-full px-4 py-2 text-xs font-bold transition-all hover:bg-gray-100" style={{ color: "var(--color-primary)" }}>
                  Galeri Lengkap <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pt-2 pb-4 px-1 snap-x no-scrollbar">
              {templates.map(t => (
                <div key={t.id} onClick={() => onStart({ initialContent: t.content })} className="flex shrink-0 snap-start flex-col gap-3 cursor-pointer group">
                  <div className={`flex h-[180px] w-[140px] items-center justify-center rounded-2xl border shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md ${t.isBlank ? "bg-white" : ""}`} style={{ backgroundColor: t.isBlank ? "white" : t.bg, borderColor: "var(--color-outline-variant)" }}>
                    <span className="material-symbols-outlined transition-transform duration-300 group-hover:scale-110" style={{ fontSize: t.isBlank ? "48px" : "32px", color: t.color }}>{t.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>{t.name}</p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500 mt-1">{t.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Documents */}
        <div className="mx-auto max-w-5xl px-4 md:px-8 mt-10 pb-20 animate-slide-up delay-200">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--color-on-surface-variant)" }}>Riwayat Perjalanan</p>
                <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>Dokumen Aktif</h2>
              </div>
              <div className="flex items-center gap-2">
                <select 
                  className="rounded-full border bg-white px-4 py-2 text-xs font-bold outline-none transition-all hover:bg-gray-50" 
                  style={{ borderColor: "var(--color-outline-variant)", color: "var(--color-primary)" }}
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                >
                  <option value="all">Semua Mata Kuliah</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="h-6 w-px bg-gray-200 mx-2" />
                <button className="flex h-9 w-9 items-center justify-center rounded-full border bg-white transition-all hover:bg-gray-50" style={{ borderColor: "var(--color-outline-variant)", color: "var(--color-primary)" }}><span className="material-symbols-outlined text-[18px]">grid_view</span></button>
                <button className="flex h-9 w-9 items-center justify-center rounded-full border bg-white transition-all hover:bg-gray-50" style={{ borderColor: "var(--color-outline-variant)", color: "var(--color-primary)" }}><span className="material-symbols-outlined text-[18px]">sort_by_alpha</span></button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredNotes.slice(0, 10).map(n => {
                const c = courses.find(x => x.id === n.courseId);
                return (
                <div key={n.id} onClick={() => onStart({ docId: n.id })} className="group cursor-pointer rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md overflow-hidden" style={{ borderColor: "var(--color-outline-variant)" }}>
                  <div className="relative flex h-32 items-start justify-start overflow-hidden bg-gray-50 p-4" style={{ borderBottom: "1px solid var(--color-outline-variant)" }}>
                    <div className="absolute top-0 left-0 w-full h-1" style={{ background: c?.color || "var(--color-primary)" }} />
                    <div className="line-clamp-5 font-mono text-[9px] leading-relaxed text-gray-500 opacity-70">{n.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150)}...</div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold" style={{ color: "var(--color-primary)" }}>{n.title}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-[12px]" style={{ color: c?.color || "var(--color-primary)" }}>book</span>
                        <p className="truncate font-mono text-[9px] uppercase tracking-widest text-gray-500">{c?.code || n.courseId}</p>
                      </div>
                    </div>
                    <button className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50 opacity-0 transition-all hover:bg-gray-200 group-hover:opacity-100"><span className="material-symbols-outlined text-[18px]" style={{ color: "var(--color-primary)" }}>more_vert</span></button>
                  </div>
                </div>
              )})}
            </div>

            {dashSearch && filteredMaterials.length > 0 && (
              <div className="mt-10">
                <h3 className="mb-4 text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>Materi Terkait</h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {filteredMaterials.map((m) => (
                    <div key={m.id} onClick={() => onStart({ materialId: m.id })} className="group relative flex cursor-pointer items-center gap-4 rounded-2xl border bg-white p-4 transition-all hover:border-gray-300 hover:shadow-sm" style={{ borderColor: "var(--color-outline-variant)" }}>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50"><span className="material-symbols-outlined text-[20px] text-red-500">{m.type === "PDF" ? "picture_as_pdf" : "description"}</span></div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-bold">{m.title}</h4>
                        <p className="mt-0.5 truncate font-mono text-[10px] text-gray-500">{m.fileName} • {m.totalPages} pages</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dashSearch && filteredTasks.length > 0 && (
              <div className="mt-10">
                <h3 className="mb-4 text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>Tugas Terkait</h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTasks.map((t) => (
                    <div key={t.id} onClick={() => onStart({ taskId: t.id })} className="group relative flex cursor-pointer items-center gap-4 rounded-2xl border bg-white p-4 transition-all hover:border-gray-300 hover:shadow-sm" style={{ borderColor: "var(--color-outline-variant)" }}>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50"><span className="material-symbols-outlined text-[20px] text-orange-500">task_alt</span></div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-bold">{t.title}</h4>
                        <p className="mt-0.5 truncate font-mono text-[10px] text-gray-500">{t.status.toUpperCase()} • {t.priority} priority</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
function DashList({ title, empty, items }: { title: string; empty: string; items: { id: string; title: string; meta: string; action: () => void }[] }) {
  return <section className="rounded-3xl border bg-white p-5" style={{ borderColor: "var(--color-outline-variant)" }}><h2 className="mb-3 text-lg font-bold" style={{ fontFamily: "var(--font-serif)" }}>{title}</h2><div className="flex flex-col gap-2">{items.length ? items.map((it) => <button key={it.id} onClick={it.action} className="rounded-xl border p-3 text-left hover:bg-gray-50" style={{ borderColor: "var(--color-outline-variant)" }}><p className="text-sm font-bold">{it.title}</p><p className="font-mono text-[10px] text-gray-500">{it.meta}</p></button>) : <p className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">{empty}</p>}</div></section>;
}

export default function StudyClient({ initialCourses, initialMaterials, initialNotes, initialTasks }: any) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-mono text-gray-500">Loading Workspace...</div>}>
      <StudyWorkspaceContent initialCourses={initialCourses} initialMaterials={initialMaterials} initialNotes={initialNotes} initialTasks={initialTasks} />
    </Suspense>
  );
}
