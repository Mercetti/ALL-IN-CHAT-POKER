@echo off
REM One-Click Development Environment Fix

echo 🔧 Fixing Development Environment Issues...

echo 📋 Running health check...
call node dev-health-check.js

echo.
echo 🧹 Cleaning up conflicts...
call clean-restart-server.bat

echo.
echo 📁 Creating VS Code settings...
if not exist ".vscode" mkdir ".vscode"
echo {"liveServer.settings.port": 5173, "liveServer.settings.root": "/apps/ai-control-center", "liveServer.settings.wait": 1000, "liveServer.settings.customBrowser": "chrome", "liveServer.settings.ignoreFiles": [".git/**", "node_modules/**", "dist/**", ".vite/**"], "emmet.includeLanguages": {"javascript": "javascriptreact"}, "files.exclude": {"**/.git": true, "**/.svn": true, "**/.hg": true, "**/CVS": true, "**/.DS_Store": true, "**/Thumbs.db": true, "**/node_modules": true, "**/dist": true, "**/.vite": true}, "typescript.preferences.importModuleSpecifier": "relative", "editor.formatOnSave": true, "editor.codeActionsOnSave": {"source.fixAll.eslint": "explicit"}, "terminal.integrated.defaultProfile.windows": "PowerShell", "terminal.integrated.env.windows": {"NODE_ENV": "development"}} > ".vscode\settings.json"

echo.
echo 🚀 Starting optimized environment...
cd /d "C:\Users\merce\Documents\poker-game\apps\ai-control-center"
start "AI Control Center" cmd /k "npm run dev"

echo.
echo ✅ Development environment fixed!
echo 🌐 AI Control Center: http://localhost:5173
echo 📊 Health check: node dev-health-check.js
echo 🔍 Port check: check-ports.bat
echo.
pause
