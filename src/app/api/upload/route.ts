import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate a unique file name
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const uniqueFileName = `${timestamp}-${cleanFileName}`;
    const filePath = join(uploadDir, uniqueFileName);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName: file.name,
      size: file.size,
      type: file.type
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, message: "Failed to upload file" }, { status: 500 });
  }
}
