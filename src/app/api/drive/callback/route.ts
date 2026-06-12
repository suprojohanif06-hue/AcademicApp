import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    // In a real production app, you would ENCRYPT the refresh token before saving.
    // We are saving it to the database so Hermes and the background sync can use it.
    if (tokens.refresh_token) {
      await prisma.setting.upsert({
        where: { key: "google_refresh_token" },
        update: { value: tokens.refresh_token },
        create: { key: "google_refresh_token", value: tokens.refresh_token },
      });
    }

    // Redirect back to dashboard with a success parameter
    return NextResponse.redirect(new URL("/dashboard?drive=connected", request.url));
  } catch (error) {
    console.error("OAuth Callback Error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
