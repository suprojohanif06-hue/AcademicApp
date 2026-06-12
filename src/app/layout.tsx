import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Academic OS — Level Edition | Your Knowledge, Elevated",
  description:
    "Academic OS: A unified environment for deep research, citation management, structured note-taking, and gamified academic progress. Built for serious scholars.",
  keywords: ["academic", "notes", "citations", "K3", "study", "google drive"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        {/* Preconnect for fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Google Fonts — Playfair Display + Hanken Grotesk + JetBrains Mono */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Hanken+Grotesk:ital,wght@0,100..900;1,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap"
        />
        {/* Material Symbols Outlined */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="h-full antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
