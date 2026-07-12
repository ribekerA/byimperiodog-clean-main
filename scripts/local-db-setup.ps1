# scripts/local-db-setup.ps1
# Run from C:\dev\byimperiodog AFTER `supabase link` is done
# Usage: powershell -ExecutionPolicy Bypass -File scripts/local-db-setup.ps1

$ErrorActionPreference = "Stop"
$proj = "C:\dev\byimperiodog"

Write-Host "`n[1/5] Pulling remote schema..." -ForegroundColor Cyan
cmd /c "cd /d $proj && supabase db pull"

Write-Host "`n[2/5] Starting local Supabase stack (Docker)..." -ForegroundColor Cyan
cmd /c "cd /d $proj && supabase start"

Write-Host "`n[3/5] Applying migrations + seed to local DB..." -ForegroundColor Cyan
cmd /c "cd /d $proj && supabase db reset"

Write-Host "`n[4/5] Fetching local credentials..." -ForegroundColor Cyan
$status = cmd /c "cd /d $proj && supabase status" 2>&1
Write-Host $status

# Parse URLs from supabase status
$apiUrl    = ($status | Select-String "API URL:\s+(.+)"            ).Matches.Groups[1].Value.Trim()
$anonKey   = ($status | Select-String "anon key:\s+(.+)"           ).Matches.Groups[1].Value.Trim()
$svcKey    = ($status | Select-String "service_role key:\s+(.+)"   ).Matches.Groups[1].Value.Trim()
$studioUrl = ($status | Select-String "Studio URL:\s+(.+)"         ).Matches.Groups[1].Value.Trim()
$dbUrl     = ($status | Select-String "DB URL:\s+(.+)"             ).Matches.Groups[1].Value.Trim()

Write-Host "`n[5/5] Writing .env.local.local with local credentials..." -ForegroundColor Cyan

$envContent = @"
# LOCAL SUPABASE — gerado por scripts/local-db-setup.ps1
# Copie estas vars para .env.local ao desenvolver localmente

NEXT_PUBLIC_SUPABASE_URL=$apiUrl
NEXT_PUBLIC_SUPABASE_ANON_KEY=$anonKey
SUPABASE_SERVICE_ROLE_KEY=$svcKey
DATABASE_URL=$dbUrl

# Studio local: $studioUrl
"@

$envContent | Out-File "$proj\.env.local.local" -Encoding utf8

Write-Host "`n✅ Setup completo!" -ForegroundColor Green
Write-Host "   API Local:   $apiUrl" -ForegroundColor White
Write-Host "   Studio:      $studioUrl" -ForegroundColor White
Write-Host "   DB URL:      $dbUrl" -ForegroundColor White
Write-Host "`n📝 Credenciais salvas em .env.local.local" -ForegroundColor Yellow
Write-Host "   Copie-as para .env.local para usar localmente.`n" -ForegroundColor Yellow
