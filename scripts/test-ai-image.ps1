param(
  [string]$Url = "http://localhost:3000/api/admin/blog/ai/image",
  [string]$Prompt = "Filhote spitz alemão anão, estúdio, foto profissional, fundo branco, alta qualidade"
)

Write-Host "Testando endpoint: $Url" -ForegroundColor Cyan
Write-Host "Prompt: $Prompt" -ForegroundColor Cyan

$body = @{ prompt = $Prompt } | ConvertTo-Json

try {
  $resp = Invoke-RestMethod -Method Post -Uri $Url -ContentType 'application/json' -Body $body -ErrorAction Stop
  Write-Host "\nResposta recebida:" -ForegroundColor Green
  Write-Host ($resp | ConvertTo-Json -Depth 5)
  if ($resp.url) {
    Write-Host "\nURL: $($resp.url)" -ForegroundColor Yellow
  }
  if ($resp.media_id) {
    Write-Host "Media ID: $($resp.media_id)" -ForegroundColor Yellow
  }
} catch {
  Write-Host "\nRequisição falhou:" -ForegroundColor Red
  if ($_.Exception -and $_.Exception.Response) {
    try {
      $stream = $_.Exception.Response.GetResponseStream()
      $reader = New-Object System.IO.StreamReader($stream)
      $text = $reader.ReadToEnd()
      Write-Host "Response body:" -ForegroundColor Red
      Write-Host $text
    } catch {}
  }
  Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
