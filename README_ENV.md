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

Google Ads API (admin panel at `/admin/config/google-ads`)
- `GOOGLE_ADS_DEVELOPER_TOKEN`: optional, and only for an older project that still has one on file. Google retired developer tokens on 2026-09-09: the access level moved to the Google Cloud project that issued the OAuth credentials, and the `developer-token` header is ignored when sent. The panel does not require it, because requiring it would block the screen over a credential the API no longer reads.
- What decides whether a real account answers is that project's access level, at `console.cloud.google.com/google/ads-apis/overview`: `Test` authenticates and only answers for test accounts, `Explorer` already answers for production accounts. A connected account returning an empty list is almost always the level, not a bug in the code.
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID`: manager (MCC) account ID, required only when the authorized login is a manager operating on child accounts. Outside that case, sending the header makes Google refuse the call. Digits only are kept, so the `123-456-7890` form copied from the panel is accepted.
- `GOOGLE_ADS_API_VERSION`: optional override, in the `vNN` form. Defaults to the version pinned in `src/lib/google-ads/config.ts`. It exists because Google retires API versions in about a year: changing this variable avoids a deploy just to edit one string.
- Reuses the OAuth client already used by GA4 and GTM (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) and the token encryption key of the integrations table (`INTEGRATIONS_ENCRYPTION_KEY`). Add the Google Ads API to that same Google Cloud project.
- The OAuth scope is `https://www.googleapis.com/auth/adwords`. There is no read-only scope for this API: whoever connects authorizes creating campaigns, changing budgets and pausing ads, not just reading reports.
