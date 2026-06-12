import { NextResponse } from "next/server";
import { getInitialWorkspaceData } from "@/app/actions/academic-actions";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getInitialWorkspaceData();
    
    // Check Google Drive connection status
    let isDriveConnected = false;
    try {
      const token = await prisma.setting.findUnique({ where: { key: "google_refresh_token" } });
      if (token) isDriveConnected = true;
    } catch {
      // DB connection issues or table not found during initial setup
    }

    return NextResponse.json({
      ...data,
      isDriveConnected,
    });
  } catch (error: any) {
    console.error("Workspace sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
