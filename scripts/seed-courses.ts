import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const coursesToSeed = [
  {
    code: "K3M",
    name: "K3 Mekanik",
    lecturer: "Winda Puspitasari, S.ST., M.T",
    room: "R. Kuliah K-305",
    schedules: { create: [{ dayOfWeek: 1, startTime: "12:20", endTime: "14:55" }] },
    credits: 3,
    color: "#EF4444" // Red
  },
  {
    code: "K3KB",
    name: "K3 Kebakaran",
    lecturer: "Moch. Luqman Ashari, Naufa Aulia Rahma, S.T., M.T.",
    room: "Lab. SPPK",
    schedules: { create: [{ dayOfWeek: 2, startTime: "08:00", endTime: "10:35" }] },
    credits: 3,
    color: "#F97316" // Orange
  },
  {
    code: "K3LK",
    name: "K3 Lingkungan Kerja",
    lecturer: "Afrigh Fajar Rosyidiin, S.ST., M.T",
    room: "Lab. PLK",
    schedules: { create: [{ dayOfWeek: 2, startTime: "10:35", endTime: "14:00" }] },
    credits: 3,
    color: "#10B981" // Green
  },
  {
    code: "SMK3",
    name: "Sistem Manajemen Keselamatan dan Kesehatan Kerja (SMK3)",
    lecturer: "Dr.Dewi Kurniasih, S.KM., M.Kes.",
    room: "R. Kuliah K-302",
    schedules: { create: [{ dayOfWeek: 3, startTime: "09:45", endTime: "11:25" }] },
    credits: 2,
    color: "#3B82F6" // Blue
  },
  {
    code: "K3KM",
    name: "K3 Kimia",
    lecturer: "Agung Nugroho, S.T., M.T",
    room: "R. Kuliah K-203",
    schedules: { create: [{ dayOfWeek: 3, startTime: "13:10", endTime: "15:45" }] },
    credits: 3,
    color: "#8B5CF6" // Purple
  },
  {
    code: "K3PUBT",
    name: "K3 Pesawat Uap dan Bejana Tekan",
    lecturer: "Arief Subekti, S.T., M.MT.",
    room: "Lab. Motor Bakar dan Boiler",
    schedules: { create: [{ dayOfWeek: 4, startTime: "10:35", endTime: "14:00" }] },
    credits: 3,
    color: "#EAB308" // Yellow
  },
  {
    code: "K3PT",
    name: "K3 Pertambangan",
    lecturer: "Agung Nugroho, S.T., M.T",
    room: "Ruang Minitheater U-503",
    schedules: { create: [{ dayOfWeek: 4, startTime: "14:05", endTime: "15:45" }] },
    credits: 2,
    color: "#64748B" // Slate
  },
  {
    code: "K3KS",
    name: "K3 Konstruksi",
    lecturer: "Mades Darul Khairansyah, S.ST., M.T.",
    room: "R. Kuliah P 108",
    schedules: { create: [
      { dayOfWeek: 5, startTime: "10:05", endTime: "10:55" },
      { dayOfWeek: 5, startTime: "13:00", endTime: "14:40" }
    ] },
    credits: 3,
    color: "#06B6D4" // Cyan
  }
];

async function main() {
  console.log('Start seeding schedule...');

  // Ensure "Semester 4" exists
  let semester = await prisma.semester.findFirst({
    where: { name: 'Semester 4' }
  });

  if (!semester) {
    semester = await prisma.semester.create({
      data: { name: 'Semester 4', active: true }
    });
    console.log('Created Semester 4');
  } else {
    console.log('Found Semester 4');
  }

  for (const course of coursesToSeed) {
    // Check if course already exists to prevent duplicates
    const existing = await prisma.course.findUnique({
      where: { name: course.name }
    });

    if (!existing) {
      await prisma.course.create({
        data: {
          ...course,
          semesterId: semester.id,
        }
      });
      console.log(`Created course: ${course.name}`);
    } else {
      console.log(`Course already exists: ${course.name}`);
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
