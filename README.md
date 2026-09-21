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

### 1. Clone (with UI submodule)

`packages/ui` is a submodule (`glocksklep-design-system`). Always clone with submodules:

```bash
git clone --recurse-submodules <repo-url>
cd szkolenia-glocksklep
```

If you already cloned without submodules:

```bash
git submodule update --init
```

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

## Auth Console checklist

Enable **Email/Password**, **Email link**, and **Google**. Authorized domains:

- `localhost`
- `szkolenia.glocksklep.pl`
- `szkolenia-glocksklep.firebaseapp.com`
- App Hosting default hostname

**Custom email action URL** (Authentication → Templates → Customize action URL):

`https://szkolenia.glocksklep.pl/auth/action`

This routes password-reset / verify-email links into the app (`/auth/action` → `/reset-hasla`).

Bootstrap admin (`szkolenia@glocksklep.pl`) after `firebase login` / ADC:

```bash
pnpm bootstrap:admin
# then open the printed password-reset link
pnpm deploy:auth
```

## Deploy

1. Create App Hosting backend id `szkolenia` in project `szkolenia-glocksklep`
2. Attach custom domain `szkolenia.glocksklep.pl`
3. Set GitHub secret `FIREBASE_SERVICE_ACCOUNT_SZKOLENIA_GLOCKSKLEP`
4. Merge to `main`/`master` or run `pnpm deploy:all`

## Agent notes

See [AGENTS.md](./AGENTS.md) and `.kiro/steering/`.
