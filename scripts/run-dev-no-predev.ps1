# Run generator then start Next dev without executing npm predev
node scripts/gen-client-photos.mjs; if ($LASTEXITCODE -ne 0) { Write-Error "Generator failed"; exit $LASTEXITCODE }
$env:CI='true'
npx cross-env NEXT_DISABLE_VERSION_CHECK=1 NEXT_TELEMETRY_DISABLED=1 next dev -p 3000
