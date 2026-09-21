# Agent notes (Szkolenia Glocksklep)

## UI / design system

This repo’s look is **`@stayfrosty/ui`** (`packages/ui`, submodule of `glocksklep-design-system`). In this app import `@ui` and `@ui/icons`. App `src/` never imports `@mui/material`, `@mui/icons-material`, `@emotion/styled`, or `@emotion/react`. Clone with `--recurse-submodules`.

| Audience | File |
|----------|------|
| Humans (install, tokens, components) | [packages/ui/README.md](./packages/ui/README.md) |
| Agents (migrate old MUI / Emotion UI) | [packages/ui/AGENTS.md](./packages/ui/AGENTS.md) |
| Cursor rule (copy into other apps) | [packages/ui/cursor-rule.mdc](./packages/ui/cursor-rule.mdc) |
| Cursor skill | `.cursor/skills/stayfrosty-ui` |

When writing or migrating screens, read those files first.

## Architecture

- Next.js App Router: thin `src/app/**/page.tsx`, UI in `src/views/**`
- Firebase client only in `src/services/**`
- Enrollment/unenrollment via Cloud Functions (`/api/enroll`, `/api/unenroll`) — clients must not write `courses.dates`
- Admin = existence of `admins/{uid}` (Console / bootstrap CF only)
- Paths: `src/constants/paths.ts`
- End tasks with `pnpm verify`
