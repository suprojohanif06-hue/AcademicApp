import { create } from "zustand";

interface AcademicState {
  isHydrated: boolean;
  isDriveConnected: boolean;
  courses: any[];
  semesters: any[];
  tasks: any[];
  notes: any[];
  materials: any[];
  
  // Hydration
  setInitialData: (data: { courses?: any[], semesters?: any[], tasks?: any[], notes?: any[], materials?: any[], isDriveConnected?: boolean }) => void;

  // Semesters
  addSemester: (semester: any) => void;

  // Courses
  addCourse: (course: any) => void;
  updateCourse: (id: string, updates: any) => void;
  deleteCourse: (id: string) => void;
  
  // Tasks
  addTask: (task: any) => void;
  updateTask: (id: string, updates: any) => void;
  updateTaskStatus: (id: string, status: string) => void;
  deleteTask: (id: string) => void;
  
  // Notes
  addNote: (note: any) => void;
  updateNote: (id: string, updates: any) => void;
  deleteNote: (id: string) => void;
  
  // Materials
  addMaterial: (material: any) => void;
  deleteMaterial: (id: string) => void;
}

export const useAcademicStore = create<AcademicState>((set) => ({
  isHydrated: false,
  isDriveConnected: false,
  courses: [],
  semesters: [],
  tasks: [],
  notes: [],
  materials: [],

  setInitialData: (data) => set((state) => {
    // Only hydrate if we haven't already, OR if the new data has different lengths/updates (optional optimization)
    // To keep it simple and ensure the latest DB changes are reflected if a hard reload happens:
    return {
      isHydrated: true,
      isDriveConnected: data.isDriveConnected !== undefined ? data.isDriveConnected : state.isDriveConnected,
      courses: data.courses || state.courses,
      semesters: data.semesters || state.semesters,
      tasks: data.tasks ? data.tasks.map(t => ({
        ...t,
        // Ensure JSON fields are parsed during hydration if not already parsed
        checklist: t.checklist || (t.checklistData ? JSON.parse(t.checklistData) : []),
        attachments: t.attachments || (t.attachmentsData ? JSON.parse(t.attachmentsData) : [])
      })) : state.tasks,
      notes: data.notes || state.notes,
      materials: data.materials || state.materials,
    };
  }),

  // Semesters
  addSemester: (semester) => set((state) => ({ semesters: [...state.semesters, semester] })),

  // Courses
  addCourse: (course) => set((state) => ({ courses: [...state.courses, { ...course, tasksCount: 0, notesCount: 0, materialsCount: 0 }] })),
  updateCourse: (id, updates) => set((state) => ({
    courses: state.courses.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
  deleteCourse: (id) => set((state) => ({
    courses: state.courses.filter(c => c.id !== id)
  })),

  // Task Actions
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
  })),
  
  updateTaskStatus: (id, status) => set((state) => ({
    tasks: state.tasks.map(t => t.id === id ? { ...t, status } : t)
  })),
  
  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter(t => t.id !== id)
  })),

  // Note Actions
  addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
  
  updateNote: (id, updates) => set((state) => ({
    notes: state.notes.map(n => n.id === id ? { ...n, ...updates } : n)
  })),
  
  deleteNote: (id) => set((state) => ({
    notes: state.notes.filter(n => n.id !== id)
  })),

  // Material Actions
  addMaterial: (material) => set((state) => ({ materials: [material, ...state.materials] })),
  
  deleteMaterial: (id) => set((state) => ({
    materials: state.materials.filter(m => m.id !== id)
  }))
}));
