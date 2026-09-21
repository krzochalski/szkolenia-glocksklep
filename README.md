# Szkolenia Glocksklep

Next.js + Firebase App Hosting app for firearms training scheduling at **https://szkolenia.glocksklep.pl**.

## Stack

- Next.js 16 / React 19 / pnpm
- `@stayfrosty/ui` (design system submodule in `packages/ui`)
- Firebase Auth (email/password, email link, Google) + Firestore + Cloud Functions
- Biome + Vitest — `pnpm verify`

## Setup

```bash
git clone --recurse-submodules <repo>

If `packages/ui` is missing, copy from stayfrosty or: `git submodule update --init --recursive`.
cp .env.example .env.local
pnpm install
pnpm --dir functions install
pnpm dev:next
```

Dev server: [http://localhost:3417](http://localhost:3417)

Emulators (Firestore + Functions):

```bash
pnpm emulators
# or full: pnpm dev
```

Emulator ports (avoid clash with stayfrosty 96xx): UI `9700`, hub `9701`, Firestore `9710`, Functions `9711`.

Bootstrap first admin (when `admins` is empty):

```bash
curl -X POST http://127.0.0.1:9711/szkolenia-glocksklep/europe-west1/api/api/bootstrap \
  -H 'Content-Type: application/json' \
  -d '{"adminEmail":"admin@example.com","adminPassword":"changeme123"}'
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
