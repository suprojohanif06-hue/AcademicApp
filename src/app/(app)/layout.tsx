import { Sidebar, MobileTopBar, MobileBottomNav } from "@/components/Navigation";
import { HermesButton } from "@/components/HermesButton";
import StoreHydrator from "@/components/StoreHydrator";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreHydrator>
      <div className="flex h-full min-h-screen bg-level">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Right side: top bar + scrollable content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Mobile Top Bar — 56px height */}
          <MobileTopBar />

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
    </StoreHydrator>
  );
}
