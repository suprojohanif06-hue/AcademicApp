import { getAllTasks, getCourses, getAllMaterials, getAllNotes } from "@/app/actions/academic-actions";
import TasksClient from "./TasksClient";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [tasks, courses, materials, notes] = await Promise.all([
    getAllTasks(),
    getCourses(),
    getAllMaterials(),
    getAllNotes(),
  ]);

  return <TasksClient initialTasks={tasks} initialCourses={courses} initialMaterials={materials} initialNotes={notes} />;
}
