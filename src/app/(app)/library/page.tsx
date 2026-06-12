import { getAllMaterials, getCourses } from "@/app/actions/academic-actions";
import LibraryClient from "./LibraryClient";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const [materials, courses] = await Promise.all([
    getAllMaterials(),
    getCourses()
  ]);

  return <LibraryClient initialMaterials={materials} courses={courses} />;
}
