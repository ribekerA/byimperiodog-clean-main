# Script para validar PageSpeed Insights após deploy
# Uso: .\scripts\check-psi.ps1

$site = "https://byimperiodog.com.br"
$mobilePSI = "https://pagespeed.web.dev/analysis?url=$site"
$desktopPSI = "https://pagespeed.web.dev/analysis?url=$site&strategy=desktop"

Write-Host "VALIDACAO PSI - byimperiodog.com.br" -ForegroundColor Cyan
Write-Host ""
Write-Host "Metas de Performance:" -ForegroundColor Yellow
Write-Host "   Mobile Performance:  73 -> 90-95/100 (+17-22 pontos)" -ForegroundColor White
Write-Host "   Mobile LCP:         11.6s -> menos de 2.5s (5-8x mais rapido)" -ForegroundColor White
Write-Host "   Desktop Performance: 86 -> 92-97/100 (+6-11 pontos)" -ForegroundColor White
Write-Host "   Desktop TBT:        80ms -> menos de 50ms (38 porcento melhoria)" -ForegroundColor White
Write-Host "   Accessibility:      90 -> 93-97/100 (WCAG AA)" -ForegroundColor White
Write-Host ""
Write-Host "URLs para teste:" -ForegroundColor Yellow
Write-Host "   MOBILE:  $mobilePSI" -ForegroundColor Green
Write-Host "   DESKTOP: $desktopPSI" -ForegroundColor Green
Write-Host ""
Write-Host "Aguarde 10-15 min apos ultimo push para garantir propagacao CDN" -ForegroundColor Magenta
Write-Host ""

# Verificar último commit
$lastCommit = git log --oneline -1
Write-Host "Ultimo commit deployado:" -ForegroundColor Yellow
Write-Host "   $lastCommit" -ForegroundColor White
Write-Host ""

# Verificar tempo desde último push
$lastPush = git log -1 --format=%cd --date=relative
Write-Host "Ultimo push: $lastPush" -ForegroundColor Yellow
Write-Host ""

Write-Host "Dica: Aguarde o email do Vercel confirmando deploy antes de testar PSI" -ForegroundColor Cyan
Write-Host ""

# Perguntar se deseja abrir os links
$open = Read-Host "Abrir URLs do PSI no navegador? (s/n)"
if ($open -eq "s" -or $open -eq "S") {
    Write-Host "Abrindo Mobile PSI..." -ForegroundColor Green
    Start-Process $mobilePSI
    Start-Sleep -Seconds 2
    Write-Host "Abrindo Desktop PSI..." -ForegroundColor Green
    Start-Process $desktopPSI
}

Write-Host ""
Write-Host "Checklist pos-validacao PSI:" -ForegroundColor Yellow
Write-Host "   [ ] Mobile Performance >= 90/100" -ForegroundColor White
Write-Host "   [ ] Mobile LCP < 2.5s" -ForegroundColor White
Write-Host "   [ ] Desktop Performance >= 92/100" -ForegroundColor White
Write-Host "   [ ] Desktop TBT < 50ms" -ForegroundColor White
Write-Host "   [ ] Accessibility >= 93/100" -ForegroundColor White
Write-Host "   [ ] Imagens otimizadas carregando (22KB/53KB/109KB)" -ForegroundColor White
Write-Host "   [ ] Cache headers ativos (31536000s immutable)" -ForegroundColor White
Write-Host ""
