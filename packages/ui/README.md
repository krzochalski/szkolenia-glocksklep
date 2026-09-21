# Stayfrosty UI

Tactical 8-bit design system for Glockacci / Stayfrosty apps: square corners, 3px ink borders, hard offset shadows, Space Grotesk + Space Mono, orange `#FF4F00` on ink `#191c1d`.

It is a thin layer on **MUI 9 + Emotion**. Apps never import MUI or Emotion directly. They import `@stayfrosty/ui`.

| Audience | Start here |
|----------|------------|
| Human (install, tokens, components) | This file |
| Agent (migrate an existing UI) | [AGENTS.md](./AGENTS.md) |
| Cursor rule to copy into another repo | [cursor-rule.mdc](./cursor-rule.mdc) |
| Cursor skill to copy into another repo | [skills/stayfrosty-ui/SKILL.md](./skills/stayfrosty-ui/SKILL.md) |

## Using this in another app

Canonical remote: `git@github.com:krzochalski/glocksklep-design-system.git`

1. Add this repo as a **git submodule** at `packages/ui` (Stayfrosty and Brass Track both do this).
2. Install peers listed below. Wire `transpilePackages` / tsconfig aliases (see [Install](#install)).
3. Load **Space Grotesk** + **Space Mono**, wrap the tree with `UiProvider`.
4. Copy `cursor-rule.mdc` → `.cursor/rules/` and `skills/stayfrosty-ui/` → `.cursor/skills/`.
5. Ban old imports (see [Lint](#lint-recommended)).
6. If the app already has MUI / Emotion `styled()` UI, follow **[AGENTS.md](./AGENTS.md)** instead of restyling from scratch.

Stayfrosty (`src/` in the shop repo) is a finished example: adapters like `ProductCard` stay in the app; tiles and shadows come from this package.

## What you get

- **`brand` + `theme`** — colors, type, shape (`borderRadius: 0`), Button / Paper / AppBar overrides
- **`UiProvider`** — `ThemeProvider` + `CssBaseline` (grid-paper body background)
- **MUI primitives** — `Button`, `Box`, `TextField`, `Dialog`, … re-exported from `@stayfrosty/ui`
- **Icons** — named re-exports from `@stayfrosty/ui/icons`
- **Composites** — branded blocks (`HardShadow`, `CatalogCard`, `FaqSection`, …) built with `sx` only

The package has **no Next.js, Redux, Firebase, or shop types**. Routing, data, and copy stay in the app.

## Install

```bash
git submodule add git@github.com:krzochalski/glocksklep-design-system.git packages/ui
git submodule update --init --recursive
```

Clone apps with `--recurse-submodules`. After clone: `git submodule update --init`.

Depend from the app (do not publish this package to npm):

- pnpm: `"@stayfrosty/ui": "link:packages/ui"`
- npm: `"@stayfrosty/ui": "file:packages/ui"`

**Peers** (install in the app, same major versions as this repo):

- `react` / `react-dom` ^19
- `@mui/material` / `@mui/icons-material` ^9
- `@emotion/react` / `@emotion/styled` ^11

`@emotion/styled` is required by MUI. **Do not import it** in app code.

Do **not** add this folder as its own pnpm workspace project if the repo uses `sharedWorkspaceLockfile: false`. That installs a second copy of React and breaks hooks. Prefer `link:` from the app package, or a tsconfig path to `packages/ui/src`.

Next.js:

```js
transpilePackages: ['@stayfrosty/ui', '@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled']
```

TypeScript / Vitest aliases if you consume source:

```json
"@stayfrosty/ui": ["./packages/ui/src/index.ts"],
"@stayfrosty/ui/icons": ["./packages/ui/src/icons.ts"]
```

Stayfrosty itself also maps `@ui` / `@ui/*` (see the shop repo `tsconfig.json` + `path-aliases.mjs`). App `src/` imports `@ui` and `@ui/icons`. Other apps can keep the `@stayfrosty/ui` package name.

## Setup

Load **Space Grotesk** (headlines) and **Space Mono** (captions, buttons, prices). Then wrap the tree:

```tsx
import { UiProvider } from '@stayfrosty/ui';

export const AppProviders = ({ children }: { children: React.ReactNode }) => (
	<UiProvider>{children}</UiProvider>
);
```

Next.js App Router also needs MUI’s Emotion cache **outside** `UiProvider`:

```tsx
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { UiProvider } from '@stayfrosty/ui';

<AppRouterCacheProvider>
	<UiProvider>{children}</UiProvider>
</AppRouterCacheProvider>
```

Tests that render DS components wrap with `UiProvider`.

## How to write UI

```tsx
import { Button, CatalogCard, HardShadow, PriceToggle } from '@stayfrosty/ui';
import { ArrowForwardIcon } from '@stayfrosty/ui/icons';

<HardShadow sx={{ p: 3, bgcolor: 'background.paper' }}>
	<Button variant='contained' endIcon={<ArrowForwardIcon />}>
		Szczegóły
	</Button>
</HardShadow>
```

- Style with the **`sx` prop** and theme keys (`ink.main`, `surface.muted`, `primary.main`).
- One-off layout: `Box`, `Stack`, `Grid`, `Container`.
- Repeated brand look: a **composite**, or theme `components` overrides in `src/theme.ts` (inside this package).
- **Never** `styled()`, `.styled.ts`, `@emotion/styled`, `@emotion/react` `keyframes`, or `import … from '@mui/material'`.

Hardcoded hex is a smell. Use `theme.palette` in `sx`, or `brand.*` only where `sx` cannot reach (cookie banners, inline `style` on third-party widgets).

### Tokens

`brand` is the raw palette. The MUI theme maps most of it onto `sx` paths:

| Use | `sx` / palette | `brand` (non-MUI) |
|-----|----------------|-------------------|
| Orange CTA | `primary.main` / `primary.dark` | `primary` / `primaryHover` |
| Ink text / borders | `ink.main` | `ink` |
| Page / paper | `background.paper` | `paper` |
| Muted panels | `surface.muted` / `.soft` / `.softer` / `.chip` | `surfaceMuted` … |
| Secondary text | `text.secondary` | `textSecondary` |
| Warm brown | `accentDark.main` / `.warm` / `.muted` | `accentDark` / `accentWarm` / `accentMuted` |
| Soft orange fill | — | `primarySoft` |

Shape is always square. Buttons are uppercase, min-height 48px, 2px borders.

## Composites

Pass **slots** (`ReactNode`) for images and actions so the app can use Next `Link`, `OptimizedImage`, etc.

### Surfaces

| Component | Role |
|-----------|------|
| `HardShadow` | `Box` with 3px ink border + 6px offset shadow. Accepts all `Box` props. |
| `TerminalBlock` | Same shadow, ink fill, light type, 2rem padding. |
| `MonoText` | Uppercase Space Mono `span`. Prefer `sx` over `style`. |

### Layout / content

| Component | Props | When to use |
|-----------|-------|-------------|
| `HeroCard` | `image`, `children`, `sx?` | Page intro: framed image + copy. |
| `CatalogCard` | `eyebrow?`, `soldOutLabel?`, `promo?`, `promoLabel?`, `image`, `title`, `description?`, `price?`, `priceToggle?`, `action?` | Product, part, or project tile. Omit price row if unused. |
| `FeatureTile` | `icon`, `iconBg?`, `title`, `description`, `variant?: 'row' \| 'card'` | Icon + title + mono description. `card` wraps `HardShadow`. |
| `FaqSection` | `items: { title, content }[]`, `title?`, `headingVariant?: 'h1' \| 'h3'` | Accordion FAQ. |
| `EmptyState` | `title`, `action?` | Loading / not-found page body (no app chrome). |
| `ImageGallery` | `images`, `alt`, `objectFit?`, `mixBlendMultiply?`, `aspectRatio?` | Main image + thumbs. Uses `<img>`, not Next Image. |
| `MobileStickyActionBar` | `summary?`, `action` | Fixed mobile CTA. Pair with `mobileStickyContentPb` on page padding. |
| `SelectableCard` | `onClick`, `image`, `title`, `description?`, `meta?` | Clickable option tile (configurator). |
| `PriceToggle` | `mode: 'netto' \| 'brutto'`, `onChange` | Net / gross control. Format money in the app. |

### Dialogs

`HardShadowDialog` is MUI `Dialog` with ink paper. Title / content / actions use the exported `sx` objects:

```tsx
import {
	Button,
	DialogActions,
	DialogContent,
	DialogTitle,
	HardShadowDialog,
	hardShadowDialogActionsSx,
	hardShadowDialogContentSx,
	hardShadowDialogTitleSx,
} from '@stayfrosty/ui';

<HardShadowDialog open={open} onClose={onClose} fullWidth maxWidth='md'>
	<DialogTitle sx={hardShadowDialogTitleSx}>Title</DialogTitle>
	<DialogContent sx={hardShadowDialogContentSx}>{children}</DialogContent>
	<DialogActions sx={hardShadowDialogActionsSx}>
		<Button variant='outlined' onClick={onClose}>
			Zamknij
		</Button>
	</DialogActions>
</HardShadowDialog>
```

`ConfirmDialog` is the branded confirm/delete dialog. Pass **all copy** from the app (no default language in the package):

```tsx
import { ConfirmDialog, Typography } from '@stayfrosty/ui';

<ConfirmDialog
	open={open}
	title='Potwierdź usunięcie'
	cancelLabel='Anuluj'
	confirmLabel='Usuń'
	loading={deleting}
	onCancel={onClose}
	onConfirm={onConfirm}
>
	<Typography>
		Czy na pewno chcesz usunąć <strong>{name}</strong>? Tej operacji nie można cofnąć.
	</Typography>
</ConfirmDialog>
```

`formOptionGroupSx` styles `RadioGroup` / `FormGroup` option rows (ink border, primary when checked).

## Icons

```tsx
import { ArrowForwardIcon, CloseIcon } from '@stayfrosty/ui/icons';
```

Shipped names match common MUI default-import aliases (`ArrowForwardIcon`, `Close` and `CloseIcon`, `Instagram`, …). To add one, export it from [`src/icons.ts`](./src/icons.ts) — that file is the only place `@mui/icons-material` is allowed.

## Layering

```
App chrome / domain     PageWrapper, nav, cart, admin, Next Link, shop types
        │
@stayfrosty/ui          Composites + themed MUI primitives
        │
MUI + Emotion           Peers — never imported from app source
```

Keep adapters in the app: map `Product` → `CatalogCard` props, pass `next/link` into `Button component={Link}`.

## Lint (recommended)

Ban the old imports so the migration cannot regress. Example Biome rule (allow the three DS files to import MUI):

```json
"noRestrictedImports": {
	"level": "error",
	"options": {
		"paths": {
			"@mui/material": "Import from @ui instead.",
			"@mui/material/styles": "Import from @ui instead.",
			"@emotion/styled": "Use the sx prop on @ui components.",
			"@emotion/react": "Use sx @keyframes, not Emotion keyframes."
		},
		"patterns": [
			{
				"group": ["@mui/icons-material", "@mui/icons-material/**"],
				"message": "Import from @ui/icons instead."
			}
		]
	}
}
```

Override off for `packages/ui/src/primitives.ts`, `icons.ts`, and `theme.ts`. `@mui/material-nextjs` stays allowed in the Next app providers file.
