<#
Script de teste rápido para endpoints admin do blog (rodar com servidor dev em execução).
Uso:
  Set-Location C:\Projetos\by-imperio-dog
  .\scripts\test-api-endpoints.ps1

O script tenta 3 chamadas:
 - /api/admin/blog/seo-suggestions
 - /api/admin/blog/generate
 - /api/admin/blog/ai/image (usa prompt de teste)

Observação: se suas rotas requerem autenticação, execute em dev com variáveis adequadas.
#>

$base = 'http://localhost:3000'

Write-Host "Testando SEO suggestions..."
try {
    $r = Invoke-RestMethod -Method Post -Uri "$base/api/admin/blog/seo-suggestions" -Body (@{ topic = 'Treinar filhote de spitz' } | ConvertTo-Json) -ContentType 'application/json'
    Write-Host (ConvertTo-Json $r -Depth 5)
} catch { Write-Host "Erro: $_" }

Write-Host "\nTestando Generate..."
try {
    $r = Invoke-RestMethod -Method Post -Uri "$base/api/admin/blog/generate" -Body (@{ topic = 'Como socializar um spitz lulu da pomerania' } | ConvertTo-Json) -ContentType 'application/json'
    Write-Host (ConvertTo-Json $r -Depth 5)
} catch { Write-Host "Erro: $_" }

Write-Host "\nTestando Image generation (falso ou real dependendo do OPENAI_API_KEY)..."
try {
    $r = Invoke-RestMethod -Method Post -Uri "$base/api/admin/blog/ai/image" -Body (@{ prompt = 'Spitz lulu da pomerania puppy, studio, high detail' } | ConvertTo-Json) -ContentType 'application/json'
    Write-Host (ConvertTo-Json $r -Depth 5)
} catch { Write-Host "Erro: $_" }
