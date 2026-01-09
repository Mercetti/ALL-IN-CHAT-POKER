@echo off
REM Create VS Code tasks.json file

echo Creating VS Code tasks.json...

REM Create the tasks.json file
(
echo {
echo   "version": "2.0.0",
echo   "tasks": [
echo     {
echo       "label": "Safe Deploy",
echo       "type": "shell",
echo       "command": "npm",
echo       "args": ["run", "deploy"],
echo       "group": {
echo         "kind": "build",
echo         "isDefault": true
echo       },
echo       "presentation": {
echo         "echo": true,
echo         "reveal": "always",
echo         "focus": false,
echo         "panel": "shared"
echo       },
echo       "problemMatcher": []
echo     },
echo     {
echo       "label": "Pre-Deploy Check",
echo       "type": "shell",
echo       "command": "npm",
echo       "args": ["run", "predeploy"],
echo       "group": "build",
echo       "presentation": {
echo         "echo": true,
echo         "reveal": "always",
echo         "focus": false,
echo         "panel": "shared"
echo       },
echo       "problemMatcher": []
echo     },
echo     {
echo       "label": "Syntax Check",
echo       "type": "shell",
echo       "command": "npm",
echo       "args": ["run", "syntax"],
echo       "group": "build",
echo       "presentation": {
echo         "echo": true,
echo         "reveal": "always",
echo         "focus": false,
echo         "panel": "shared"
echo       },
echo       "problemMatcher": []
echo     },
echo     {
echo       "label": "Start File Watcher",
echo       "type": "shell",
echo       "command": "node",
echo       "args": ["auto-watch.js"],
echo       "group": "build",
echo       "presentation": {
echo         "echo": true,
echo         "reveal": "always",
echo         "focus": false,
echo         "panel": "dedicated"
echo       },
echo       "isBackground": true,
echo       "problemMatcher": []
echo     },
echo     {
echo       "label": "AI Control Center",
echo       "type": "shell",
echo       "command": "npm",
echo       "args": ["run", "control:center"],
echo       "group": "build",
echo       "presentation": {
echo         "echo": true,
echo         "reveal": "always",
echo         "focus": false,
echo         "panel": "dedicated"
echo       },
echo       "isBackground": true,
echo       "problemMatcher": []
echo     }
echo   ]
echo }
) > ".vscode\tasks.json"

echo ✅ VS Code tasks.json created successfully!
echo.
echo 🎯 Available tasks in VS Code:
echo   - Safe Deploy (Ctrl+Shift+P > Tasks: Run Task > Safe Deploy)
echo   - Pre-Deploy Check
echo   - Syntax Check
echo   - Start File Watcher
echo   - AI Control Center
echo.
echo 💡 Use Ctrl+Shift+B to run the default "Safe Deploy" task
pause
