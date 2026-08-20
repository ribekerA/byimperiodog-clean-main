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

Google Ads conversions
- `GOOGLE_ADS_ID`: account ID in the `AW-123456789` format. It is used only as a fallback when the active `pixels_settings` environment has no Google Ads ID.
- `GOOGLE_ADS_CONVERSION_LABEL`: label for the form-lead conversion shown in Google Ads. Never use a guessed value; copy the exact label from the conversion action.
- The active `pixels_settings` values (`googleAdsId` and `googleAdsConversionLabel`) take precedence over these environment variables.
- Both values are read on the server and passed to client components. Do not prefix the label with `NEXT_PUBLIC_`.
