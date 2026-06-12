"use client";

import React, { useEffect, useState } from "react";
import { useAcademicStore } from "@/store/useAcademicStore";

export default function StoreHydrator({ children }: { children: React.ReactNode }) {
  const { isHydrated, setInitialData } = useAcademicStore();
  const [loading, setLoading] = useState(!isHydrated);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isHydrated) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function loadWorkspaceData() {
      try {
        const res = await fetch("/api/workspace");
        if (!res.ok) {
          throw new Error(`Failed to load workspace data: ${res.statusText}`);
        }
        const data = await res.json();
        
        if (isMounted) {
          setInitialData({
            courses: data.courses,
            semesters: data.semesters,
            tasks: data.tasks,
            notes: data.notes,
            materials: data.materials,
            isDriveConnected: data.isDriveConnected,
          });
          setLoading(false);
        }
      } catch (err: any) {
        console.error(err);
        if (isMounted) {
          setError(err.message || "Failed to establish connection to database.");
          setLoading(false);
        }
      }
    }

    loadWorkspaceData();

    return () => {
      isMounted = false;
    };
  }, [isHydrated, setInitialData]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f9f9f7] bg-level animate-fade-in">
        <div className="relative flex items-center justify-center">
          {/* Outer glowing pulse */}
          <div className="absolute w-20 h-20 border-4 border-secondary/20 rounded-full animate-ping duration-1000"></div>
          {/* Inner high-speed loading spinner */}
          <div className="w-12 h-12 border-4 border-primary border-t-secondary rounded-full animate-spin"></div>
        </div>
        
        <h3 className="mt-8 text-lg font-bold text-primary tracking-tight font-serif">
          Academic OS
        </h3>
        <p className="mt-2 text-[10px] font-bold text-on-surface-variant/60 tracking-widest font-mono uppercase animate-pulse">
          Synchronizing Workspace Data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f9f9f7] px-6 text-center">
        <span className="material-symbols-outlined text-red-500 text-5xl mb-4">error</span>
        <h3 className="text-xl font-bold text-primary mb-2 font-serif">Workspace Synchronization Failed</h3>
        <p className="text-sm text-on-surface-variant max-w-md mb-6 leading-relaxed">
          {error} Please make sure your Supabase database is online and your Vercel environment variables are correct.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-2.5 rounded-full text-xs font-bold bg-primary text-white transition-all hover:opacity-90 active:scale-95 shadow-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
