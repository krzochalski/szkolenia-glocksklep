# Caching matrix (Szkolenia Glocksklep)

How HTML, RSC, static assets, Firestore, and TanStack Query stay fresh — especially on iOS Safari / home-screen PWA.

## Investigation (pre-fix, prod `https://szkolenia.glocksklep.pl`)

| Layer | Observed | Risk |
|-------|----------|------|
| Catalog HTML (`/`, `/najblizsze-szkolenia`, …) | `Cache-Control: s-maxage=300, stale-while-revalidate≈1y` (`x-nextjs-cache`, Google CDN) | Long SWR at CDN; ISR 300s |
| Shells (`/profil`, `/admin`, `/login`) | `s-maxage=31536000` | Year-long CDN HTML after deploy |
| `/_next/static/*` | `public, max-age=31536000, immutable` | OK |
| `/manifest.webmanifest`, `/sw.js` | `max-age=0` | OK |
| `apphosting.yaml` / `next.config` `headers()` | None | Defaults only |
| Service worker (`public/sw.js`) | Network-only passthrough + `skipWaiting`/`clients.claim` | Not cache-first HTML |
| Firestore client | `persistentLocalCache` + plain `getDoc`/`getDocs` | Cache-satisfied reads after iOS suspend |
| TanStack Query | `staleTime` 10m, `refetchOnWindowFocus: false` | No resume refetch |
| Deploy version | `NEXT_PUBLIC_APP_BUILD_ID` set, unused at runtime | Sticky old bundles |

Mutations (admin Firestore, `/api/enroll`, `/api/unenroll`) did not call `revalidatePath`.

## Target strategy

| Route / data | Strategy | TTL | Invalidation |
|--------------|----------|-----|--------------|
| HTML documents (app routes) | `Cache-Control: private, no-cache, max-age=0, must-revalidate` via `next.config` `headers()` | Revalidate every request | Browser + CDN honor no-cache |
| `/_next/static/*` | Next immutable | 1y | Content hash |
| `/sw.js`, `/manifest.webmanifest` | `no-cache, max-age=0, must-revalidate` | Always revalidate | Deploy |
| Catalog pages (`/`, `/szkolenia`, `/szkolenia/[slug]`, `/najblizsze-szkolenia`) | ISR `revalidate = 60` + client live RQ | ≤60s HTML seed; client ≤30s | `POST /api/revalidate` (secret) from CF enroll/unenroll; `/api/revalidate-catalog` (admin) after admin writes |
| CMS pages (`/faq`, `/regulamin`, `/polityka-*`, `/o-nas`, `/sciezka-rozwoju`) | ISR 60s + static RQ | 60s / 10–30m client | Time-based; admin CMS save invalidates RQ keys |
| Auth / profil / admin shells | `dynamic = 'force-dynamic'` | No long CDN HTML | Deploy |
| Client Router Cache | `experimental.staleTimes.dynamic: 0`, `static: 30` | Soft nav | Navigation |
| Live Firestore (courses, seats, prices, waitlist) | `getDocsFromServer` / `getDocFromServer` when online; RQ `liveQueryOptions` (30s, focus+reconnect) | ≤30s + resume | Resume (`visibilitychange` / `pageshow` / `online`); mutation `invalidateCourseQueries` |
| Static CMS Firestore | Default/static RQ options | 10–30m | Key invalidation on admin save |
| App build | `/api/version` + client poll | On resume + ~5 min | Toast → reload |
| Service worker | Network-only (keep) | N/A | `skipWaiting` |

Primary freshness for seats/prices is **client** (server reads + resume). ISR is SEO / first paint only.

## Env

| Variable | Where | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_APP_BUILD_ID` | Build (next.config) | Embedded client build id |
| `REVALIDATE_SECRET` | App Hosting + Cloud Functions runtime | Protects `POST /api/revalidate` |
| `SITE_ORIGIN` (optional on Functions) | Cloud Functions | Defaults to `https://szkolenia.glocksklep.pl` |

Set the same secret in App Hosting and Functions. If unset, revalidate calls no-op (RQ/resume still refresh clients).

## Manual test plan (iOS Safari + home-screen)

1. **Deploy update** — Install/open PWA, deploy new build, background app, return: toast „Dostępna nowa wersja – odśwież” (or auto within ~5 min); reload shows new UI without reinstall.
2. **Seats / price** — Open `/najblizsze-szkolenia` on iOS; in admin change slots or price; return to iOS tab: within ~30s / on resume, updated values without hard refresh.
3. **Background >10 min** — Open term detail, leave Safari/PWA >10 min, resume: seats/prices refetch; no cache-only stale seats.
4. **Offline** — Enable airplane mode: banner „Jesteś offline — dane mogą być nieaktualne”; go online: refetch.
5. **Static assets** — Network tab: `/_next/static/*` still long-cached; HTML/`/api/version` revalidated.

## Related code

- Headers / `staleTimes`: `next.config.mjs`
- Version / revalidate: `src/app/api/version`, `src/app/api/revalidate`
- Resume / version UI: `src/utils/resumeSync.ts`, `src/utils/appVersion.ts`, `src/app/providers.tsx`
- Live reads: `src/services/courses.ts`, `src/services/queryClient.ts`
- CF: `functions/src/revalidateCatalog.ts`, enroll/unenroll + `/api/revalidate-catalog`
