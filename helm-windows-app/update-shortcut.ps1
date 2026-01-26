# Update Helm Control shortcut with proper icon
Write-Host "Updating Helm Control shortcut with icon..." -ForegroundColor Cyan

$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = "$env:USERPROFILE\Desktop"
$ShortcutPath = "$DesktopPath\Helm Control.lnk"

# Remove old shortcut if exists
if (Test-Path $ShortcutPath) {
    Remove-Item $ShortcutPath
    Write-Host "Removed old shortcut" -ForegroundColor Yellow
}

# Create new shortcut with icon
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = '-ExecutionPolicy Bypass -File "C:\Users\merce\Documents\poker-game\helm-windows-app\Launch-Helm.ps1"'
$Shortcut.WorkingDirectory = "C:\Users\merce\Documents\poker-game\helm-windows-app"
$Shortcut.Description = "Helm Control - Small LLM Edition"

# Use a nice Windows system icon (shield/computer icon)
$Shortcut.IconLocation = "shell32.dll,167"  # Shield icon
$Shortcut.Save()

Write-Host "✅ Updated shortcut created with shield icon!" -ForegroundColor Green
Write-Host "📍 Location: $ShortcutPath" -ForegroundColor Cyan
Write-Host "🚀 Double-click to launch Helm Control!" -ForegroundColor Yellow
