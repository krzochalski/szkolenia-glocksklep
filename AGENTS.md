# Agent notes (Szkolenia Glocksklep)

## UI / design system

This repo’s look is **`@stayfrosty/ui`** (`packages/ui`, submodule of `glocksklep-design-system`). In this app import `@ui` and `@ui/icons`. App `src/` never imports `@mui/material`, `@mui/icons-material`, `@emotion/styled`, or `@emotion/react`. Prefer `git clone --recurse-submodules`; otherwise `pnpm install` runs `scripts/ensure-ui-submodule.mjs` via `preinstall`.

| Audience | File |
|----------|------|
| Humans (install, tokens, components) | [packages/ui/README.md](./packages/ui/README.md) |
| Agents (migrate old MUI / Emotion UI) | [packages/ui/AGENTS.md](./packages/ui/AGENTS.md) |
| Cursor rule (copy into other apps) | [packages/ui/cursor-rule.mdc](./packages/ui/cursor-rule.mdc) |
| Cursor skill (copy into other apps) | [packages/ui/skills/stayfrosty-ui/SKILL.md](./packages/ui/skills/stayfrosty-ui/SKILL.md) |

When writing or migrating screens, read those files first. Skill: `.cursor/skills/stayfrosty-ui`.

## Architecture

- Next.js App Router: thin `src/app/**/page.tsx`, UI in `src/views/**`
- Firebase client only in `src/services/**`
- Enrollment/unenrollment via Cloud Functions (`/api/enroll`, `/api/unenroll`) — clients must not write `courses.dates`
- Admin user delete via Cloud Functions (`/api/delete-user`) — removes Auth + `users/{uid}`; clients must not delete user docs directly
- Browser `/api/*` is proxied by Next (`src/app/api/[...path]`) with a Google ID token; Firebase Bearer is forwarded as `X-Firebase-Authorization` (org Domain Restricted Sharing blocks public Cloud Run invoker)
- Admin = existence of `admins/{uid}` (Console / bootstrap CF only)
- Paths: `src/constants/paths.ts`
- End tasks with `pnpm verify`
