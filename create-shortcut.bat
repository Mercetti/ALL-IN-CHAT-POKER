@echo off
REM Create/Update AI Control Center Desktop Shortcut

echo 🖥️ Creating AI Control Center Desktop Shortcut...

REM Get current desktop path
for /f "tokens=3" %%a in ('reg query "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders" /v Desktop') do set DESKTOP=%%a

REM Remove old shortcut if it exists
if exist "%DESKTOP%\AI Control Center.lnk" (
    echo 🗑️ Removing old shortcut...
    del "%DESKTOP%\AI Control Center.lnk"
)

REM Create new shortcut with update script
echo 📝 Creating new shortcut...
powershell "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP%\AI Control Center.lnk'); $Shortcut.TargetPath = 'C:\Users\merce\Documents\poker-game\update-ai-control-center.bat'; $Shortcut.WorkingDirectory = 'C:\Users\merce\Documents\poker-game'; $Shortcut.IconLocation = 'C:\Users\merce\Documents\poker-game\apps\ai-control-center\public\icon.ico'; $Shortcut.Description = 'AI Control Center - Auto-Updates on Launch'; $Shortcut.Save()"

echo ✅ Desktop shortcut created/updated!
echo 🔄 The shortcut will auto-update the app when launched
echo 📍 Location: %DESKTOP%\AI Control Center.lnk
pause
