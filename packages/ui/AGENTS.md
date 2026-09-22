# Agent instructions — `@stayfrosty/ui`

Read [README.md](./README.md) for tokens and composite APIs. This file is the **migration playbook**. Follow it in order when an app still uses MUI, Emotion `styled()`, or `.styled.ts`.

Stayfrosty already completed this migration. Copy the same moves.

Canonical remote: `git@github.com:krzochalski/glocksklep-design-system.git`. Apps add it as a submodule at `packages/ui`.

When dropping this package into another repo, also copy:

| File | Destination in the other app |
|------|------------------------------|
| `cursor-rule.mdc` | `.cursor/rules/stayfrosty-ui.mdc` |
| `skills/stayfrosty-ui/` | `.cursor/skills/stayfrosty-ui/` |
| This file + README.md | Keep next to the package (agents look here first) |

## Non-negotiables

1. App `src/` (and equivalent) **must not** import:
   - `@mui/material`
   - `@mui/material/styles`
   - `@mui/icons-material` or `@mui/icons-material/*`
   - `@emotion/styled`
   - `@emotion/react`
2. No `styled()`, no `makeStyles` / `@mui/styles`, no new `.styled.ts`.
3. Style with `sx` + theme tokens. Hex only via `brand` when `sx` cannot run (third-party `style=`).
4. This package stays free of Next, Redux, Firebase, routing, and domain models.
5. Do not install this package as an isolated pnpm workspace member when `sharedWorkspaceLockfile: false` — duplicate React, invalid hook call.

Allowed MUI import in the **app**: `@mui/material-nextjs` (Next Emotion cache only).

Allowed MUI imports in **this package**: `src/primitives.ts`, `src/icons.ts`, `src/theme.ts` only.

## Adopt (empty or existing app)

1. `git submodule add git@github.com:krzochalski/glocksklep-design-system.git packages/ui`. Add peer deps listed in [README.md](./README.md). pnpm: `link:packages/ui`. npm: `file:packages/ui`.
2. Next: `transpilePackages` includes `@stayfrosty/ui` and MUI/Emotion. Point tsconfig + Vitest aliases at `src/index.ts` and `src/icons.ts` if consuming source. Stayfrosty also aliases `@ui` / `@ui/*` (see the shop repo `path-aliases.mjs`).
3. Load Space Grotesk + Space Mono. Wrap the tree with `UiProvider`. Next: `AppRouterCacheProvider` **outside** `UiProvider`.
4. Tests that render UI wrap with `UiProvider`.
5. Turn on import bans (README lint snippet). Copy [cursor-rule.mdc](./cursor-rule.mdc) into the app’s `.cursor/rules/`.
6. Grep must be empty under app source for the packages in Non-negotiables.

## Migrate existing MUI UI

Do mechanical rewrites first. Then replace duplicated look with composites. Do not restyle from scratch.

### 1. Theme

If the app has its own `createTheme`, **delete it** and use this package’s `theme` / `brand` / `UiProvider`. Extra tokens belong in `packages/ui/src/theme.ts` (this package), not in the app.

### 2. Rewrite imports

| From | To |
|------|----|
| `import { Button, Box } from '@mui/material'` | `import { Button, Box } from '@ui'` (or `@stayfrosty/ui` outside this repo) |
| `import { styled } from '@mui/material/styles'` | delete; convert the component to `sx` (step 3) |
| `import Foo from '@mui/icons-material/Bar'` | `import { Foo } from '@ui/icons'` |
| `import theme, { brand } from '@/theme'` | `import { brand, theme } from '@ui'` |

Keep the **local name** of default icon imports (`ArrowForwardIcon`, `Close`, …). If a name is missing, add `export { default as LocalName } from '@mui/icons-material/MuiName'` in [`src/icons.ts`](./src/icons.ts).

`import { Link as MuiLink } from '@mui/material'` becomes the same named import from `@ui`.

After a bulk replace, merge duplicate `@ui` import lines.

### 3. Kill `styled()` and Emotion keyframes

Rewrite every `styled(X)` / `styled('div')` to a real component (`Box`, `Button`, `Dialog`, …) with `sx`. Delete `*.styled.ts`.

Emotion:

```tsx
const fade = keyframes`from { opacity: 0 } to { opacity: 1 }`;
const Root = styled('main')`animation: ${fade} 0.4s both;`;
```

becomes:

```tsx
<Box
	component='main'
	sx={{
		'@keyframes fadeSlideIn': {
			from: { opacity: 0 },
			to: { opacity: 1 },
		},
		animation: 'fadeSlideIn 0.4s both',
	}}
/>
```

Put `@keyframes` on an ancestor that stays mounted; children can reference the animation name.

### 4. Map look-alikes to composites

Search the app for these shapes. Prefer a composite over a one-off `sx` copy.

| You find | Use |
|----------|-----|
| 3px ink border + 6px offset `box-shadow` | `HardShadow` |
| Same, ink background, light text | `TerminalBlock` |
| Uppercase Space Mono caption | `MonoText` |
| Hero: image frame + heading column | `HeroCard` with `image={<img … />}` or app `OptimizedImage` |
| Listing tile: header bar, square image, title, price, CTA | `CatalogCard` — app maps domain → props. Dense horizontal rows: `layout="list"`. |
| Icon box + uppercase title + short desc | `FeatureTile` (`row` or `card`) |
| FAQ Q/A list or custom accordion | `FaqSection` (`items: { title, content }[]`) |
| Centered “Ładowanie…” / “nie znaleziony” | `EmptyState` (app still wraps `PageWrapper`) |
| `Container maxWidth='xl'` + `py: 4` + flex column + `gap: 4` | `PageColumn` — usage in [README](./README.md#page-column). Pass extra `sx` only (`pb`, `component="main"`). |
| Centered stem + orange chevron between path levels | `PathConnector` |
| Progression step tile (index badge + title/meta/action slots) | `PathStepCard` — app maps course → slots |
| Netto / brutto segment control | `PriceToggle` — keep money math in the app |
| `Box component='button'` option tile with hard shadow | `SelectableCard` |
| Dialog paper with ink border + offset shadow | `HardShadowDialog` + `hardShadowDialog*Sx` |
| Confirm / cancel before a consequential action | `ConfirmDialog` |
| Thumb gallery | `ImageGallery` (`string[]` srcs) |
| Fixed bottom mobile CTA | `MobileStickyActionBar` + `mobileStickyContentPb` |
| Radio/checkbox rows with ink border | `RadioGroup` / `FormGroup` + `formOptionGroupSx` |
| Sticky wordmark bar + mono links | `SiteHeader` — full prop list in [README](./README.md#site-header). App passes links, `linkComponent`, cart, actions. |
| Full-screen mobile nav overlay | `SiteNavDrawer` — same `links`. App owns open/close. |

**Adapters stay in the app.** Example: `ProductCard` reads `Product`, renders `CatalogCard` + `PriceToggle` + `Button component={Link}`.

Leave default MUI `Card` / `Paper` only if the look already matches the theme. If it looks like a catalog tile, use `CatalogCard` / `HardShadow`.

### 5. What not to move into this package

- App shell that knows routes or Redux (nav adapters, footer copy). Presentational chrome is `SiteHeader` / `SiteNavDrawer`; the app passes links.
- `next/image` / generated `srcSet` helpers
- Forms bound to Zod + shop/admin schemas
- JSON-LD, cookie copy, analytics
- Polish (or any) marketing strings — pass as props

### 6. Verify

```bash
# app source — must print nothing
rg "from '@mui/material'|from '@mui/icons-material'|from '@emotion/styled'|from '@emotion/react'" src

# no leftover styled files
rg -l "styled\(" --glob '!packages/ui/**' ; ls **/*.styled.ts
```

Run the app’s lint + typecheck + unit tests. Wrap UI tests with `UiProvider`.

Smoke the migrated screens in a browser: home, listing, detail, FAQ, a form, a dialog. Check that hard shadows still inset (`width: calc(100% - 6px)` is inside `HardShadow` — do not re-add a second offset that clips).

## Pitfalls (Stayfrosty already hit these)

- **Two Reacts / invalid hook call:** `packages/ui` listed as a pnpm workspace project while `sharedWorkspaceLockfile: false`. Use `link:packages/ui` from the app `package.json` instead.
- **Double shadow clip:** `HardShadow` already shrinks width for the 6px offset. Do not wrap it in another box that also adds `box-shadow: 6px 6px`.
- **Money / images / routes stay in the app:** `formatPrice`, `OptimizedImage`, `next/link`, Redux cart. Composites take `ReactNode` slots.
- **Tests:** anything that renders DS components needs `UiProvider` or MUI theme context is missing.
- **Cache order (Next):** `AppRouterCacheProvider` wrapping `UiProvider`, not the other way around.
- **Bulk replace leftovers:** merge duplicate `@ui` import lines; fix icon names that did not exist yet by editing `src/icons.ts`.

## Before / after

```tsx
// BAD
import styled from '@emotion/styled';
import { Box, Button } from '@mui/material';
import ArrowForward from '@mui/icons-material/ArrowForward';

const Card = styled(Box)`
	border: 3px solid #191c1d;
	box-shadow: 6px 6px 0 0 #191c1d;
`;
```

```tsx
// GOOD
import { Button, HardShadow } from '@ui';
import { ArrowForwardIcon } from '@ui/icons';

<HardShadow sx={{ p: 3, bgcolor: 'background.paper' }}>
	<Button variant='contained' endIcon={<ArrowForwardIcon />}>
		Szczegóły
	</Button>
</HardShadow>
```

## Adding to this package

- New **primitive**: already on `@mui/material` → it is already re-exported. Do nothing.
- New **icon**: one line in `src/icons.ts`.
- New **composite**: `src/composites/`, `sx` only, no domain types, export from `src/composites/index.ts`. Add a small render test under `src/composites/__tests__/`.
- New **token**: `src/theme.ts` (`brand` + palette module augmentation).

Do not export `styled` or `joinSx` as public API.
