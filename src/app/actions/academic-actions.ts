"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ─── SEMESTERS ──────────────────────────────────────────────────
export async function getSemesters() {
  return prisma.semester.findMany({
    orderBy: { createdAt: "asc" },
  });
}

export async function createSemester(data: { name: string; active?: boolean }) {
  const semester = await prisma.semester.create({
    data: {
      name: data.name,
      active: data.active ?? true,
    },
  });
  revalidatePath("/courses");
  revalidatePath("/dashboard");
  return semester;
}

// ─── COURSES ────────────────────────────────────────────────────
export async function getCourses() {
  const courses = await prisma.course.findMany({
    include: {
      _count: {
        select: { tasks: true, notes: true, materials: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return courses.map((course) => ({
    ...course,
    tasksCount: course._count.tasks,
    notesCount: course._count.notes,
    materialsCount: course._count.materials,
  }));
}

export async function getCourseDetails(id: string) {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      semester: true,
      _count: {
        select: { tasks: true, notes: true, materials: true },
      },
    },
  });
  if (!course) return null;

  return {
    ...course,
    tasksCount: course._count.tasks,
    notesCount: course._count.notes,
    materialsCount: course._count.materials,
  };
}

export async function createCourse(data: {
  semesterId: string;
  code: string;
  name: string;
  lecturer: string;
  room?: string;
  schedule?: string;
  credits: number;
  color: string;
}) {
  const course = await prisma.course.create({
    data: {
      semesterId: data.semesterId,
      code: data.code,
      name: data.name,
      lecturer: data.lecturer,
      room: data.room,
      credits: data.credits,
      color: data.color,
    },
  });
  revalidatePath("/courses");
  revalidatePath("/dashboard");
  return course;
}

export async function updateCourse(id: string, data: Partial<any>) {
  const course = await prisma.course.update({
    where: { id },
    data,
  });
  revalidatePath("/courses");
  revalidatePath(`/courses/${id}`);
  revalidatePath("/dashboard");
  return course;
}

export async function deleteCourse(id: string) {
  await prisma.course.delete({ where: { id } });
  revalidatePath("/courses");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

// ─── TASKS ────────────────────────────────────
export async function getAllTasks() {
  return prisma.task.findMany({
    include: { course: true },
    orderBy: { dueDate: "asc" },
  });
}

export async function getCourseTasks(courseId: string) {
  return prisma.task.findMany({
    where: { courseId },
    orderBy: { dueDate: "asc" },
  });
}

export async function createTask(data: { courseId: string; title: string; type: string; priority: string; status: string; dueDate: string }) {
  const task = await prisma.task.create({
    data: {
      courseId: data.courseId,
      title: data.title,
      type: data.type,
      priority: data.priority,
      status: data.status,
      dueDate: new Date(data.dueDate),
    },
  });
  revalidatePath(`/courses/${data.courseId}`);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  return task;
}

export async function updateTaskStatus(id: string, status: string) {
  const task = await prisma.task.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath(`/courses/${task.courseId}`);
  return task;
}

export async function updateTask(id: string, data: Partial<any>) {
  const task = await prisma.task.update({
    where: { id },
    data,
  });
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath(`/courses/${task.courseId}`);
  return task;
}

export async function deleteTask(id: string, courseId: string) {
  await prisma.task.delete({ where: { id } });
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

// ─── MATERIALS & NOTES ────────────────────────────────────
export async function getAllMaterials() {
  return prisma.material.findMany({
    include: { course: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllNotes() {
  return prisma.note.findMany({
    include: { course: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getCourseMaterials(courseId: string) {
  return prisma.material.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCourseNotes(courseId: string) {
  return prisma.note.findMany({
    where: { courseId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createMaterial(data: { courseId: string; title: string; type: string; fileName: string; url: string; totalPages: number; source: string }) {
  const material = await prisma.material.create({
    data: {
      courseId: data.courseId,
      name: data.title,
      type: data.type,
      url: data.url,
      totalPages: data.totalPages,
      source: data.source,
      gdriveFileId: `placeholder-id-${Date.now()}`
    },
  });
  revalidatePath(`/courses/${data.courseId}`);
  revalidatePath("/library");
  return material;
}

export async function createNote(data: { courseId: string; title: string; content: string }) {
  const note = await prisma.note.create({
    data: {
      courseId: data.courseId,
      title: data.title,
      content: data.content,
      gdriveFileId: `placeholder-note-id-${Date.now()}`
    },
  });
  revalidatePath(`/courses/${data.courseId}`);
  revalidatePath("/library");
  return note;
}
export async function updateNote(id: string, data: Partial<any>) {
  const note = await prisma.note.update({
    where: { id },
    data,
  });
  revalidatePath(`/courses/${note.courseId}`);
  revalidatePath("/library");
  return note;
}
export async function deleteMaterial(id: string, courseId: string) {
  await prisma.material.delete({ where: { id } });
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/library");
}

export async function deleteNote(id: string, courseId: string) {
  await prisma.note.delete({ where: { id } });
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/library");
}

export async function getInitialWorkspaceData() {
  const [semesters, courses, tasks, notes, materials] = await Promise.all([
    getSemesters(),
    getCourses(),
    getAllTasks(),
    getAllNotes(),
    getAllMaterials(),
  ]);
  return { semesters, courses, tasks, notes, materials };
}
