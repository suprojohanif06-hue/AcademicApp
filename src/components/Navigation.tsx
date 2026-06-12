"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAcademicStore } from "@/store/useAcademicStore";

import { useLocalStorage } from "@/hooks/useLocalStorage";

const navItems = [
  { href: "/dashboard", icon: "home", label: "Home" },
  { href: "/courses", icon: "school", label: "Courses" },
  { href: "/study", icon: "menu_book", label: "Study" },
  { href: "/canvas", icon: "account_tree", label: "Canvas" },
  { href: "/tasks", icon: "check_circle", label: "Tasks" },
  { href: "/library", icon: "book", label: "Library" },
  { href: "/research", icon: "science", label: "Research" },
  { href: "/archive", icon: "inventory_2", label: "Archive" },
];

const mobileNavItems = [
  { href: "/dashboard", icon: "home", label: "Home" },
  { href: "/courses", icon: "school", label: "Courses" },
  { href: "/study", icon: "menu_book", label: "Study" },
  { href: "/canvas", icon: "account_tree", label: "Canvas" },
  { href: "/tasks", icon: "check_circle", label: "Tasks" },
  { href: "/hermes", icon: "smart_toy", label: "Hermes" },
];

export function Sidebar({ isDriveConnected = false }: { isDriveConnected?: boolean }) {
  const { activeTab, setActiveTab } = useAcademicStore();
  const [isCollapsed, setIsCollapsed, isHydrated] = useLocalStorage("sidebar-collapsed", false);

  if (!isHydrated) {
    return (
      <aside className="hidden md:flex w-64 border-r border-outline-variant h-full" style={{ background: "var(--color-surface-container-lowest)" }}></aside>
    );
  }

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-outline-variant h-full transition-all duration-300 ${isCollapsed ? "w-16 items-center" : "w-64"}`}
      style={{ background: "var(--color-surface-container-lowest)" }}
    >
      {/* ── Brand Logo ── */}
      <div className={`h-16 flex items-center border-b border-outline-variant shrink-0 w-full relative ${isCollapsed ? 'justify-center' : 'px-4 justify-between'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="material-symbols-outlined icon-filled shrink-0" style={{ fontSize: "28px", color: "var(--color-primary)" }}>
              school
            </span>
            <div className="flex flex-col shrink-0">
              <h1 className="font-bold text-lg leading-none" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>
                Academic OS
              </h1>
              <p className="text-[10px] uppercase tracking-widest font-mono font-bold" style={{ color: "var(--color-tertiary)" }}>
                Level Edition
              </p>
            </div>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className={`shrink-0 transition-colors flex items-center justify-center rounded-full hover:bg-gray-100 ${isCollapsed ? 'w-12 h-12 text-primary' : 'h-8 w-8 text-gray-500 hover:text-primary'}`}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <span className={`material-symbols-outlined ${isCollapsed ? 'icon-filled' : ''}`} style={{ fontSize: isCollapsed ? "28px" : "20px" }}>
            {isCollapsed ? "school" : "chevron_left"}
          </span>
        </button>
      </div>

      {/* ── Scholar Profile Card ── */}
      {!isCollapsed ? (
        <div
          className="mx-4 mb-3 mt-4 p-3 rounded-xl shrink-0"
          style={{ background: "var(--color-surface-container-low)", border: "1px solid var(--color-outline-variant)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ background: "var(--color-secondary)" }}
            >
              H
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate" style={{ color: "var(--color-primary)" }}>
                Hanif
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="xp-badge">Level 14</span>
                <span className="text-[10px]" style={{ color: "var(--color-on-surface-variant)" }}>1,850 XP</span>
              </div>
            </div>
          </div>

          {/* ── Google Drive Status Indicator ── */}
          {isDriveConnected ? (
            <div
              className="mt-3 flex items-center gap-2 px-2 py-1.5 rounded-lg"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#22c55e" }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#22c55e" }} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide flex-1" style={{ color: "#16a34a" }}>
                Drive: Connected
              </span>
              <span className="material-symbols-outlined icon-filled" style={{ fontSize: "14px", color: "#16a34a" }}>
                cloud_done
              </span>
            </div>
          ) : (
            <Link
              href="/api/drive/auth"
              className="mt-3 flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg transition-all hover:opacity-80 active:scale-95"
              style={{ background: "var(--color-primary)", color: "var(--color-on-primary)" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>cloud_off</span>
              <span className="text-[10px] font-bold uppercase tracking-wide">Connect Drive</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center shrink-0">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 mb-2 relative" style={{ background: "var(--color-secondary)" }}>
            H
            {isDriveConnected ? (
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            ) : (
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
            )}
          </div>
        </div>
      )}

      {/* ── XP Progress Bar ── */}
      {!isCollapsed && (
        <div className="mx-4 mb-5 shrink-0">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-outline-variant)" }}>
            <div
              className="h-full rounded-full relative overflow-hidden"
              style={{ width: "68%", background: "var(--color-secondary)" }}
            >
              <div className="absolute inset-0 animate-pulse-glow" style={{ background: "rgba(255,255,255,0.3)" }} />
            </div>
          </div>
          <p className="text-[10px] mt-1 text-right" style={{ color: "var(--color-on-surface-variant)", fontFamily: "var(--font-mono)" }}>
            68% → Lvl 15
          </p>
        </div>
      )}

      {/* ── Nav Items ── */}
      <div className={`flex flex-col gap-1 flex-1 overflow-y-auto overflow-x-hidden ${isCollapsed ? 'px-1 items-center w-full mt-2' : 'px-3'}`}>
        {navItems.map((item) => {
          const isActive = activeTab === item.href || (item.href !== "/dashboard" && activeTab.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              onClick={(e) => {
                if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  setActiveTab(item.href);
                }
              }}
              className={`nav-link w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? "active font-bold" : "hover:bg-gray-100"}`}
              style={isActive ? { background: "var(--color-primary-container)", color: "var(--color-on-primary-container)" } : { color: "var(--color-on-surface-variant)" }}
            >
              <span className={`material-symbols-outlined shrink-0 ${isActive ? " icon-filled" : ""}`} style={{ fontSize: "20px" }}>
                {item.icon}
              </span>
              {!isCollapsed && <span className="text-sm truncate">{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* ── Settings ── */}
      <div
        className={`mt-auto pt-4 mb-4 shrink-0 w-full ${isCollapsed ? 'px-1 items-center flex flex-col' : 'px-3 mx-0'}`}
        style={{ borderTop: "1px solid var(--color-outline-variant)" }}
      >
        <Link 
          href="/settings" 
          title={isCollapsed ? "Settings" : undefined}
          onClick={(e) => {
            if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
              e.preventDefault();
              setActiveTab("/settings");
            }
          }}
          className={`nav-link w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-gray-100 ${activeTab.startsWith('/settings') ? 'active font-bold bg-gray-200' : ''}`}
          style={{ color: "var(--color-on-surface-variant)" }}
        >
          <span className="material-symbols-outlined shrink-0" style={{ fontSize: "20px" }}>settings</span>
          {!isCollapsed && <span className="text-sm">Settings</span>}
        </Link>
      </div>
    </aside>
  );
}

export function MobileTopBar({ isDriveConnected = false }: { isDriveConnected?: boolean }) {
  return (
    <header
      className="md:hidden fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-14"
      style={{
        background: "rgba(249,249,247,0.9)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--color-outline-variant)",
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
          style={{ background: "var(--color-primary)" }}
        >
          A
        </div>
        <h1 className="font-bold text-base tracking-tight" style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>
          Academic OS
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {isDriveConnected ? (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50/50 border border-green-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-bold text-green-700 tracking-wider">DRIVE: OK</span>
          </div>
        ) : (
          <Link href="/api/drive/auth" className="flex items-center gap-1 px-2 py-1 rounded-full border border-red-200/50 transition-all active:scale-95" style={{ background: "var(--color-error-container)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "12px", color: "var(--color-error)" }}>cloud_off</span>
            <span className="text-[9px] font-bold tracking-wider" style={{ color: "var(--color-error)" }}>CONNECT</span>
          </Link>
        )}
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm" style={{ background: "var(--color-secondary)" }}>
          H
        </div>
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  const { activeTab, setActiveTab } = useAcademicStore();
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-1 pb-safe pt-2"
      style={{
        background: "rgba(249,249,247,0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--color-outline-variant)",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
    >
      {mobileNavItems.map((item) => {
        const isActive = activeTab === item.href || (item.href !== "/dashboard" && activeTab.startsWith(item.href + "/"));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={(e) => {
              if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                setActiveTab(item.href);
              }
            }}
            className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all active:scale-90 min-w-[56px]"
            style={{
              background: isActive ? "var(--color-surface-container-high)" : "transparent",
              color: isActive ? "var(--color-primary)" : "var(--color-on-surface-variant)",
            }}
          >
            <span
              className={`material-symbols-outlined${isActive ? " icon-filled" : ""}`}
              style={{ fontSize: "22px" }}
            >
              {item.icon}
            </span>
            <span
              className="text-[10px] font-semibold"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.03em" }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
