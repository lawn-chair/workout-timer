# Plan: Basic PWA Support

## Goal

Enable installable PWA support with a custom app icon and a basic offline
fallback. Cache the app shell and static assets only; do not cache API
responses or workout data.

## Scope

- App Router manifest via `src/app/manifest.ts`.
- Custom icons in `public/icons/` (SVG source + PNG exports).
- Offline fallback page for navigation requests.
- Service worker with app-shell caching only.
- Playwright check for manifest and offline fallback.

## Approach

1. Add `manifest.ts` with name/short name and theme colors from
   `docs/DESIGN_LANGUAGE.md`.
2. Create icon assets: `public/icons/icon.svg` plus PNG sizes
   (1024, 512, 192, 180, 144, 96).
3. Add a basic `public/manifest.webmanifest` if needed for legacy support,
   but prefer the App Router manifest for Next metadata.
4. Add an offline fallback page (static) and a service worker that:
   - precaches app shell and icons,
   - responds with offline fallback for navigation requests when offline,
   - skips caching `/api/*`.
5. Add Playwright test to assert manifest link and offline fallback render.

## Tests

- `npm run test:e2e` (Playwright)
- `npm run check`

## Notes

- Use ASCII-only comments and names.
- Keep PWA behavior minimal and predictable.
