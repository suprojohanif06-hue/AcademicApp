import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const scopes = [
    "https://www.googleapis.com/auth/drive.file",
  ];

  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: "offline", // to get refresh token
    scope: scopes,
    include_granted_scopes: true,
    prompt: "consent", // force to show consent screen to get new refresh token
  });

  return NextResponse.redirect(authorizationUrl);
}
