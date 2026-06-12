import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with Hanif's initial data...");

  // 1. Clear existing data to avoid duplicates during dev
  await prisma.task.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.course.deleteMany();

  // 2. Create Courses
  const k3 = await prisma.course.create({
    data: {
      name: "Keselamatan & Kesehatan Kerja",
      code: "K3-101",
      lecturer: "Dr. Pratiwi",
      room: "Lab K3 • R.101",
      color: "var(--color-pastel-peach)",
    },
  });

  const hig = await prisma.course.create({
    data: {
      name: "Higiene Industri",
      code: "HIG-201",
      lecturer: "Prof. Rahardjo",
      room: "R.204 • Online",
      color: "var(--color-pastel-mint)",
    },
  });

  const apd = await prisma.course.create({
    data: {
      name: "Manajemen APD & LOTO",
      code: "APD-301",
      lecturer: "Ir. Susanto",
      room: "Aula B",
      color: "var(--color-pastel-lavender)",
    },
  });

  // 3. Create Schedules
  await prisma.schedule.createMany({
    data: [
      { dayOfWeek: 1, startTime: "08:00", endTime: "09:40", courseId: k3.id }, // Senin
      { dayOfWeek: 2, startTime: "10:30", endTime: "12:10", courseId: hig.id }, // Selasa
      { dayOfWeek: 4, startTime: "13:00", endTime: "14:40", courseId: apd.id }, // Kamis
    ],
  });

  // 4. Create Tasks (Boss Battles)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const next3Days = new Date();
  next3Days.setDate(next3Days.getDate() + 3);

  const nextFriday = new Date();
  nextFriday.setDate(nextFriday.getDate() + (5 - nextFriday.getDay() + 7) % 7 || 7);

  await prisma.task.createMany({
    data: [
      {
        title: "UTS Higiene Industri",
        dueDate: tomorrow,
        xpReward: 1200,
        courseId: hig.id,
      },
      {
        title: "Makalah APD K3 Konstruksi",
        dueDate: next3Days,
        xpReward: 2000,
        courseId: apd.id,
      },
      {
        title: "Laporan Praktikum K3",
        dueDate: nextFriday,
        xpReward: 750,
        courseId: k3.id,
      },
    ],
  });

  console.log("Seeding complete! ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
