import { google } from "googleapis";
import { prisma } from "@/lib/db";

export const DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/calendar.events",
];

export const ACADEMIC_ROOT_FOLDER = "Academic OS";

type DriveFolder = { id: string; name?: string | null };

export async function hasGoogleConnection() {
  const token = await prisma.setting.findUnique({ where: { key: "google_refresh_token" } });
  return Boolean(token?.value);
}

export async function getGoogleAuthClient() {
  const refreshTokenSetting = await prisma.setting.findUnique({
    where: { key: "google_refresh_token" },
  });

  if (!refreshTokenSetting?.value) {
    throw new Error("Google is not connected yet.");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({ refresh_token: refreshTokenSetting.value });
  return oauth2Client;
}

function escapeDriveQuery(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export async function findDriveFolder(name: string, parentId?: string): Promise<DriveFolder | null> {
  const auth = await getGoogleAuthClient();
  const drive = google.drive({ version: "v3", auth });
  const escapedName = escapeDriveQuery(name);
  const parentClause = parentId ? ` and '${parentId}' in parents` : "";

  const res = await drive.files.list({
    q: `name = '${escapedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false${parentClause}`,
    fields: "files(id,name)",
    spaces: "drive",
    pageSize: 1,
  });

  const folder = res.data.files?.[0];
  return folder?.id ? { id: folder.id, name: folder.name } : null;
}

export async function createDriveFolder(name: string, parentId?: string): Promise<DriveFolder> {
  const auth = await getGoogleAuthClient();
  const drive = google.drive({ version: "v3", auth });

  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    },
    fields: "id,name",
  });

  if (!folder.data.id) throw new Error(`Failed to create Drive folder: ${name}`);
  return { id: folder.data.id, name: folder.data.name };
}

export async function getOrCreateDriveFolder(name: string, parentId?: string): Promise<DriveFolder> {
  const existing = await findDriveFolder(name, parentId);
  if (existing) return existing;
  return createDriveFolder(name, parentId);
}

export async function getOrCreateAcademicRootFolder() {
  return getOrCreateDriveFolder(ACADEMIC_ROOT_FOLDER);
}

export async function ensureSemesterFolder(name: string) {
  const root = await getOrCreateAcademicRootFolder();
  return getOrCreateDriveFolder(name, root.id);
}

export async function ensureCourseFolder(courseName: string, semesterFolderId: string) {
  const courseFolder = await getOrCreateDriveFolder(courseName, semesterFolderId);
  await Promise.all([
    getOrCreateDriveFolder("Materials", courseFolder.id),
    getOrCreateDriveFolder("Notes", courseFolder.id),
    getOrCreateDriveFolder("Tasks", courseFolder.id),
    getOrCreateDriveFolder("Library", courseFolder.id),
  ]);
  return courseFolder;
}

export async function ensureCourseSubfolder(courseFolderId: string, subfolder: "Materials" | "Notes" | "Tasks" | "Library") {
  return getOrCreateDriveFolder(subfolder, courseFolderId);
}

export async function createDriveTextFile(name: string, content: string, parentId: string, mimeType = "text/markdown") {
  const auth = await getGoogleAuthClient();
  const drive = google.drive({ version: "v3", auth });

  const file = await drive.files.create({
    requestBody: {
      name,
      parents: [parentId],
      mimeType,
    },
    media: {
      mimeType,
      body: content,
    },
    fields: "id,name,webViewLink",
  });

  if (!file.data.id) throw new Error(`Failed to create Drive file: ${name}`);
  return file.data;
}

export async function createCalendarEvent(input: {
  title: string;
  description?: string;
  dueDate: Date;
  courseName?: string;
}) {
  const auth = await getGoogleAuthClient();
  const calendar = google.calendar({ version: "v3", auth });
  const start = input.dueDate;
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const event = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: input.courseName ? `[${input.courseName}] ${input.title}` : input.title,
      description: input.description,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      reminders: {
        useDefault: false,
        overrides: [{ method: "popup", minutes: 60 }],
      },
    },
  });

  return event.data;
}

export async function tryGoogle<T>(operation: () => Promise<T>): Promise<T | null> {
  try {
    if (!(await hasGoogleConnection())) return null;
    return await operation();
  } catch (error) {
    console.warn("Google integration skipped:", error);
    return null;
  }
}
