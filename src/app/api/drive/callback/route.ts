import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/db";
import { createToken, SESSION_COOKIE } from "@/lib/auth";

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
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();

    if (!profile.email) {
      return NextResponse.json({ error: "Google account email not available" }, { status: 400 });
    }

    let user = await prisma.user.findUnique({ where: { email: profile.email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name || profile.email.split("@")[0],
          password: `google-oauth-${crypto.randomUUID()}`,
        },
      });
    }

    if (tokens.refresh_token) {
      await prisma.setting.upsert({
        where: { userId_key: { userId: user.id, key: "google_refresh_token" } },
        update: { value: tokens.refresh_token },
        create: { userId: user.id, key: "google_refresh_token", value: tokens.refresh_token },
      });
    }

    const token = await createToken(user.id);
    const response = NextResponse.redirect(new URL("/dashboard?drive=connected", request.url));
    response.cookies.set({
      name: SESSION_COOKIE,
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("OAuth Callback Error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
