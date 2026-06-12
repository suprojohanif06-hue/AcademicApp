"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createMaterial as createMaterialDB } from "@/app/actions/academic-actions";
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

const getMockSize = (id: string) => {
  const sizes: Record<string, string> = {
    "uu-1-1970": "2.4 MB",
    "safety-manual": "15.1 MB",
    "hig-ppt-1": "5.6 MB",
    "rm-journal-1": "1.2 MB"
  };
  return sizes[id] || "1.0 MB";
};

export default function LibraryClient({ 
  initialMaterials, 
  courses 
}: { 
  initialMaterials: any[], 
  courses: any[] 
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showUpload, setShowUpload] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<any | null>(null);
  
  const [uploadType, setUploadType] = useState<"file" | "url">("file");
  const [uploadData, setUploadData] = useState({ title: "", url: "", courseId: "general", category: "" });
  const [isDragging, setIsDragging] = useState(false);

  const { isHydrated, setInitialData, materials: storeMaterials, courses: storeCourses, addMaterial } = useAcademicStore();

  useEffect(() => {
    if (!isHydrated) {
      setInitialData({ materials: initialMaterials, courses });
    }
  }, [isHydrated, initialMaterials, courses, setInitialData]);

  const materials = isHydrated ? storeMaterials : initialMaterials;
  const currentCourses = isHydrated ? storeCourses : courses;

  const handleUpload = () => {
    if (!uploadData.title) return;
    
    let materialType = uploadType === "url" ? "URL" : "DOC";
    let fileName = uploadData.title;

    if (uploadType === "file") {
      const lower = uploadData.title.toLowerCase();
      if (lower.endsWith(".pdf")) materialType = "PDF";
      else if (lower.endsWith(".ppt") || lower.endsWith(".pptx")) materialType = "PPT";
      fileName = uploadData.title;
    } else {
      fileName = uploadData.url;
    }

    if (uploadData.courseId === "general" && currentCourses.length > 0) {
       alert("Please select a valid course for the material.");
       return;
    } else if (uploadData.courseId === "general") {
       alert("Create a course first before uploading materials.");
       return;
    }

    const newMaterialData = {
      courseId: uploadData.courseId,
      title: uploadData.title,
      type: materialType,
      fileName,
      url: uploadType === "url" ? uploadData.url : `/local/${uploadData.title}`,
      totalPages: 1,
      source: "Local",
      category: uploadData.category
    };

    const tempId = `temp-${Date.now()}`;
    const tempMaterial = {
      id: tempId,
      ...newMaterialData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Optimistic Update
    addMaterial(tempMaterial);
    setShowUpload(false);
    setUploadData({ title: "", url: "", courseId: "general", category: "" });

    // Background DB Action
    createMaterialDB(newMaterialData)
      .then((created) => {
        // Swap temp for real
        useAcademicStore.getState().deleteMaterial(tempId);
        useAcademicStore.getState().addMaterial(created);
      })
      .catch((err) => {
        console.error("Failed to create material in DB:", err);
        useAcademicStore.getState().deleteMaterial(tempId);
        alert("Failed to save material to database. Reverted changes.");
      });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.relatedTarget === null) setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setUploadType("file");
      setUploadData(prev => ({ ...prev, title: file.name }));
      setShowUpload(true);
    }
  };

  const coursesMap = useMemo(() => {
    const map: Record<string, any> = {};
    currentCourses.forEach(c => map[c.id] = c);
    return map;
  }, [currentCourses]);

  const filtered = useMemo(() => {
    return materials.filter((m) => {
      const course = coursesMap[m.courseId];
      const safeTitle = (m.name || m.title || "").toLowerCase();
      const safeFileName = (m.fileName || "").toLowerCase();
      const searchLower = search.toLowerCase();
      
      const matchSearch = safeTitle.includes(searchLower) || safeFileName.includes(searchLower) || (m.category || "").toLowerCase().includes(searchLower);
      
      let matchFilter = true;
      if (filter === "Regulations") {
        matchFilter = safeTitle.includes("uu") || safeTitle.includes("permen");
      } else if (filter !== "All") {
        matchFilter = course?.code === filter;
      }
      
      return matchSearch && matchFilter;
    });
  }, [materials, coursesMap, search, filter]);

  const filterOptions = ["All", "Regulations", ...currentCourses.map(c => c.code)];

  return (
    <div 
      className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8 relative min-h-screen animate-fade-in"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div 
          className="absolute inset-0 z-[110] bg-[var(--color-surface-container-highest)]/80 backdrop-blur-sm border-4 border-dashed rounded-3xl flex flex-col items-center justify-center m-4 animate-in fade-in duration-200"
          style={{ borderColor: "var(--color-primary)" }}
          onDragLeave={() => setIsDragging(false)}
        >
          <span className="material-symbols-outlined icon-filled mb-4 animate-bounce" style={{ fontSize: "64px", color: "var(--color-primary)" }}>
            cloud_upload
          </span>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-serif)" }}>Drop file to Library</h2>
          <p className="mt-2 font-mono text-sm tracking-wide" style={{ color: "var(--color-on-surface-variant)" }}>Release to open upload form</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 animate-slide-up">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: "var(--color-on-surface-variant)" }}>ACADEMIC MATERIALS</p>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>Library</h2>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold self-start sm:self-auto transition-all hover:opacity-90 active:scale-95"
          style={{ background: "var(--color-primary)", color: "var(--color-on-primary)" }}
        >
          <span className="material-symbols-outlined icon-filled" style={{ fontSize: "18px" }}>upload_file</span>
          Upload File
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6 animate-slide-up delay-100">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors focus-within:border-[var(--color-primary)]" style={{ background: "var(--color-surface-container-low)", border: "1px solid var(--color-outline-variant)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--color-on-surface-variant)" }}>search</span>
          <input
            type="text"
            placeholder="Search documents, regulations, materials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--color-on-surface)" }}
          />
        </div>

        <div className="relative shrink-0">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full md:w-auto appearance-none pl-4 pr-10 py-2.5 rounded-xl text-sm outline-none cursor-pointer hover:bg-[var(--color-surface-container)]"
            style={{ background: "var(--color-surface-container-low)", border: "1px solid var(--color-outline-variant)", color: "var(--color-on-surface)" }}
          >
            {filterOptions.map(opt => (
              <option key={opt} value={opt}>{opt === "All" ? "All Materials" : opt === "Regulations" ? "Regulations" : `Course: ${opt}`}</option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ fontSize: "18px", color: "var(--color-on-surface-variant)" }}>
            expand_more
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-slide-up delay-200">
        {filtered.map((material) => {
          const course = coursesMap[material.courseId];
          const iconMap: Record<string, string> = { "PDF": "picture_as_pdf", "PPT": "slideshow", "Journal": "article", "Handout": "description" };
          const icon = iconMap[material.type] || "description";
          const color = course?.color || "var(--color-pastel-blue)";

          return (
            <div
              key={material.id}
              onClick={() => {
                if (material.type === "DOC" || material.type === "Journal" || material.type === "Handout") {
                  router.push(`/study?materialId=${material.id}`);
                } else {
                  setPreviewMaterial(material);
                }
              }}
              className="group flex flex-col p-3 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              style={{ 
                background: "white", 
                border: "1px solid var(--color-outline-variant)", 
                boxShadow: "0 2px 4px rgba(0,0,0,0.02)" 
              }}
            >
              <div className="h-32 mb-3 rounded-xl flex flex-col items-center justify-center gap-2 relative overflow-hidden" style={{ background: color }}>
                <span className="material-symbols-outlined icon-filled transition-transform group-hover:scale-110" style={{ fontSize: "48px", color: "var(--color-primary)", opacity: 0.8 }}>
                  {icon}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--color-primary)", opacity: 0.7 }}>
                  {material.type}
                </span>
                {material.source === "Drive" && (
                   <div className="absolute top-2 right-2 bg-white/50 backdrop-blur-sm rounded-full p-1 flex items-center justify-center shadow-sm">
                     <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "var(--color-primary)" }}>cloud</span>
                   </div>
                )}
              </div>

              <div className="flex-1 flex flex-col px-1">
                <h3 className="font-bold text-sm leading-snug line-clamp-2 mb-2" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>
                  {material.name || material.title}
                </h3>
                
                {course && (
                  <span className="inline-flex px-2 py-0.5 rounded border text-[10px] font-mono mb-3 self-start items-center gap-1" style={{ borderColor: course.color, color: "var(--color-secondary)", background: `${course.color}20` }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: course.color }}></span>
                    {course.code}
                  </span>
                )}
                
                <div className="flex items-center justify-between mt-auto pt-2 border-t text-[10px] font-mono" style={{ borderColor: "var(--color-surface-variant)", color: "var(--color-on-surface-variant)" }}>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>calendar_today</span>
                    {new Date(material.createdAt).toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                  <span>{getMockSize(material.id)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="mt-8 p-12 rounded-2xl flex flex-col items-center gap-3 animate-slide-up delay-200" style={{ border: "1.5px dashed var(--color-outline-variant)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "var(--color-outline-variant)" }}>search_off</span>
          <p className="text-sm font-medium" style={{ color: "var(--color-on-surface-variant)" }}>No materials found.</p>
          <button 
            onClick={() => { setSearch(""); setFilter("All"); }}
            className="mt-2 px-4 py-2 rounded-lg text-xs font-bold transition-opacity hover:opacity-80"
            style={{ background: "var(--color-surface-container-high)", color: "var(--color-primary)" }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-outline-variant)]">
              <h3 className="font-bold text-lg text-[var(--color-primary)]">Add Material</h3>
              <button onClick={() => setShowUpload(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button 
                  onClick={() => setUploadType("file")} 
                  className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${uploadType === "file" ? "bg-white shadow-sm text-[var(--color-primary)]" : "text-gray-500"}`}
                >
                  Local File
                </button>
                <button 
                  onClick={() => setUploadType("url")} 
                  className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${uploadType === "url" ? "bg-white shadow-sm text-[var(--color-primary)]" : "text-gray-500"}`}
                >
                  Web Link
                </button>
              </div>

              {uploadType === "file" ? (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">FILE (Mock Upload)</label>
                  <input 
                    type="file" 
                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.files?.[0]?.name || "" })}
                    className="w-full text-sm p-2 border border-dashed rounded-xl border-[var(--color-outline-variant)]"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Select any PDF, PPT, DOC, etc.</p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">URL</label>
                  <input 
                    type="url" 
                    placeholder="https://..."
                    value={uploadData.url}
                    onChange={(e) => setUploadData({ ...uploadData, url: e.target.value, title: e.target.value })}
                    className="w-full text-sm p-2.5 border rounded-xl border-[var(--color-outline-variant)] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">COURSE</label>
                <select 
                  value={uploadData.courseId}
                  onChange={(e) => setUploadData({ ...uploadData, courseId: e.target.value })}
                  className="w-full text-sm p-2.5 border rounded-xl border-[var(--color-outline-variant)] outline-none focus:border-[var(--color-primary)] bg-white"
                >
                  {currentCourses.length === 0 && <option value="general">No Courses Available</option>}
                  {currentCourses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-[var(--color-outline-variant)] flex justify-end gap-2">
              <button onClick={() => setShowUpload(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-800">Cancel</button>
              <button 
                onClick={handleUpload}
                disabled={!uploadData.title || currentCourses.length === 0}
                className="px-6 py-2 rounded-xl text-sm font-bold disabled:opacity-50 transition-opacity"
                style={{ background: "var(--color-primary)", color: "var(--color-on-primary)" }}
              >
                Save to Library
              </button>
            </div>
          </div>
        </div>
      )}

      {previewMaterial && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#525659] animate-in fade-in zoom-in-95 duration-200">
          <div className="flex shrink-0 items-center justify-between px-4 py-3 shadow-sm z-10" style={{ background: "var(--color-surface-container-lowest)", borderBottom: "1px solid var(--color-outline-variant)" }}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px]" style={{ color: "var(--color-on-surface-variant)" }}>
                {previewMaterial.type === "PDF" ? "picture_as_pdf" : previewMaterial.type === "PPT" ? "slideshow" : "link"}
              </span>
              <h3 className="font-bold text-sm" style={{ color: "var(--color-on-surface)" }}>{previewMaterial.name || previewMaterial.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPreviewMaterial(null)}
                className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-surface-container-high)] flex items-center justify-center"
                style={{ color: "var(--color-on-surface-variant)" }}
                title="Close Viewer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
          <div className="relative flex-1 overflow-hidden bg-[#e5e7eb]">
            <PdfViewer url={previewMaterial.url || "/api/drive/file/placeholder"} page={1} />
          </div>
        </div>
      )}
    </div>
  );
}
