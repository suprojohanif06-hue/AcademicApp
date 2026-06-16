# Context

## Project Info
- **Project Name**: Academic App (Academic OS)
- **Path**: d:/Project/academic-app
- **Language/Framework**: TypeScript, Next.js (Note the Next.js agent rule about breaking changes in node_modules/next/dist/docs/)
- **Repository**: git origin/main

## Requirements
- **R1. Resolve Navigation Bug**: Ensure clicking navigation links in the Sidebar, Mobile Top Bar, or Mobile Bottom Nav successfully changes the page content. Standard Next.js route navigation must be used instead of overriding transitions with custom history state without actual page rendering.
- **R2. Commit and Push Fixes**: Stage, commit, and push the navigation changes (specifically `src/components/Navigation.tsx`) to the GitHub repository so that Vercel triggers a new production build.
- **R3. Verify Build and Transitions**: Ensure the production build on Vercel succeeds and verify that page transitions are completely instantaneous (0ms delay) on the live site.

## Core Rules & Constraints
- Only use standard Next.js route navigation.
- No direct code modifications by Orchestrator. All edits must be delegated to workers.
- Integrity verification mode: development. No cheating/hardcoding test results.
