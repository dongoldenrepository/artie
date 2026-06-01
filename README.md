# Artie

**Your art. Tracked beautifully.**

Artie is a personal art catalog for painters, photographers, and other visual artists. Each artist gets their own independent deployment on their own Cloudflare account — their data, their bill, their catalog.

---

## How It Works

- **One shared codebase** (this repo) — all artists run the same app
- **Independent deployments** — each artist deploys to their own Cloudflare account
- **Auto-updates** — when `main` is updated, Cloudflare Pages automatically redeploys every artist's catalog
- **Centralized migrations** — schema changes are applied across all artists from one command

---

## For New Artists — Getting Started

### Prerequisites

1. Create a [Cloudflare account](https://cloudflare.com) (free tier works)
2. Install Node.js (https://nodejs.org)
3. Install Wrangler: `npm install -g wrangler`
4. Log in to your Cloudflare account: `wrangler login`

### Setup

```bash
git clone https://github.com/YOUR_ORG/artie.git
cd artie
npm install
./setup.sh
```

The setup script will:
- Create your D1 database and R2 image storage on your Cloudflare account
- Run all database migrations
- Build and deploy your catalog
- Give you your catalog URL

### Final Step — Connect to GitHub for Auto-Updates

After setup, connect your Cloudflare Pages project to this GitHub repo so you receive updates automatically:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages → your project
2. Settings → Builds & deployments → Connect to Git
3. Select this repo, branch: `main`
4. Build command: `npm run build`
5. Build output directory: `dist`

That's it. Future updates to `main` will deploy to your catalog automatically — no action needed from you.

---

## For Don (Platform Admin)

### Development Workflow

- Do all development on the `dev` branch
- Test against your own catalog (`wrangler.toml` pointing to your D1/R2)
- When ready, merge `dev` → `main`
- All connected artist catalogs redeploy automatically

### Running a Migration Across All Artists

When a schema change is needed:

1. Add the migration file to `migrations/` (e.g. `0011_new_feature.sql`)
2. Copy `artists.json.template` to `artists.json` (first time only) and fill in all artist credentials
3. Run: `./migrate-all.sh migrations/0011_new_feature.sql`

`artists.json` is in `.gitignore` — it contains private credentials and stays on your machine only.

### Onboarding a New Artist

1. Artist creates their Cloudflare account and runs `wrangler login`
2. Clone the repo: `git clone https://github.com/YOUR_ORG/artie.git`
3. Run `./setup.sh` — follow the prompts
4. Connect their Pages project to GitHub (see above)
5. Add their credentials to your local `artists.json`
6. Optionally bulk-load their artwork using `upload-images-v2.sh`

---

## Tech Stack

- **Frontend**: React + Vite
- **Database**: Cloudflare D1 (SQLite)
- **Image storage**: Cloudflare R2
- **Hosting**: Cloudflare Pages
- **Updates**: GitHub → Cloudflare Pages auto-deploy
