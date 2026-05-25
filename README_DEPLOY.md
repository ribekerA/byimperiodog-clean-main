Deploy to Vercel (automated)
=============================

This project includes a GitHub Actions workflow that builds and deploys to Vercel on pushes to `main`.

What you need to add as GitHub Secrets:

- `VERCEL_TOKEN` — a personal token created in your Vercel account (Settings → Tokens).
- `VERCEL_ORG_ID` — your Vercel Organization ID (from Vercel project settings).
- `VERCEL_PROJECT_ID` — the Vercel Project ID (from Vercel project settings).

Steps:

1. Add the three secrets above in your GitHub repo (Settings → Secrets → Actions).
2. Push to `main`. The workflow will run, build and deploy to Vercel using the provided token and project IDs.

Notes:

- The workflow runs `npm install` and `npm run build` using Node 20.
- If you prefer Vercel to build itself, disable the last step and instead configure Vercel's Git integration.
- Make sure to set production environment variables in the Vercel project UI (e.g. `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc.) — do not commit secrets in the repo.
