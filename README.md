# noneapk.xyz

A minimal, Vercel-inspired app store. Download APKs and purchase licenses via Paykassma.
Hosted on **Cloudflare Pages**.

## Deployment

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin git@github.com:YOUR_USER/noneapk.git
git push -u origin main
```

### 2. Create a Cloudflare Pages project

1. Go to **Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git**
2. Select your `noneapk` repo
3. Build settings:
   - **Framework preset:** `None`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/`
4. Click **Save and Deploy**

### 3. Add your custom domain

1. In your Pages project → **Custom domains → Set up a custom domain**
2. Enter `noneapk.xyz`
3. If your DNS is already on Cloudflare (it should be), the CNAME is auto-created
4. Also add `www.noneapk.xyz` — `_redirects` will 301 it to apex

### 4. Verify

- `https://noneapk.xyz/` → landing page with all apps
- `https://noneapk.xyz/neon-player/` → app detail (direct visit, hard refresh — should work)
- `https://noneapk.xyz/neon-player/purchase` → products page (direct visit — should work)

If any of the deep links 404, check that you have **no `404.html`** in the repo root.

## Important: SPA Routing

Cloudflare Pages uses this logic when a request doesn't match a static file:

1. If `404.html` exists → serve it (this would break the SPA)
2. If `404.html` does NOT exist → serve `index.html` (SPA fallback) ✅

So **do not add a `404.html`**. If you want a custom "not found" UI for unknown apps, handle it in JS (`Views.notFoundView`) as already implemented.

## Local development

```bash
# Python (built-in on macOS/Linux)
python3 -m http.server 8000

# Or Node
npx serve .

# Or Cloudflare's official tool (recommended — matches production)
npx wrangler pages dev .
```

Then open `http://localhost:8000`. Direct links like `http://localhost:8000/neon-player/` work with `wrangler` and `serve`, but Python's `http.server` will return 404 on deep links (that's fine — Cloudflare Pages in production handles it).

## Adding a new app

Edit `data/apps.json` and add an entry under `apps`. Push to GitHub — Cloudflare Pages auto-deploys on every push to `main`.

## Paykassma

Update `data/paykassma.json` with the **actual** plugin base URL and wallet types from your Paykassma dashboard. In `js/paykassma.js`, replace the demo `window.open(paymentUrl, ...)` with:

```js
window.location.href = paymentUrl;
```

for a real redirect.

## Caching

- CSS / JS: cached 1 year, `immutable` (bump the filename or query string when you update)
- `data/apps.json`: revalidated every 5 minutes
- `data/paykassma.json`: cached 1 hour
- `index.html`: no explicit cache — Cloudflare's default behavior revalidates on each deploy

## Rollback

Cloudflare Pages keeps every deployment. To roll back: **Pages project → Deployments → select a previous one → Rollback**.