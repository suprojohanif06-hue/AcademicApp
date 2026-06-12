import { getCourseDetails, getCourseMaterials, getCourseNotes, getCourseTasks } from "@/app/actions/academic-actions";
import CourseDetailClient from "./CourseDetailClient";
import Link from "next/link";

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const course = await getCourseDetails(resolvedParams.id);

  if (!course) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/courses" className="text-sm text-blue-600">← Back to Courses</Link>
        <p className="mt-6">Course not found</p>
      </div>
    );
  }

  const [materials, notes, tasks] = await Promise.all([
    getCourseMaterials(course.id),
    getCourseNotes(course.id),
    getCourseTasks(course.id),
  ]);

  return <CourseDetailClient course={course} materials={materials} notes={notes} tasks={tasks} />;
}
