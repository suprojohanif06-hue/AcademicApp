# Analysis Report — Navigation Bug Investigation

## Executive Summary
A navigation bug was reported where Academic OS remains stuck on the **Dashboard** tab (rendering Dashboard content) even when the browser address bar changes to other URLs (like `/courses` or `/tasks`).

The investigation revealed that page transitions are failing because the navigation components (`Sidebar` and `MobileBottomNav` in `src/components/Navigation.tsx`) were intercepting standard Next.js click events. They called `e.preventDefault()` and manually updated the browser's URL using a custom Zustand store state (`activeTab`/`setActiveTab`) and HTML5 History API (`window.history.pushState`), bypassing the Next.js App Router entirely.

This report documents the architectural flaw, evidence chain, and the proposed cleanup of the custom history state manipulation.

---

## 1. Affected Components and Files

### A. Navigation Component (`src/components/Navigation.tsx`)
This component defines `Sidebar`, `MobileTopBar`, and `MobileBottomNav`. In its original implementation:
- It imported `activeTab` and `setActiveTab` from `useAcademicStore`.
- Nav links (`<Link href={item.href}>`) had custom `onClick` event listeners that called `e.preventDefault()`, stopping Next.js routing.
- The `isActive` flag was determined using Zustand store's `activeTab` state rather than the real routing path.

### B. State Store (`src/store/useAcademicStore.ts`)
The Zustand store manages the custom routing state:
- `activeTab: string` (defaulting to `"/dashboard"`).
- `setActiveTab: (tab: string) => void` which manually invokes `window.history.pushState(null, "", tab)`.

### C. Layout and Routing (`src/app/(app)/layout.tsx`)
The app utilizes Next.js App Router with page routes nested under the `(app)` group (e.g., `/dashboard`, `/courses`, `/study`, `/tasks`). The layout correctly renders `{children}`, which responds to Next.js routing when standard navigation is allowed to proceed.

---

## 2. Root Cause Analysis

Next.js App Router relies on intercepting `<Link>` clicks to perform soft page transitions and fetch the server component payloads for the targeted pages. 

When a user clicks a nav link in the original sidebar:
1. The custom `onClick` handler triggers:
   ```typescript
   onClick={(e) => {
     if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
       e.preventDefault(); // <-- BLOCKS NEXT.JS ROUTER TRANSITION
       setActiveTab(item.href);
     }
   }}
   ```
2. The `setActiveTab` action in the store executes:
   ```typescript
   setActiveTab: (tab) => {
     set({ activeTab: tab });
     if (typeof window !== "undefined") {
       window.history.pushState(null, "", tab); // <-- CUSTOM HIST STATE MANIPULATION
     }
   }
   ```
3. The browser address bar updates to `tab` (e.g. `/courses`), but since the click was prevented, Next.js's internal router state remains on `/dashboard`.
4. As a result, the page content (`children` in `layout.tsx`) is never re-rendered with the new route's component, leaving the user stuck on the Dashboard UI.

---

## 3. Evidence Chain

### Observation 1: Zustand Custom Routing Method
In `src/store/useAcademicStore.ts` (lines 41–47):
```typescript
  activeTab: "/dashboard",
  setActiveTab: (tab) => {
    set({ activeTab: tab });
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", tab);
    }
  },
```

### Observation 2: Original Intercepting Click Handlers
Running `git diff src/components/Navigation.tsx` shows that the original codebase intercepted navigation link clicks in both the `Sidebar` and `MobileBottomNav` elements:
```diff
-              onClick={(e) => {
-                if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
-                  e.preventDefault();
-                  setActiveTab(item.href);
-                }
-              }}
```

### Observation 3: Real-Time Routing Check
Next.js provides a native hook `usePathname` from `next/navigation` to detect active routes on the client side. The working directory's current version of `src/components/Navigation.tsx` has been updated to use `usePathname()` and removed the custom `onClick` handler, restoring normal Next.js routing behavior.

---

## 4. Proposed Fixes & Cleanup Plan

To completely resolve the issue and ensure standard Next.js routing is utilized:

### 1. Remove Click Interceptors in Navigation Component
The `onClick` interceptors must be removed from `Link` tags in `src/components/Navigation.tsx`. Active tabs should be determined dynamically via `usePathname()` from `next/navigation`.
*(Note: This change has already been drafted/applied in the working tree for `src/components/Navigation.tsx`).*

### 2. Clean Up Store State
The store variables `activeTab` and `setActiveTab` are now dead code and should be removed from `src/store/useAcademicStore.ts` to prevent future regressions.

#### Before:
```typescript
interface AcademicState {
  // ...
  activeTab: string;
  setActiveTab: (tab: string) => void;
  // ...
}

export const useAcademicStore = create<AcademicState>((set) => ({
  // ...
  activeTab: "/dashboard",
  setActiveTab: (tab) => {
    set({ activeTab: tab });
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", tab);
    }
  },
  // ...
}));
```

#### After:
```typescript
interface AcademicState {
  // ... (Remove activeTab and setActiveTab definitions)
}

export const useAcademicStore = create<AcademicState>((set) => ({
  // ... (Remove activeTab and setActiveTab implementations)
}));
```
