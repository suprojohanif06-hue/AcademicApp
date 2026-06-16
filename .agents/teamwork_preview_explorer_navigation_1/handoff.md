# Handoff Report — Navigation Bug Investigation

## 1. Observation
- **Direct Observation 1 (Zustand Store Custom History Pushing)**: In `src/store/useAcademicStore.ts` at lines 41-47:
  ```typescript
    activeTab: "/dashboard",
    setActiveTab: (tab) => {
      set({ activeTab: tab });
      if (typeof window !== "undefined") {
        window.history.pushState(null, "", tab);
      }
    },
  ```
- **Direct Observation 2 (Interception in Navigation UI)**: In `src/components/Navigation.tsx` (viewed via `git diff`), the original implementation of sidebar links and mobile bottom navigation links intercepted clicks like so:
  ```typescript
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    setActiveTab(item.href);
                  }
                }}
  ```
- **Direct Observation 3 (Next.js Routing and Layout Shell)**: In `src/app/(app)/layout.tsx` (lines 5-36), the root navigation components (`Sidebar`, `MobileTopBar`, `MobileBottomNav`) are rendered as global layouts surrounding `{children}`. The layouts and page routes (e.g. `/courses/page.tsx` and `/dashboard/page.tsx`) expect standard route updates from the Next.js router.
- **Direct Observation 4 (Current Working Tree Modification)**: Running `git status` shows `src/components/Navigation.tsx` is modified. The local diff shows the deletion of the `onClick` handlers that called `e.preventDefault()`, and replacing the custom `activeTab` from the Zustand store with standard Next.js `usePathname()` for determining active route styles.

---

## 2. Logic Chain
1. **From Observation 2 & 4**: In the original codebase, clicking any link in the navigation sidebar or mobile navigation bar triggered the `onClick` listener. It explicitly executed `e.preventDefault()`, which prevents the browser's default behavior and also blocks Next.js's internal router from processing the link click.
2. **From Observation 1**: Instead of letting Next.js navigate, the onClick handler invoked `setActiveTab(item.href)`. This store action called `window.history.pushState(null, "", tab)`.
3. **From HTML5 History Spec & Next.js Internals**: Calling `window.history.pushState` updates the URL in the address bar dynamically, but it does NOT trigger a route transition inside Next.js App Router. Next.js is unaware of the URL change because its routing listeners are not fired by standard client-side `pushState` calls directly.
4. **From Observation 3**: Because Next.js was unaware of the route transition, the layout's `{children}` remained resolved to the page components of the initial route (the Dashboard page). The page layout never re-rendered the target page components (like the Courses page).
5. **Conclusion**: This mismatch between the browser URL (updated via `pushState`) and the actual page layout content (blocked by `e.preventDefault()`) caused the app to be stuck on the Dashboard page.

---

## 3. Caveats
- **Areas not investigated**: The hermes floating action button (`HermesButton`) and onboarding page transition (`src/app/page.tsx` -> `/dashboard`) were not deeply analyzed, but they do not seem to rely on the custom history state.
- **Assumptions made**: It is assumed that Next.js routing issues are not being exacerbated by any middleware, as no `middleware.ts` exists in the codebase.
- **Alternative interpretations**: It is possible that the custom history state was originally introduced to build a Single Page Application (SPA) where layout components were conditionally rendered in a single file, but since then, the architecture transitioned to Next.js App Router (with individual page files in `src/app/(app)/.../page.tsx`) while the old navigation handlers were left in place.

---

## 4. Conclusion
The navigation bug is caused by custom event interception (`e.preventDefault()`) on nav links, which manually updates the browser history via `window.history.pushState` inside the store's `setActiveTab` action, thereby bypassing Next.js page rendering. 

Fixing this requires:
1. Deleting the `onClick` intercepts on nav links in `src/components/Navigation.tsx` (already drafted in workspace).
2. Using standard Next.js `usePathname()` hook to track active paths for navigation styling (already drafted in workspace).
3. Removing `activeTab` and `setActiveTab` from the Zustand store (`src/store/useAcademicStore.ts`) since they are now dead code.

---

## 5. Verification Method
1. **Compile and Build Check**: Run the command `npm run build` or `npx next build` to verify there are no TypeScript or compilation errors after changing the navigation/store files.
2. **Code Inspection**: Confirm that `src/components/Navigation.tsx` has no instances of `e.preventDefault()` within navigation links and no longer imports/calls `setActiveTab` or `activeTab`.
3. **Zustand Store Check**: Inspect `src/store/useAcademicStore.ts` to ensure `activeTab` and `setActiveTab` are removed from both `AcademicState` interface and the store implementation.
4. **Manual Navigation Test**:
   - Run the application via `npm run dev` or a local development server.
   - Navigate to `/` (onboarding). Click the link to go to `/dashboard`.
   - From `/dashboard`, click the `Courses`, `Study`, `Canvas`, or `Tasks` links in the sidebar/bottom nav.
   - Verify that the URL changes *and* the main content area updates to show the respective page (e.g. Courses client, Tasks client, etc.) rather than staying stuck on the Dashboard.
