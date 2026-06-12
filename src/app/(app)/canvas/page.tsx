"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  Connection,
  Controls,
  Edge,
  MiniMap,
  Node,
  NodeProps,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { nanoid } from "nanoid";

type CanvasNodeData = {
  title: string;
  body?: string;
  src?: string;
};

type CanvasNode = Node<CanvasNodeData>;
type CanvasEdge = Edge;

const STORAGE_KEY = "academic-canvas-mvp";

const initialNodes: CanvasNode[] = [
  {
    id: "welcome",
    type: "textNode",
    position: { x: 120, y: 120 },
    data: {
      title: "Academic Canvas",
      body: "Drag node ini, sambungkan ke node lain, tambah gambar dari toolbar kiri.",
    },
  },
];

const initialEdges: CanvasEdge[] = [];

function TextNode({ data, selected }: NodeProps<CanvasNode>) {
  return (
    <div className={`w-64 rounded-2xl border bg-white p-4 shadow-sm transition ${selected ? "ring-2 ring-black" : ""}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px]">sticky_note_2</span>
        <p className="text-sm font-bold text-gray-900">{data.title}</p>
      </div>
      <p className="whitespace-pre-wrap text-xs leading-5 text-gray-600">{data.body}</p>
    </div>
  );
}

function ImageNode({ data, selected }: NodeProps<CanvasNode>) {
  return (
    <div className={`w-72 overflow-hidden rounded-2xl border bg-white shadow-sm transition ${selected ? "ring-2 ring-black" : ""}`}>
      {data.src ? <img src={data.src} alt={data.title} className="max-h-72 w-full object-contain bg-gray-100" /> : <div className="flex h-40 items-center justify-center bg-gray-100 text-xs text-gray-500">No image</div>}
      <div className="flex items-center gap-2 p-3">
        <span className="material-symbols-outlined text-[18px]">image</span>
        <p className="truncate text-xs font-bold text-gray-800">{data.title}</p>
      </div>
    </div>
  );
}

function CanvasInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CanvasEdge>(initialEdges);
  const [loaded, setLoaded] = useState(false);

  const nodeTypes = useMemo(() => ({ textNode: TextNode, imageNode: ImageNode }), []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.nodes)) setNodes(parsed.nodes);
        if (Array.isArray(parsed.edges)) setEdges(parsed.edges);
      }
    } finally {
      setLoaded(true);
    }
  }, [setEdges, setNodes]);

  useEffect(() => {
    if (!loaded) return;
    const t = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges, updatedAt: new Date().toISOString() }));
    }, 350);
    return () => window.clearTimeout(t);
  }, [nodes, edges, loaded]);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)), [setEdges]);

  const addTextNode = () => {
    setNodes((nds) => [
      ...nds,
      {
        id: nanoid(),
        type: "textNode",
        position: { x: 160 + nds.length * 24, y: 160 + nds.length * 24 },
        data: { title: "Sticky Note", body: "Tulis ide / konsep K3 di sini." },
      },
    ]);
  };

  const addImageNode = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = String(e.target?.result || "");
        if (!src) return;
        setNodes((nds) => [
          ...nds,
          {
            id: nanoid(),
            type: "imageNode",
            position: { x: 220 + nds.length * 24, y: 180 + nds.length * 24 },
            data: { title: file.name, src },
          },
        ]);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const clearCanvas = () => {
    if (!confirm("Reset canvas?")) return;
    setNodes(initialNodes);
    setEdges(initialEdges);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f8f9fb] animate-fade-in">
      <div className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-4 animate-slide-up">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500">Academic OS</p>
          <h1 className="font-serif text-xl font-bold text-black">Canvas Workspace</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={addTextNode} className="rounded-lg border px-3 py-1.5 text-xs font-bold hover:bg-gray-50 bg-white"><span className="material-symbols-outlined align-middle text-[16px]">note_add</span> Text</button>
          <button onClick={addImageNode} className="rounded-lg border px-3 py-1.5 text-xs font-bold hover:bg-gray-50 bg-white"><span className="material-symbols-outlined align-middle text-[16px]">image</span> Image</button>
          <button onClick={clearCanvas} className="rounded-lg border px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 bg-white"><span className="material-symbols-outlined align-middle text-[16px]">delete</span> Reset</button>
        </div>
      </div>

      <div className="relative flex-1 min-h-0 animate-fade-in delay-100">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background gap={20} size={1} />
          <Controls />
          <MiniMap pannable zoomable />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function CanvasPage() {
  return (
    <>
      <link rel="stylesheet" href="/xyflow.css" />
      <ReactFlowProvider>
        <CanvasInner />
      </ReactFlowProvider>
    </>
  );
}
