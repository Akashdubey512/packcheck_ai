# PackCheck AI - Local Runner Script
# Launches AI Service, Backend Gateway, and Frontend UI in independent terminal windows

$ProjectRoot = $PSScriptRoot

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Starting PackCheck AI Local Stack    " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Start AI Microservice (FastAPI on Port 8000)
Write-Host "`n[1/3] Starting AI Service on port 8000..." -ForegroundColor Yellow
$aiPython = Join-Path $ProjectRoot "ai-service\sih\Scripts\python.exe"
if (-not (Test-Path $aiPython)) {
    $aiPython = "python"
}
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot\ai-service'; Write-Host 'Starting AI Service on http://127.0.0.1:8000...' -ForegroundColor Green; & '$aiPython' -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

# 2. Start Backend Gateway (Express on Port 5000)
Write-Host "[2/3] Starting Backend Gateway on port 5000..." -ForegroundColor Yellow
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot\backend'; Write-Host 'Starting Backend Gateway on http://localhost:5000...' -ForegroundColor Green; npm run dev"

# 3. Start Frontend UI (Vite on Port 3000)
Write-Host "[3/3] Starting Frontend on port 3000..." -ForegroundColor Yellow
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot\frontend'; Write-Host 'Starting Frontend UI on http://localhost:3000...' -ForegroundColor Green; npm run dev"

Write-Host "`nAll three services initiated!" -ForegroundColor Green
Write-Host "- Frontend UI:       http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Backend Gateway:   http://localhost:5000" -ForegroundColor Cyan
Write-Host "- AI Service Docs:   http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "`nPress any key to close this launcher window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
