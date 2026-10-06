# Szkolenia Glocksklep

Next.js + Firebase App Hosting app for firearms training scheduling at **https://szkolenia.glocksklep.pl**.

## Stack

- Next.js 16 / React 19 / pnpm
- `@stayfrosty/ui` (design system submodule in `packages/ui`)
- Firebase Auth (email/password, email link, Google) + Firestore + Cloud Functions
- Biome + Vitest — `pnpm verify`

## Setup (another machine)

### Prerequisites

- **Node.js** 22+ (or current LTS)
- **[pnpm](https://pnpm.io)**
- **Git** with submodule support
- Access to Firebase project `szkolenia-glocksklep` (Auth / Firestore). No service-account file is required for normal local `pnpm dev`.

### 1. Clone and install

`packages/ui` is a git submodule (`glocksklep-design-system`). Preferred:

```bash
git clone --recurse-submodules <repo-url>
cd szkolenia-glocksklep
pnpm install
```

A plain clone is fine too: `pnpm install` runs `preinstall` → `scripts/ensure-ui-submodule.mjs`, which runs `git submodule update --init --recursive` if `packages/ui` is missing. Manual fallback: `git submodule update --init`.

### 2. Environment (`.env.local`)

Firebase web config must **not** be committed. Copy the example and fill values:

```bash
cp .env.example .env.local
```

Get values from [Firebase Console](https://console.firebase.google.com/project/szkolenia-glocksklep/settings/general) → **Project settings** → **Your apps** → Web app:

| Variable | Required |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | yes |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | yes |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | yes |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | yes |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | yes |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | yes |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | optional |
| `NEXT_PUBLIC_SITE_ORIGIN` | yes — use `http://localhost:3417` locally |

Shortcut: copy an existing `.env.local` from another machine (keep it out of git).

Production App Hosting still injects these via `apphosting.yaml` (public Firebase **web** client config, not a server secret).

### 3. Install and run

```bash
pnpm install
pnpm --dir functions install
pnpm dev
```

Open [http://localhost:3417](http://localhost:3417).

Localhost uses the **live** Firebase project (Auth, Firestore, Cloud Functions) — no emulators.

### Verify

```bash
pnpm verify   # biome lint + typecheck + unit tests
```

## npm scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Lint, then start Next.js on port **3417** |
| `pnpm build` | Optimize images, lint, then production Next.js build |
| `pnpm start` | Serve the production build (`next start`) |
| `pnpm optimize-images` | Generate WebP/responsive thumbnails under `public/` |
| `pnpm lint` | Biome lint only |
| `pnpm format` | Lint + write Biome format fixes |
| `pnpm check` | Biome check with `--write` (lint + format) |
| `pnpm typecheck` | TypeScript `tsc --noEmit` |
| `pnpm test` | Lint + Vitest once |
| `pnpm test:unit` | Vitest once (no lint) |
| `pnpm test:watch` | Lint + Vitest watch mode |
| `pnpm verify` | Lint + typecheck + unit tests (CI / agent stop hook) |
| `pnpm functions:build` | Compile Cloud Functions (`functions/`) |
| `pnpm deploy:functions` | Build and deploy Functions only |
| `pnpm deploy:firestore:rules` | Deploy Firestore security rules |
| `pnpm deploy:auth` | Deploy Auth config (`auth` target) |
| `pnpm deploy:all` | App build + Functions build, then App Hosting + Functions + Firestore |
| `pnpm bootstrap:admin` | Create/bootstrap admin user (needs `firebase login` / ADC) |
| `pnpm configure:auth` | Apply Auth settings via Admin SDK (action URL, etc.) |

`preinstall` runs automatically and ensures the `packages/ui` git submodule is present.

## Auth Console checklist

Enable **Email/Password**, **Email link**, and **Google**. Authorized domains:

- `localhost`
- `szkolenia.glocksklep.pl`
- `szkolenia-glocksklep.firebaseapp.com`
- App Hosting default hostname

**Custom email action URL** (Authentication → Templates → Customize action URL):

`https://szkolenia.glocksklep.pl/auth/action`

If the Console rejects the change (`EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED`), the app still sends password-reset and email-link messages via Cloud Functions (`/api/password-reset`, `/api/email-sign-in-link`) with links rewritten to that URL. Requires SMTP env on Functions.

This routes password-reset / verify-email links into the app (`/auth/action` → `/reset-hasla`).

Bootstrap admin (`szkolenia@glocksklep.pl`) after `firebase login` / ADC:

```bash
pnpm bootstrap:admin
# then open the printed password-reset link
pnpm deploy:auth
```

## Transactional email (SMTP via Cloud Functions)

Waiting-list and enrollment confirmations are sent by Cloud Functions with **nodemailer** (same pattern as Stayfrosty) — not the Trigger Email extension.

Copy [`functions/.env.example`](./functions/.env.example) → `functions/.env` and set a [Google App Password](https://myaccount.google.com/apppasswords) for `zamowienia@glocksklep.pl`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=zamowienia@glocksklep.pl
SMTP_PASS=xxxx-xxxx-xxxx-xxxx
MAIL_FROM=zamowienia@glocksklep.pl
```

Without `SMTP_PASS`, enroll / waitlist still work; confirmation emails are skipped (logged).
Password-reset and email-link endpoints return 503; the web app then falls back to Firebase Auth’s built-in mailer (action URL on `*.firebaseapp.com`).

## Deploy

1. Create App Hosting backend id `szkolenia` in project `szkolenia-glocksklep`
2. Attach custom domain `szkolenia.glocksklep.pl`
3. Set GitHub secret `FIREBASE_SERVICE_ACCOUNT_SZKOLENIA_GLOCKSKLEP`
4. Merge to `main`/`master` or run `pnpm deploy:all`

## Agent notes

See [AGENTS.md](./AGENTS.md) and `.kiro/steering/`.
