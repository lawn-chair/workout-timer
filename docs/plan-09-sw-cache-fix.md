# Plan 09: Fix Service Worker Cache

**Effort:** Trivial | **Impact:** Low | **Priority:** 9

## Problem

`public/sw.js` includes `/` in the app shell cache:

```js
const APP_SHELL = [
  '/',           // ← problem
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  ...
]
```

The home page (`/`) is auth-gated and user-specific. Caching it in the service worker means:

1. **Stale data on revisit:** The SW serves the cached HTML, which contains the initial server-rendered workout list. After the user creates/deletes workouts and revisits, the cached version shows the old list until the client-side hydration replaces it.

2. **Auth leak risk:** If user A logs out and user B logs in on the same browser, the cached `/` HTML from user A could flash briefly before hydration. In practice this is mitigated by the client-side auth check, but it's still poor hygiene.

3. **Cache install failure:** If the user isn't authenticated when the SW installs, the fetch for `/` returns a redirect to `/login`. The SW caches the redirect response, which is not useful.

Only truly static, auth-independent assets should be in the app shell.

## Solution

Remove `/` from `APP_SHELL`. The service worker's navigation handler already has a network-first fallback to `/offline`, which is the correct behavior for dynamic routes.

---

## Change

### `public/sw.js`

```diff
 const APP_SHELL = [
-  '/',
-  OFFLINE_URL,
+  OFFLINE_URL,
   '/manifest.webmanifest',
   '/icons/icon-192.png',
   '/icons/icon-512.png',
   '/icons/icon.svg',
   '/icons/icon-180.png',
   '/icons/icon-144.png',
   '/icons/icon-96.png',
 ]
```

That's it. The navigation fetch handler already does the right thing:

```js
if (event.request.mode === 'navigate') {
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(OFFLINE_URL, { ignoreSearch: true })
    )
  )
  return
}
```

Navigation requests go to the network first. If the network fails (offline), the cached `/offline` page is served. This is correct for all dynamic routes.

### Bump the cache version

```diff
-const VERSION = 'v1'
+const VERSION = 'v2'
```

Bumping the version causes the `activate` handler to delete the old cache (which includes the stale `/` response) and install a clean cache with the new shell.

---

## Files Changed

| File           | Change                                            |
| -------------- | ------------------------------------------------- |
| `public/sw.js` | Remove `/` from `APP_SHELL`, bump version to `v2` |
