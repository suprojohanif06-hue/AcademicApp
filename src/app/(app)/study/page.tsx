import { getAllMaterials, getCourses, getAllNotes, getAllTasks } from "@/app/actions/academic-actions";
import StudyClient from "./StudyClient";

export const dynamic = "force-dynamic";

export default async function StudyPage() {
  const [courses, materials, notes, tasks] = await Promise.all([
    getCourses(),
    getAllMaterials(),
    getAllNotes(),
    getAllTasks(),
  ]);

  return <StudyClient initialCourses={courses} initialMaterials={materials} initialNotes={notes} initialTasks={tasks} />;
}
