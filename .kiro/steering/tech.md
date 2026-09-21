# Tech stack — Szkolenia Glocksklep

- Next.js 16 App Router + Turbopack, React 19, TypeScript strict
- pnpm 12, Node 22 (app), Node 24 (functions)
- UI: `@stayfrosty/ui` (MUI 9 under the hood) — app imports `@ui` / `@ui/icons` only
- Forms: react-hook-form + Zod 4
- Data: TanStack Query + Firebase Auth/Firestore
- Backend: Cloud Functions Express (`europe-west1`) for enroll/unenroll + bootstrap
- Hosting: Firebase App Hosting backend `szkolenia`, origin `https://szkolenia.glocksklep.pl`
- Lint/test: Biome + Vitest — `pnpm verify` after changes
- Path aliases via `path-aliases.mjs` / `tsconfig.json`
