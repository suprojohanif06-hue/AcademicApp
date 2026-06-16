"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ─── SEMESTERS ──────────────────────────────────────────────────
export async function getSemesters() {
  const { getCurrentUserId } = await import("@/lib/auth");
  const userId = await getCurrentUserId();

  return prisma.semester.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createSemester(data: { name: string; active?: boolean }) {
  const { getCurrentUserId } = await import("@/lib/auth");
  const userId = await getCurrentUserId();

  const semester = await prisma.semester.create({
    data: {
      name: data.name,
      active: data.active ?? true,
      userId,
    },
  });
  
  revalidatePath("/courses");
  revalidatePath("/dashboard");

  if (data.active ?? true) {
    import("@/lib/google-drive").then(({ ensureSemesterFolder, tryGoogle }) => {
      tryGoogle(async () => {
        const folder = await ensureSemesterFolder(data.name);
        if (folder?.id) {
          await prisma.semester.update({ where: { id: semester.id }, data: { gdriveFolderId: folder.id } });
        }
      }).catch(console.error);
    });
  }

  return semester;
}

export async function deleteSemester(id: string) {
  const { getCurrentUserId } = await import("@/lib/auth");
  const userId = await getCurrentUserId();

  await prisma.course.deleteMany({
    where: { semesterId: id, userId },
  });
  const semester = await prisma.semester.delete({
    where: { id, userId },
  });
  revalidatePath("/courses");
  revalidatePath("/dashboard");
  return semester;
}

// ─── COURSES ────────────────────────────────────────────────────
export async function getCourses() {
  const { getCurrentUserId } = await import("@/lib/auth");
  const userId = await getCurrentUserId();

  const courses = await prisma.course.findMany({
    where: { userId },
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
  const { getCurrentUserId } = await import("@/lib/auth");
  const userId = await getCurrentUserId();

  const course = await prisma.course.findFirst({
    where: { id, userId },
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
  const { getCurrentUserId } = await import("@/lib/auth");
  const userId = await getCurrentUserId();

  const course = await prisma.course.create({
    data: {
      semesterId: data.semesterId,
      code: data.code,
      name: data.name,
      lecturer: data.lecturer,
      room: data.room,
      credits: data.credits,
      color: data.color,
      userId,
    },
  });
  
  revalidatePath("/courses");
  revalidatePath("/dashboard");

  import("@/lib/google-drive").then(({ tryGoogle, ensureCourseFolder, ensureSemesterFolder }) => {
    tryGoogle(async () => {
      const semester = await prisma.semester.findFirst({ where: { id: data.semesterId, userId } });
      if (!semester) return;
      
      let gdriveFolderId = semester.gdriveFolderId;
      if (!gdriveFolderId) {
        const semFolder = await ensureSemesterFolder(semester.name);
        if (semFolder) {
          await prisma.semester.update({ where: { id: semester.id }, data: { gdriveFolderId: semFolder.id } });
          gdriveFolderId = semFolder.id;
        }
      }

      if (gdriveFolderId) {
        const courseFolder = await ensureCourseFolder(data.name, gdriveFolderId);
        if (courseFolder?.id) {
          await prisma.course.update({ where: { id: course.id }, data: { gdriveFolderId: courseFolder.id } });
        }
      }
    }).catch(console.error);
  });

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
  const { getCurrentUserId } = await import("@/lib/auth");
  const userId = await getCurrentUserId();
  await prisma.course.delete({ where: { id, userId } });
  revalidatePath("/courses");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

// ─── TASKS ────────────────────────────────────
export async function getAllTasks() {
  const { getCurrentUserId } = await import("@/lib/auth");
  const userId = await getCurrentUserId();

  return prisma.task.findMany({
    where: { course: { userId } },
    include: { course: true },
    orderBy: { dueDate: "asc" },
  });
}

export async function getCourseTasks(courseId: string) {
  const { getCurrentUserId } = await import("@/lib/auth");
  const userId = await getCurrentUserId();

  return prisma.task.findMany({
    where: { courseId, course: { userId } },
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

  if (data.dueDate) {
    import("@/lib/google-drive").then(({ createCalendarEvent, tryGoogle }) => {
      tryGoogle(async () => {
        const course = await prisma.course.findUnique({ where: { id: data.courseId } });
        const event = await createCalendarEvent({
          title: data.title,
          dueDate: new Date(data.dueDate),
          courseName: course?.name,
        });
        if (event?.id) {
          await prisma.task.update({ where: { id: task.id }, data: { gcalEventId: event.id } });
        }
      }).catch(console.error);
    });
  }

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
  const { getCurrentUserId } = await import("@/lib/auth");
  const userId = await getCurrentUserId();

  return prisma.material.findMany({
    where: { course: { userId } },
    include: { course: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllNotes() {
  const { getCurrentUserId } = await import("@/lib/auth");
  const userId = await getCurrentUserId();

  return prisma.note.findMany({
    where: { course: { userId } },
    include: { course: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getCourseMaterials(courseId: string) {
  const { getCurrentUserId } = await import("@/lib/auth");
  const userId = await getCurrentUserId();

  return prisma.material.findMany({
    where: { courseId, course: { userId } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCourseNotes(courseId: string) {
  const { getCurrentUserId } = await import("@/lib/auth");
  const userId = await getCurrentUserId();

  return prisma.note.findMany({
    where: { courseId, course: { userId } },
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
      gdriveFileId: `pending-note-sync-${Date.now()}`,
    },
  });

  revalidatePath(`/courses/${data.courseId}`);
  revalidatePath("/library");

  import("@/lib/google-drive").then(({ ensureCourseSubfolder, createDriveTextFile, tryGoogle }) => {
    tryGoogle(async () => {
      const course = await prisma.course.findUnique({ where: { id: data.courseId } });
      if (course?.gdriveFolderId) {
        const notesFolder = await ensureCourseSubfolder(course.gdriveFolderId, "Notes");
        if (notesFolder) {
          const safeTitle = data.title.trim() ? data.title.trim() : "Untitled Note";
          const file = await createDriveTextFile(`${safeTitle}.md`, data.content || " ", notesFolder.id);
          if (file?.id) {
            await prisma.note.update({ where: { id: note.id }, data: { gdriveFileId: file.id } });
          }
        }
      }
    }).catch(console.error);
  });

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
