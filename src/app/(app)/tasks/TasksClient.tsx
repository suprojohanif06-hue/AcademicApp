"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { updateTaskStatus as updateTaskStatusDB, updateTask as updateTaskDB, createTask as createTaskDB } from "@/app/actions/academic-actions";
import { useAcademicStore } from "@/store/useAcademicStore";

type Status = "backlog" | "todo" | "inprogress" | "review" | "done";
type Priority = "low" | "medium" | "high";

const columns: { id: Status; label: string; description: string; dot: string }[] = [
  { id: "backlog", label: "Backlog", description: "Upcoming or planned quests", dot: "var(--color-outline-variant)" },
  { id: "todo", label: "To Do", description: "Quests ready to start", dot: "var(--color-primary-fixed)" },
  { id: "inprogress", label: "In Progress", description: "Currently working on", dot: "var(--color-primary)" },
  { id: "review", label: "Review", description: "Waiting for feedback or grading", dot: "var(--color-secondary)" },
  { id: "done", label: "Done", description: "Completed quests", dot: "var(--color-tertiary)" },
];

const priorityMeta: Record<Priority, { label: string; icon: string; color: string; bg: string }> = {
  low: { label: "Low", icon: "keyboard_arrow_down", color: "var(--color-on-surface-variant)", bg: "var(--color-surface-container-high)" },
  medium: { label: "Medium", icon: "remove", color: "var(--color-secondary)", bg: "var(--color-secondary-fixed)" },
  high: { label: "High", icon: "keyboard_double_arrow_up", color: "var(--color-error)", bg: "var(--color-error-container)" },
};

function normalizeStatus(status: string): Status {
  if (["todo", "inprogress", "done", "backlog", "review"].includes(status)) return status as Status;
  return "todo";
}

function getNextStatus(current: Status): Status {
  const flow: Status[] = ["backlog", "todo", "inprogress", "review", "done"];
  const idx = flow.indexOf(current);
  return idx < flow.length - 1 ? flow[idx + 1] : current;
}

function getPrevStatus(current: Status): Status {
  const flow: Status[] = ["backlog", "todo", "inprogress", "review", "done"];
  const idx = flow.indexOf(current);
  return idx > 0 ? flow[idx - 1] : current;
}

function courseBadgeStyle(course?: any) {
  if (!course) return { background: "var(--color-surface-container-high)", color: "var(--color-on-surface-variant)" };
  return { background: course.color, color: "var(--color-on-surface)" };
}

function isOverdue(task: any) {
  if (task.status === "done" || !task.dueDate) return false;
  return new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
}

function formatDueDate(dateStr?: string) {
  if (!dateStr) return "No due date";
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) return `In ${diffDays} days`;
  if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function countTotalChecklistItems(items?: any[]): number {
  if (!items) return 0;
  return items.reduce((sum, item) => sum + 1 + countTotalChecklistItems(item.subtasks), 0);
}

function countCompletedChecklistItems(items?: any[]): number {
  if (!items) return 0;
  return items.reduce((sum, item) => sum + (item.completed ? 1 : 0) + countCompletedChecklistItems(item.subtasks), 0);
}

function TaskCard({
  task,
  course,
  onMove,
  onDoneToggle,
  onClick,
}: {
  task: any;
  course?: any;
  onMove: (id: string, status: Status) => void;
  onDoneToggle: (id: string, status: Status) => void;
  onClick: (id: string) => void;
}) {
  const status = normalizeStatus(task.status);
  const done = status === "done";
  const priority = priorityMeta[task.priority as Priority] || priorityMeta.medium;
  const checklistTotal = countTotalChecklistItems(task.checklist);
  const checklistDone = countCompletedChecklistItems(task.checklist);
  const progress = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : status === "inprogress" ? 65 : done ? 100 : 0;
  const dueDanger = isOverdue(task);

  return (
    <article
      onClick={() => onClick(task.id)}
      className={`group rounded-xl p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${done ? "grayscale opacity-65 hover:grayscale-0 hover:opacity-100" : ""}`}
      style={{
        background: "var(--color-surface-container-lowest)",
        border: "1px solid var(--color-outline-variant)",
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <span
          className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${done ? "line-through" : ""}`}
          style={courseBadgeStyle(course)}
          title={course?.name}
        >
          {course?.code || course?.name || "GEN"}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onDoneToggle(task.id, status); }}
            className="rounded p-1 text-[var(--color-on-surface-variant)] opacity-0 transition-opacity hover:bg-[var(--color-surface-container)] group-hover:opacity-100 focus:opacity-100"
            title={done ? "Reopen task" : "Mark done"}
          >
            <span className={`material-symbols-outlined text-[17px] ${done ? "icon-filled text-[var(--color-secondary)]" : ""}`}>
              {done ? "check_circle" : "radio_button_unchecked"}
            </span>
          </button>
          <Link
            onClick={(e) => e.stopPropagation()}
            href={`/study?taskId=${task.id}`}
            className="rounded p-1 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)]"
            title="Open in Study Workspace"
          >
            <span className={`material-symbols-outlined text-[18px] ${status === "inprogress" ? "icon-filled text-[var(--color-primary)]" : ""}`}>link</span>
          </Link>
        </div>
      </div>

      <h4 className={`mb-3 text-sm font-bold leading-snug text-[var(--color-on-surface)] ${done ? "line-through" : ""}`}>
        {task.title}
      </h4>

      <div className="mb-3 flex h-0 items-center justify-between overflow-hidden text-[10px] font-bold uppercase tracking-wide text-[var(--color-on-surface-variant)] opacity-0 transition-all group-hover:h-6 group-hover:opacity-100 group-focus-within:h-6 group-focus-within:opacity-100">
        <button
          onClick={(e) => { e.stopPropagation(); onMove(task.id, getPrevStatus(status)); }}
          disabled={status === "backlog"}
          className="rounded-full px-2 py-0.5 hover:bg-[var(--color-surface-container)] disabled:opacity-25"
        >
          ← Move
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMove(task.id, getNextStatus(status)); }}
          disabled={status === "done"}
          className="rounded-full px-2 py-0.5 hover:bg-[var(--color-surface-container)] disabled:opacity-25"
        >
          Move →
        </button>
      </div>

      {(status === "inprogress" || checklistTotal > 0) && (
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-[var(--color-on-surface-variant)]">
            <span>{checklistTotal > 0 ? `${checklistDone}/${checklistTotal} checklist` : "Progress"}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[var(--color-surface-container)]">
            <div className="h-full rounded-full bg-[var(--color-secondary)] transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-3">
        <div className={`flex items-center gap-1 text-[11px] font-semibold ${dueDanger ? "text-[var(--color-error)]" : "text-[var(--color-on-surface-variant)]"}`}>
          <span className="material-symbols-outlined text-[15px]">{done ? "history" : "calendar_today"}</span>
          <span>{done ? "Completed" : formatDueDate(task.dueDate)}</span>
        </div>
        <div className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold uppercase" style={{ background: priority.bg, color: priority.color }}>
          <span className="material-symbols-outlined text-[15px]">{priority.icon}</span>
          <span>{dueDanger ? "URGENT" : priority.label}</span>
        </div>
      </div>
    </article>
  );
}

// Checklists recursive helpers
function addChecklistItemRecursive(items: any[], newItem: any, parentId?: string): any[] {
  if (!parentId) return [...items, newItem];
  return items.map(item => {
    if (item.id === parentId) return { ...item, subtasks: [...(item.subtasks || []), newItem] };
    if (item.subtasks) return { ...item, subtasks: addChecklistItemRecursive(item.subtasks, newItem, parentId) };
    return item;
  });
}

function updateChecklistItemRecursive(items: any[], itemId: string, updater: (item: any) => any): any[] {
  return items.map(item => {
    if (item.id === itemId) return updater(item);
    if (item.subtasks) return { ...item, subtasks: updateChecklistItemRecursive(item.subtasks, itemId, updater) };
    return item;
  });
}

function deleteChecklistItemRecursive(items: any[], itemId: string): any[] {
  return items.filter(item => item.id !== itemId).map(item => {
    if (item.subtasks) return { ...item, subtasks: deleteChecklistItemRecursive(item.subtasks, itemId) };
    return item;
  });
}

// ─── TimelineRoadmapView ───────────────────────────────────────────
function TimelineRoadmapView({ tasks, courses, onClick }: { tasks: any[]; courses: any[]; onClick: (id: string) => void }) {
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-12 pt-4 hide-scrollbar">
      <div className="mx-auto max-w-3xl">
        <div className="relative border-l-2 border-[var(--color-outline-variant)] ml-4 md:ml-8 space-y-8 py-4">
          {sortedTasks.map((task) => {
            const course = courses.find((c) => c.id === task.courseId);
            
            // Determine colors
            let borderColor = "var(--color-outline-variant)";
            let dotBg = "var(--color-surface-container-low)";
            
            if (task.status === "todo") {
              borderColor = "var(--color-primary)";
              dotBg = "var(--color-primary-container)";
            } else if (task.status === "inprogress") {
              borderColor = "var(--color-secondary)";
              dotBg = "var(--color-secondary-container)";
            } else if (task.status === "review") {
              borderColor = "var(--color-tertiary)";
              dotBg = "var(--color-tertiary-container)";
            } else if (task.status === "done") {
              borderColor = "var(--color-outline-variant)";
              dotBg = "var(--color-surface-container-high)";
            }

            const priority = priorityMeta[task.priority as Priority] || priorityMeta.medium;
            const done = task.status === "done";
            const dueDanger = isOverdue(task);

            return (
              <div key={task.id} className="relative pl-8 md:pl-12 group">
                {/* Timeline Dot */}
                <div 
                  className="absolute left-[-9px] top-6 w-4 h-4 rounded-full border-2 z-10 transition-transform group-hover:scale-125"
                  style={{ background: dotBg, borderColor: borderColor }}
                />
                
                {/* Connecting horizontal dash */}
                <div className="absolute left-0 top-8 w-8 border-t border-dashed border-[var(--color-outline-variant)]" />

                {/* Content Card */}
                <article
                  onClick={() => onClick(task.id)}
                  className={`rounded-2xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer ${done ? "grayscale opacity-60 hover:grayscale-0 hover:opacity-100" : ""}`}
                  style={{
                    background: "var(--color-surface-container-lowest)",
                    border: `1px solid ${done ? "var(--color-outline-variant)" : borderColor}`,
                  }}
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${done ? "line-through" : ""}`}
                        style={courseBadgeStyle(course)}
                        title={course?.name}
                      >
                        {course?.code || course?.name || "GEN"}
                      </span>
                      <div className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${dueDanger ? "text-[var(--color-error)]" : "text-[var(--color-on-surface-variant)]"}`}>
                        <span className="material-symbols-outlined text-[14px]">{done ? "history" : "calendar_today"}</span>
                        {done ? "Completed" : formatDueDate(task.dueDate)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase" style={{ background: priority.bg, color: priority.color }}>
                      <span className="material-symbols-outlined text-[14px]">{priority.icon}</span>
                      {priority.label}
                    </div>
                  </div>

                  <h4 className={`text-base font-bold leading-snug text-[var(--color-on-surface)] ${done ? "line-through" : ""}`}>
                    {task.title}
                  </h4>
                  
                  {task.description && (
                    <p className="mt-2 text-sm text-[var(--color-on-surface-variant)] line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="mt-4 flex items-center justify-between border-t border-[var(--color-outline-variant)] pt-3 text-[11px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <span className={`material-symbols-outlined text-[14px] ${done ? "text-[var(--color-secondary)]" : ""}`}>{done ? "check_circle" : "radio_button_unchecked"}</span> 
                      {task.status}
                    </span>
                    <span className="flex items-center gap-1 group-hover:text-[var(--color-primary)] transition-colors">
                      Open details <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </span>
                  </div>
                </article>
              </div>
            );
          })}
          
          {sortedTasks.length === 0 && (
             <div className="pl-8 pt-4 font-medium italic text-sm text-[var(--color-on-surface-variant)]">No quests available for roadmap.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TaskDetailPane ───────────────────────────────────────────────
function NestedChecklistItem({
  item, depth, maxDepth = 3, taskId, notes, materials, onToggle, onUpdateText, onDelete, onAddChild, onLinkNote, onLinkMaterial, onUnlinkNote, onUnlinkMaterial, onUpdateItem
}: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubtaskUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        const newAttachment = { url: data.url, fileName: data.fileName, size: data.size, type: data.type };
        const currentAttachments = item.attachments || [];
        onUpdateItem(item.id, { attachments: [...currentAttachments, newAttachment] });
      } else {
        alert("Upload failed: " + data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`flex flex-col ${depth > 0 ? 'ml-6 border-l pl-3 border-gray-200' : 'mb-2'}`}>
      <div className="group flex flex-col gap-1 py-1 transition-colors hover:bg-gray-50/50 rounded px-1">
        <div className="flex items-start gap-3">
          <div className="relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
            <input 
              type="checkbox" 
              checked={item.completed}
              onChange={(e) => onToggle(item.id, e.target.checked)}
              className="peer absolute h-full w-full cursor-pointer opacity-0 z-10"
            />
            <div className="flex h-4 w-4 items-center justify-center rounded-[4px] border-2 border-gray-300 transition-colors peer-checked:border-black peer-checked:bg-black">
              <span className="material-symbols-outlined text-[12px] font-bold text-white opacity-0 peer-checked:opacity-100">check</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder="To-do..."
              className={`w-full bg-transparent text-sm outline-none transition-all ${item.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}
              value={item.text}
              onChange={(e) => onUpdateText(item.id, e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleSubtaskUpload} />
            <button onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-blue-500" title="Add Attachment">
              <span className="material-symbols-outlined text-[16px]">attach_file</span>
            </button>
            {depth < maxDepth && (
              <button onClick={() => onAddChild(item.id)} className="text-gray-400 hover:text-[var(--color-primary)]" title="Add Subtask">
                <span className="material-symbols-outlined text-[16px]">add</span>
              </button>
            )}
            <button onClick={() => onDelete(item.id)} className="text-gray-400 hover:text-red-500" title="Delete">
              <span className="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>
        </div>
        {item.attachments && item.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pl-7 pb-1">
            {item.attachments.map((att: any, idx: number) => (
              <a key={idx} href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded border bg-white px-2 py-1 text-[10px] font-medium text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                <span className="material-symbols-outlined text-[14px]">{att.type?.startsWith('image/') ? 'image' : 'attach_file'}</span>
                {att.fileName}
              </a>
            ))}
          </div>
        )}
      </div>
      
      {item.subtasks && item.subtasks.length > 0 && (
        <div className="flex flex-col">
          {item.subtasks.map((subitem: any) => (
            <NestedChecklistItem
              key={subitem.id} item={subitem} depth={depth + 1} maxDepth={maxDepth} taskId={taskId} notes={notes} materials={materials} onToggle={onToggle} onUpdateText={onUpdateText} onDelete={onDelete} onAddChild={onAddChild} onLinkNote={onLinkNote} onLinkMaterial={onLinkMaterial} onUnlinkNote={onUnlinkNote} onUnlinkMaterial={onUnlinkMaterial} onUpdateItem={onUpdateItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskDetailPane({ task, courses, materials, notes, onClose, onUpdate }: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleChecklistAdd = (parentId?: string) => {
    const newItem = { id: `chk-${Date.now()}`, text: "", completed: false, attachments: [] };
    onUpdate({ checklist: addChecklistItemRecursive(task.checklist || [], newItem, parentId) });
  };
  const handleChecklistToggle = (id: string, completed: boolean) => {
    onUpdate({ checklist: updateChecklistItemRecursive(task.checklist || [], id, (item) => ({ ...item, completed })) });
  };
  const handleChecklistUpdateText = (id: string, text: string) => {
    onUpdate({ checklist: updateChecklistItemRecursive(task.checklist || [], id, (item) => ({ ...item, text })) });
  };
  const handleChecklistDelete = (id: string) => {
    onUpdate({ checklist: deleteChecklistItemRecursive(task.checklist || [], id) });
  };

  const handleChecklistUpdateItem = (id: string, updates: any) => {
    onUpdate({ checklist: updateChecklistItemRecursive(task.checklist || [], id, (item) => ({ ...item, ...updates })) });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        const newAttachment = { url: data.url, fileName: data.fileName, size: data.size, type: data.type };
        const currentAttachments = task.attachments || [];
        onUpdate({ attachments: [...currentAttachments, newAttachment] });
      } else {
        alert("Upload failed: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity lg:hidden" onClick={onClose} />
      <div className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[600px] flex-col bg-white shadow-2xl transition-transform duration-300 lg:w-[600px] lg:border-l lg:border-[var(--color-outline-variant)]">
        
        <div className="flex shrink-0 items-center justify-between border-b px-6 py-4" style={{ borderColor: "var(--color-outline-variant)" }}>
          <div className="flex flex-1 items-center gap-3">
            <select
              className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide outline-none hover:bg-gray-200"
              value={task.status}
              onChange={(e) => onUpdate({ status: e.target.value as Status })}
            >
              {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/study?taskId=${task.id}`} className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-[var(--color-on-primary)] transition-all hover:opacity-90">
              <span className="material-symbols-outlined text-[16px]">menu_book</span> Study
            </Link>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <input
            type="text"
            className="mb-6 w-full bg-transparent text-2xl font-bold outline-none placeholder:text-gray-300"
            value={task.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Task Title..."
          />

          <div className="mb-8 flex flex-col gap-3 rounded-xl border p-4 bg-gray-50" style={{ borderColor: "var(--color-outline-variant)" }}>
            <div className="flex items-center gap-4">
              <span className="w-24 shrink-0 text-xs font-semibold text-gray-500">Course</span>
              <select
                className="flex-1 rounded-md bg-transparent px-2 py-1 text-sm outline-none hover:bg-gray-200"
                value={task.courseId}
                onChange={(e) => onUpdate({ courseId: e.target.value })}
              >
                {courses.map((c: any) => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-24 shrink-0 text-xs font-semibold text-gray-500">Priority</span>
              <select
                className="flex-1 rounded-md bg-transparent px-2 py-1 text-sm outline-none hover:bg-gray-200"
                value={task.priority}
                onChange={(e) => onUpdate({ priority: e.target.value as Priority })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-24 shrink-0 text-xs font-semibold text-gray-500">Due Date</span>
              <input
                type="date"
                className="flex-1 rounded-md bg-transparent px-2 py-1 text-sm outline-none hover:bg-gray-200"
                value={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""}
                onChange={(e) => onUpdate({ dueDate: e.target.value })}
              />
            </div>
          </div>

          {/* Description & Checklist Card */}
          <div className="mb-6 rounded-xl border bg-white p-6 shadow-sm flex flex-col" style={{ borderColor: "var(--color-outline-variant)" }}>
            <textarea
              className="w-full resize-none bg-transparent text-sm outline-none mb-4"
              placeholder="Add description..."
              value={task.description || ""}
              onChange={(e) => onUpdate({ description: e.target.value })}
              style={{ minHeight: "100px", fieldSizing: "content" } as any}
            />

            {(task.checklist && task.checklist.length > 0) && <div className="w-full h-px bg-gray-100 mb-4" />}
            
            <div className="flex flex-col gap-0">
              {task.checklist?.map((item: any) => (
                <NestedChecklistItem
                  key={item.id} item={item} depth={0} maxDepth={3} taskId={task.id} notes={notes} materials={materials} onToggle={handleChecklistToggle} onUpdateText={handleChecklistUpdateText} onDelete={handleChecklistDelete} onAddChild={handleChecklistAdd} onUpdateItem={handleChecklistUpdateItem}
                />
              ))}
              
              <button onClick={() => handleChecklistAdd()} className="flex items-center gap-2 mt-3 px-2 py-1.5 text-xs font-bold text-gray-400 hover:text-[var(--color-primary)] hover:bg-gray-50 rounded transition-colors self-start">
                <span className="material-symbols-outlined text-[16px]">add</span> Add subtask
              </button>
            </div>
          </div>

          {/* Attachments Section (Outside) */}
          <div className="mb-6 flex flex-col gap-3">
            {(task.attachments && task.attachments.length > 0) && (
              <div className="flex flex-wrap gap-3">
                {task.attachments.map((att: any, idx: number) => (
                  <a key={idx} href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-[var(--color-primary)] hover:bg-blue-50 hover:text-[var(--color-primary)]">
                    <span className="material-symbols-outlined text-[20px]">{att.type?.startsWith('image/') ? 'image' : 'attach_file'}</span>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate max-w-[150px] leading-tight">{att.fileName}</span>
                      <span className="text-[10px] font-medium text-gray-400">{(att.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
            
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            
            <div className="flex flex-wrap gap-3 mt-1">
              <button onClick={handleUploadClick} className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-bold text-gray-500 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-white transition-colors">
                <span className="material-symbols-outlined text-[16px]">attach_file</span> Add Attachment
              </button>
              <button className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-bold text-gray-500 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-white transition-colors">
                <span className="material-symbols-outlined text-[16px]">library_books</span> Link Material
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Client Page ───────────────────────────────────────────────
export default function TasksClient({
  initialTasks,
  initialCourses,
  initialMaterials,
  initialNotes,
}: {
  initialTasks: any[];
  initialCourses: any[];
  initialMaterials: any[];
  initialNotes: any[];
}) {
  const {
    isHydrated, setInitialData,
    tasks: storeTasks,
    courses: storeCourses,
    materials: storeMaterials,
    notes: storeNotes,
    updateTaskStatus,
    addTask,
    updateTask
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

  const tasks = isHydrated ? storeTasks : initialTasks.map(t => ({
    ...t,
    checklist: t.checklistData ? JSON.parse(t.checklistData) : [],
    attachments: t.attachmentsData ? JSON.parse(t.attachmentsData) : [],
  }));
  const courses = isHydrated ? storeCourses : initialCourses;
  const materials = isHydrated ? storeMaterials : initialMaterials;
  const notes = isHydrated ? storeNotes : initialNotes;
  
  const [query, setQuery] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "timeline">("kanban");

  const selectedTask = useMemo(() => tasks.find(t => t.id === selectedTaskId) || null, [tasks, selectedTaskId]);

  const visibleTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((task) => {
      const course = courses.find((item: any) => item.id === task.courseId);
      return [task.title, task.type, task.priority, task.status, course?.code, course?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [courses, tasks, query]);

  const tasksByStatus = useMemo(() => {
    return columns.reduce<Record<Status, any[]>>((acc, column) => {
      acc[column.id] = visibleTasks.filter((task) => task.status === column.id);
      return acc;
    }, { backlog: [], todo: [], inprogress: [], review: [], done: [] });
  }, [visibleTasks]);

  const activeCount = tasks.filter((task) => task.status !== "done").length;
  const doneCount = tasks.filter((task) => task.status === "done").length;
  const dueTodayCount = tasks.filter((task) => formatDueDate(task.dueDate) === "Today" && task.status !== "done").length;

  const handleUpdateTaskStatus = async (id: string, status: Status) => {
    updateTaskStatus(id, status);
    await updateTaskStatusDB(id, status);
  };

  const toggleDone = async (id: string, currentStatus: Status) => {
    await handleUpdateTaskStatus(id, currentStatus === "done" ? "todo" : "done");
  };

  const handleCreateQuickTask = () => {
    if (courses.length === 0) return alert("Please create a course first.");
    const firstCourse = courses[0];
    
    const newTaskData = {
      courseId: firstCourse.id,
      title: "Untitled Quest",
      type: "assignment",
      priority: "medium",
      status: "backlog",
      dueDate: new Date().toISOString(),
    };

    const tempId = `temp-${Date.now()}`;
    const tempTask = {
      id: tempId,
      ...newTaskData,
      checklist: [],
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Optimistic UI updates
    addTask(tempTask);
    setSelectedTaskId(tempId);

    // DB Action in background
    createTaskDB(newTaskData)
      .then((createdTask) => {
        const hydratedTask = {
          ...createdTask,
          checklist: [],
          attachments: [],
        };
        // Swap temp task for real task
        useAcademicStore.getState().updateTask(tempId, hydratedTask);
        // Keep selected task linked to the real ID
        setSelectedTaskId((currentId) => currentId === tempId ? createdTask.id : currentId);
      })
      .catch((err) => {
        console.error("Failed to save quest in DB:", err);
        useAcademicStore.getState().deleteTask(tempId);
        setSelectedTaskId((currentId) => currentId === tempId ? null : currentId);
        alert("Failed to save quest to database. Reverted changes.");
      });
  };

  const handleUpdateTask = (updates: any) => {
    if (!selectedTaskId) return;
    updateTask(selectedTaskId, updates);
    
    const dbUpdates = { ...updates };
    if (updates.checklist) {
      dbUpdates.checklistData = JSON.stringify(updates.checklist);
      delete dbUpdates.checklist;
    }
    if (updates.attachments) {
      dbUpdates.attachmentsData = JSON.stringify(updates.attachments);
      delete dbUpdates.attachments;
    }
    
    if (updates.dueDate) {
      dbUpdates.dueDate = new Date(updates.dueDate).toISOString();
    }
    
    // Debounce this in a real scenario, but for now we call it directly
    updateTaskDB(selectedTaskId, dbUpdates);
  };

  return (
    <>
      <div className="flex min-h-full flex-col bg-[var(--color-surface)] animate-fade-in">
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--color-outline-variant)] bg-[var(--color-surface)] px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight text-[var(--color-on-surface)]" style={{ fontFamily: "var(--font-serif)" }}>
              Quest Board
            </h1>
            <div className="hidden h-6 w-px bg-[var(--color-outline-variant)] md:block" />
            <div className="hidden items-center gap-2 md:flex">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[var(--color-on-surface-variant)]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Filter quests..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-64 rounded-full border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] py-1.5 pl-9 pr-4 text-sm text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] outline-none transition-colors focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-xl bg-gray-100 p-1 border border-gray-200">
              <button 
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "kanban" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <span className="material-symbols-outlined text-[16px]">view_column</span>
                Kanban
              </button>
              <button 
                onClick={() => setViewMode("timeline")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "timeline" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <span className="material-symbols-outlined text-[16px]">timeline</span>
                Roadmap
              </button>
            </div>

            <button
              onClick={handleCreateQuickTask}
              className="hidden items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-bold text-[var(--color-on-primary)] transition-transform hover:scale-105 active:scale-95 md:flex"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Quest
            </button>
          </div>
        </header>

        <section className="flex flex-1 flex-col px-4 pt-6 md:px-6">
          <div className="mb-6 flex shrink-0 flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div className="animate-slide-up">
              <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
                Quest Board & Milestones
              </p>
              <h2 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>
                Academic Quests
              </h2>
              <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">
                Active research cycles and study milestones.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden gap-2 lg:flex">
                <span className="rounded-full bg-[var(--color-surface-container-lowest)] px-3 py-1 text-[11px] font-bold text-[var(--color-on-surface-variant)] ring-1 ring-[var(--color-outline-variant)]">{activeCount} active</span>
                <span className="rounded-full bg-[var(--color-surface-container-lowest)] px-3 py-1 text-[11px] font-bold text-[var(--color-on-surface-variant)] ring-1 ring-[var(--color-outline-variant)]">{dueTodayCount} due today</span>
                <span className="rounded-full bg-[var(--color-surface-container-lowest)] px-3 py-1 text-[11px] font-bold text-[var(--color-on-surface-variant)] ring-1 ring-[var(--color-outline-variant)]">{doneCount} done</span>
              </div>
            </div>
          </div>

          {viewMode === "kanban" ? (
            <div className="flex-1 overflow-x-auto pb-6">
              <div className="flex min-w-max gap-6 items-start">
                {columns.map((column) => {
                  const columnTasks = tasksByStatus[column.id];
                  return (
                    <section
                      key={column.id}
                      className="flex h-max min-h-[520px] w-[300px] flex-col rounded-xl p-4 md:w-[320px]"
                      style={{ background: "var(--color-surface-container-low)" }}
                    >
                      <div className="mb-4 flex items-center justify-between px-1">
                        <div className="min-w-0">
                          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-[var(--color-on-surface)]">
                            <span className={`h-2 w-2 rounded-full ${column.id === "inprogress" ? "animate-pulse" : ""}`} style={{ background: column.dot }} />
                            {column.label}
                          </h3>
                          <p className="mt-0.5 text-[11px] font-medium text-[var(--color-on-surface-variant)]">{column.description}</p>
                        </div>
                        <span className="rounded-full bg-[var(--color-surface-container-highest)] px-2 py-0.5 text-xs font-bold text-[var(--color-on-surface-variant)]">
                          {columnTasks.length}
                        </span>
                      </div>

                      <div className="flex-1 space-y-4 pr-1">
                        {columnTasks.length > 0 ? (
                          columnTasks.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              course={initialCourses.find((course) => course.id === task.courseId)}
                              onMove={handleUpdateTaskStatus}
                              onDoneToggle={toggleDone}
                              onClick={setSelectedTaskId}
                            />
                          ))
                        ) : (
                          <div className="rounded-xl border border-dashed border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-5 text-center text-xs font-semibold text-[var(--color-on-surface-variant)] opacity-70">
                            No quests here
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          ) : (
            <TimelineRoadmapView tasks={visibleTasks} courses={initialCourses} onClick={setSelectedTaskId} />
          )}
        </section>

        <button
          onClick={handleCreateQuickTask}
          className="fixed bottom-24 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-lg transition-transform active:scale-90 md:hidden"
          title="New Quest"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      {selectedTask && (
        <TaskDetailPane
          task={selectedTask}
          courses={initialCourses}
          materials={initialMaterials}
          notes={initialNotes}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={handleUpdateTask}
        />
      )}
    </>
  );
}
