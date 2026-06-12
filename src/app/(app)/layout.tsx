import { Sidebar, MobileTopBar, MobileBottomNav } from "@/components/Navigation";
import { HermesButton } from "@/components/HermesButton";
import { prisma } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let isDriveConnected = false;
  try {
    const token = await prisma.setting.findUnique({ where: { key: "google_refresh_token" } });
    if (token) isDriveConnected = true;
  } catch {
    // DB might not be connected yet during Phase 2 dev
  }

  return (
    <div className="flex h-full min-h-screen bg-level">
      {/* Desktop Sidebar */}
      <Sidebar isDriveConnected={isDriveConnected} />

      {/* Right side: top bar + scrollable content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Top Bar — 56px height */}
        <MobileTopBar isDriveConnected={isDriveConnected} />

        {/* Scrollable page content area */}
        <main
          className="flex-1 overflow-y-auto pt-14 md:pt-0"
          id="app-scroll-container"
        >
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav />

      {/* Floating Hermes FAB */}
      <HermesButton />
    </div>
  );
}
