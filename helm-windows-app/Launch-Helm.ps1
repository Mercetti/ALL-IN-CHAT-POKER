# Helm Control Launcher
Write-Host "🛡️  Starting Helm Control - Small LLM Edition" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is available
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

# Change to app directory
Set-Location $PSScriptRoot

Write-Host "🚀 Starting Helm Control application..." -ForegroundColor Yellow
Write-Host ""

# Start the app
npm run dev

Write-Host ""
Write-Host "Helm Control stopped." -ForegroundColor Gray
Read-Host "Press Enter to exit"
