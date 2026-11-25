# Fix admin login session loss

## Symptoms
1. After a successful login the page takes a long time to load.
2. Shortly after login the user is bounced back to `/login` ("logged out instantly").

## Root causes (all verified by reproduction against the running API)

### A. Sanctum stateful-domain / Origin mismatch — the "instant logout" (PRIMARY)
Laravel Sanctum only starts a session when the request's `Origin`/`Referer` host is in
`SANCTUM_STATEFUL_DOMAINS`. The admin app lives at `http://localhost:5174`, which *is* listed,
so requests made with that Origin are stateful and the session works.

The problem is the API base URL. The admin `.env` sets:

```
VITE_API_BASE_URL=http://192.168.0.108:8000
```

`192.168.0.108:8000` is **not** in `SANCTUM_STATEFUL_DOMAINS`. Every request the app makes
targets that host, and while the browser still sends `Origin: http://localhost:5174`, Sanctum's
`EnsureFrontendRequestsAreStateful` compares that Origin against the stateful list. As soon as
any request goes out **without** a matching `Origin`/`Referer` (or with a different one), Sanctum
treats it as a token request: no session is started, `auth:admin` returns **401**, and the
frontend's 401 interceptor wipes the session.

Reproduced:

```
POST /api/auth/admin/login            Origin: http://localhost:5174  -> 200
GET  /api/auth/admin/me                Origin: http://localhost:5174  -> 200
GET  /api/auth/admin/me                Origin: http://192.168.0.108:8000 -> 401   <-- session lost
GET  /api/auth/admin/me                (no Origin header)              -> 401   <-- session lost
```

### B. Bare `axios` in `ensureCsrfCookie` — the 500 "Session store not set"
`src/api/axiosInstance.ts` calls `axios.get(...)` (the global axios), not `axiosInstance`.
The global axios has no `withXSRFToken`/cookie handling and, critically, no `baseURL`/config,
so it is a separate client with different header behaviour. Sanctum's
`EnsureFrontendRequestsAreStateful` only attaches `StartSession` for stateful origins; the
global axios request can land without one, and `AdminAuthController::completeLogin()` then calls
`$request->session()->regenerate()` → **RuntimeException: "Session store not set on request"**
→ HTTP 500.

Reproduced directly against the API:

```
POST /api/auth/admin/login  (no Origin) -> 500  "Session store not set on request."
```

The same request with `Origin: http://localhost:5174` → 200.

### C. `ensureCsrfCookie()` is called on *every* login/logout
Two extra round-trips on every login, and it re-fetches the CSRF cookie, which **rotates the
session cookie** — this is the "takes much more time to load" part and it can also race with the
login POST itself.

### D. The 401 interceptor logs the user out on *any* 401
`src/api/axiosInstance.ts` clears the auth store and hard-redirects to `/login` for every 401.
Combined with React StrictMode (double-invoked effects in `src/main.tsx`) and the parallel
`fetchMe()` bootstrap in `src/App.tsx`, a single stale/failed request wipes a perfectly valid
session. This is the direct cause of the "logged out instantly" behaviour.

### E. `sanctum.guard` is `['web']` but the app logs into the `admin` guard
`config/sanctum.php` has `'guard' => ['web']`, while `AdminAuthController` uses
`Auth::guard('admin')->login(...)`. Sanctum's `AuthenticateSession` middleware therefore
validates the **web** guard's `password_hash_web` session key, which the admin login never
writes (it writes `password_hash_admin`). The admin session is not correctly protected by the
password-hash check, and any mismatch triggers a session flush + logout.

### F. Config drift
- API `.env`: `STOREFRONT_URL=http://localhost:5173`, `ADMIN_URL=http://localhost:5174` — but the
  admin `.env` has `VITE_STOREFRONT_URL=http://localhost:5174` (points at itself, not the
  storefront at 5173).
- The admin `vite.config.ts` proxies `/api` and `/sanctum` to `http://localhost:8000`, but the app
  never uses the proxy because `VITE_API_BASE_URL` is absolute. Dead config that confuses the
  origin story.

## Fix plan

### 1. `sonali-storefront-admin/src/api/axiosInstance.ts`
- Make `ensureCsrfCookie()` use `axiosInstance` (so it carries the same baseURL, `withCredentials`
  and `withXSRFToken` config) instead of the global `axios`.
- Send an explicit `Origin`-equivalent that Sanctum recognises. Since the browser controls the
  `Origin` header, the robust fix is to make the API stateful for the admin origin **and** to
  stop relying on the header being present. Simplest reliable approach: use the **same-origin
  Vite proxy** so requests are same-origin (no CORS, no Origin ambiguity).
- Guard the 401 handler so it does **not** clear the session for auth-endpoint probes
  (`/api/auth/admin/me`, `/api/auth/admin/login`) that are expected to fail during bootstrap, and
  only hard-redirect when the user genuinely has no session.
- Cache the CSRF cookie promise so concurrent callers share one request instead of racing.

### 2. `sonali-storefront-admin/.env`
- Point `VITE_API_BASE_URL` at the same-origin proxy (`""` → relative URLs) so the browser talks
  to `/api` and `/sanctum` on the dev server origin (`http://localhost:5174`), which Sanctum
  already treats as stateful. This removes the cross-origin `192.168.0.108:8000` hop entirely.
- Fix `VITE_STOREFRONT_URL` to `http://localhost:5173`.

### 3. `sonali-storefront-admin/vite.config.ts`
- Keep the proxy, but point it at the API host consistently and make it forward cookies properly.
  Target `http://192.168.0.108:8000` (the same instance the rest of the stack uses) and drop
  `changeOrigin` so the browser's `Origin`/`Referer` (`localhost:5174`) is preserved for
  Sanctum's stateful check.
- Comment out (not delete) the previous `changeOrigin: true` entries per the user's instruction.

### 4. `sonali-storefront-admin/src/App.tsx`
- Guard the bootstrap `fetchMe()` so a 401 during bootstrap is treated as "no session" and does
  not wipe an already-authenticated store state. Skip the fetch entirely if a session is already
  known.
- Avoid re-running bootstrap on every `isAuthenticated` change (it currently re-runs the effect
  each time auth flips).

### 5. `sonali-storefront-admin/src/pages/LoginPage.tsx`
- The extra `fetchMe()` verification after login doubles the round-trips and can 401 → interceptor
  → logout. Comment it out (not delete) and navigate straight to the redirect target on a
  successful login.

### 6. `sonali-foshol-api/config/sanctum.php`
- Change `'guard' => ['web']` to `'guard' => ['admin']` so `AuthenticateSession` validates the
  guard the admin actually logs into. This prevents the spurious session flush/logout.

### 7. `sonali-foshol-api/.env` and `.env.example`
- Add `192.168.0.108:8000` and `192.168.0.108:5173`/`192.168.0.108:5174` to
  `SANCTUM_STATEFUL_DOMAINS` so the API is stateful for the LAN host too (needed for other
  devices on the network, and as a safety net for the direct-IP path).
- Add `CORS_ALLOWED_ORIGINS` including `http://192.168.0.108:5173,http://192.168.0.108:5174`.
- Fix `ADMIN_URL` / `STOREFRONT_URL` to the correct ports.

### 8. Backend hardening (`AdminAuthController`)
- Guard `$request->session()` calls so a missing session store does not throw a 500; fall back
  gracefully. This removes the "Session store not set on request" failure mode entirely.

## Constraints from the user
- Do **not** remove code — **comment out** instead.
- Do **not** run anything in the background.

## Verification
- `GET /sanctum/csrf-cookie` through the dev proxy → **200** (was 500).
- `POST /api/auth/admin/login` → 200, no 500 (was 500 without a matching `Origin`).
- `GET /api/auth/admin/me` afterwards → 200, repeatedly, with the same browser session.
- Reload the page → still authenticated (no bounce to `/login`).
- `POST /api/auth/admin/logout` → 200, and `/me` afterwards → 401.
- Storefront on :5173 unaffected; `AuthFlowTest` 7/7 passing.

## Additional root cause found during implementation

### G. The Vite proxy converts the upstream `204` into a `500` (this was the real blocker)
Sanctum's `/sanctum/csrf-cookie` answers with a **bodiless `204 No Content`**. Through the Vite
dev proxy that response arrived as **`500 No Content`** — with all the correct Laravel headers
and both `Set-Cookie`s present, but the status mangled and an empty body. Other statuses (401,
404) passed through the proxy unharmed, so it was specific to the bodiless 204.

Reproduced:

```
GET http://192.168.0.108:8000/sanctum/csrf-cookie  -> 204
GET http://localhost:5174/sanctum/csrf-cookie      -> 500   <-- through the proxy
GET http://localhost:5174/api/does-not-exist       -> 404   <-- other statuses pass fine
```

Fix: register our own `/sanctum/csrf-cookie` route in the API (`routes/web.php`) that returns
**200 with a small JSON body**. It still sets the same XSRF-TOKEN and session cookies, and the
proxy forwards it unchanged. The route is registered in `web.php` so it takes precedence over
Sanctum's own route (confirmed via `php artisan route:list --path=sanctum`).

## Notes / follow-ups (not changed)
- `phpunit.xml` hardcodes `DB_CONNECTION=mysql` / `DB_DATABASE=sonali_foshol_test`, but the local
  `.env` uses SQLite and no MySQL server is running. The suite must be run with
  `DB_CONNECTION=sqlite DB_DATABASE=/tmp/test.sqlite php artisan test`. One test
  (`AdminApiTest` → "it filters and sorts admin products") fails on SQLite because of a
  `HAVING` clause on a non-aggregate query — pre-existing, reproduced with the changes stashed.
- The admin panel had `server.port: 5173` in `vite.config.ts` while actually running on 5174
  (the storefront owns 5173). Now pinned to 5174 with `strictPort`.
- The admin `.env` had `VITE_STOREFRONT_URL=http://localhost:5174` (pointing at itself); the
  storefront is on 5173.

