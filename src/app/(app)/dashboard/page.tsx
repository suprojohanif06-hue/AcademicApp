import DashboardClient from "./DashboardClient";
import { getCourses, getAllTasks, getAllNotes, getAllMaterials } from "@/app/actions/academic-actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [courses, tasks, notes, materials] = await Promise.all([
    getCourses(),
    getAllTasks(),
    getAllNotes(),
    getAllMaterials()
  ]);

  return <DashboardClient 
    courses={courses} 
    tasks={tasks} 
    notes={notes} 
    materials={materials} 
  />;
}
