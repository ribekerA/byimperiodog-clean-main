1) Rode `sql/site_settings.sql` no Supabase.
2) No `.env.local`, defina:
```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```
3) No `app/layout.tsx`, adicione:
```tsx
import TrackingScripts from "@/components/TrackingScripts";
<body>
  <TrackingScripts />
  {children}
</body>
```
