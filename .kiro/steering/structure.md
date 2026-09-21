# Structure

```
src/app/           # App Router routes + layouts + SEO (robots, sitemap)
src/views/         # Page UIs (public, auth, profil, admin)
src/components/    # Shared chrome (header, shells, JsonLd)
src/services/      # Firebase + API clients only
src/constants/     # paths, seo
src/hooks/         # useAuthUser, useAdminGuard, …
src/seo/           # metadata helpers + JSON-LD builders
src/types/         # domain types
src/utils/         # schemas, stripUndefined
packages/ui/       # design system submodule
functions/         # Cloud Functions
```

- Prefer `@/` and path aliases over deep relative imports.
- Keep files under ~300 lines when practical.
- No barrel `index.ts` required for views; services/hooks may re-export.
