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
| `CatalogCard` | `eyebrow?`, `soldOutLabel?`, `promo?`, `promoLabel?`, `image`, `title`, `description?`, `price?`, `priceToggle?`, `action?` | Product, part, or project tile. Omit `eyebrow` to hide the header bar. `soldOutLabel` greys the card, strikes it, and stamps the label on the image. |
| `FeatureTile` | `icon`, `iconBg?`, `title`, `description`, `variant?: 'row' \| 'card'` | Icon + title + mono description. `card` wraps `HardShadow`. |
| `FaqSection` | `items: { title, content }[]`, `title?`, `headingVariant?: 'h1' \| 'h3'` | Accordion FAQ. |
| `EmptyState` | `title`, `action?` | Loading / not-found page body (no app chrome). |
| `PageColumn` | see [Page column](#page-column) | Page body. `xl` width, `py: 4`, flex column, `gap: 4`. |
| `ImageGallery` | `images`, `alt`, `objectFit?`, `mixBlendMultiply?`, `aspectRatio?` | Main image + thumbs. Uses `<img>`, not Next Image. |
| `MobileStickyActionBar` | `summary?`, `action` | Fixed mobile CTA. Pair with `mobileStickyContentPb` on page padding. |
| `SelectableCard` | `onClick`, `image`, `title`, `description?`, `meta?` | Clickable option tile (configurator). |
| `PriceToggle` | `mode: 'netto' \| 'brutto'`, `onChange` | Net / gross control. Format money in the app. |
| `SiteHeader` | see [Site header](#site-header) | Sticky bar. Brand, links, optional cart and actions. No routes inside. |
| `SiteNavDrawer` | see [Site header](#site-header) | Mobile overlay. Same `links` as the header. |

### Page column

Page body for any app on this theme. Children stack in a column. Vertical padding and the gap between children are both theme spacing `4` (32px). Width defaults to MUI `xl` (1536px) and stays centered, same as `Container`.

Import from `@stayfrosty/ui` (this shop aliases that package as `@ui`).

```tsx
import { PageColumn, mobileStickyContentPb } from '@stayfrosty/ui';

<PageColumn component='main'>
	<h1>Title</h1>
	<section>...</section>
</PageColumn>
```

`sx` is merged after the built-in styles, so a later value wins. Pass only the extra bits:

```tsx
<PageColumn sx={{ pb: mobileStickyContentPb }}>{/* fixed mobile bar */}</PageColumn>
<PageColumn maxWidth='md'>{/* narrower column; false is full bleed */}</PageColumn>
```

Pair a fixed mobile call-to-action with `MobileStickyActionBar` and `mobileStickyContentPb` on `sx.pb`.

#### Built-in styles

| Style | Value |
|-------|-------|
| `maxWidth` | `'xl'` |
| `py` | `4` |
| `display` | `'flex'` |
| `flexDirection` | `'column'` |
| `gap` | `4` |

#### Props

Every MUI `Container` prop is accepted.

| Prop | Default | Notes |
|------|---------|-------|
| `maxWidth` | `'xl'` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| false` |
| `sx` | — | Merged after the built-in styles. Typical extras: `pb`, `overflow`. |
| `component` | `'div'` | Set `'main'` when this column is the page landmark. |
| `children` | — | Stacked sections. |

### Site header

Presentational chrome for any app on this theme. Routing, active state, open/close, and cart count stay in the app. Both components take the same `SiteNavItem` list and an optional `linkComponent` (`'a'` by default, or `next/link`).

```tsx
import { SiteHeader, SiteNavDrawer } from '@stayfrosty/ui';

<SiteHeader
	brand='ACME'
	brandHref='/'
	linkComponent={Link}
	navLabel='Primary'
	links={[
		{ href: '/', label: 'Home', active: true },
		{ href: '/docs', label: 'Docs' },
		{ id: 'github', href: 'https://github.com', label: 'GitHub', external: true },
	]}
	actions={<button type='button'>Account</button>}
	mobileActions={<button type='button'>Account</button>}
	onOpenMenu={() => setOpen(true)}
	menuOpen={open}
/>

<SiteNavDrawer
	open={open}
	onClose={() => setOpen(false)}
	linkComponent={Link}
	links={links}
	footer={<a href='/login'>Sign in</a>}
/>
```

Omit `cartHref` when the app has no cart. Omit `onOpenMenu` when there is no drawer. Omit `brandHref` when `brand` is already a link or a logo with its own handler.

`actions` renders only in the desktop row. `mobileActions` renders only in the small-screen cluster. Pass both when the control should exist at every width — one React node cannot be mounted twice.

#### `SiteNavItem`

| Field | Default | Notes |
|-------|---------|---|
| `href` | — | Passed to `linkComponent`. |
| `label` | — | String or node. |
| `active` | `false` | Orange underline in the header, ink bar in the drawer. Sets `aria-current="page"`. |
| `external` | `false` | `target="_blank"`, `rel="noreferrer"`, and an external-link icon. |
| `id` | `href` | React key when two items share an `href`. |

#### `SiteHeader`

| Prop | Default | Notes |
|------|---------|---|
| `brand` | — | String uses the orange Space Grotesk wordmark. Any other node renders as-is. |
| `brandHref` | — | Wraps `brand` in `linkComponent`. |
| `links` | — | Desktop row. Hidden below `desktopFrom`. |
| `linkComponent` | `'a'` | Router link. Must accept `href`. |
| `navLabel` | string `brand`, else `"Primary"` | Accessible name of the desktop `<nav>`. |
| `cartHref` | — | Omit to hide the cart. Rendered in both clusters. |
| `cartCount` | `0` | Badge. `0` stays hidden. |
| `cartLabel` | `"Cart"` | Accessible name. Pass the app’s language (`"Koszyk"`). |
| `cartIcon` | cart icon | Replaces the icon. The badge stays. |
| `actions` | — | Desktop only, after the cart. |
| `mobileActions` | — | Below `desktopFrom`, between cart and menu. |
| `onOpenMenu` | — | Omit to hide the menu button. |
| `menuOpen` | `false` | `aria-expanded`. |
| `menuLabel` | `"Open navigation"` | |
| `menuIcon` | hamburger | |
| `desktopFrom` | `"md"` | `"sm"` \| `"md"` \| `"lg"`. Link row from this breakpoint up. |
| `position` | `"sticky"` | App bar position. |
| `hideOnPrint` | `true` | |
| `maxWidth` | `"xl"` | Toolbar width. `false` is full bleed. |
| `sx` | — | App bar override. |
| `toolbarSx` | — | Inner bar override (padding, height). |

#### `SiteNavDrawer`

| Prop | Default | Notes |
|------|---------|---|
| `open` | — | `false` renders nothing. |
| `onClose` | — | Backdrop, close button, and each link. |
| `links` | — | Same items as the header, including ones you hid from the desktop row. |
| `linkComponent` | `'a'` | |
| `title` | `"MENU"` | Head label. Ignored when `header` is set. |
| `header` | — | Replaces the title. Close button stays. |
| `ariaLabel` | string `title`, else `"Menu"` | Dialog name. |
| `footer` | — | Pinned to the bottom of the panel. |
| `closeLabel` | `"Close navigation"` | |
| `closeIcon` | close icon | |
| `side` | `"start"` | `"end"` docks the panel on the right. |
| `width` | `"min(320px, 100%)"` | Number is pixels. |
| `navLabel` | — | Accessible name of the drawer `<nav>`. |
| `sx` | — | Panel override. |
| `backdropSx` | — | Overlay override. |

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

#### ConfirmDialog

Branded confirm / cancel for consequential user actions (enroll, delete, logout, …). Built on `HardShadowDialog`. Prefer this over a raw dialog or `window.confirm`.

| Prop | Notes |
|------|--------|
| `open` | Controlled. |
| `title` | Dialog title. |
| `children` | Message body. Strings wrap in `Typography`. |
| `cancelLabel` / `confirmLabel` | Button copy (app owns locale). |
| `confirmColor` | Defaults to `error`. Use `primary` / `warning` when the action is not destructive. |
| `loading` | Disables both buttons, blocks dismiss, shows a spinner on confirm. |
| `onCancel` / `onConfirm` | Handlers. |

```tsx
import { ConfirmDialog, Typography } from '@stayfrosty/ui';

<ConfirmDialog
	open={open}
	title='Potwierdź wypisanie'
	cancelLabel='Anuluj'
	confirmLabel='Wypisz się'
	loading={isPending}
	onCancel={() => setOpen(false)}
	onConfirm={() => unenroll()}
>
	Czy na pewno chcesz wypisać się z tego terminu?
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
