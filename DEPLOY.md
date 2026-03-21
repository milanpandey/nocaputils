# nocaputils.com - Cloudflare Deployment Guide

This project is configured as a completely static site (via Next.js `output: 'export'`). This means it requires **zero backend servers** and can be hosted 100% for free on Cloudflare Pages.

## Prerequisites
- A GitHub account.
- A Cloudflare account.
- Your domain (`nocaputils.com`) configured in Cloudflare.

## Step 1: Push to GitHub
1. Initialize a Git repository in this folder if you haven't already:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of nocaputils"
   ```
2. Create a new repository on GitHub.
3. Push your code to GitHub.

## Step 2: Connect Cloudflare Pages
1. Log into your Cloudflare dashboard and go to **Workers & Pages**.
2. Click **Create application**, then the **Pages** tab, and click **Connect to Git**.
3. Select your new GitHub repository.

## Step 3: Configure the Build Settings
Cloudflare will ask how to build the site. Use these exact settings:
- **Framework Preset**: `Next.js (Static HTML Export)`
- **Build Command**: `npm run build`
- **Build Output Directory**: `out`

> [!NOTE]
> We have added a **`wrangler.jsonc`** file to the project. This ensures Cloudflare's deployment step knows exactly where your static assets are (`./out`).

> [!WARNING]
> Selecting the standard **"Next.js"** preset instead of **"Next.js (Static HTML Export)"** will cause the build to fail with a `standalone` directory error. This is because the standard preset expects a server-side build, while this project is strictly static.

> **Note on Headers**: We have included a `public/_headers` file. During the build, Next.js copies this to the `out` folder. Cloudflare automatically reads this to apply `Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy`. This is **critical** for FFmpeg.wasm to work securely in the browser.

## Step 4: Deploy and Link Domain
1. Click **Save and Deploy**. Cloudflare will build the site and provide a `.pages.dev` URL.
2. In your Cloudflare Pages project settings, go to the **Custom Domains** tab.
3. Click **Set up a custom domain** and enter `nocaputils.com`. Cloudflare will automatically route the DNS since you already have the domain there.

## Ongoing Maintenance Cost: $0
Because everything happens on the client's device (Next.js is statically exported to HTML/JS/CSS, and FFmpeg runs in the browser memory via WASM), there are **no server costs, no database costs, and no storage costs** for processing. Cloudflare Pages offers unlimited bandwidth for static assets, so your hosting cost remains mathematically zero permanently.
