# Deploy Brand Dashboard to Cloudflare Workers

This app is already set up for Cloudflare Workers (OpenNext). Everything below runs inside this folder.

| | |
|---|---|
| Worker name | `v-try-brand-dashboard` (set in `wrangler.jsonc`) |
| Production domain | `https://shop.brand.vtrystudio.com` |
| Backend API | `https://api.vtrystudio.com` |
| Node | 26 (`.nvmrc`) |

## 1. One-time setup

```bash
npm ci                 # install dependencies
npx wrangler login     # opens the browser to sign in to Cloudflare
```

## 2. Set the secrets (never put these in a file in git)

```bash
npx wrangler secret put NEXTAUTH_SECRET   # random 32+ character string that encrypts login sessions (`openssl rand -hex 32`)
npx wrangler secret put GOOGLE_CLIENT_ID   # Google OAuth client id (same project as the backend)
npx wrangler secret put GOOGLE_CLIENT_SECRET   # Google OAuth client secret
# npx wrangler secret put UPSTASH_REDIS_REST_URL   # only if you use the Upstash rate limiter
# npx wrangler secret put UPSTASH_REDIS_REST_TOKEN   # only if you use the Upstash rate limiter
```

Public, non-secret settings (site URL, API URL) are already in `wrangler.jsonc` (runtime) and `.env.production` (baked in at build). Change them there if a domain changes, then redeploy.

## 3. Deploy

```bash
npm run deploy
```

This builds the app and publishes it. Cloudflare prints the URL (`https://v-try-brand-dashboard.<your-subdomain>.workers.dev`).

## 4. Attach your domain

Either in the dashboard (**Workers & Pages -> v-try-brand-dashboard -> Settings -> Domains & Routes -> Add -> Custom domain -> `shop.brand.vtrystudio.com`**), or uncomment the `routes` block in `wrangler.jsonc` and run `npm run deploy` again. The domain's DNS must be in the same Cloudflare account.

## 5. Settings in other places that must match

- **Backend `.env`:** `CORS_ORIGINS` must include `https://shop.brand.vtrystudio.com`, and `COOKIE_DOMAIN=.vtrystudio.com` must be set so the login cookies are shared with the API. Restart the backend after changing them.
- **Google:** In Google Cloud Console, on the OAuth client, add **Authorized JavaScript origin** `https://shop.brand.vtrystudio.com` and **Authorized redirect URI** `https://shop.brand.vtrystudio.com/api/auth/callback/google`.

## Preview locally in the Cloudflare runtime

```bash
cp .dev.vars.example .dev.vars   # fill in the values (this file is git-ignored)
npm run preview
```

## Deploy from Git (Workers Builds) instead of from your computer

In the Cloudflare dashboard create a Worker from this Git repository and use:

- Build command: `npx opennextjs-cloudflare build`
- Deploy command: `npx opennextjs-cloudflare deploy`
- Build variable: `NODE_VERSION=26`

Add the secrets above under **Settings -> Variables and Secrets** (type "Secret").

## Good to know

- `NEXT_PUBLIC_*` values are baked in at build time. Edit `.env.production` and redeploy to change them.
- The Edge runtime (`export const runtime = 'edge'`) is not supported by the adapter and must not be used in this app. Routes already run on Workers.
- `next/image` uses the Cloudflare Images binding (`IMAGES` in `wrangler.jsonc`). If you do not want to use it, set `images.unoptimized: true` in `next.config.js` and remove the binding.
- If you start using ISR / `revalidate`, add an R2 or KV cache in `open-next.config.ts`.
- The `Dockerfile` is not used for Cloudflare. Keep it only if you also deploy somewhere else.
- Limits: the Worker is about 2 MiB compressed, well under the 3 MiB free-plan limit.
