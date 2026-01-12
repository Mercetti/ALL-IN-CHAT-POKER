#!/usr/bin/env sh
echo "🔧 Installing pre-commit markdownlint hook..."
npx husky install
echo "✅ Pre-commit hook installed. It will auto-fix docs on every commit."
