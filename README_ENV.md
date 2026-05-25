# Environment and secrets (local & CI)

This project uses environment variables for configuration and secrets.

Local development
- Copy `.env.example` to `.env.local` and fill values you need for local dev.
- Never commit `.env.local` — it's already listed in `.gitignore`.

CI / Deployment (GitHub Actions + Vercel)
- Do not store secrets in the repository. Instead, add them to GitHub Secrets:
  - `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (if needed for build)
  - `OPENAI_API_KEY` (server-only)
- The GitHub Actions workflow reads these secrets and injects them into the Build step.

Security notes
- Rotate any keys that were committed or exposed. For example, if an OpenAI key was exposed, revoke and generate a new one.
- Keep `.env.local` local — do not share it.
