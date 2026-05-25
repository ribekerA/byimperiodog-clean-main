# Load environment variables from .env.local and start dev server
# This ensures SUPABASE_SERVICE_ROLE_KEY is properly loaded

Write-Host "🔧 Carregando variáveis de ambiente de .env.local..." -ForegroundColor Cyan

if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match '^([^#=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim() -replace '^["'']|["'']$', ''
            [Environment]::SetEnvironmentVariable($key, $value, 'Process')
            if ($key -like "*KEY*" -or $key -like "*SECRET*") {
                Write-Host "  ✅ $key`: ${value.Substring(0, [Math]::Min(20, $value.Length))}..." -ForegroundColor Green
            } else {
                Write-Host "  ✅ $key`: $value" -ForegroundColor Green
            }
        }
    }
} else {
    Write-Host "❌ Arquivo .env.local não encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "`n🚀 Iniciando servidor de desenvolvimento...`n" -ForegroundColor Cyan
npm run dev
