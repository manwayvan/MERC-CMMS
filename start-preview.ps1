Write-Host "Starting local preview server..." -ForegroundColor Green
Write-Host ""
Write-Host "Server will be available at: http://localhost:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

Set-Location $PSScriptRoot
npx http-server . -p 8080

