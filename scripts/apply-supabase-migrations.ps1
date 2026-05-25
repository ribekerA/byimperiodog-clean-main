<#
Script para aplicar as migrations SQL no seu projeto Supabase.
Modo de uso (PowerShell):
  Set-Location C:\Projetos\by-imperio-dog
  .\scripts\apply-supabase-migrations.ps1

O script tenta 3 abordagens (na ordem):
  1) Usar psql se a variável $env:DATABASE_URL estiver definida e psql estiver no PATH
  2) Usar supabase CLI (se instalado) e executar os arquivos via redirecionamento
  3) Mostrar instruções manuais para colar o SQL no editor do Supabase

Notas:
- As variáveis de ambiente esperadas: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL.
- Se você não tiver psql/supabase CLI, abra o arquivo `sql/blog.sql` e `sql/blog_comments.sql` no Painel SQL do Supabase e rode manualmente.
#>

Write-Host "=== Aplicador de migrations Supabase (script) ===" -ForegroundColor Cyan

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$sqlDir = Join-Path (Split-Path $repoRoot -Parent) 'sql'
if (-not (Test-Path $sqlDir)) { Write-Host "Diretório 'sql' não encontrado em $sqlDir" -ForegroundColor Yellow; exit 1 }

# Coletar todos .sql e ordenar por nome (garante ordem determinística)
$sqlFiles = Get-ChildItem -Path $sqlDir -Filter *.sql -File | Sort-Object Name | Select-Object -ExpandProperty FullName
if (-not $sqlFiles -or $sqlFiles.Count -eq 0) { Write-Host "Nenhum arquivo .sql encontrado em $sqlDir" -ForegroundColor Yellow; exit 1 }

Write-Host "Arquivos SQL a aplicar (ordenados):" -ForegroundColor Green
$sqlFiles | ForEach-Object { Write-Host " - $_" }

# 1) tentar psql
$psql = Get-Command psql -ErrorAction SilentlyContinue
if ($psql -and $env:DATABASE_URL) {
    Write-Host "psql detectado e DATABASE_URL presente. Aplicando arquivos via psql..." -ForegroundColor Green
    foreach ($f in $sqlFiles) {
        Write-Host "Executando: psql -> $f" -ForegroundColor Gray
        & psql $env:DATABASE_URL -f $f
        if ($LASTEXITCODE -ne 0) { Write-Host "psql retornou erro ($LASTEXITCODE) ao executar $f" -ForegroundColor Red; exit $LASTEXITCODE }
    }
    Write-Host "Migrations aplicadas via psql com sucesso." -ForegroundColor Green
    exit 0
}

# 2) tentar supabase CLI
$sup = Get-Command supabase -ErrorAction SilentlyContinue
if ($sup) {
    Write-Host "Supabase CLI detectado. Tentarei aplicar via 'supabase db query'." -ForegroundColor Green
    foreach ($f in $sqlFiles) {
        Write-Host "Executando: supabase db query < $f" -ForegroundColor Gray
        # redirecionamento com powershell
        Get-Content $f | supabase db query
        if ($LASTEXITCODE -ne 0) { Write-Host "supabase db query retornou erro ($LASTEXITCODE) ao aplicar $f" -ForegroundColor Red; exit $LASTEXITCODE }
    }
    Write-Host "Migrations aplicadas via supabase CLI com sucesso." -ForegroundColor Green
    exit 0
}

# 3) fallback: instruções manuais
Write-Host "Não foi possível aplicar automaticamente as migrations. Por favor, aplique manualmente no painel do Supabase:" -ForegroundColor Yellow
Write-Host "1) Entre em app.supabase.com -> SQL Editor." -ForegroundColor Cyan
Write-Host "2) Rode, na ordem, os arquivos do diretório sql/ (sugestão: blog.sql, blog_comments.sql, blog_v2.sql, blog_categories.sql, blog_ai_infra.sql, analytics_events.sql, site_settings.sql, newsletter.sql, puppies_normalize_phase1.sql, seed_demo_pt.sql, seed_blog_demo.sql)." -ForegroundColor Cyan
Write-Host "3) Verifique se 'analytics_events' foi criada e se políticas de RLS estão ativas quando necessário." -ForegroundColor Cyan
Write-Host "Dica: Com SUPABASE_SERVICE_ROLE_KEY você pode montar um DATABASE_URL: postgres://postgres:YOUR_SERVICE_KEY@<host>:5432/postgres" -ForegroundColor Gray

exit 0
