# Fix: group() is not a function (Supabase JS)
O client do Supabase não possui `.group()` nessa versão. Para agrupar por dia,
criamos a função RPC `leads_daily(from_ts timestamptz)` e a chamamos via `supabase.rpc`.

## Passos
1. Rode `sql/leads_daily.sql` no Supabase (SQL Editor).
2. Substitua `app/admin/dashboard/page.tsx` pela versão deste pacote.
3. Reinicie o servidor (`npm run dev`).

Pronto: o gráfico de leads por dia volta a funcionar.
