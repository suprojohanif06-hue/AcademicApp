"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import TiptapImageResize from "tiptap-extension-resize-image";
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { Highlight } from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import Dropcursor from "@tiptap/extension-dropcursor";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import BulletList from "@tiptap/extension-bullet-list";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Extension, Mark, Node, mergeAttributes, wrappingInputRule } from "@tiptap/core";
import { CitationExtension } from "./CitationSuggestion";

type PdfCitation = { id: string; page: number; wikilink: string };

const CALLOUT_TYPES = ["NOTE", "INFO", "TIP", "WARNING", "DANGER", "TODO", "QUESTION", "SUMMARY"];

const PdfLinkMark = Mark.create({
  name: "pdfLink",
  inclusive: false,
  addAttributes() {
    return {
      wikilink: { default: null, parseHTML: (el) => el.getAttribute("data-wikilink"), renderHTML: (attrs) => attrs.wikilink ? { "data-wikilink": attrs.wikilink } : {} },
    };
  },
  parseHTML() { return [{ tag: "span[data-wikilink]" }]; },
  renderHTML({ HTMLAttributes }) { return ["span", mergeAttributes(HTMLAttributes, { class: "pdf-link" }), 0]; },
});

const CustomOrderedList = OrderedList.extend({
  addAttributes() {
    return {
      ...(this.parent?.() || {}),
      listStyleType: {
        default: "decimal",
        parseHTML: (el: HTMLElement) => el.style.listStyleType || el.getAttribute("data-list-style-type") || "decimal",
        renderHTML: (attrs) => ({ "data-list-style-type": attrs.listStyleType, style: `list-style-type: ${attrs.listStyleType}` }),
      },
    };
  },
});

const CustomBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...(this.parent?.() || {}),
      listStyleType: {
        default: "disc",
        parseHTML: (el: HTMLElement) => el.style.listStyleType || el.getAttribute("data-list-style-type") || "disc",
        renderHTML: (attrs) => ({ "data-list-style-type": attrs.listStyleType, style: `list-style-type: ${attrs.listStyleType}` }),
      },
    };
  },
});

const CalloutNode = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      type: { default: "NOTE", parseHTML: (el) => el.getAttribute("data-callout") || "NOTE", renderHTML: (attrs) => ({ "data-callout": attrs.type || "NOTE" }) },
    };
  },
  parseHTML() { return [{ tag: "div[data-callout]" }]; },
  renderHTML({ HTMLAttributes }) { return ["div", mergeAttributes(HTMLAttributes, { class: "obsidian-callout" }), 0]; },
  addInputRules() {
    return [wrappingInputRule({ find: /^> \[!([a-zA-Z]+)\]\s$/, type: this.type, getAttributes: (match) => ({ type: match[1].toUpperCase() }) })];
  },
});

export type StudyEditorPaneHandle = { 
  insertWikilink: (wikilink: string) => void;
  editor: any;
};

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function decodeEntities(s: string) {
  return s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();
}

function htmlToSource(html: string) {
  let next = html;
  next = next.replace(/<span[^>]*data-wikilink=\"([^\"]+)\"[^>]*>.*?<\/span>/gi, "$1");
  next = next.replace(/<div[^>]*data-callout=\"([^\"]+)\"[^>]*>([\s\S]*?)<\/div>/gi, (_m, type, body) => {
    const text = decodeEntities(String(body).replace(/<br\s*\/?>(\s*)/gi, "\n").replace(/<[^>]+>/g, ""));
    return `> [!${String(type).toUpperCase()}]\n${text.split("\n").map((l) => `> ${l}`).join("\n")}\n`;
  });
  next = next.replace(/<h([1-6])[^>]*>(.*?)<\/h\1>/gi, (_m, lv, txt) => `${"#".repeat(Number(lv))} ${decodeEntities(String(txt).replace(/<[^>]+>/g, ""))}\n`);
  next = next.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, txt) => `> ${decodeEntities(String(txt).replace(/<[^>]+>/g, ""))}\n`);
  next = next.replace(/<li[^>]*data-type="taskItem"[^>]*>(.*?)<\/li>/gi, (_m, txt) => {
    const isChecked = _m.includes('data-checked="true"');
    return `- [${isChecked ? 'x' : ' '}] ${decodeEntities(String(txt).replace(/<[^>]+>/g, ""))}\n`;
  });
  next = next.replace(/<li[^>]*>(.*?)<\/li>/gi, (_m, txt) => `- ${decodeEntities(String(txt).replace(/<[^>]+>/g, ""))}\n`);
  return next
    .replace(/<p[^>]*>/gi, "")
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>(\s*)/gi, "\n")
    .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<em>(.*?)<\/em>/gi, "*$1*")
    .replace(/<[^>]+>/g, "")
    .split("\n")
    .map((l) => decodeEntities(l))
    .join("\n")
    .replace(/\n\n+/g, "\n\n")
    .trim();
}

function sourceToHtml(src: string) {
  const out: string[] = [];
  let inUl = false, inOl = false;
  let calloutType: string | null = null;
  let calloutLines: string[] = [];
  
  const flushCallout = () => {
    if (calloutType) {
      out.push(`<div data-callout="${calloutType}">${calloutLines.map((l) => `<p>${escapeHtml(l)}</p>`).join("")}</div>`);
      calloutType = null;
      calloutLines = [];
    }
  };

  const flushLists = (currentType: "ul" | "ol" | "none") => {
    if (inUl && currentType !== "ul") { out.push("</ul>"); inUl = false; }
    if (inOl && currentType !== "ol") { out.push("</ol>"); inOl = false; }
  };

  for (const line of src.split("\n")) {
    const start = line.match(/^> \[!([a-zA-Z]+)\]\s*(.*)$/);
    if (start) {
      flushLists("none");
      flushCallout();
      calloutType = start[1].toUpperCase();
      if (start[2]) calloutLines.push(start[2]);
      continue;
    }
    if (calloutType && line.startsWith("> ")) {
      calloutLines.push(line.slice(2));
      continue;
    }
    if (calloutType) flushCallout();

    const withLinks = escapeHtml(line).replace(/\[\[[^\]]+\]\]/g, (wikilink) => {
      const inner = wikilink.slice(2, -2);
      const label = inner.includes("|") ? inner.slice(inner.lastIndexOf("|") + 1) : inner;
      return `<span class="pdf-link" data-wikilink="${wikilink}">${escapeHtml(label)}</span>`;
    });
    
    const h = withLinks.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushLists("none");
      out.push(`<h${h[1].length}>${h[2]}</h${h[1].length}>`);
    } else if (/^-\s+\[([ xX])\]\s+(.*)$/.test(withLinks)) {
      flushLists("ul");
      if (!inUl) { out.push(`<ul data-type="taskList">`); inUl = true; }
      const match = withLinks.match(/^-\s+\[([ xX])\]\s+(.*)$/);
      const isChecked = match?.[1].toLowerCase() === 'x';
      out.push(`<li data-type="taskItem" data-checked="${isChecked}"><label><input type="checkbox" ${isChecked ? 'checked' : ''}><span></span></label><div><p>${match?.[2] || ''}</p></div></li>`);
    } else if (/^-\s+/.test(withLinks)) {
      flushLists("ul");
      if (!inUl) { out.push("<ul>"); inUl = true; }
      out.push(`<li><p>${withLinks.replace(/^-\s+/, "")}</p></li>`);
    } else if (/^\d+\.\s+/.test(withLinks)) {
      flushLists("ol");
      if (!inOl) { out.push("<ol>"); inOl = true; }
      out.push(`<li><p>${withLinks.replace(/^\d+\.\s+/, "")}</p></li>`);
    } else if (/^>\s+/.test(withLinks)) {
      flushLists("none");
      out.push(`<blockquote>${withLinks.replace(/^>\s+/, "")}</blockquote>`);
    } else {
      flushLists("none");
      out.push(`<p>${withLinks || "<br/>"}</p>`);
    }
  }
  flushLists("none");
  flushCallout();
  return out.join("");
}

const MenuBar = ({ editor }: { editor: any }) => {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const refresh = () => forceUpdate((v) => v + 1);
    editor.on("selectionUpdate", refresh);
    editor.on("transaction", refresh);
    editor.on("update", refresh);
    return () => {
      editor.off("selectionUpdate", refresh);
      editor.off("transaction", refresh);
      editor.off("update", refresh);
    };
  }, [editor]);

  if (!editor) return null;
  const btn = "p-1.5 rounded flex items-center justify-center transition-colors hover:bg-gray-200 text-gray-700";
  const activeBtn = (nameOrAttrs: string | Record<string, any>, attrs?: any) => {
    if (typeof nameOrAttrs === "string") return editor.isActive(nameOrAttrs, attrs) ? "bg-[#d3e3fd] text-[#041e49]" : "";
    return editor.isActive(nameOrAttrs) ? "bg-[#d3e3fd] text-[#041e49]" : "";
  };
  
  const insertCallout = (type: string) => {
    const pos = editor.state.selection.from;
    const placeholder = "Ketik isi callout di sini...";
    editor.chain().focus().insertContent({
      type: "callout",
      attrs: { type },
      content: [{ type: "paragraph", content: [{ type: "text", text: placeholder }] }]
    }).run();
    requestAnimationFrame(() => editor.chain().focus().setTextSelection({ from: pos + 2, to: pos + 2 + placeholder.length }).run());
  };

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1 border-b px-4 py-1.5 overflow-x-auto no-scrollbar" style={{ backgroundColor: "#edf2fa", borderColor: "#c7c7c7" }}>
      {/* Group: Typography */}
      <div className="flex items-center gap-1">
        <select 
          className="rounded hover:bg-gray-200 bg-transparent px-2 py-1 text-xs font-medium text-gray-800 outline-none cursor-pointer" 
          value={editor ? (editor.getAttributes("textStyle")?.fontFamily || "serif") : "serif"} 
          onChange={(e) => editor?.chain().focus().setFontFamily(e.target.value).run()}
        >
          <option value="serif">Times New Roman</option>
          <option value="Inter">Inter</option>
          <option value="monospace">Monospace</option>
        </select>
        <div className="h-4 w-px bg-gray-400 mx-1 opacity-50" />
        <select 
          className="rounded hover:bg-gray-200 bg-transparent px-2 py-1 text-xs font-medium text-gray-800 outline-none cursor-pointer" 
          value={editor ? (editor.getAttributes("textStyle")?.fontSize || "12px") : "12px"} 
          onChange={(e) => editor?.chain().focus().setFontSize(e.target.value).run()}
        >
          {["10px", "11px", "12px", "14px", "16px", "18px", "20px", "24px"].map((sz) => (
            <option key={sz} value={sz}>{sz.replace("px", "")}</option>
          ))}
        </select>
      </div>

      <div className="h-4 w-px bg-gray-400 mx-1 opacity-50" />

      {/* Group: Basic Formatting */}
      <div className="flex items-center gap-0.5">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`${btn} ${activeBtn("bold")}`} title="Bold (Ctrl+B)"><span className="material-symbols-outlined text-[18px]">format_bold</span></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`${btn} ${activeBtn("italic")}`} title="Italic (Ctrl+I)"><span className="material-symbols-outlined text-[18px]">format_italic</span></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`${btn} ${activeBtn("underline")}`} title="Underline (Ctrl+U)"><span className="material-symbols-outlined text-[18px]">format_underlined</span></button>
        <input type="color" onInput={(e) => editor.chain().focus().setColor(e.currentTarget.value).run()} value={editor.getAttributes("textStyle").color || "#000000"} className="ml-1 h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0 hover:bg-gray-200" title="Text Color" />
        <button type="button" onClick={() => editor.chain().focus().toggleHighlight().run()} className={`${btn} ${activeBtn("highlight")}`} title="Highlight"><span className="material-symbols-outlined text-[18px]">ink_highlighter</span></button>
      </div>

      <div className="h-4 w-px bg-gray-400 mx-1 opacity-50" />

      {/* Group: Structure */}
      <div className="flex items-center gap-1">
        <select 
          className="rounded hover:bg-gray-200 bg-transparent px-2 py-1 text-xs font-medium text-gray-800 outline-none cursor-pointer" 
          value={editor.isActive("heading") ? `h${editor.getAttributes("heading").level}` : "p"} 
          onChange={(e) => {
            const v = e.target.value;
            if (v === "p") editor.chain().focus().setParagraph().run();
            else editor.chain().focus().setHeading({ level: parseInt(v[1]) as any }).run();
          }}
        >
          <option value="p">Normal text</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
      </div>

      <div className="h-4 w-px bg-gray-400 mx-1 opacity-50" />

      {/* Group: Alignment */}
      <div className="flex items-center gap-0.5">
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("left").run()} className={`${btn} ${activeBtn({ textAlign: "left" })}`} title="Align Left"><span className="material-symbols-outlined text-[18px]">format_align_left</span></button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("center").run()} className={`${btn} ${activeBtn({ textAlign: "center" })}`} title="Align Center"><span className="material-symbols-outlined text-[18px]">format_align_center</span></button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("right").run()} className={`${btn} ${activeBtn({ textAlign: "right" })}`} title="Align Right"><span className="material-symbols-outlined text-[18px]">format_align_right</span></button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("justify").run()} className={`${btn} ${activeBtn({ textAlign: "justify" })}`} title="Justify"><span className="material-symbols-outlined text-[18px]">format_align_justify</span></button>
      </div>

      <div className="h-4 w-px bg-gray-400 mx-1 opacity-50" />

      {/* Group: Lists & Blocks */}
      <div className="flex items-center gap-0.5">
        <div className="flex items-center">
          <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${btn} ${activeBtn("bulletList")} rounded-r-none pr-1`} title="Bulleted List"><span className="material-symbols-outlined text-[18px]">format_list_bulleted</span></button>
          <select 
            className={`bg-transparent hover:bg-gray-200 cursor-pointer outline-none rounded-r h-full py-1.5 ${activeBtn("bulletList")} pl-0 pr-1 text-xs`}
            value={editor.isActive("bulletList") ? (editor.getAttributes("bulletList")?.listStyleType || "disc") : "disc"}
            onChange={(e) => {
              const val = e.target.value;
              if (editor.isActive("bulletList")) editor.chain().focus().updateAttributes("bulletList", { listStyleType: val }).run();
              else editor.chain().focus().toggleBulletList().updateAttributes("bulletList", { listStyleType: val }).run();
            }}
            title="Bullet Style"
          >
            <option value="disc">● Solid</option>
            <option value="circle">○ Circle</option>
            <option value="square">■ Square</option>
          </select>
        </div>

        <div className="flex items-center">
          <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`${btn} ${activeBtn("orderedList")} rounded-r-none pr-1`} title="Numbered List"><span className="material-symbols-outlined text-[18px]">format_list_numbered</span></button>
          <select 
            className={`bg-transparent hover:bg-gray-200 cursor-pointer outline-none rounded-r h-full py-1.5 ${activeBtn("orderedList")} pl-0 pr-1 text-xs`}
            value={editor.isActive("orderedList") ? (editor.getAttributes("orderedList")?.listStyleType || "decimal") : "decimal"}
            onChange={(e) => {
              const val = e.target.value;
              if (editor.isActive("orderedList")) editor.chain().focus().updateAttributes("orderedList", { listStyleType: val }).run();
              else editor.chain().focus().toggleOrderedList().updateAttributes("orderedList", { listStyleType: val }).run();
            }}
            title="Numbering Style"
          >
            <option value="decimal">1, 2, 3</option>
            <option value="lower-alpha">a, b, c</option>
            <option value="upper-alpha">A, B, C</option>
            <option value="lower-roman">i, ii, iii</option>
            <option value="upper-roman">I, II, III</option>
          </select>
        </div>

        <button type="button" onClick={() => editor.chain().focus().toggleTaskList().run()} className={`${btn} ${activeBtn("taskList")}`} title="Task List"><span className="material-symbols-outlined text-[18px]">checklist</span></button>
        
        <select className="rounded hover:bg-gray-200 bg-transparent px-2 py-1 text-xs font-medium text-gray-800 outline-none cursor-pointer ml-1" defaultValue="" onChange={(e) => { if (e.target.value) insertCallout(e.target.value); e.currentTarget.value = ""; }}>
          <option value="" disabled>Callout</option>
          {CALLOUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="h-4 w-px bg-gray-400 mx-1 opacity-50" />

      {/* Group: Insert & Indent */}
      <div className="flex items-center gap-0.5">
        <button type="button" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className={btn} title="Insert Table"><span className="material-symbols-outlined text-[18px]">table_chart</span></button>
        {editor.isActive("table") && (
          <>
            <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className={btn} title="Add Row"><span className="material-symbols-outlined text-[18px]">add_row_below</span></button>
            <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className={btn} title="Add Column"><span className="material-symbols-outlined text-[18px]">add_column_right</span></button>
            <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className={btn} title="Delete Row"><span className="material-symbols-outlined text-[18px]">table_rows_narrow</span></button>
            <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className={btn} title="Delete Column"><span className="material-symbols-outlined text-[18px]">view_column_2</span></button>
            <button type="button" onClick={() => editor.chain().focus().mergeCells().run()} className={btn} title="Merge Cells"><span className="material-symbols-outlined text-[18px]">merge_type</span></button>
            <button type="button" onClick={() => editor.chain().focus().splitCell().run()} className={btn} title="Split Cell"><span className="material-symbols-outlined text-[18px]">splitscreen</span></button>
            <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className={`${btn} text-red-600`} title="Delete Table"><span className="material-symbols-outlined text-[18px]">delete</span></button>
          </>
        )}
        <button type="button" onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.onchange = () => {
            if (input.files?.length) {
              const url = URL.createObjectURL(input.files[0]);
              editor.chain().focus().setImage({ src: url }).run();
            }
          };
          input.click();
        }} className={btn} title="Insert Image"><span className="material-symbols-outlined text-[18px]">image</span></button>
        <button type="button" onClick={async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            const video = document.createElement('video');
            video.srcObject = stream;
            await video.play();
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const modal = document.createElement('div');
              modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/80';
              
              const container = document.createElement('div');
              container.className = 'bg-white p-4 rounded-xl flex flex-col items-center gap-4 max-w-2xl w-full mx-4';
              
              const header = document.createElement('div');
              header.className = 'flex justify-between items-center w-full';
              header.innerHTML = '<h3 class="font-bold">Kamera</h3>';
              
              const closeBtn = document.createElement('button');
              closeBtn.innerHTML = '<span class="material-symbols-outlined">close</span>';
              closeBtn.className = 'p-1 hover:bg-gray-100 rounded';
              closeBtn.onclick = () => { stream.getTracks().forEach(t => t.stop()); modal.remove(); };
              header.appendChild(closeBtn);
              
              video.className = 'w-full rounded-lg bg-black object-contain max-h-[60vh]';
              
              const captureBtn = document.createElement('button');
              captureBtn.className = 'bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow hover:bg-blue-700 flex items-center gap-2';
              captureBtn.innerHTML = '<span class="material-symbols-outlined">photo_camera</span> Ambil Foto';
              
              captureBtn.onclick = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                editor.chain().focus().setImage({ src: dataUrl }).run();
                stream.getTracks().forEach(t => t.stop());
                modal.remove();
              };
              
              container.appendChild(header);
              container.appendChild(video);
              container.appendChild(captureBtn);
              modal.appendChild(container);
              document.body.appendChild(modal);
            }
          } catch (err) {
            alert("Kamera tidak bisa diakses: " + String(err));
          }
        }} className={btn} title="Ambil dari Kamera"><span className="material-symbols-outlined text-[15px]">photo_camera</span></button>
        <div className="w-px h-4 bg-gray-400 mx-0.5 opacity-50" />
        <button type="button" onClick={() => (editor.commands as any).setIndent()} className={btn} title="Indent"><span className="material-symbols-outlined text-[18px]">format_indent_increase</span></button>
        <button type="button" onClick={() => (editor.commands as any).outdent()} className={btn} title="Outdent"><span className="material-symbols-outlined text-[18px]">format_indent_decrease</span></button>
      </div>
    </div>
  );
};

const FontSize = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [{ types: ["textStyle"], attributes: { fontSize: { default: null, parseHTML: (el) => el.style.fontSize, renderHTML: (attrs) => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {} } } }];
  },
  addCommands() {
    return { setFontSize: (fontSize: string) => ({ chain }: any) => chain().setMark("textStyle", { fontSize }).run() };
  },
});

const Indent = Extension.create({
  name: "indent",
  addGlobalAttributes() {
    return [{ types: ["paragraph", "heading", "blockquote", "listItem"], attributes: { indent: { default: 0, parseHTML: (el) => parseInt(el.style.paddingLeft, 10) / 2 || 0, renderHTML: (attrs) => attrs.indent ? { style: `padding-left: ${attrs.indent * 2}rem` } : {} } } }];
  },
  addCommands() {
    return {
      setIndent: () => ({ tr, state, dispatch }: any) => {
        const { selection } = state;
        tr.doc.nodesBetween(selection.from, selection.to, (node: any, pos: any) => {
          if (["paragraph", "heading", "blockquote", "listItem"].includes(node.type.name)) {
            const indent = (node.attrs.indent || 0) + 1;
            if (dispatch) tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent });
          }
        });
        return true;
      },
      outdent: () => ({ tr, state, dispatch }: any) => {
        const { selection } = state;
        tr.doc.nodesBetween(selection.from, selection.to, (node: any, pos: any) => {
          if (["paragraph", "heading", "blockquote", "listItem"].includes(node.type.name)) {
            const indent = Math.max(0, (node.attrs.indent || 0) - 1);
            if (dispatch) tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent });
          }
        });
        return true;
      },
    } as any;
  },
});




export const StudyEditorPane = forwardRef<StudyEditorPaneHandle, {
  noteId?: string | null;
  citations: PdfCitation[];
  onRemoveCitation: (id: string) => void;
  onChipClick: (wikilink: string) => void;
  editorContent: string;
  setEditorContent: (val: string) => void;
  isPdfOpen: boolean;
  setIsPdfOpen: (val: boolean) => void;
}>(function StudyEditorPane({ noteId, citations, onRemoveCitation, onChipClick, editorContent, setEditorContent, isPdfOpen, setIsPdfOpen }, ref) {
  const [mode, setMode] = useState<"source" | "edit" | "reading">("edit");
  const [sourceText, setSourceText] = useState(htmlToSource(editorContent));
  const [showCitations, setShowCitations] = useState(true);
  const [pageMargin, setPageMargin] = useState("2.5cm");
  const [isMounted, setIsMounted] = useState(false);
  
  const lastSelectionRef = useRef<{ from: number; to: number } | null>(null);
  const sourceTextareaRef = useRef<HTMLTextAreaElement>(null);
  const sourceSelectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ orderedList: false, bulletList: false }), 
      Dropcursor, 
      Underline, 
      TextStyle, 
      Color, 
      FontFamily,
      CustomBulletList, CustomOrderedList, FontSize, Indent, TiptapImageResize, CharacterCount, Highlight, Table.configure({ resizable: true }), TableRow, TableHeader, TableCell,
      TaskList, TaskItem.configure({ nested: true }),
      CitationExtension,
      PdfLinkMark, 
      CalloutNode, 
      TextAlign.configure({ types: ["heading", "paragraph", "image"] }), 
      Placeholder.configure({ placeholder: "Mulai menulis catatan / dokumen... Ketik #, ##, ###, > [!NOTE] untuk Obsidian-style blocks." })
    ],
    content: sourceToHtml(htmlToSource(editorContent)),
    editable: true,
    immediatelyRender: false,
    editorProps: {
      handleDrop(view, event, _slice, moved) {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target?.result) {
                const schema = view.state.schema;
                const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                const imageType = schema.nodes.image || schema.nodes.imageResize;
                const node = imageType.create({ src: e.target.result });
                const transaction = view.state.tr.insert(coordinates?.pos || view.state.selection.from, node);
                view.dispatch(transaction);
              }
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
      handlePaste(view, event, _slice) {
        if (event.clipboardData && event.clipboardData.files && event.clipboardData.files[0]) {
          const file = event.clipboardData.files[0];
          if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target?.result) {
                const schema = view.state.schema;
                const imageType = schema.nodes.image || schema.nodes.imageResize;
                const node = imageType.create({ src: e.target.result });
                const transaction = view.state.tr.replaceSelectionWith(node);
                view.dispatch(transaction);
              }
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setEditorContent(html);
      setSourceText(htmlToSource(html));
      lastSelectionRef.current = { from: editor.state.selection.from, to: editor.state.selection.to };
    },
    onSelectionUpdate: ({ editor }) => {
      lastSelectionRef.current = { from: editor.state.selection.from, to: editor.state.selection.to };
    },
  });

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (editor) editor.setEditable(mode === "edit");
  }, [editor, mode]);

  const lastNoteIdRef = useRef(noteId);

  useEffect(() => {
    if (editor && noteId !== lastNoteIdRef.current) {
      const isIdUpgrade = lastNoteIdRef.current?.startsWith("new-") && !noteId?.startsWith("new-");
      lastNoteIdRef.current = noteId;
      
      if (!isIdUpgrade) {
        editor.commands.setContent(sourceToHtml(htmlToSource(editorContent)));
      }
    }
  }, [noteId, editor, editorContent]);

  useImperativeHandle(ref, () => ({
    editor,
    insertWikilink: (wikilink: string) => {
      const inner = wikilink.slice(2, -2);
      const label = inner.includes("|") ? inner.slice(inner.lastIndexOf("|") + 1) : inner;
      const text = label;

      if (mode === "source") {
        const ta = sourceTextareaRef.current;
        const start = ta?.selectionStart ?? sourceSelectionRef.current.start ?? sourceText.length;
        const end = ta?.selectionEnd ?? sourceSelectionRef.current.end ?? start;
        const nextSource = `${sourceText.slice(0, start)}${wikilink} ${sourceText.slice(end)}`;
        setSourceText(nextSource);
        const html = sourceToHtml(nextSource);
        setEditorContent(html);
        editor?.commands.setContent(html);
        requestAnimationFrame(() => {
          if (!ta) return;
          const pos = start + wikilink.length + 1;
          ta.focus();
          ta.setSelectionRange(pos, pos);
          sourceSelectionRef.current = { start: pos, end: pos };
        });
        return;
      }

      if (!editor) {
        const nextSource = `${htmlToSource(editorContent)}\n${wikilink}`;
        const html = sourceToHtml(nextSource);
        setSourceText(nextSource);
        setEditorContent(html);
        return;
      }

      setMode("edit");
      editor.setEditable(true);
      const pos = Math.min(lastSelectionRef.current?.to ?? editor.state.selection.to, editor.state.doc.content.size);
      editor.commands.insertContentAt(pos, [
        { type: "text", text, marks: [{ type: "pdfLink", attrs: { wikilink } }] },
        { type: "text", text: " " },
      ]);
      editor.commands.setTextSelection(pos + text.length + 1);
      const html = editor.getHTML();
      setEditorContent(html);
      setSourceText(htmlToSource(html));
    },
  }), [editor, editorContent, mode, setEditorContent, sourceText]);

  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest("[data-wikilink]") as HTMLElement | null;
    const wikilink = link?.getAttribute("data-wikilink");
    if (wikilink) onChipClick(wikilink);
  };

  const switchMode = (next: "source" | "edit" | "reading") => {
    if (mode === "source" && next !== "source") {
      const html = sourceToHtml(sourceText);
      editor?.commands.setContent(html);
      setEditorContent(html);
    }
    if (next === "source" && editor) setSourceText(htmlToSource(editor.getHTML()));
    setMode(next);
  };

  if (!isMounted) return null;

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-xl border bg-[#f4f5f7]" style={{ borderColor: "var(--color-outline-variant)" }}>
      <div className="flex shrink-0 items-center justify-between border-b px-4 h-12 bg-white" style={{ borderColor: "var(--color-outline-variant)" }}>
        <div className="flex items-center gap-1">
          {!isPdfOpen && <button type="button" onClick={() => setIsPdfOpen(true)} className="mr-2 flex items-center gap-1 rounded-full bg-[#0b1020] px-2.5 py-1 text-[10px] font-bold text-white hover:opacity-90 transition-all shadow-sm"><span className="material-symbols-outlined text-[14px]">left_panel_open</span>PDF</button>}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border">
            {(["source", "edit", "reading"] as const).map((m) => (
              <button type="button" key={m} onClick={() => switchMode(m)} className={`rounded-md px-2.5 py-1 text-[10px] font-bold capitalize transition-all ${mode === m ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{m}</button>
            ))}
          </div>
          <button type="button" onClick={() => setShowCitations((v) => !v)} className={`ml-2 flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold transition-colors ${showCitations ? "bg-orange-50 text-orange-700 border-orange-200" : "text-gray-600 hover:bg-gray-100"}`} title="Show/hide citation list">
            <span className="material-symbols-outlined text-[14px]">{showCitations ? "visibility_off" : "visibility"}</span>
            {showCitations ? "Hide Citations" : `Cites (${citations.length})`}
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-3 text-[10px] font-mono text-gray-500 uppercase tracking-tight">
             <span>{editor?.storage.characterCount.words()} Words</span>
             <span>{editor?.storage.characterCount.characters()} Chars</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Auto Saved
          </div>
        </div>
      </div>

      {mode === "edit" && <MenuBar editor={editor} />}

      {showCitations && citations.length > 0 && (
        <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b px-4 py-2" style={{ background: "var(--color-pastel-yellow)", borderColor: "var(--color-outline-variant)" }}>
          <span className="text-[10px] font-bold uppercase">Citations:</span>
          {citations.map((cit) => (
            <div key={cit.id} onClick={() => onChipClick(cit.wikilink)} className="flex shrink-0 cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[11px] font-bold" style={{ background: "var(--color-primary)", color: "var(--color-on-primary)" }}>
              p.{cit.page}<button type="button" onClick={(e) => { e.stopPropagation(); onRemoveCitation(cit.id); }} className="ml-1 opacity-60">×</button>
            </div>
          ))}
        </div>
      )}

      <div className="relative min-h-0 flex-1 overflow-y-auto bg-[#f0f1f4] flex justify-center p-4 md:p-8 scroll-smooth" onClick={handleContentClick}>
        {mode === "source" ? (
          <div 
            className="relative shadow-xl rounded-sm bg-white border border-gray-200"
            style={{ width: "100%", maxWidth: "21cm", minHeight: "29.7cm" }}
          >
            <textarea
              ref={sourceTextareaRef}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              onSelect={(e) => { const ta = e.currentTarget; sourceSelectionRef.current = { start: ta.selectionStart, end: ta.selectionEnd }; }}
              onKeyUp={(e) => { const ta = e.currentTarget; sourceSelectionRef.current = { start: ta.selectionStart, end: ta.selectionEnd }; }}
              onClick={(e) => { const ta = e.currentTarget; sourceSelectionRef.current = { start: ta.selectionStart, end: ta.selectionEnd }; }}
              className="flex-1 w-full h-full resize-none bg-transparent font-mono text-sm leading-7 text-gray-800 outline-none"
            />
          </div>
        ) : (
          <div 
            onClick={() => editor?.chain().focus().run()}
            className={`relative bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-sm border border-gray-200 prose prose-slate max-w-none focus:outline-none transition-all mb-20 flex flex-col ${mode === "reading" ? "opacity-95 cursor-default" : "cursor-text"}`}
            style={{ width: "100%", maxWidth: "21cm", minHeight: "29.7cm", padding: pageMargin }}
          >
             <EditorContent editor={editor} className="flex-1 w-full" />
          </div>
        )}
      </div>

      <style jsx global>{`
        .ProseMirror { min-height: 100%; outline: none !important; }
        .ProseMirror p { margin: 0 0 0.75rem; line-height: 1.6; }
        .ProseMirror h1 { font-size: 1.875rem; line-height: 2.25rem; font-weight: 800; margin: 1rem 0 .75rem; font-family: var(--font-serif); }
        .ProseMirror h2 { font-size: 1.5rem; line-height: 2rem; font-weight: 750; margin: .9rem 0 .65rem; font-family: var(--font-serif); }
        .ProseMirror h3 { font-size: 1.25rem; line-height: 1.75rem; font-weight: 700; margin: .8rem 0 .55rem; font-family: var(--font-serif); }
        .ProseMirror blockquote { border-left: 4px solid #94a3b8; padding-left: .9rem; color: #475569; font-style: italic; margin: .75rem 0; }
        .ProseMirror ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .ProseMirror ol[data-list-style-type="lower-alpha"] { list-style-type: lower-alpha; }
        .ProseMirror ol[data-list-style-type="upper-alpha"] { list-style-type: upper-alpha; }
        .ProseMirror ol[data-list-style-type="lower-roman"] { list-style-type: lower-roman; }
        .ProseMirror ol[data-list-style-type="upper-roman"] { list-style-type: upper-roman; }
        .ProseMirror ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .pdf-link { color: #2563eb; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; font-weight: 600; }
        .pdf-link:hover { color: #1d4ed8; background: #eff6ff; }
        .obsidian-callout { border-left: 5px solid #2563eb; border-radius: .75rem; background: #eff6ff; padding: .85rem 1rem; margin: .85rem 0; font-size: .9rem; min-height: 3rem; }
        .obsidian-callout::before { content: attr(data-callout); display: block; font-weight: 800; font-size: .72rem; letter-spacing: .08em; margin-bottom: .35rem; color: #1d4ed8; }
        .obsidian-callout[data-callout="WARNING"], .obsidian-callout[data-callout="DANGER"] { background: #fef2f2; border-left-color: #dc2626; }
        .obsidian-callout[data-callout="WARNING"]::before, .obsidian-callout[data-callout="DANGER"]::before { color: #dc2626; }
        .obsidian-callout[data-callout="TIP"], .obsidian-callout[data-callout="TODO"] { background: #ecfdf5; border-left-color: #16a34a; }
        .obsidian-callout[data-callout="TIP"]::before, .obsidian-callout[data-callout="TODO"]::before { color: #16a34a; }
        .obsidian-callout[data-callout="QUESTION"] { background: #fffbeb; border-left-color: #d97706; }
        .obsidian-callout[data-callout="QUESTION"]::before { color: #d97706; }
        /* Image Alignment */
        .ProseMirror img { display: block; margin-left: auto; margin-right: auto; }
        .ProseMirror img.text-align-left { margin-left: 0; margin-right: auto; }
        .ProseMirror img.text-align-center { margin-left: auto; margin-right: auto; }
        .ProseMirror img.text-align-right { margin-left: auto; margin-right: 0; }

        .ProseMirror table { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 1.5rem 0; overflow: hidden; border: 1px solid #cbd5e1; }
        .ProseMirror td, .ProseMirror th { min-width: 1em; border: 1px solid #cbd5e1; padding: 6px 10px; vertical-align: top; box-sizing: border-box; position: relative; }
        .ProseMirror th { font-weight: bold; text-align: left; background-color: #f8fafc; }
        .ProseMirror .selectedCell:after { z-index: 2; position: absolute; content: ""; left: 0; right: 0; top: 0; bottom: 0; background: rgba(200, 200, 255, 0.4); pointer-events: none; }
        .ProseMirror .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: 0; width: 4px; z-index: 20; background-color: #3b82f6; pointer-events: none; }
        .ProseMirror table p { margin: 0; }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
});

StudyEditorPane.displayName = "StudyEditorPane";
