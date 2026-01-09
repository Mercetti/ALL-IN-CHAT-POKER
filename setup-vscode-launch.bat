@echo off
REM Setup VS Code launch configurations for always-on automation

echo Setting up VS Code launch configurations...

REM Create the launch.json file
(
echo {
echo     "version": "0.2.0",
echo     "configurations": [
echo         {
echo             "type": "node",
echo             "request": "launch",
echo             "name": "Run server.js",
echo             "program": "${workspaceFolder}/server.js",
echo             "cwd": "${workspaceFolder}",
echo             "env": {
echo                 "NODE_ENV": "development"
echo             },
echo             "console": "integratedTerminal",
echo             "skipFiles": [
echo                 "<node_internals>/**"
echo             ]
echo         },
echo         {
echo             "type": "node",
echo             "request": "attach",
echo             "name": "Attach to Node (9229)",
echo             "port": 9229,
echo             "restart": true,
echo             "skipFiles": [
echo                 "<node_internals>/**"
echo             ]
echo         },
echo         {
echo             "type": "chrome",
echo             "request": "launch",
echo             "name": "Open App in Chrome",
echo             "url": "http://localhost:8080",
echo             "webRoot": "${workspaceFolder}/public"
echo         },
echo         {
echo             "type": "node",
echo             "request": "launch",
echo             "name": "Start File Watcher",
echo             "program": "${workspaceFolder}/auto-watch.js",
echo             "cwd": "${workspaceFolder}",
echo             "console": "integratedTerminal",
echo             "skipFiles": [
echo                 "<node_internals>/**"
echo             ]
echo         },
echo         {
echo             "type": "node",
echo             "request": "launch",
echo             "name": "Start AI Control Center",
echo             "program": "${workspaceFolder}/node_modules/.bin/npm",
echo             "args": ["run", "control:center"],
echo             "cwd": "${workspaceFolder}",
echo             "console": "integratedTerminal",
echo             "skipFiles": [
echo                 "<node_internals>/**"
echo             ]
echo         },
echo         {
echo             "type": "node",
echo             "request": "launch",
echo             "name": "Start Production Monitor",
echo             "program": "${workspaceFolder}/auto-deploy-monitor.js",
echo             "cwd": "${workspaceFolder}",
echo             "console": "integratedTerminal",
echo             "skipFiles": [
echo                 "<node_internals>/**"
echo             ]
echo         }
echo     ]
echo }
) > ".vscode\launch.json"

echo ✅ VS Code launch configurations updated!
echo.
echo 🚀 Available debug configurations:
echo   - Run server.js
echo   - Start File Watcher (real-time syntax checking)
echo   - Start AI Control Center
echo   - Start Production Monitor
echo.
echo 💡 Use Ctrl+Shift+D > Select configuration > Start debugging
pause
