import { getCourses, getSemesters } from "@/app/actions/academic-actions";
import CoursesClient from "./CoursesClient";

export default async function CoursesPage() {
  const [courses, semesters] = await Promise.all([
    getCourses(),
    getSemesters(),
  ]);

  return <CoursesClient initialCourses={courses} initialSemesters={semesters} />;
}
