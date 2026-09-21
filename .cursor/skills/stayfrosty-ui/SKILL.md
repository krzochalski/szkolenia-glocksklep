---
name: stayfrosty-ui
description: >-
  Adopt or migrate UI onto @stayfrosty/ui (Stayfrosty / Glockacci design system).
  Use when writing React UI, migrating off MUI/Emotion styled(), adding screens,
  or when the user mentions @stayfrosty/ui, HardShadow, CatalogCard, sx, .styled.ts,
  @mui/material, or @emotion/styled.
---

# Stayfrosty UI

Copy this folder into the consuming app as `.cursor/skills/stayfrosty-ui/`. Also copy `../../cursor-rule.mdc` into `.cursor/rules/`.

Canonical docs (read before editing UI):

- Humans + API: `packages/ui/README.md` (or this package’s `README.md`)
- Migration playbook: `packages/ui/AGENTS.md`

## Do

1. Import primitives and composites from `@ui`. Icons from `@ui/icons`. (Package name remains `@stayfrosty/ui`; Stayfrosty maps it to `@ui`.)
2. Style with `sx` + theme tokens. Repeated brand look → composites, not a one-off copy.
3. Wrap the tree (and UI tests) with `UiProvider`. Next: `AppRouterCacheProvider` outside `UiProvider`.
4. Keep routing, data, Next Image, and domain types in the app. Pass slots (`image`, `action`) into composites.

## Do not

- Import `@mui/material`, `@mui/icons-material`, `@emotion/styled`, or `@emotion/react` in app source.
- Use `styled()`, `makeStyles`, or new `.styled.ts` files.
- Put Next, Redux, Firebase, or shop models inside `@stayfrosty/ui`.
- Add this package as an isolated pnpm workspace member when `sharedWorkspaceLockfile: false` (duplicate React).

## Migrate old UI

Follow `AGENTS.md` in order: theme → rewrite imports → kill `styled()` → map look-alikes to composites → verify with ripgrep.

Missing icon: add a named re-export in `src/icons.ts` (this package).
