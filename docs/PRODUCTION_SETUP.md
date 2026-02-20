# Production Setup (Vercel + Turso)

This guide documents the initial production setup for `timer.bpr.rocks`.

## Prereqs

- Vercel account
- Turso account
- Cloudflare access for `bpr.rocks`
- Google Cloud account

## 1) Google OAuth

1. Create or select a Google Cloud project.
2. Configure the OAuth consent screen:
   - Authorized domain: `bpr.rocks`
3. Create OAuth Client ID (Web application).
4. Authorized redirect URI:
   - `https://timer.bpr.rocks/api/auth/callback/google`
5. Copy the credentials:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

## 2) Turso Database

1. Create a new Turso database for production.
2. Copy the connection URL and auth token.
3. These values will be used as `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in Vercel.

## 3) Generate NEXTAUTH_SECRET

Create a strong random secret and set it in Vercel as `NEXTAUTH_SECRET`.

```bash
openssl rand -base64 32
```

## 4) Vercel Project Setup

1. Create a new Vercel project connected to this repo.
2. Set **Production** environment variables:

```bash
TURSO_DATABASE_URL=...  # Turso URL
TURSO_AUTH_TOKEN=...    # Turso auth token
NEXTAUTH_URL=https://timer.bpr.rocks
NEXTAUTH_SECRET=...     # generated secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
DEV_AUTH=false
E2E_TESTING=false
```

## 5) Cloudflare DNS

1. In Vercel → Project → Domains, add `timer.bpr.rocks`.
2. In Cloudflare DNS, add the record Vercel provides.
   - Typically: `timer` → `cname.vercel-dns.com`
3. Set Proxy status to **DNS only**.

## 6) Migrations (Production)

Migrations are applied automatically during deploy via:

```bash
npx prisma migrate deploy
```

This runs before `next build` (see `package.json` build script).

## 7) Deploy

1. Push changes to `main`.
2. Vercel builds and deploys the app.

## 8) Smoke Test

- Sign in with Google.
- Create a workout and start the timer.
- Toggle public, view the public page, and clone.
- Update audio settings.

## Rollback

If a deploy fails, roll back to a previous deployment in Vercel.
