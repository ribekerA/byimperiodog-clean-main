# Script para aplicar migração experiments.sql no Supabase
# Uso: .\scripts\apply-experiments-migration.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Aplicando migração experiments.sql..." -ForegroundColor Cyan

# Carrega variáveis do .env.local
$envPath = ".\.env.local"
if (-not (Test-Path $envPath)) {
    Write-Host "❌ Erro: .env.local não encontrado" -ForegroundColor Red
    exit 1
}

$env:DOTENV_LOADED = "true"
Get-Content $envPath | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim().Trim('"').Trim("'")
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$supabaseKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "❌ Erro: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Variáveis carregadas" -ForegroundColor Green
Write-Host "📍 Supabase URL: $($supabaseUrl.Substring(0, 30))..." -ForegroundColor Gray

# Lê o SQL
$sqlPath = ".\sql\experiments.sql"
if (-not (Test-Path $sqlPath)) {
    Write-Host "❌ Erro: $sqlPath não encontrado" -ForegroundColor Red
    exit 1
}

$sqlContent = Get-Content $sqlPath -Raw
Write-Host "📄 SQL lido: $($sqlContent.Length) caracteres" -ForegroundColor Gray

# Extrai o project ref da URL (formato: https://xxxxxxxxxxxxx.supabase.co)
if ($supabaseUrl -match 'https://([^.]+)\.supabase\.co') {
    $projectRef = $matches[1]
    Write-Host "🔑 Project Ref: $projectRef" -ForegroundColor Gray
} else {
    Write-Host "❌ Erro: Não foi possível extrair project ref da URL" -ForegroundColor Red
    exit 1
}

# Executa via Supabase REST API (PostgREST)
Write-Host "`n🔧 Executando SQL via API..." -ForegroundColor Yellow

try {
    # Usa o endpoint RPC do Supabase para executar SQL bruto
    $headers = @{
        "apikey" = $supabaseKey
        "Authorization" = "Bearer $supabaseKey"
        "Content-Type" = "application/json"
        "Prefer" = "return=minimal"
    }
    
    # Primeiro, verifica se a função _touch_updated_at existe
    Write-Host "🔍 Verificando função _touch_updated_at..." -ForegroundColor Gray
    
    $checkFunctionSql = @"
DO `$`$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = '_touch_updated_at'
    ) THEN
        CREATE OR REPLACE FUNCTION public._touch_updated_at()
        RETURNS trigger LANGUAGE plpgsql AS `$func`$
        BEGIN
            new.updated_at = now();
            RETURN new;
        END;
        `$func`$;
    END IF;
END
`$`$;
"@
    
    $body = @{
        query = $checkFunctionSql
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" -Method Post -Headers $headers -Body $body -ErrorAction SilentlyContinue
    
    if ($?) {
        Write-Host "✅ Função _touch_updated_at verificada" -ForegroundColor Green
    }
    
    # Agora executa o SQL da migração
    Write-Host "📦 Criando tabela experiments..." -ForegroundColor Gray
    
    $body = @{
        query = $sqlContent
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" -Method Post -Headers $headers -Body $body -ErrorAction Stop
    
    Write-Host "✅ Migração aplicada com sucesso!" -ForegroundColor Green
    
} catch {
    # Tenta método alternativo: psql via conexão direta
    Write-Host "⚠️  Método API falhou, tentando conexão direta..." -ForegroundColor Yellow
    
    # Pega connection string do .env.local
    $connectionString = $env:DATABASE_URL
    
    if (-not $connectionString) {
        Write-Host "❌ Erro ao executar via API e DATABASE_URL não definida" -ForegroundColor Red
        Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "`n📝 SOLUÇÃO MANUAL:" -ForegroundColor Yellow
        Write-Host "1. Acesse: https://supabase.com/dashboard/project/$projectRef/sql/new" -ForegroundColor White
        Write-Host "2. Copie o conteúdo de sql/experiments.sql" -ForegroundColor White
        Write-Host "3. Cole no SQL Editor e clique em 'Run'" -ForegroundColor White
        exit 1
    }
    
    # Tenta com psql se disponível
    $psqlPath = Get-Command psql -ErrorAction SilentlyContinue
    if ($psqlPath) {
        Write-Host "🔧 Usando psql..." -ForegroundColor Gray
        psql $connectionString -f $sqlPath
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Migração aplicada com sucesso via psql!" -ForegroundColor Green
        } else {
            Write-Host "❌ Erro ao executar via psql" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ psql não encontrado no PATH" -ForegroundColor Red
        Write-Host "`n📝 SOLUÇÃO MANUAL:" -ForegroundColor Yellow
        Write-Host "1. Acesse: https://supabase.com/dashboard/project/$projectRef/sql/new" -ForegroundColor White
        Write-Host "2. Copie o conteúdo de sql/experiments.sql" -ForegroundColor White
        Write-Host "3. Cole no SQL Editor e clique em 'Run'" -ForegroundColor White
        exit 1
    }
}

Write-Host "`n🎯 Próximo passo: npm run seed" -ForegroundColor Cyan
