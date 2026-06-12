import TasksClient from "./TasksClient";

export default function TasksPage() {
  return <TasksClient initialTasks={[]} initialCourses={[]} initialMaterials={[]} initialNotes={[]} />;
}
