"use client";

import { useEffect } from "react";
import { useAcademicStore } from "@/store/useAcademicStore";

export default function StoreHydrator({
  initialData,
}: {
  initialData: {
    courses: any[];
    semesters: any[];
    tasks: any[];
    notes: any[];
    materials: any[];
  };
}) {
  const { setInitialData } = useAcademicStore();

  // Hydrate the Zustand store on initial client mount
  useEffect(() => {
    setInitialData({
      courses: initialData.courses,
      semesters: initialData.semesters,
      tasks: initialData.tasks,
      notes: initialData.notes,
      materials: initialData.materials,
    });
  }, [initialData, setInitialData]);

  return null;
}
