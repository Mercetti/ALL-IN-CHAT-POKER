# Create Helm Control Desktop Shortcut with Icon
Write-Host "Creating Helm Control desktop shortcut..." -ForegroundColor Cyan

$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = "$env:USERPROFILE\Desktop"
$ShortcutPath = "$DesktopPath\Helm Control.lnk"

# Create shortcut
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = '-ExecutionPolicy Bypass -File "C:\Users\merce\Documents\poker-game\helm-windows-app\Launch-Helm.ps1"'
$Shortcut.WorkingDirectory = "C:\Users\merce\Documents\poker-game\helm-windows-app"
$Shortcut.Description = "Helm Control - Small LLM Edition"

# Try to set icon (use Windows system icon as fallback)
try {
    $Shortcut.IconLocation = "shell32.dll,13"  # Star/rocket icon
} catch {
    Write-Host "Using default icon" -ForegroundColor Yellow
}

$Shortcut.Save()

Write-Host "✅ Desktop shortcut created: $ShortcutPath" -ForegroundColor Green
Write-Host "🚀 Double-click to launch Helm Control!" -ForegroundColor Yellow
